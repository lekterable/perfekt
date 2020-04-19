const path = require('path')

module.exports = {
  mode: 'production',
  target: 'node',
  entry: './src/index.js',
  output: {
    path: path.resolve('dist'),
    filename: 'index.js',
    library: 'perfekt',
    libraryTarget: 'umd'
  },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }]
  }
}
