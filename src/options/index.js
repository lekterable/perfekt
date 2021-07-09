export default class Options {
  #options
  #defaultOptions

  constructor(defaultOptions) {
    this.#defaultOptions = defaultOptions
  }

  get options() {
    return { ...this.#defaultOptions, ...this.#options }
  }

  merge(options) {
    this.#options = { ...this.#options, ...options }
    return this
  }

  restore() {
    this.#options = this.#defaultOptions
    return this
  }
}

export * as defaults from './default'
export { default as Optionable } from './optionable'
