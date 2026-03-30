# BattleTris

BattleTris is a real-time, multiplayer Tetris experience. The app ships as a single Node.js service that serves the React/Vite frontend and hosts the Socket.io multiplayer backend.

## Application Overview

- Real-time multiplayer rooms with live board updates and garbage/attack mechanics
- Responsive UI built with React and Tailwind CSS
- WebSocket gameplay powered by Socket.io
- In-memory room and player state (no database)

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, motion
- Backend: Node.js, Express, Socket.io
- Infrastructure: Terraform for AWS App Runner, GCP Cloud Run, and Render

## Local Development

Prerequisites:
- Node.js 20+ recommended

Steps:
1. Install dependencies:
   `npm install`
2. Run the app:
   `npm run dev`
3. Open:
   `http://localhost:8080`

## Environment Configuration

Environments are controlled by settings YAMLs and infrastructure YAMLs:

- Environment settings: `config/<env>-settings.yaml`
- Infrastructure settings: `config/Infrastructure/*.yaml`

To switch environments and regenerate `.env`:

```bash
./scripts/switch-env.sh DEV
```

The generated `.env` includes the active `INFRASTRUCTURE` reference, and frontend URLs are derived from the infrastructure file.

## Development Process

Typical workflow:

1. Make changes locally.
2. Run lint/build:
   `npm run lint` and `npm run build`
3. Create a release tag:
   `./scripts/check-version.sh`
4. Build artifacts once and publish them:
   `./scripts/build-artifacts.sh vX.Y.Z`
5. Deploy using GitHub Actions (Deploy workflow) or the provided scripts.

## Build Once, Deploy Many

Deployments use tagged Docker artifacts instead of building during deploy. See `BUILD_ONCE_DEPLOY_MANY.md` for the full process.

## Observability

OpenTelemetry tracing and metrics are supported and disabled by default. See `OBSERVABILITY.md` for how to enable and configure exporters.

## Secret Lifecycle Guidance

Right now secrets are managed via:
- `.env` / `config/.env` (local files)
- environment YAMLs (infrastructure config)

This works early on, but as deployments grow it creates three risks:

1. **Secret sprawl**  
   The same secret ends up copied into multiple places (dev, qa, uat, prod). That makes it hard to know which value is current and where it’s used.

2. **No rotation policy**  
   If a key is compromised, you’d have to manually update multiple files and redeploy everywhere. There’s no standard rotation or audit trail.

3. **Access control & audit gaps**  
   `.env` files aren’t tied to IAM policies or audit logs. A secret manager gives you access control, version history, and automatic rotation support.

What it means in practice:
As the number of environments grows, manual secrets quickly become brittle and unsafe. A centralized secret manager avoids duplication, provides auditability, and makes rotation manageable.

## Solution Architecture (High Level)

- The frontend is a React SPA built by Vite.
- The backend is a Node.js + Express server with Socket.io for realtime gameplay.
- The same Node.js process serves static assets and WebSocket traffic.
- Room/player state is in-memory and cleaned up on timers.

For the detailed architecture diagram and patterns, see `architecture_readme.md`.
