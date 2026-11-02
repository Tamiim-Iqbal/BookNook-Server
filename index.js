import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

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
const client = new MongoClient(process.env.MONGODB_URI);

await client.connect();
console.log("Successfully connected to MongoDB!");

const db = client.db("booknook");
const books = db.collection("books");   // all books collection

// Home Route
app.get("/", (req, res) => {
  res.send("Hello from BookNook server");
});

// Get All Books
app.get("/books", async (req, res) => {
  try {
    const allBooks = await books
      .find()
      .sort({ addedAt: -1 })
      .toArray();

    res.json(allBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

// Add a New Book
app.post("/books", async (req, res) => {
  try {
    const newBook = {
      ...req.body,
      addedAt: new Date(),
    };

    const result = await books.insertOne(newBook);

    res.status(201).json({
      success: true,
      message: "Book added successfully",
      insertedId: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add book",
    });
  }
});

// Get Latest 8 Books
app.get("/books/latest", async (req, res) => {
  try {
    const latestBooks = await books
      .find()
      .sort({ addedAt: -1 })
      .limit(8)
      .toArray();

    res.json(latestBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch latest books" });
  }
});

// Get Book by ID
app.get("/book-details/:id", async (req, res) => {
  const {id} = req.params;

  try {
    const result = await books.findOne({ _id: new ObjectId(id) });

    if (!result) {
      return res.status(404).json({ error: "Book not found" });
    }
      res.json(result);
    } 
    catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch book" });
  }
});


// Get Logged-in User's Books
app.get("/books/my-books", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const myBooks = await books
      .find({ "addedBy.email": email })
      .sort({ addedAt: -1 })
      .toArray();

    res.json(myBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch user's books" });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`BookNook server is running on port ${PORT}`);
});