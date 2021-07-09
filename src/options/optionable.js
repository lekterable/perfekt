import Options from '.'

export default class Optionable {
  #options

  constructor(options) {
    this.#options = new Options(options)
  }

  get options() {
    return this.#options.options
  }

  set options(options) {
    this.#options = this.#options.restore().merge(options)
  }
}
