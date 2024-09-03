const app = require('./app');

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`App is running on port ${port} ...`);
});

process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhadled Rejection! 💥 Shutting down...');
  server.close(() => process.exit(1));
});
