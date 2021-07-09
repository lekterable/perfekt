const defaultConfig = {
  unreleasedHeader: '# Latest',
  releaseHeader: '# %version%',
  breakingHeader: '## BREAKING',
  groups: [
    { name: '## Features', change: 'minor', types: ['feat', 'feature'] },
    { name: '## Fixes', change: 'patch', types: ['fix'] }
  ],
  miscFormat: '## Misc',
  lineFormat: '- %message% %hash%',
  ignoredScopes: ['changelog']
}

export default defaultConfig
