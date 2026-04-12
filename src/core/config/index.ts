import defaultConfig from './default'
import mergeGroups from './merge-groups'
import { Config as TConfig } from '~types'
import validateConfig from './validate'

class Config {
  #config: TConfig

  constructor(overrides?: unknown) {
    const validated = validateConfig(overrides)

    this.#config = {
      ...defaultConfig,
      ...validated,
      groups: mergeGroups(defaultConfig.groups, validated?.groups)
    }
  }

  get config() {
    return this.#config
  }
}

export default Config
export { defaultConfig }
