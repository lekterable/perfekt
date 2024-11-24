import defaultConfig from './default'
import { Config as TConfig } from '~types'

class Config {
  #config: TConfig

  constructor(overrides?: Partial<TConfig>) {
    this.#config = { ...defaultConfig, ...overrides }
  }

  get config() {
    return this.#config
  }
}

export default Config
export { defaultConfig }
