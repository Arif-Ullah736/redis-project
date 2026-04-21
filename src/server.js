const http = require('http');
const app = require('./app');
const sequelize = require('./config/db');
// require cloudinary config (config runs on import)
require("./config/cloudinary");

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    // Verify DB connection before starting server (Sequelize)
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL via Sequelize successfully');

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`backend listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
