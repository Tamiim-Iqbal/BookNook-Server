import express from "express";
import cors from "cors";
import 'dotenv/config'
import { MongoClient } from 'mongodb';

const app = express();
const PORT = process.env.PORT || 5001;

// middleware
app.use(cors());
app.use(express.json());

// MongoDB dataabse connection
const client = new MongoClient(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@ac-arrrync-shard-00-00.yloqdzu.mongodb.net:27017,ac-arrrync-shard-00-01.yloqdzu.mongodb.net:27017,ac-arrrync-shard-00-02.yloqdzu.mongodb.net:27017/?ssl=true&replicaSet=atlas-9ee286-shard-0&authSource=admin`);

export async function connectToMongoDB() {
 try {
   await client.connect();
   console.log("Successfully connected to MongoDB!");
   return client;
 } catch (err) {
   console.dir(err);
 }
}

const dbClient = await connectToMongoDB();
const db = dbClient.db("booknook");
const books = db.collection("books");

app.get("/", (req, res) => {
  res.send("Hello from BookNook server");
});

app.get("/books", async (req, res) => {
  try {
    const allBooks = await books.find().toArray();
    res.json(allBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

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

app.listen(PORT, () => {
  console.log(`BookNook server is running on port ${PORT}`);
});