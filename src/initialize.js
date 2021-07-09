import inquirer from 'inquirer'
import { writeFile } from './utils'

export const questions = [
  {
    type: 'list',
    name: 'configFormat',
    message: 'Which format do you want to use for your your config?',
    choices: [
      '.perfektrc',
      'perfekt.config.js',
      'perfekt.yaml',
      'perfekt.json'
    ],
    default: '.perfektrc'
  }
]

const initialize = async () => {
  const { configFormat } = await inquirer.prompt(questions)

  writeFile(configFormat, '')
}

export default initialize
