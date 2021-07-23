const defaultConfig = {
  unreleasedHeader: '# Latest',
  releaseHeader: '# %version%',
  breakingHeader: '## BREAKING',
  miscHeader: '## Misc',
  lineFormat: '- %message% %hash%',
  ignoredScopes: ['changelog'],
  groups: [
    { name: '## Features', change: 'minor', types: ['feat', 'feature'] },
    { name: '## Fixes', change: 'patch', types: ['fix'] }
  ]
}

export default defaultConfig
