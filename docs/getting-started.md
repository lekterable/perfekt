# Getting started

How to get started, depends mostly on your needs and on your project's state.

If you're not interested in executing a release, and just want to generate a changelog, go to [changelog documentation](./documentation.md#changelog)

If your project is fairly new, go ahead and start with the [new projects section](#new-projects), if it is in development for some time already AND it has a lot (and I mean A LOT) of commits, proceed to the [old projects section](#old-projects).

## Installation

`npm i -g perfekt`

Installing **perfekt** globally is recommended as this will allow you to conveniently use it on different projects.

If you'd like to use it as a git hook or integrate it into your CI/CD you can also install it locally.

## New projects

For the new projects, all you need to do is to make sure that you don't have any leftover git tags that could cause a problem, to confirm that, run:

`git tag`

If the output is empty, you should be able to run:

`perfekt release <version>`

where `<version>` is the version of your new release

refer to [release documentation](#release) for more information

## Old projects

For the projects that have a long-existing git history, which could potentially make the process time out, you can use:

`perfekt release <version> --from <commit>`

where `<version>` is the version of your new release and `<commit>` is the hash of the last commit that should **NOT** be the part of the release.

after this, you can start referring to [new projects section](#new-projects) when executing future releases.
