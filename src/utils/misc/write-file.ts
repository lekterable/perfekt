import fs from 'fs'

const writeFile = (fileName: string, content: string) =>
  new Promise<void>((resolve, reject) =>
    fs.writeFile(fileName, content, 'utf8', err => {
      if (err) return reject(err)

      return resolve()
    })
  )

export default writeFile
