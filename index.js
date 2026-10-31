import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient } from "mongodb";

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(
  cors({
    origin: [
      "https://web-booknook.vercel.app",
      "http://localhost:3000",
    ],
  })
);

app.use(express.json());

// MongoDB Connection
const client = new MongoClient(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ac-arrrync-shard-00-00.yloqdzu.mongodb.net:27017,ac-arrrync-shard-00-01.yloqdzu.mongodb.net:27017,ac-arrrync-shard-00-02.yloqdzu.mongodb.net:27017/?ssl=true&replicaSet=atlas-9ee286-shard-0&authSource=admin`);

await client.connect();
console.log("Successfully connected to MongoDB!");

const db = client.db("booknook");
const books = db.collection("books");

// Home Route
app.get("/", (req, res) => {
  res.send("Hello from BookNook server");
});

// Get All Books
app.get("/books", async (req, res) => {
  try {
    const allBooks = await books.find().toArray();
    res.json(allBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Get Latest 8 Books
app.get("/books/latest", async (req, res) => {
  try {
    const latestBooks = await books
      .find()
      .sort({ _id: -1 })
      .limit(8)
      .toArray();

    res.json(latestBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch latest books" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`BookNook server is running on port ${PORT}`);
});