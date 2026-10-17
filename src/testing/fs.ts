import type fs from 'fs'

type ReadFileCallback = (
  error: NodeJS.ErrnoException | null,
  data: string,
) => void
type WriteFileCallback = (error: NodeJS.ErrnoException | null) => void

const toError = (error: unknown) =>
  (error instanceof Error
    ? error
    : new Error(String(error))) as NodeJS.ErrnoException

export const rejectReadFile = (error: unknown) =>
  ((_fileName: unknown, _encoding: unknown, callback: ReadFileCallback) =>
    callback(toError(error), '')) as unknown as typeof fs.readFile

export const resolveReadFile = (content: string) =>
  ((_fileName: unknown, _encoding: unknown, callback: ReadFileCallback) =>
    callback(null, content)) as unknown as typeof fs.readFile

export const rejectWriteFile = (error: unknown) =>
  ((
    _fileName: unknown,
    _content: unknown,
    _encoding: unknown,
    callback: WriteFileCallback,
  ) => callback(toError(error))) as unknown as typeof fs.writeFile

export const resolveWriteFile = () =>
  ((
    _fileName: unknown,
    _content: unknown,
    _encoding: unknown,
    callback: WriteFileCallback,
  ) => callback(null)) as unknown as typeof fs.writeFile
