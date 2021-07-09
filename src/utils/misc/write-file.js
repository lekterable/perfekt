import fs from 'fs'

const writeFile = (fileName, content) =>
  new Promise((resolve, reject) =>
    fs.writeFile(fileName, content, 'utf8', err => {
      if (err) return reject(err)
      return resolve()
    })
  )

export default writeFile
