import app from "./app";
import * as dotenv from "dotenv";
import { connectDb } from "./lib/db";

dotenv.config(); // Load environment variables from .env file
connectDb(); // Connect to the database

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running on http://localhost:${PORT}`);
});
