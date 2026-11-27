[![StepSecurity Maintained Action](https://raw.githubusercontent.com/step-security/maintained-actions-assets/main/assets/maintained-action-banner.png)](https://docs.stepsecurity.io/actions/stepsecurity-maintained-actions)

<h1 align="center">Cache PHP extensions in GitHub Actions</h1>

<p align="center">
  <a href="https://github.com/step-security/cache-extensions" title="Cache PHP extensions in GitHub Actions"><img alt="GitHub Actions status" src="https://github.com/step-security/cache-extensions/workflows/Node%20test%20workflow/badge.svg"></a>
  <a href="https://github.com/step-security/cache-extensions/blob/master/LICENSE" title="license"><img alt="LICENSE" src="https://img.shields.io/badge/license-MIT-428f7e.svg?logo=open%20source%20initiative&logoColor=white&labelColor=555555"></a>
  <a href="#tada-php-support" title="PHP Versions Supported"><img alt="PHP Versions Supported" src="https://img.shields.io/badge/php-5.3%20to%208.7-777bb3.svg?logo=php&logoColor=white&labelColor=555555"></a>
</p>

Cache PHP extensions in [GitHub Actions](https://github.com/features/actions "GitHub Actions"). This action has to be used along with [step-security/setup-php](https://github.com/step-security/setup-php "Setup PHP") and [actions/cache](https://github.com/actions/cache "Cache in GitHub Actions") GitHub Actions. It configures the environment required to cache PHP extensions. Refer to [Usage](#memo-usage "How to use this") section for details and example workflow.

## Contents

- [PHP Support](#tada-php-support)
- [OS/Platform Support](#cloud-osplatform-support)
- [Usage](#memo-usage)
  - [Inputs](#inputs)
  - [Flags](#flags)
  - [Workflow](#workflow)
  - [Thread Safe Setup](#thread-safe-setup)
- [License](#scroll-license)
- [Dependencies](#package-dependencies)

## :tada: PHP Support

| PHP Version |Stability|Release Support|
|-------------|--- |--- |
| 5.3         |`Stable`|`End of life`|
| 5.4         |`Stable`|`End of life`|
| 5.5         |`Stable`|`End of life`|
| 5.6         |`Stable`|`End of life`|
| 7.0         |`Stable`|`End of life`|
| 7.1         |`Stable`|`End of life`|
| 7.2         |`Stable`|`End of life`|
| 7.3         |`Stable`|`End of life`|
| 7.4         |`Stable`|`End of life`|
| 8.0         |`Stable`|`End of life`|
| 8.1         |`Stable`|`Security fixes only`|
| 8.2         |`Stable`|`Security fixes only`|
| 8.3         |`Stable`|`Active`|
| 8.4         |`Stable`|`Active`|
| 8.5         |`Stable`|`Active`|
| 8.6         |`Nightly`|`In development`|
| 8.7         |`Nightly`|`In development`|

## :cloud: OS/Platform Support

| Virtual environment | Arch    | YAML workflow label                |
|---------------------|---------|------------------------------------|
| Ubuntu 26.04        | x86_64  | `ubuntu-26.04`                     |
| Ubuntu 24.04        | x86_64  | `ubuntu-latest` or `ubuntu-24.04`  |
| Ubuntu 22.04        | x86_64  | `ubuntu-22.04`                     |
| Ubuntu 26.04        | aarch64 | `ubuntu-26.04-arm`                 |
| Ubuntu 24.04        | aarch64 | `ubuntu-24.04-arm`                 |
| Ubuntu 22.04        | aarch64 | `ubuntu-22.04-arm`                 |
| Windows Server 2025 | x64     | `windows-2025`                     |
| Windows Server 2022 | x64     | `windows-latest` or `windows-2022` |
| macOS Tahoe 26.x    | arm64   | `macos-26`                         |
| macOS Sequoia 15.x  | arm64   | `macos-latest` or `macos-15`       |
| macOS Sonoma 14.x   | arm64   | `macos-14`                         |
| macOS Tahoe 26.x    | x86_64  | `macos-26-intel`                   |
| macOS Sequoia 15.x  | x86_64  | `macos-15-intel`                   |

**Note**: Support for self-hosted runners for the above operating systems is in beta. If you use this action on a self-hosted runner, please report any issues you find.

## :memo: Usage

Use this GitHub Action when the extensions you are adding in [setup-php](https://github.com/step-security/setup-php "setup-php GitHub Action") are installed and take a long time to set up. If you are using extensions which have the result `Installed and enabled` in the logs like `pecl` extensions on `Ubuntu` or extensions which have custom support, it is recommended to use this action to cache your extensions.

### Inputs

#### `php-version` (optional)

- Specify the PHP version you want to set up.
- Accepts a `string`. For example `'8.5'`.
- Accepts `latest` to set up the latest stable PHP version.
- Accepts `nightly` to set up a nightly build of the next PHP release.
- Accepts `master` to set up a nightly build from the master branch of PHP.
- Accepts the format `d.x`, where `d` is the major version. For example `5.x`, `7.x` and `8.x`.
- See [PHP support](#tada-php-support) for the supported PHP versions.
- If not specified, it looks for `php-version-file` input.

#### `php-version-file` (optional)

- Specify a file with the PHP version you want to set up.
- Accepts a `string`. For example `'.phpenv-version'`.
- See [PHP support](#tada-php-support) for the supported PHP versions.
- By default, `.php-version` file is used.
- If not specified and the default `.php-version` file is not found, the latest stable PHP version is set up.

#### `extensions` (required)

- Specify the extensions you want to set up.
- Accepts a `string` in csv-format. For example `mbstring, xdebug, :opcache`.
- Extensions prefixed with `:` are ignored in output cache key.

#### `key` (required)

- Specify the key to identify the cache version.
- Accepts any `string`. For example `cache-v1`.
- Changing this would reset the cache.

See [action.yml](action.yml "Metadata for this GitHub Action") and usage below for more info.

### Flags

> Specify using the `env` keyword

#### `share-cache-across-jobs` (optional)

- Specify `true` to share the cache across jobs in the same workflow.
- By default, it is set to `false` and the job ID is included in the cache key.

#### `share-cache-across-workflows` (optional)

- Specify `true` to share the cache across workflows for the same job ID.
- By default, it is set to `false` and the workflow ID is included in the cache key.
- Enable both flags to share the cache across all jobs and workflows in the repository.

```yaml
- name: Setup cache environment
  id: extcache
  uses: step-security/cache-extensions@v1
  with:
    php-version: ${{ matrix.php-versions }}
    extensions: ${{ env.extensions }}
    key: ${{ env.key }}
  env:
    share-cache-across-jobs: true
    share-cache-across-workflows: true
```

### Workflow

> Cache extensions in a PHP workflow

```yaml
jobs:
  run:
    runs-on: ${{ matrix.operating-system }}
    strategy:
      matrix:
        operating-system: [ubuntu-latest, windows-latest, macos-latest]
        php-versions: ['8.3', '8.4', '8.5']
    name: PHP ${{ matrix.php-versions }} Test on ${{ matrix.operating-system }}
    env:
      extensions: intl, pcov
      key: cache-v1 # can be any string, change to clear the extension cache.
    steps:
    - name: Checkout
      uses: actions/checkout@v7

    - name: Setup cache environment
      id: extcache
      uses: step-security/cache-extensions@v1
      with:
        php-version: ${{ matrix.php-versions }}
        extensions: ${{ env.extensions }}
        key: ${{ env.key }}

    - name: Cache extensions
      uses: actions/cache@v6
      with:
        path: ${{ steps.extcache.outputs.dir }}
        key: ${{ steps.extcache.outputs.key }}
        restore-keys: ${{ steps.extcache.outputs.key }}

    - name: Setup PHP
      uses: step-security/setup-php@v2
      with:
        php-version: ${{ matrix.php-versions }}
        extensions: ${{ env.extensions }}
```

### Thread Safe Setup

If you set up both `TS` and `NTS` PHP versions in your workflow, please add `${{ env.phpts }}` to `key` and `restore-keys` inputs in `actions/cache` step in the above workflow to avoid a conflicting cache.

```yaml
- name: Cache extensions
  uses: actions/cache@v6
  with:
    path: ${{ steps.extcache.outputs.dir }}
    key: ${{ steps.extcache.outputs.key }}-${{ env.phpts }}
    restore-keys: ${{ steps.extcache.outputs.key }}-${{ env.phpts }}
```

## :scroll: License

The code and documentation in this project are under the [MIT License](LICENSE "License for step-security/cache-extensions"). This project has multiple [dependencies](https://github.com/step-security/cache-extensions/network/dependencies "Dependencies for this PHP Action"). Their licenses can be found in their respective repositories.

## :package: Dependencies

- [Node.js dependencies](https://github.com/step-security/cache-extensions/network/dependencies "Node.js dependencies")
