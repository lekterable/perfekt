export * from './changelog'
export * from './initialize'
export * from './release'

export const defaultConfig = {
  unreleasedFormat: '# Latest',
  releaseFormat: '# %version%',
  breakingFormat: '## BREAKING',
  groups: [
    { name: '## Features', types: ['feat', 'feature'] },
    { name: '## Fixes', types: ['fix'] }
  ],
  miscFormat: '## Misc',
  lineFormat: '- %message% %hash%',
  ignoredScopes: ['changelog']
}

export const defaultChangelogOptions = {
  write: false,
  root: false,
  from: null
}

export const defaultReleaseOptions = {
  from: null
}
