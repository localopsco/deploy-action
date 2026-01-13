import { vi } from 'vitest'

export const debug = vi.fn()
export const error = vi.fn()
export const info = vi.fn()

const getInputImpl = vi.fn()
export const getInput = (
  name: string,
  options?: { required?: boolean }
): string => {
  const value = getInputImpl(name)
  if (options?.required && !value) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  return value
}
getInput.mockImplementation = getInputImpl.mockImplementation.bind(getInputImpl)
getInput.mockReturnValue = getInputImpl.mockReturnValue.bind(getInputImpl)

export const setOutput = vi.fn()
export const setFailed = vi.fn()
export const warning = vi.fn()
