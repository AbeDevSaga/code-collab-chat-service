const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./configuration/db_config");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(
  cors({
    origin: "*", 
    methods: "GET,POST,PUT,DELETE", 
    allowedHeaders: "Content-Type,Authorization", 
  })
);

connectDB();

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use("/api/chat-group", require("./routes/chatGroupRoutes")); 
app.use("/api/messages", require("./routes/messageRoutes"));

app.get("/", (req, res) => {
  res.send(
    "<h1>Welcome to the chat-group Service!</h1><p>Use the /api/projects route to manage projects.</p>"
  );
});

app.listen(PORT, () => console.log(`Project Service running on port ${PORT}`));
