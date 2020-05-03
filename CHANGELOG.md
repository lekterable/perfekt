# Latest

## Features

- make breaking and misc headers configurable [6b05a3b8](https://github.com/lekterable/perfekt/commit/6b05a3b8430eb18af4c2d9fa67addc78c7357cfb)
- add --from option to changelog and release [0586c886](https://github.com/lekterable/perfekt/commit/0586c8867ef43fabe18a34bf496e65288055120d)
- make no-commits error more specific [a357a61a](https://github.com/lekterable/perfekt/commit/a357a61a4197d01201a84b9ae7ed7f447e16c7d7)
- add release version bumping [17feea4a](https://github.com/lekterable/perfekt/commit/17feea4af5e339532d680a6ef6e9ec331f8abd2e)
- make changelog ignored scopes configurable [d34a9f12](https://github.com/lekterable/perfekt/commit/d34a9f12500df6ea21a17b85b783a41b1fca5347)
- make changelog groups configurable [a2ec46eb](https://github.com/lekterable/perfekt/commit/a2ec46eb9e962a79a9153300adc2229af182d4a6)

## Misc

- update README [dd3bf31e](https://github.com/lekterable/perfekt/commit/dd3bf31edd0df6b27bec7764c731bef4fda1971d)
- add eslint prettier config [86f22d65](https://github.com/lekterable/perfekt/commit/86f22d65f117bf26fc9fd1596e3c074acf58d3b8)
- catch errors higher in the scope [ac5c2a84](https://github.com/lekterable/perfekt/commit/ac5c2a84546ff5675ff239566fa7f9b93a9afab9)

# 1.1.0

## Features

- add %HASH% placeholder to line format [a3c93b2f](https://github.com/lekterable/perfekt/commit/a3c93b2f6620e467fb58a87953a8a8c9a626aadc)
- introduce changelog customization using config file [e66d6176](https://github.com/lekterable/perfekt/commit/e66d61767f1013360cc45fb653f498c1e944a7b0)
- use higher level of headers for changelog [eea23d95](https://github.com/lekterable/perfekt/commit/eea23d9532ef27fc1350247512ee8289532408ad)

## Fixes

- throw error if there are no commits [5fa8e6c9](https://github.com/lekterable/perfekt/commit/5fa8e6c9996444fa0d17493cf1e379a696682696)
- check if changelog exists before accessing [4d95659f](https://github.com/lekterable/perfekt/commit/4d95659f302e0fe968154e17214876849172509f)
- make release pass the config object [56473839](https://github.com/lekterable/perfekt/commit/56473839b2887ea3962546eeb88ce0ad2a098365)
- handle edge case with non conventional commits [8be681f2](https://github.com/lekterable/perfekt/commit/8be681f2483c5255caa6c6a5c12a452465d10a22)
- replace %message% as last to avoid bugs [ec507396](https://github.com/lekterable/perfekt/commit/ec5073967f83dbcfc98b0ba17a1aa9659a042385)
- stop adding empty line at the end of the file on --root [faee4801](https://github.com/lekterable/perfekt/commit/faee480108aab450a606ac8132f89c9f42ec8ab3)
- stop adding Latest when not applicable [c64fa467](https://github.com/lekterable/perfekt/commit/c64fa4673612f90b349d125912f07d5db4140bcd)

## Misc

- setup travis [c3561dc0](https://github.com/lekterable/perfekt/commit/c3561dc0c18151fc38a0415556211ffe7cff83bf)
- add main modules tests [8990fd64](https://github.com/lekterable/perfekt/commit/8990fd64de5ababc39eba8e8c9b2d7b2509216ef)
- include commit links in the changelog [8f622021](https://github.com/lekterable/perfekt/commit/8f622021665bc6076d00fde6527800980eba836a)

# 1.0.0

## BREAKING

- group changelog entries by type [c5f11dab](https://github.com/lekterable/perfekt/commit/c5f11dab8f350e3765e0435122494fac959bf3da)

## Features

- add --root option [b813606b](https://github.com/lekterable/perfekt/commit/b813606b18a1bdd1acb89db615db26705dcc72f4)
- add initialize config feature [187e9201](https://github.com/lekterable/perfekt/commit/187e92014cbeaa576cfca2218e8bf6d406fc724a)
- add package version [b9108801](https://github.com/lekterable/perfekt/commit/b91088017bbc059063d0ced001427b1b1ec03da2)
- prepend the CHANGELOG file instead of rewriting it [960ea6f5](https://github.com/lekterable/perfekt/commit/960ea6f5b301d181da1a6f644627af183e1e513e)
- add update version feature [fdef971e](https://github.com/lekterable/perfekt/commit/fdef971e2cb81062be1dedefac4da1c8d1b36dd7)

## Misc

- move util tests to separate files [db810d58](https://github.com/lekterable/perfekt/commit/db810d5879dbfb9ea5981750285d09bef760ea15)
- move commands to separate files [dbd5fa05](https://github.com/lekterable/perfekt/commit/dbd5fa05035bb0a7b8279155cb987e85f882a503)

# 0.2.0

## Features

- include changelog in the releases [2da21c56](https://github.com/lekterable/perfekt/commit/2da21c56b13af5ea23e6c3660bf67dd7dffcae8a)
- add option to write to local CHANGELOG file [51ef458b](https://github.com/lekterable/perfekt/commit/51ef458bb35d3bbdcf149d37c640b0f0d2c09bf0)

## Misc

- add utils tests [217b25d0](https://github.com/lekterable/perfekt/commit/217b25d0b22b0280178f776a6a8e294b9d32ef6c)
- extract line generating logic to function and promisify exec [e69a284b](https://github.com/lekterable/perfekt/commit/e69a284b02c7a70c6c2d0c297c663235c8d3dacd)

# 0.1.0

## Features

- add execute release feature [4e02179c](https://github.com/lekterable/perfekt/commit/4e02179cae1234d7083036024080a3f25fcb52c2)
- exclude CHANGELOG scoped entries [847282e9](https://github.com/lekterable/perfekt/commit/847282e92d695a14b1bd1201197e39b3c890621e)
- add generate changelog feature [7b907d9d](https://github.com/lekterable/perfekt/commit/7b907d9dde9ad20a2138c06332ba920522f42dab)
- init :seedling: [c681eb22](https://github.com/lekterable/perfekt/commit/c681eb22a1b2662d0ddc168d2989d2f31be93d97)

## Fixes

- support other conventions [b2f59019](https://github.com/lekterable/perfekt/commit/b2f5901922505efbfb6dd684252e8df0cdffeeb2)

## Misc

- add CHANGELOG.md [f14c2848](https://github.com/lekterable/perfekt/commit/f14c28483e506dcec028d040eb1dfaf7c04dd2f6)
