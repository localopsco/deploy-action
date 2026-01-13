import { vi, describe, it, expect, beforeEach } from 'vitest'
import * as core from '../__fixtures__/core.js'

vi.mock('@actions/core', () => core)

const mocks = vi.hoisted(() => {
  return {
    post: vi.fn().mockReturnValue({
      json: () => Promise.resolve({})
    })
  }
})

vi.mock('ky', () => ({
  default: {
    post: mocks.post
  }
}))

import { run } from '../src/main.js'

describe('Action Main', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    core.getInput.mockReturnValue('')
  })

  it('fails if api_token is not provided', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'environment_id') return 'e_1'
      if (name === 'service_id') return 's_1'
      if (name === 'commit_id') return 'c_1'
      if (name === 'api_token') return ''
      return ''
    })

    await run()
    expect(core.setFailed).toHaveBeenCalledWith(
      'Input required and not supplied: api_token'
    )
  })

  it('fails if no body input is provided', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'environment_id') return 'e_1'
      if (name === 'service_id') return 's_1'
      if (name === 'api_token') return '123'
      return ''
    })

    await run()
    expect(core.setFailed).toHaveBeenCalledWith(
      'One of commit_id, docker_image_tag, or helm_chart_version must be provided.'
    )
  })

  it('deploys with commit_id', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'base_url') return 'https://sdk.localops.co'
      if (name === 'environment_id') return 'e_1'
      if (name === 'service_id') return 's_1'
      if (name === 'commit_id') return 'c_1'
      if (name === 'api_token') return 'test_token'
      return ''
    })

    await run()

    expect(mocks.post).toHaveBeenCalledWith(
      'https://sdk.localops.co/v1/environments/e_1/services/s_1/deploy',
      {
        json: { commit_id: 'c_1' },
        headers: { Authorization: 'Bearer test_token' }
      }
    )
    expect(core.info).toHaveBeenCalledWith('Deployment triggered successfully.')
  })

  it('deploys with docker_image_tag', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'base_url') return 'https://sdk.localops.co'
      if (name === 'environment_id') return 'e_1'
      if (name === 'service_id') return 's_1'
      if (name === 'docker_image_tag') return 'd_1'
      if (name === 'api_token') return 'test_token'
      return ''
    })

    await run()

    expect(mocks.post).toHaveBeenCalledWith(
      'https://sdk.localops.co/v1/environments/e_1/services/s_1/deploy',
      {
        json: { docker_image_tag: 'd_1' },
        headers: { Authorization: 'Bearer test_token' }
      }
    )
  })

  it('deploys with helm_chart_version', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'base_url') return 'https://sdk.localops.co'
      if (name === 'environment_id') return 'e_1'
      if (name === 'service_id') return 's_1'
      if (name === 'helm_chart_version') return 'h_1'
      if (name === 'api_token') return 'test_token'
      return ''
    })

    await run()

    expect(mocks.post).toHaveBeenCalledWith(
      'https://sdk.localops.co/v1/environments/e_1/services/s_1/deploy',
      {
        json: { helm_chart_version: 'h_1' },
        headers: { Authorization: 'Bearer test_token' }
      }
    )
  })

  it('uses custom base_url', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'base_url') return 'https://api.localops.co'
      if (name === 'environment_id') return 'e_1'
      if (name === 'service_id') return 's_1'
      if (name === 'commit_id') return 'c_1'
      if (name === 'api_token') return 'test_token'
      return ''
    })

    await run()

    expect(mocks.post).toHaveBeenCalledWith(
      'https://api.localops.co/v1/environments/e_1/services/s_1/deploy',
      {
        json: { commit_id: 'c_1' },
        headers: { Authorization: 'Bearer test_token' }
      }
    )
  })

  it('handles ky errors', async () => {
    core.getInput.mockImplementation((name) => {
      if (name === 'environment_id') return 'e_1'
      if (name === 'service_id') return 's_1'
      if (name === 'commit_id') return 'c_1'
      if (name === 'api_token') return 'test_token'
      return ''
    })

    const errorMsg = 'Network Error'
    mocks.post.mockRejectedValueOnce(new Error(errorMsg))

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(errorMsg)
  })
})
