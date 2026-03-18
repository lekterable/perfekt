import fs from 'fs'

type ReadFileCallback = (
  error: NodeJS.ErrnoException | null,
  data: string
) => void
type WriteFileCallback = (error: NodeJS.ErrnoException | null) => void

const toError = (error: unknown) =>
  (error instanceof Error
    ? error
    : new Error(String(error))) as NodeJS.ErrnoException

export const rejectReadFile = (error: unknown) =>
  ((_: unknown, __: unknown, callback: ReadFileCallback) =>
    callback(toError(error), '')) as unknown as typeof fs.readFile

export const resolveReadFile = (content: string) =>
  ((_: unknown, __: unknown, callback: ReadFileCallback) =>
    callback(null, content)) as unknown as typeof fs.readFile

export const rejectWriteFile = (error: unknown) =>
  ((_: unknown, __: unknown, ___: unknown, callback: WriteFileCallback) =>
    callback(toError(error))) as unknown as typeof fs.writeFile

export const resolveWriteFile = () =>
  ((_: unknown, __: unknown, ___: unknown, callback: WriteFileCallback) =>
    callback(null)) as unknown as typeof fs.writeFile
