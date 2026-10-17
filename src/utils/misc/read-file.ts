import fs from 'fs'

const readFile = (fileName: string) =>
  new Promise<string>((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (error, file) => {
      if (error) return reject(error)

      return resolve(file)
    })
  })

export default readFile
