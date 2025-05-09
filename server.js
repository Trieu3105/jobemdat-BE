// index.js
const express = require("express");
const app = express();
const cors = require('cors');
require('dotenv').config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
  });
const loginRouter = require("./API/auth");
const giftcodeRouter = require("./API/giftcode");
const paymentRouter = require("./API/payment");
const contentRouter = require("./API/posts");


const PORT = process.env.PORT || 8080;

corsOptions = {
  origin: process.env.CLIENT_URL, // Use CLIENT_URL from environment variables
  methods: ['GET', 'POST',"OPTIONS"], 
  credentials: true, // Allow credentials (cookies) to be sent
};

app.use(cors(corsOptions)); // Apply CORS options globally
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.use('/api/', loginRouter);
app.use('/api/', giftcodeRouter);
app.use('/api/', paymentRouter);
app.use('/api/', contentRouter);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
