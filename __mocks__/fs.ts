const fs = jest.createMockFromModule<typeof import('fs')>('fs')

export default fs
