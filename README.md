# LocalOps Deploy Action

[![CI](https://github.com/localopsco/deploy-action/actions/workflows/ci.yml/badge.svg)](https://github.com/localopsco/deploy-action/actions/workflows/ci.yml)
![Coverage](./badges/coverage.svg)

GitHub Action to trigger deployments in [LocalOps Deliver](https://localops.co).

## Quick Start

```yaml
- name: Trigger LocalOps Deployment
  uses: localopsco/deploy-action@v0
  with:
    api_token: ${{ secrets.LOCALOPS_API_TOKEN }}
    environment_id: 'env-123'
    service_id: 'svc-456'
    commit_id: ${{ github.sha }}
```

## Inputs

| Input                | Description                  | Required | Default                   |
| -------------------- | ---------------------------- | -------- | ------------------------- |
| `api_token`          | LocalOps API token           | ✅       |                           |
| `environment_id`     | Target environment ID        | ✅       |                           |
| `service_id`         | Target service ID            | ✅       |                           |
| `commit_id`          | Git commit SHA to deploy     | ⚡       |                           |
| `docker_image_tag`   | Docker image tag to deploy   | ⚡       |                           |
| `helm_chart_version` | Helm chart version to deploy | ⚡       |                           |
| `base_url`           | LocalOps API base URL        | ❌       | `https://sdk.localops.co` |

> **Note**: Exactly one of `commit_id`, `docker_image_tag`, or
> `helm_chart_version` must be provided (marked with ⚡).

## Examples

### Deploy on Push to Main

Automatically deploy when changes are pushed to the main branch:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Trigger LocalOps Deployment
        uses: localopsco/deploy-action@v0
        with:
          api_token: ${{ secrets.LOCALOPS_API_TOKEN }}
          environment_id: ${{ vars.ENVIRONMENT_ID }}
          service_id: ${{ vars.SERVICE_ID }}
          commit_id: ${{ github.sha }}
```

### Build and Deploy Docker Image

Build a Docker image, push to a registry, and deploy:

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and Push
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: myorg/myapp:${{ github.sha }}

      - name: Trigger LocalOps Deployment
        uses: localopsco/deploy-action@v0
        with:
          api_token: ${{ secrets.LOCALOPS_API_TOKEN }}
          environment_id: ${{ vars.ENVIRONMENT_ID }}
          service_id: ${{ vars.SERVICE_ID }}
          docker_image_tag: ${{ github.sha }}
```

### Deploy Helm Chart

Deploy a specific Helm chart version:

```yaml
- name: Deploy Helm Chart
  uses: localopsco/deploy-action@v0
  with:
    api_token: ${{ secrets.LOCALOPS_API_TOKEN }}
    environment_id: ${{ vars.ENVIRONMENT_ID }}
    service_id: ${{ vars.SERVICE_ID }}
    helm_chart_version: '1.2.3'
```

## Authentication

For triggering deployments, you will need to provide an API token from your
LocalOps account.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build for distribution
npm run package
```

## License

MIT
