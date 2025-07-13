# Game Review API Server

This is a Node.js and Express REST API for managing game reviews, built as part of the SENG365 course.

## Features

- User authentication and authorization
- Game creation, retrieval, and updating
- Review submission and retrieval
- MySQL database integration

## Getting Started

Follow these instructions to run the API locally.

### Prerequisites

- Node.js (v14 or higher recommended)
- npm
- MySQL database

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/your-username/game-review-api.git
   cd game-review-api
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a `.env` file in the root directory with your database credentials:

   ```
   SENG365_MYSQL_HOST={your host}
   SENG365_MYSQL_USER={your user}
   SENG365_MYSQL_PASSWORD={your password}
   SENG365_MYSQL_DATABASE={your database name}
   ```

   **Example:**
   ```
   SENG365_MYSQL_HOST=db2.csse.canterbury.ac.nz
   SENG365_MYSQL_USER=abc123
   SENG365_MYSQL_PASSWORD=password
   SENG365_MYSQL_DATABASE=abc123_s365
   ```

### Running the Server

To start the server in production mode:

```
npm run start
```

To start the server with debugging enabled:

```
npm run debug
```

By default, the server runs on [http://localhost:4941](http://localhost:4941).

## API Overview

The API provides endpoints for:

- User registration and login
- Managing games
- Submitting and viewing reviews

Refer to the API specification or project documentation for full endpoint details.

## Author

Luke Armstrong
