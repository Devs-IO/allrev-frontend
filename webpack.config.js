const Dotenv = require('dotenv-webpack');

module.exports = {
  plugins: [
    new Dotenv({
      path: './.env', // Caminho para o seu arquivo .env
    }),
  ],
};
