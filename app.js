const express = require('express');

const mongoose = require('mongoose');
const listingRoutes = require('./routes/listings');

const dotenv = require('dotenv');
const colors = require('colors');
const errorHandler = require('./middleware/error');
const connectDB = require('./config/db');
const chatRoomRoutes = require('./routes/chatRoomRoutes');

const cookieParser = require('cookie-parser');
const cors = require("cors");
const morgan = require('morgan');
const expressUpload = require('express-fileupload');

// route files
const auth = require('./routes/auth');
const users = require('./routes/users');
const listings = require('./routes/listings');
const ticketRoutes = require('./routes/ticketRoutes');
const app = express();

// load env vars
dotenv.config({ path: './config/config.env' });

// connect to DB
connectDB(app);

// view engine
app.set('view engine', 'ejs');

// middleware
app.use(express.static('public'));
app.use(express.json());
app.use(cookieParser());
app.use(expressUpload());
app.use(cors({
  credentials: true,
  origin: "http://localhost:3000"
}));


// dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get("/")
// mount routers
app.use('/api/listings', listings);
app.use('/api/auth', auth);
app.use('/api/users', users);
//check signed in user for all get get requests
app.use("/api/chatroom", chatRoomRoutes);
app.use("/api/", ticketRoutes);

app.use(errorHandler);

app.get('/', (req, res) => res.render('home'));
app.use("*", (req, res) => {
  return res.status(404).json({
    success: false,
    message: 'API endpoint does not exist.'
  })
});