# Configuration

> **perfekt's** huge advantage is it's configurability.

See [cosmiconfig](https://github.com/davidtheclark/cosmiconfig) for more details on what configuration formats are supported.

Default config looks like this:

```json
{
  "unreleasedHeader": "# Latest",
  "releaseHeader": "# %version%",
  "breakingHeader": "## BREAKING",
  "miscHeader": "## Misc",
  "lineFormat": "- %message% %hash%",
  "groups": [
    {
      "name": "## Features",
      "change": "minor",
      "aliases": ["feat", "feature"]
    },
    {
      "name": "## Fixes",
      "change": "patch",
      "aliases": ["fix"]
    }
  ],
  "ignoredScopes": ["changelog"]
}
```

## unreleasedHeader

Format of the unreleased-block header in the generated changelog

Placeholders:

`none`

Default:

`# Latest`

## releaseHeader

Format of the release header in the generated changelog

Placeholders:

`%version%` - release version

Default:

`# %version%`

## breakingHeader

Format of the breaking changes header in the generated changelog

Placeholders:

`none`

Default:

`## BREAKING`

## miscHeader

Format of the miscellaneous header in the generated changelog

Placeholders:

`none`

Default:

`## Misc`

## lineFormat

Format of the individual lines in the generated changelog

Placeholders:

`%message%` - commit message

`%hash%` - abbreviated (8-digit long) commit hash

`%HASH%` - full commit hash

Default:

`- %message% %hash%`

## groups

Used to define how commits should be grouped inside of the release block.

Each object is a separate group, e.g:

```json
{
  "name": "## Features",
  "change": "minor",
  "types": ["feat", "feature"]
}
```

The `name` property will be used as the group's header in changelog, `change` is needed to determine the release type when using `new` as a release version and the `types` array contains all commit types which should be associated with that group.

All commits with unmatched types will become a part of the `Misc` group.

> commit type comes from: `type(scope?): message`

Default:

```json
[
  {
    "name": "## Features",
    "change": "minor",
    "types": ["feat", "feature"]
  },

  {
    "name": "## Fixes",
    "change": "patch",
    "types": ["fix"]
  }
]
```

> change can be either `major`, `minor` or `patch`

> `Breaking` and `Misc` groups correspond to `major` and `patch` changes respectively.

## ignoredScopes

Array of scopes which will be ignored while generating a changelog

Default:

`['changelog']`
