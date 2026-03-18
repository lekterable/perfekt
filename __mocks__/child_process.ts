const child_process =
  jest.createMockFromModule<typeof import('child_process')>('child_process')

export default child_process
