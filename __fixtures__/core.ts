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

const getBooleanInputImpl = vi.fn()
export const getBooleanInput = (
  name: string,
  options?: { required?: boolean }
): boolean => {
  const value = getBooleanInputImpl(name)
  if (options?.required && value === undefined) {
    throw new Error(`Input required and not supplied: ${name}`)
  }
  return value ?? false
}
getBooleanInput.mockImplementation =
  getBooleanInputImpl.mockImplementation.bind(getBooleanInputImpl)
getBooleanInput.mockReturnValue =
  getBooleanInputImpl.mockReturnValue.bind(getBooleanInputImpl)

export const setOutput = vi.fn()
export const setFailed = vi.fn()
export const warning = vi.fn()
