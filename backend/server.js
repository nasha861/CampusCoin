const express = require("express");
const cors = require("cors");

require("dotenv").config();

const connectDB = require("./src/config/db");

const app = express();



app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "CampusCoin API is running",
  });
});

const PORT = process.env.PORT || 8000;

connectDB();

app.listen(PORT, () => {
  console.log(`CampusCoin server running on port ${PORT}`);
});