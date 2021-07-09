import fs from 'fs'

const readFile = fileName =>
  new Promise((resolve, reject) => {
    fs.readFile(fileName, 'utf8', (err, file) => {
      if (err) return reject(err)
      return resolve(file)
    })
  })

export default readFile
