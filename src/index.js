export * from './changelog'
export * from './initialize'
export * from './release'

export const defaultConfig = {
  unreleasedFormat: '# Latest',
  releaseFormat: '# %version%',
  lineFormat: '- %message% %hash%'
}

export const defaultChangelogOptions = {
  write: false,
  root: false
}
