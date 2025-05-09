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
origin: process.env.CLIENT_URL, // Allow requests from the frontend
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "OPTIONS"], // Allow specific methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allow specific headers
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
