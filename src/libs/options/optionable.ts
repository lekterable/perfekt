import Options from '.'

class Optionable<T> {
  #options

  constructor(options: Partial<T>) {
    this.#options = new Options<T>(options)
  }

  get options() {
    return this.#options.options
  }

  set options(options: Partial<T>) {
    this.#options = this.#options.restore().merge(options)
  }
}

export default Optionable
