import * as core from '@actions/core'
import ky from 'ky'
import * as github from '@actions/github'

export async function run(): Promise<void> {
  try {
    const baseUrl = core.getInput('base_url')
    const preview = core.getBooleanInput('preview', { required: false })
    const environmentId = core.getInput('environment_id', { required: true })
    const serviceId = core.getInput('service_id', { required: true })
    const apiToken = core.getInput('api_token', { required: true })

    const commitId = core.getInput('commit_id')
    const dockerImageTag = core.getInput('docker_image_tag')
    const helmChartVersion = core.getInput('helm_chart_version')

    if (!commitId && !dockerImageTag && !helmChartVersion) {
      throw new Error(
        'One of commit_id, docker_image_tag, or helm_chart_version must be provided.'
      )
    }

    // if preview is true, then commitId is required
    if (preview && !commitId) {
      throw new Error('commit_id is required for preview deployments')
    }

    const payload: Record<string, string | number> = {}
    if (commitId) {
      payload['commit_id'] = commitId
    } else if (dockerImageTag) {
      payload['docker_image_tag'] = dockerImageTag
    } else if (helmChartVersion) {
      payload['helm_chart_version'] = helmChartVersion
    }

    // if preview, get the PR number and branch name and add to payload
    if (preview) {
      // fill here
      const isPR = github.context.eventName === 'pull_request'
      if (isPR) {
        const prNumber = github.context.payload.pull_request?.number
        const branchName = github.context.payload.pull_request?.head.ref
        if (prNumber && branchName) {
          payload['pr_number'] = prNumber
          payload['branch_name'] = branchName
        }
      }
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
