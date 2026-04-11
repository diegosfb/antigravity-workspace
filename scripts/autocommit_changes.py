#!/usr/bin/env python3
"""Auto-commit checkpoints when the working tree changes.

Usage:
  ./scripts/autocommit_changes.py start
  ./scripts/autocommit_changes.py stop

Each detected change is committed and pushed to the configured remote.

11

"""

import os
import subprocess
import signal
import sys
import time
from datetime import datetime
from typing import List, Optional

INTERVAL = float(os.getenv("AGENTIC_CHECKPOINT_INTERVAL", "2.0"))
ENV_FLAG_NAME = "autocommiting"
ENV_PID_NAME = "autocommit_pid"
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def run(cmd: List[str]) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    # Never prompt; fail fast if git would ask for input.
    env["GIT_TERMINAL_PROMPT"] = "0"
    return subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)


def env_path() -> str:
    return os.path.join(PROJECT_ROOT, ".env")


def migrate_pidfile() -> None:
    legacy_paths = [
        os.path.join(PROJECT_ROOT, ".agent", "agentic_autocommit.pid"),
        os.path.join(PROJECT_ROOT, ".git", ".agentic_autocommit.pid"),
    ]
    current_pid = read_env_value(ENV_PID_NAME)
    for path in legacy_paths:
        if not os.path.exists(path):
            continue
        try:
            with open(path, "r", encoding="utf-8") as handle:
                pid_value = handle.read().strip()
        except Exception:
            pid_value = ""
        if pid_value and not current_pid:
            set_env_value(ENV_PID_NAME, pid_value)
            current_pid = pid_value
        try:
            os.remove(path)
        except OSError:
            pass


def normalize_env_value(value: str) -> str:
    stripped = value.strip().strip('"').strip("'")
    return stripped.lower()


def read_env_flag() -> str:
    return read_env_value(ENV_FLAG_NAME)


def read_env_value(key: str) -> str:
    path = env_path()
    if not os.path.exists(path):
        return ""
    raw = ""
    with open(path, "r", encoding="utf-8") as handle:
        for line in handle.read().splitlines():
            if not line or line.lstrip().startswith("#"):
                continue
            entry = line
            if entry.startswith("export "):
                entry = entry[len("export "):]
            if "=" not in entry:
                continue
            found_key, value = entry.split("=", 1)
            if found_key.strip() == key:
                raw = value.strip()
                break
    return raw


def set_env_value(key: str, value: Optional[str]) -> None:
    path = env_path()
    existing_lines = []
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as handle:
            existing_lines = handle.read().splitlines()

    updated_lines: List[str] = []
    found = False
    for line in existing_lines:
        if line.lstrip().startswith("#") or "=" not in line:
            updated_lines = [*updated_lines, line]
            continue
        entry = line
        if entry.startswith("export "):
            entry = entry[len("export "):]
        line_key = entry.split("=", 1)[0].strip()
        if line_key == key:
            if value is not None:
                updated_lines = [*updated_lines, f'{key}={value}']
            found = True
        else:
            updated_lines = [*updated_lines, line]

    if not found and value is not None:
        updated_lines = [*updated_lines, f'{key}={value}']

    with open(path, "w", encoding="utf-8") as handle:
        handle.write("\n".join(updated_lines) + "\n")


def get_changed_paths() -> List[str]:
    # -z keeps filenames safe; porcelain v1 is easy to parse.
    res = run(["git", "status", "--porcelain=v1", "-z"])
    data = res.stdout
    if not data:
        return []

    parts = data.split(b"\0")
    paths: List[str] = []
    i = 0
    while i < len(parts):
        entry = parts[i]
        if not entry:
            i += 1
            continue
        # Format: XY<space>path
        status = entry[:2].decode(errors="replace")
        path = entry[3:].decode(errors="replace")

        if status[0] in ("R", "C") or status[1] in ("R", "C"):
            # Rename/copy: next NUL contains the new path.
            if i + 1 < len(parts) and parts[i + 1]:
                new_path = parts[i + 1].decode(errors="replace")
                paths.append(new_path)
                i += 2
                continue
        paths.append(path)
        i += 1

    # De-duplicate while preserving order.
    seen = set()
    unique_paths = []
    for p in paths:
        if p not in seen:
            seen.add(p)
            unique_paths.append(p)
    return unique_paths


def build_description(paths: List[str]) -> str:
    if not paths:
        return "updated files"
    if len(paths) == 1:
        return f"updated {paths[0]}"
    if len(paths) == 2:
        return f"updated {paths[0]}, {paths[1]}"
    return f"updated {len(paths)} files: {paths[0]}, {paths[1]}"


def timestamp() -> str:
    now = datetime.now()
    return f"{now.month:02d}{now.day:02d}{now.hour:02d}{now.minute:02d}{now.second:02d}"


def commit_checkpoint(paths: List[str]) -> None:
    run(["git", "add", "-A"])
    # If nothing is staged, skip.
    if run(["git", "diff", "--cached", "--quiet"]).returncode == 0:
        return
    message = f"[AGENTIC DEV CHECKPOINT] - {timestamp()}"
    # --no-gpg-sign avoids interactive pinentry prompts.
    commit_res = run(["git", "commit", "--no-gpg-sign", "-m", message])
    if commit_res.returncode == 0:
        # Best-effort push to GitHub after each checkpoint commit.
        upstream = run(["git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"])
        if upstream.returncode == 0:
            run(["git", "push"])
        else:
            run(["git", "push", "-u", "origin", "HEAD"])


def print_usage() -> None:
    print("Usage:")
    print("  autocommit_changes.py start  # Start background auto-commit + push")
    print("  autocommit_changes.py stop   # Stop the background process")
    print("  autocommit_changes.py status # Print `running` or `not running`")
    print("  autocommit_changes.py ensure # Start if autocommiting=TRUE in .env")


def is_running(pid: int) -> bool:
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    return True


def start_daemon() -> None:
    migrate_pidfile()
    existing_pid_raw = read_env_value(ENV_PID_NAME)
    if existing_pid_raw:
        try:
            existing_pid = int(existing_pid_raw.strip().strip('"').strip("'"))
        except Exception:
            existing_pid = None
        if existing_pid and is_running(existing_pid):
            print(f"Already running (pid {existing_pid}).")
            set_env_value(ENV_FLAG_NAME, '"TRUE"')
            return

    # Spawn detached child running the loop.
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"
    proc = subprocess.Popen(
        [sys.executable, os.path.abspath(__file__), "run"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL,
        env=env,
        start_new_session=True,
    )
    set_env_value(ENV_FLAG_NAME, '"TRUE"')
    set_env_value(ENV_PID_NAME, str(proc.pid))
    print(f"Started (pid {proc.pid}).")


def stop_daemon() -> None:
    migrate_pidfile()
    pid_value = read_env_value(ENV_PID_NAME)
    pid = None
    if pid_value:
        try:
            pid = int(pid_value.strip().strip('"').strip("'"))
        except Exception:
            pid = None

    if pid and is_running(pid):
        os.kill(pid, signal.SIGTERM)
        print("Stopped.")
    else:
        print("Not running.")

    set_env_value(ENV_FLAG_NAME, "false")
    set_env_value(ENV_PID_NAME, None)


def run_loop() -> None:
    while True:
        paths = get_changed_paths()
        if paths:
            commit_checkpoint(paths)
        time.sleep(INTERVAL)


def status() -> None:
    migrate_pidfile()
    running = False
    pid = None
    pid_value = read_env_value(ENV_PID_NAME)
    if pid_value:
        try:
            pid = int(pid_value.strip().strip('"').strip("'"))
        except Exception:
            pid = None
    if pid and is_running(pid):
        running = True

    if running:
        print("running")
    else:
        print("not running")


def ensure_from_env() -> None:
    migrate_pidfile()
    flag_value = read_env_flag()
    if not flag_value:
        print(f"{ENV_FLAG_NAME} is not set; no action taken.")
        return
    normalized = normalize_env_value(flag_value)
    if normalized in ("true", "1", "yes", "y"):
        start_daemon()
        return
    print(f"{ENV_FLAG_NAME} is set to {flag_value}; no action taken.")


def main() -> None:
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)
    cmd = sys.argv[1].lower()
    if cmd == "start":
        start_daemon()
    elif cmd == "stop":
        stop_daemon()
    elif cmd == "status":
        status()
    elif cmd == "ensure":
        ensure_from_env()
    elif cmd == "run":
        run_loop()
    else:
        print_usage()
        sys.exit(1)


if __name__ == "__main__":
    main()
