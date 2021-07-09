import defaultConfig from './default'
export { default as defaultConfig } from './default'

export default class Config {
  #config

  constructor(configOverrides) {
    this.#config = { ...defaultConfig, ...configOverrides }
  }

  get config() {
    return this.#config
  }
}
