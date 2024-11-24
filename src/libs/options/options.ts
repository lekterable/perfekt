class Options<T> {
  #options?: Partial<T>
  #defaultOptions: Partial<T>

  constructor(defaultOptions: Partial<T>) {
    this.#defaultOptions = defaultOptions
  }

  get options() {
    return { ...this.#defaultOptions, ...this.#options }
  }

  merge(options: Partial<T>) {
    this.#options = { ...this.#options, ...options }
    return this
  }

  restore() {
    this.#options = this.#defaultOptions
    return this
  }
}

export default Options
