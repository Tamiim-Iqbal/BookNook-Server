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
    credentials: true,
  })
);

app.use(express.json());

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URI);

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
    const allBooks = await books
      .find()
      .sort({ addedAt: -1 })
      .toArray();

    res.json(allBooks);
  } catch (error) {
    console.error("Error fetching books:", error);

    res.status(500).json({
      error: "Failed to fetch books",
    });
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
    console.error("Error adding book:", error);

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
  } catch (error) {
    console.error("Error fetching latest books:", error);

    res.status(500).json({
      error: "Failed to fetch latest books",
    });
  }
});

// Get Book by ID
app.get("/book-details/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        error: "Invalid book ID",
      });
    }

    const result = await books.findOne({
      _id: new ObjectId(id),
    });

    if (!result) {
      return res.status(404).json({
        error: "Book not found",
      });
    }

    res.json(result);
  } catch (error) {
    console.error("Error fetching book:", error);

    res.status(500).json({
      error: "Failed to fetch book",
    });
  }
});

// Update a Book
app.patch("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate book ID
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const {
      name,
      author,
      category,
      copy,
      img,
      description,
      rating,
    } = req.body;

    // Validate required fields
    if (
      !name?.trim() ||
      !author?.trim() ||
      !category?.trim() ||
      !img?.trim() ||
      !description?.trim() ||
      copy === undefined ||
      rating === undefined
    ) {
      return res.status(400).json({
        message: "All book fields are required",
      });
    }

    // Validate copy and rating
    if (
      !Number.isInteger(Number(copy)) ||
      Number(copy) < 1 ||
      !Number.isFinite(Number(rating)) ||
      Number(rating) < 0 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        message: "Invalid copy or rating value",
      });
    }

    // Prepare updated book data
    const updatedBook = {
      name: name.trim(),
      author: author.trim(),
      category: category.trim(),
      copy: Number(copy),
      img: img.trim(),
      description: description.trim(),
      rating: Number(rating),
    };

    const result = await books.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedBook }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Book updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error updating book:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update book",
    });
  }
});

// Delete a Book
app.delete("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid book ID",
      });
    }

    const result = await books.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        message: "Book not found",
      });
    }

    res.json({
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting book:", error);

    res.status(500).json({
      message: "Failed to delete book",
    });
  }
});


// Get Logged-in User's Books
app.get("/my-books", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const myBooks = await books
      .find({ "addedBy.email": email })
      .sort({ addedAt: -1 })
      .toArray();

    res.json(myBooks);
  } catch (error) {
    console.error("Error fetching user's books:", error);

    res.status(500).json({
      error: "Failed to fetch user's books",
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`BookNook server is running on port ${PORT}`);
});
