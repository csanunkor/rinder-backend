const mongoose = require('mongoose');
const http = require('http');
const WebSockets = require('../utils/WebSockets');

const connectDB = async (app) => {
  const PORT = process.env.PORT || 5000

  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  }).then(
    (_) => {
      
      console.log(`MongoDB Connected: ${process.env.MONGO_URI}`.cyan.underline.bold);
      const server = http.createServer(app);
      /** Create socket connection */
      const socketio = require("socket.io")(server, {
        cors: {
          origin: "http://localhost:3000",
          methods: ["GET", "POST"],
          credentials: true
        }
      });
      global.io = socketio.listen(server);
      global.io.on('connection', WebSockets.connection)
      /** Listen on provided port, on all network interfaces. */
      server.listen(PORT);
      /** Event listener for HTTP server "listening" event. */
      server.on("listening", () => {
        console.log(`Messaging on port:: http://localhost:${PORT}/`)
      });

      process.on('unhandledRejection', (err, promise) => {
        console.log(`Error: ${err.message}`.red);
        // Close server & exit process
        server.close(() => process.exit(1));
      });
    }
  )
  .catch((err) => console.log(err));
};

module.exports = connectDB;
