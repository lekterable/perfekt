class Commit {
  #commit: string
  #hash: string
  #message: string
  #isConventional: boolean
  #isBreaking?: boolean
  #type?: string
  #scope?: string

  constructor(commit: string) {
    const match = commit.match(/(?<hash>.{40}) (?<title>.*)/)

    const hash = match?.groups?.hash
    const title = match?.groups?.title

    if (!hash || !title) throw new Error('Received commit is invalid.')

    this.#commit = commit

    const commitDetails = title.match(
      /(?<type>[\w ]*)(?:\((?<scope>[\w ]*)\))?(?<isBreaking>!)?: (?<message>.*)/
    )

    if (!commitDetails) {
      this.#hash = hash
      this.#message = title
      this.#isConventional = false
      return
    }

    const { groups } = commitDetails

    if (!groups) {
      throw new Error('Error while parsing commit details.')
    }

    this.#hash = hash
    this.#message = groups.message
    this.#isConventional = true
    this.#isBreaking = Boolean(groups.isBreaking)
    this.#type = groups.type
    this.#scope = groups.scope ?? undefined
  }

  get commit() {
    return this.#commit
  }

  get hash() {
    return this.#hash
  }

  get message() {
    return this.#message
  }

  get isConventional() {
    return this.#isConventional
  }

  get isBreaking() {
    return this.#isBreaking
  }

  get type() {
    return this.#type
  }

  get scope() {
    return this.#scope
  }
}

export default Commit
