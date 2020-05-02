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
  lineFormat: '- %message% %hash%',
  ignoredScopes: ['changelog']
}

export const defaultChangelogOptions = {
  write: false,
  root: false
}
