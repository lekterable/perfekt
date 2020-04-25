# Latest

## Features

- introduce changelog customization using config file e66d6176
- use higher level of headers for changelog eea23d95

## Fixes

- stop adding empty line at the end of the file on --root faee4801
- stop adding Latest when not applicable c64fa467

# 1.0.0

## BREAKING

- group changelog entries by type c5f11dab

## Features

- add --root option b813606b
- add initialize config feature 187e9201
- add package version b9108801
- prepend the CHANGELOG file instead of rewriting it 960ea6f5
- add update version feature fdef971e

## Misc

- move util tests to separate files db810d58
- move commands to separate files dbd5fa05

# 0.2.0

## Features

- include changelog in the releases 2da21c56
- add option to write to local CHANGELOG file 51ef458b

## Misc

- add utils tests 217b25d0
- extract line generating logic to function and promisify exec e69a284b

# 0.1.0

## Features

- add execute release feature 4e02179c
- exclude CHANGELOG scoped entries 847282e9
- add generate changelog feature 7b907d9d
- init :seedling: c681eb22

## Fixes

- support other conventions b2f59019

## Misc

- add CHANGELOG.md f14c2848
