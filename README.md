# ☕ Coffee House API

A modern REST API for a coffee shop application built with NestJS, TypeScript, and SQLite. This backend service provides comprehensive functionality for managing products, user authentication, and order processing.

## 🚀 Features

- **Product Management**: Browse coffee products with detailed information including sizes, additives, and pricing
- **User Authentication**: JWT-based authentication with registration and login
- **Order Processing**: Handle both anonymous and authenticated orders
- **Interactive API Documentation**: Swagger UI for easy API exploration and testing
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Data Seeding**: Automatic database population with sample coffee products
- **Input Validation**: Robust request validation using class-validator

## 🛠️ Tech Stack

- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: SQLite with TypeORM
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI 3.0
- **Validation**: class-validator & class-transformer
- **Password Hashing**: bcrypt

## 📋 Prerequisites

- Node.js (v22 or higher)
- npm or yarn

## 🔧 Installation

1. Clone the repository:
```bash
git clone git@github.com:AlreadyBored/coffee-shop-be.git
cd coffee-shop-be
```

2. Install dependencies:
```bash
npm install
```

3. The application will automatically create and seed the SQLite database on first run.

## 🚀 Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run start:prod

# Debug mode
npm run start:debug
```

The server will start on `http://localhost:3000`

## 📚 API Documentation

Interactive Swagger UI documentation is available at:
**http://localhost:3000/api**

The API documentation includes:
- Complete endpoint descriptions
- Request/response schemas
- Authentication examples
- Interactive testing interface

## 🔗 API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile (protected)

### Products
- `GET /products/favorites` - Get 3 random coffee products for main page
- `GET /products` - Get all products (without sizes and additives)
- `GET /products/:id` - Get full product details by ID

### Orders
- `POST /orders/confirm` - Confirm order (anonymous or authenticated)
- `POST /orders/confirm-auth` - Confirm order (authenticated users only)

### General
- `GET /` - API information and available endpoints

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Register a new user or login with existing credentials
2. Include the JWT token in the Authorization header:
   ```
   Authorization: Bearer <your-jwt-token>
   ```

### User Registration Example
```json
{
  "login": "john123",
  "password": "password123",
  "confirmPassword": "password123",
  "city": "New York",
  "street": "Main Street",
  "houseNumber": 123,
  "paymentMethod": "card"
}
```

## 📦 Project Structure

```
src/
├── app.controller.ts          # Main application controller
├── app.module.ts             # Root application module
├── main.ts                   # Application entry point
├── common/                   # Shared utilities and interfaces
│   ├── dto/                  # Data Transfer Objects
│   ├── interfaces/           # TypeScript interfaces
│   ├── services/            # Shared services (seeding)
│   └── utils/               # Utility functions
├── entities/                # TypeORM entities
│   ├── product.entity.ts    # Product database model
│   └── user.entity.ts       # User database model
└── modules/                 # Feature modules
    ├── auth/                # Authentication module
    ├── orders/              # Order processing module
    └── products/            # Product management module
```

## 🗄️ Database

The application uses SQLite with TypeORM for data persistence. The database is automatically created and seeded with sample coffee products on first run.

### Entities
- **User**: User accounts with authentication details and address information
- **Product**: Coffee products with sizes, additives, and pricing information

## 🧪 Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔍 Code Quality

```bash
# Linting
npm run lint

# Code formatting
npm run format
```

## 🌟 Key Features Explained

### Type-Safe JSON Parsing
The application includes a generic `safeJsonParse<T>` utility function that provides type-safe JSON parsing with error handling.

### Automatic Data Seeding
On startup, the application automatically seeds the database with coffee products from `data/products.json` if no products exist.

### Comprehensive Validation
All API endpoints include robust input validation using decorators from `class-validator`.

### JWT Authentication
Secure authentication system with password hashing using bcrypt and JWT token generation.

### Swagger Integration
Complete API documentation with interactive testing capabilities using Swagger UI.

## 🚦 CORS Configuration

The API is configured to accept requests from:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

## 📝 Environment

The application runs on port 3000 by default. Database file (`shop.db`) is created in the project root.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related Projects

This backend API is designed to work with a corresponding frontend coffee shop application.

---

**Happy Coding! ☕**