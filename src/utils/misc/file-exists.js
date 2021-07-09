import fs from 'fs'

const fileExists = fileName => fs.existsSync(fileName)

export default fileExists
