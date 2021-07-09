export default class Commit {
  #commit
  #hash
  #message
  #isConventional
  #isBreaking
  #type
  #scope

  constructor(commit) {
    if (!commit) throw new Error('Required argument `commit` is missing.')

    const match = commit.match(/(?<hash>.{40}) (?<title>.*)/)

    if (!match) throw new Error('Received commit is invalid.')

    this.#commit = commit

    const { hash, title } = match.groups

    const commitDetails = title.match(
      /(?<type>[\w ]*)(?:\((?<scope>[\w ]*)\))?(?<isBreaking>!)?: (?<message>.*)/
    )

    if (!commitDetails) {
      this.#hash = hash
      this.#message = title
      this.#isConventional = false
      return
    }

    const {
      groups: { type, scope, message, isBreaking }
    } = commitDetails

    this.#hash = hash
    this.#message = message
    this.#isConventional = true
    this.#isBreaking = Boolean(isBreaking)
    this.#type = type
    this.#scope = scope ?? null
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
