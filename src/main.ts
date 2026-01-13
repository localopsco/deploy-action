import * as core from '@actions/core'
import ky from 'ky'

export async function run(): Promise<void> {
  try {
    const baseUrl = core.getInput('base_url')
    const environmentId = core.getInput('environment_id', { required: true })
    const serviceId = core.getInput('service_id', { required: true })
    const apiToken = core.getInput('api_token', { required: true })

    const commitId = core.getInput('commit_id')
    const dockerImageTag = core.getInput('docker_image_tag')
    const helmChartVersion = core.getInput('helm_chart_version')

    if (!commitId && !dockerImageTag && !helmChartVersion) {
      throw new Error('One of commit_id, docker_image_tag, or helm_chart_version must be provided.')
    }

    const payload: Record<string, string> = {}
    if (commitId) {
      payload['commit_id'] = commitId
    } else if (dockerImageTag) {
      payload['docker_image_tag'] = dockerImageTag
    } else if (helmChartVersion) {
      payload['helm_chart_version'] = helmChartVersion
    }

    const url = `${baseUrl}/v1/environments/${environmentId}/services/${serviceId}/deploy`
    core.debug(`Deploying to ${url} with payload: ${JSON.stringify(payload)}`)
    await ky.post(url, {
      json: payload,
      headers: { Authorization: `Bearer ${apiToken}` }
    })

    core.info('Deployment triggered successfully.')
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}
