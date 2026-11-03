import express from "express";
import cors from "cors";
import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";
import { jwtVerify, createRemoteJWKSet } from 'jose'

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

// Verify API Middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization Header:", authHeader); // Log the authorization header for debugging

  if (!authHeader) {
    return res.status(401).json({
      error: "Unauthorized access. Please log in.",
    }).send({msg: 'Unauthorized! Please log in.'});
  }

  const token = authHeader.split(" ")[1];   // Assuming the token is in the format "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      error: "Unauthorized access. Please log in.",
    }).send({msg: 'Unauthorized! Please log in.'});
  }
  // console.log("Token:", token);
  
  const JWKS = createRemoteJWKSet(new URL('http://localhost:3000/api/auth/jwks'))

  try {
    const {payload} = await jwtVerify(token, JWKS)
    // console.log("Decoded Payload:", payload); 
    next(); // Proceed to the next middleware or route handler
  }
  catch (error) {
    console.error("Token verification error:", error);
    return res.status(500).json({
      error: "Unauthorized access. Invalid token.",
    }).send({msg: 'Unauthorized! Invalid token.'});
  }
};

app.use(express.json());

// MongoDB Connection
const client = new MongoClient(process.env.MONGODB_URI);

await client.connect();
console.log("Successfully connected to MongoDB!");

const db = client.db("booknook");
const books = db.collection("books");
const borrowedBooks = db.collection("borrowedBooks");

// Duplicate Borrow Handle
await borrowedBooks.createIndex(
  {
    bookId: 1,
    "borrower.email": 1,
  },
  {
    unique: true,
  }
);

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
app.get("/book-details/:id", verifyToken,  async (req, res) => {
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


// Get Logged-in User's Books | My Books
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


// Borrow a Book
app.post("/borrow", async (req, res) => {
  try {
    const { bookId, borrower } = req.body;

    // Validate request data
    if (
      !bookId ||
      !ObjectId.isValid(bookId) ||
      !borrower?.name?.trim() ||
      !borrower?.email?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid borrow information",
      });
    }

    // Find the book
    const book = await books.findOne({
      _id: new ObjectId(bookId),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    // Check if the user already borrowed this book
    const existingBorrow = await borrowedBooks.findOne({
      bookId: new ObjectId(bookId),
      "borrower.email": borrower.email.trim().toLowerCase(),
    });

    if (existingBorrow) {
      return res.status(409).json({
        success: false,
        message: "You have already borrowed this book",
      });
    }

    // Atomically decrease available copies
    const updateResult = await books.updateOne(
      {
        _id: new ObjectId(bookId),
        copy: { $gt: 0 },
      },
      {
        $inc: { copy: -1 },
      }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        message: "This book is currently unavailable",
      });
    }

    // Calculate borrowing and return dates
    const borrowedAt = new Date();

    const returnDate = new Date(borrowedAt);
    returnDate.setDate(returnDate.getDate() + 7);

    // Create borrow document
    const borrowData = {
      bookId: new ObjectId(bookId),

      name: book.name,
      author: book.author,
      category: book.category,
      img: book.img,

      borrower: {
        name: borrower.name.trim(),
        email: borrower.email.trim().toLowerCase(),
      },

      borrowedAt,
      returnDate,
      status: "borrowed",
    };

    try {
      const result = await borrowedBooks.insertOne(borrowData);

      res.status(201).json({
        success: true,
        message: "Book borrowed successfully",
        insertedId: result.insertedId,
        borrow: borrowData,
      });
    } catch (error) {
      // Restore copy if inserting the borrow record fails
      await books.updateOne(
        { _id: new ObjectId(bookId) },
        { $inc: { copy: 1 } }
      );

      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "You have already borrowed this book",
        });
      }

      throw error;
    }
  } catch (error) {
    console.error("Error borrowing book:", error);

    res.status(500).json({
      success: false,
      message: "Failed to borrow book",
    });
  }
});

// Get My Borrowed Books
app.get("/my-borrows", async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const result = await borrowedBooks
      .find({
        "borrower.email": email.toLowerCase(),
        status: "borrowed",
      })
      .sort({ borrowedAt: -1 })
      .toArray();

    res.json(result);
  } catch (error) {
    console.error("Error fetching borrowed books:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch borrowed books",
    });
  }
});


// Return a Book
app.patch("/return/:id", async (req, res) => {
  let borrowId;
  let borrowRecord;

  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid borrow ID",
      });
    }

    borrowId = new ObjectId(id);

    borrowRecord = await borrowedBooks.findOne({
      _id: borrowId,
      status: "borrowed",
    });

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: "Borrowed book not found or already returned",
      });
    }

    const returnResult = await borrowedBooks.updateOne(
      {
        _id: borrowId,
        status: "borrowed",
      },
      {
        $set: {
          status: "returned",
          returnedAt: new Date(),
        },
      }
    );

    if (returnResult.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        message: "This book has already been returned",
      });
    }

    const bookResult = await books.updateOne(
      { _id: borrowRecord.bookId },
      { $inc: { copy: 1 } }
    );

    if (bookResult.modifiedCount === 0) {
      await borrowedBooks.updateOne(
        { _id: borrowId, status: "returned" },
        {
          $set: { status: "borrowed" },
          $unset: { returnedAt: "" },
        }
      );

      return res.status(404).json({
        success: false,
        message: "Original book not found",
      });
    }

    res.json({
      success: true,
      message: "Book returned successfully",
    });
  } catch (error) {
    console.error("Error returning book:", error);

    // Roll back the status if the return operation fails
    if (borrowId && borrowRecord) {
      await borrowedBooks.updateOne(
        { _id: borrowId, status: "returned" },
        {
          $set: { status: "borrowed" },
          $unset: { returnedAt: "" },
        }
      ).catch(console.error);
    }

    res.status(500).json({
      success: false,
      message: "Failed to return book",
    });
  }
});


// Start Server
app.listen(PORT, () => {
  console.log(`BookNook server is running on port ${PORT}`);
});
