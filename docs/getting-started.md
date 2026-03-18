# Getting started

How to get started, depends mostly on your needs and on your project's state.

If you're not interested in executing a release, and just want to generate a changelog, go to [changelog documentation](./documentation.md#changelog)

If your project is fairly new, start with the [new projects section](#new-projects). If it has been in development for a while and has a lot of commits, proceed to the [old projects section](#old-projects).

To install **perfekt** globally, run:

`pnpm add -g perfekt`

or

`npm install -g perfekt`

or

`yarn global add perfekt`

## New projects

For new projects, all you need to do is make sure you don't have leftover git tags that could cause a problem. To confirm that, run:

`git tag`

If the output is empty, you should be able to run:

`perfekt release <version>`

where `<version>` is the version of your new release.

Refer to the [release documentation](./documentation.md#release) for more information.

## Old projects

For projects with a long existing git history, which could potentially make the process time out, you can use:

`perfekt release <version> --from <commit>`

where `<version>` is the version of your new release and `<commit>` is the hash of the last commit that should **NOT** be part of the release.

After this, you can follow the [new projects section](#new-projects) for future releases.
