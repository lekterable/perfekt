import fs from 'fs'

const readFile = (fileName: string) =>
  new Promise<string>((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, file) => {
      if (err) return reject(err)

      return resolve(file)
    })
  })

export default readFile
