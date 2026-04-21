const { Sequelize } = require('sequelize');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

// Initialize Sequelize for PostgreSQL (Neon-compatible SSL)
const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: { 
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
});

module.exports = sequelize;
