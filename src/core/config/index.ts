import defaultConfig from './default'
import { Config as TConfig } from '~types'
import validateConfig from './validate'

class Config {
  #config: TConfig

  constructor(overrides?: unknown) {
    this.#config = { ...defaultConfig, ...validateConfig(overrides) }
  }

  get config() {
    return this.#config
  }
}

export default Config
export { defaultConfig }
