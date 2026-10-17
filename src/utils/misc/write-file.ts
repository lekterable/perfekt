import fs from 'fs'

const writeFile = (fileName: string, content: string) =>
  new Promise<void>((resolve, reject) =>
    fs.writeFile(fileName, content, 'utf8', (error) => {
      if (error) return reject(error)

      return resolve()
    }),
  )

export default writeFile
