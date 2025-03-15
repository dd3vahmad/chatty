import app from "./app";
import { config } from "dotenv";
import { connectDb } from "./lib/db";

config(); // Load environment variables from .env file
connectDb(); // Connect to the database

const PORT = process.env.PORT || 3030;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
