# Antigravity Runner (VS Code Extension)

This extension adds an **Antigravity** view in the Explorer that lists agents, skills, and workflows found in:

```
<workspace>/.agent/antigravity
```

## Behavior

- Clicking an item opens its source file.
- For workflows, if a matching script exists in `scripts/<workflow>.sh` or `scripts/<workflow>.py`, it runs that script in a VS Code terminal.
- For agents/skills/workflows without a runnable script, it copies the invocation token to clipboard:
  - Agent: `@agent-name`
  - Skill: `$skill-name`
  - Workflow: `/workflow-name`

## Development

From this folder, press `F5` to launch the extension in a new Extension Development Host.
