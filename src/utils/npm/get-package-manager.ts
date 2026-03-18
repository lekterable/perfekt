import fs from 'fs'
import fileExists from '~utils/misc/file-exists'
import { PackageManagerName } from '~types'

const packageManagers = {
  npm: {
    lockfile: 'package-lock.json',
    versionCommand: (version: string) =>
      `npm version ${version} --no-git-tag-version`
  },
  pnpm: {
    lockfile: 'pnpm-lock.yaml',
    versionCommand: (version: string) =>
      `pnpm version ${version} --no-git-tag-version`
  },
  yarn: {
    lockfile: 'yarn.lock',
    versionCommand: (version: string) =>
      `yarn version --new-version ${version} --no-git-tag-version`
  }
} as const

const packageManagerOrder: PackageManagerName[] = ['npm', 'pnpm', 'yarn']

const isPackageManager = (value: string): value is PackageManagerName =>
  packageManagerOrder.includes(value as PackageManagerName)

const getPackageManagerFromPackageJson = () => {
  if (!fileExists('package.json')) return

  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))

    if (typeof packageJson.packageManager !== 'string') return

    const [packageManager] = packageJson.packageManager.split('@')

    if (isPackageManager(packageManager)) return packageManager
  } catch {
    return
  }
}

export const getPackageManager = (): PackageManagerName => {
  const packageManager = getPackageManagerFromPackageJson()

  if (packageManager) return packageManager

  const detected = packageManagerOrder.find(manager =>
    fileExists(packageManagers[manager].lockfile)
  )

  return detected ?? 'npm'
}

export const getReleaseFiles = () => {
  const packageManager = getPackageManager()
  const files = [
    'CHANGELOG.md',
    'package.json',
    packageManagers[packageManager].lockfile
  ]

  return files.filter(fileExists)
}

export const getVersionCommand = (version: string) =>
  packageManagers[getPackageManager()].versionCommand(version)

export default getPackageManager
