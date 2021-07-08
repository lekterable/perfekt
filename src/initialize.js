import { writeFileSync } from 'fs'
import inquirer from 'inquirer'

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

export const initialize = async () => {
  const { configFormat } = await inquirer.prompt(questions)

  writeFileSync(configFormat, '')
}
