# LocalOps Deploy Action

![CI](https://github.com/localopsco/deploy-action/actions/workflows/ci.yml/badge.svg)
![Coverage](./badges/coverage.svg)

GitHub Action to trigger a deployment in LocalOps deliver.

## Usage

```yaml
steps:
  - name: Trigger Deployment
    uses: localopsco/deploy-action@v1
    with:
      environment_id: 'env-123'
      service_id: 'svc-456'
      # One of the following is required:
      commit_id: 'sha-789'
      # docker_image_tag: 'v1.0.0'
      # helm_chart_version: '1.2.3'
      
      # Optional
      # base_url: 'https://sdk.localops.co' 
```

## Inputs

| Input | Description | Required | Default |
| --- | --- | --- | --- |
| `environment_id` | The environment ID for deployment | **Yes** | |
| `service_id` | The service ID for deployment | **Yes** | |
| `commit_id` | The commit ID to deploy | No* | |
| `docker_image_tag` | The docker image tag to deploy | No* | |
| `helm_chart_version` | The helm chart version to deploy | No* | |
| `base_url` | The base URL of the API | No | `https://sdk.localops.co` |

\* **Note**: Exactly one of `commit_id`, `docker_image_tag`, or `helm_chart_version` must be provided.

## Development

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test
```

### Package

```bash
npm run package
```
