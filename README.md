# BookNook Server

BookNook Server is a REST API for managing a shared book collection. It is
built with Express and MongoDB and supports adding, browsing, updating, and
deleting books, as well as borrowing and returning books.

## Features

- Book CRUD operations
- Latest books listing
- User-specific book listings
- Borrow and return workflows
- Duplicate-borrow protection
- Available-copy tracking
- MongoDB persistence
- CORS support for the BookNook client and local development

## Tech Stack

<p>
  <img style="height: 30px;" src="https://img.shields.io/badge/Node.js_18+-339933?logo=node.js&logoColor=white" alt="Node.js 18+" />
  <img style="height: 30px;" src="https://img.shields.io/badge/Express.js_5-000000?logo=express&logoColor=white" alt="Express.js 5" />
  <img style="height: 30px;" src="https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white" alt="MongoDB" />
  <img style="height: 30px;" src="https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black" alt="JavaScript" />
  <img style="height: 30px;" src="https://img.shields.io/badge/dotenv-ECD53F?logo=dotenv&logoColor=black" alt="dotenv" />
  <img style="height: 30px;" src="https://img.shields.io/badge/CORS-333333?logoColor=white" alt="CORS" />
</p>


## Getting Started

### Prerequisites

- Node.js 18 or later
- A MongoDB deployment

### Installation

```bash
git clone <repository-url>
cd 03-booknook-server
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
MONGODB_URI=your-mongodb-connection-string
PORT=5001
```

`PORT` is optional and defaults to `5001`. Do not commit `.env` or expose your
MongoDB connection string.

### Run the server

Start the server normally:

```bash
npm start
```

Start the server with automatic reload during development:

```bash
npm run dev
```

The API is available at `http://localhost:5001` by default.

## API Endpoints

### Books

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/` | Check that the server is running |
| `GET` | `/books` | Get all books, newest first |
| `POST` | `/books` | Add a new book |
| `GET` | `/books/latest` | Get the eight newest books |
| `GET` | `/book-details/:id` | Get one book by MongoDB ID |
| `PATCH` | `/books/:id` | Update a book |
| `DELETE` | `/books/:id` | Delete a book |
| `GET` | `/my-books?email=user@example.com` | Get books added by a user |

### Borrowing

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/borrow` | Borrow an available book |
| `GET` | `/my-borrows?email=user@example.com` | Get a user's active borrowed books |
| `PATCH` | `/return/:id` | Return a borrowed book |

## Request examples

### Add a book

```json
{
  "name": "The Hobbit",
  "author": "J. R. R. Tolkien",
  "category": "Fantasy",
  "copy": 3,
  "img": "https://example.com/the-hobbit.jpg",
  "description": "A fantasy adventure novel.",
  "rating": 4.8,
  "addedBy": {
    "email": "reader@example.com"
  }
}
```

### Borrow a book

```json
{
  "bookId": "507f1f77bcf86cd799439011",
  "borrower": {
    "name": "Alex Reader",
    "email": "reader@example.com"
  }
}
```

Borrowed books receive a seven-day return date. A user cannot borrow the same
book more than once while an existing borrow is active.

## Database

The server connects to the `booknook` database and uses these collections:

- `books`
- `borrowedBooks`

The `borrowedBooks` collection has a unique index on the book ID and borrower
email to prevent duplicate active borrow records.

## Project structure

```text
.
├── index.js        # Express application and API routes
├── package.json    # Scripts and dependencies
├── package-lock.json
└── .env            # Local environment variables (not committed)
```

## License

This project is released under the ISC license.
