import app from "./app";
import * as dotenv from "dotenv";
import { connectDb } from "./lib/db";
import { Server } from "socket.io"
import { createServer } from "node:http";

dotenv.config(); // Load environment variables from .env file
connectDb(); // Connect to the database

// Socket.io initialization
const server = createServer(app)
const io = new Server(server)

io.on("connection", (socket) => {
  console.log("New connection")

  socket.on("disconnect", (c) => {
    console.log("Connection closed", c)
  })
})

const PORT = process.env.PORT || 3030;

server.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running on http://localhost:${PORT}`);
});
