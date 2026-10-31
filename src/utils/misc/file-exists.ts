import fs from 'node:fs'

const fileExists = (fileName: string) => fs.existsSync(fileName)

export default fileExists
