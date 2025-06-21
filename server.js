const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
var passport = require('passport');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const outRoutes = require('./routes/outRoutes');
const inRoutes = require('./routes/inRoutes');

const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const socket = require('./socketIO');

const io = new Server(server, {
  connectionStateRecovery: {}
});
const { timeStamp, timeLog } = require('console');

require('dotenv').config();
main().catch(err => console.log(err));

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log("database connected");
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use('/public', express.static("public"));
app.use(passport.initialize());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongoUrl: process.env.MONGODB_URL })
}));
app.use(passport.authenticate('session'));

app.use('/', outRoutes.router);
app.use('/dashbord', inRoutes.router);

socket(io);

server.listen(process.env.PORT, () => {
  console.log("server started");
})