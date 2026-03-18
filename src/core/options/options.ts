class Options<T extends object> {
  #options?: Partial<T>
  #defaultOptions: T

  constructor(defaultOptions: T) {
    this.#defaultOptions = defaultOptions
  }

  get options(): T {
    return { ...this.#defaultOptions, ...this.#options }
  }

  merge(options: Partial<T>): this {
    this.#options = { ...this.#options, ...options }
    return this
  }

  restore(): this {
    this.#options = undefined
    return this
  }
}

export default Options
