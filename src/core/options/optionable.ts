import Options from '.'

class Optionable<T extends object> {
  #options: Options<T>

  constructor(options: T) {
    this.#options = new Options<T>(options)
  }

  get options(): T {
    return this.#options.options
  }

  set options(options: Partial<T>) {
    this.#options.restore().merge(options)
  }
}

export default Optionable
