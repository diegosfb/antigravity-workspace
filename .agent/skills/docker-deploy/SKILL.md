---
name: docker-deploy
description: Automates building and launching a Dockerized version of the application. It handles image creation, container orchestration, and port mapping.
---

# Docker Deploy Skill

## When to use this skill
- When you need to test the app in a production-like isolated environment.
- For local development using `docker-compose`.
- Before pushing to cloud registries like GCR (GCP) or ECR (AWS).

## How to use it
1.  **Environment Check**: 
    - Verify Docker Desktop or Engine is running: `docker info`.
    - Locate the `Dockerfile` or `docker-compose.yml` in the project root.
2.  **Build Phase**:
    - Run the build command: `docker build -t battletris-server .`
    - *Optional*: Use `--no-cache` if dependencies have changed significantly.
3.  **Launch Phase**:
    - **Single Container**: `docker run -d -p 8080:8080 --name battletris-instance battletris-server`
    - **Compose**: If a `docker-compose.yml` exists, run `docker-compose up -d`.
4.  **Health Verification**:
    - Check container status: `docker ps`.
    - Stream logs to ensure the server started correctly: `docker logs -f battletris-instance`.
5.  **Access**:
    - Confirm the app is reachable at `http://localhost:8080`.

## Operational Guardrails
- **Cleanup**: Before launching, check for existing containers with the same name and offer to `docker rm -f` them to avoid port conflicts.
- **Image Size**: Recommend multi-stage builds if the resulting image exceeds 500MB.
- **Storage**: Ensure `.dockerignore` is present to avoid baking `node_modules` or `.git` into the image.
