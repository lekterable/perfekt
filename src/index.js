export * from './changelog'
export * from './initialize'
export * from './release'

export const defaultConfig = {
  unreleasedFormat: '# Latest',
  releaseFormat: '# %version%',
  groups: [
    ['## Features', 'feat', 'feature'],
    ['## Fixes', 'fix']
  ],
  lineFormat: '- %message% %hash%'
}

export const defaultChangelogOptions = {
  write: false,
  root: false
}
