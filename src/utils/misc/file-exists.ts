import fs from 'fs'

const fileExists = (fileName: string) => fs.existsSync(fileName)

export default fileExists
