# Auriva Backend - Clean MVC Architecture

Production-ready, scalable Node.js & Express REST API backend for the **Auriva** platform, built with MongoDB, Mongoose, JWT authentication, and strict Role-Based Access Control (RBAC).

---

## 🏗️ Architecture & Folder Structure

The project follows a strict **Model-View-Controller (MVC)** design pattern where concerns are separated into dedicated layers:

```text
backend/
│
├── src/
│   │
│   ├── config/               # Configuration & Database connection
│   │   ├── db.js             # Centralized MongoDB connection
│   │   └── env.js            # Strongly-typed environment variables
│   │
│   ├── constants/            # Application constants
│   │   ├── roles.js          # USER and ADMIN role constants (frozen)
│   │   └── status.js         # Account & HTTP status codes
│   │
│   ├── controllers/          # HTTP request handlers
│   │   ├── authController.js # Auth operations (register, login, otp, etc.)
│   │   ├── userController.js # User profile and account management
│   │   └── adminController.js# Admin operations & user management
│   │
│   ├── middleware/           # Express middleware
│   │   ├── authMiddleware.js # JWT verification and user hydration
│   │   ├── adminMiddleware.js# RBAC admin permission check
│   │   └── errorMiddleware.js# Centralized 404 & global error handling
│   │
│   ├── models/               # Mongoose schemas & database logic
│   │   ├── User.js           # User schema with extensible fields & hashing
│   │   └── Admin.js          # Admin schema with secure credentials
│   │
│   ├── routes/               # API endpoint routing definitions
│   │   ├── authRoutes.js     # /api/v1/auth routes
│   │   ├── userRoutes.js     # /api/v1/users routes
│   │   └── adminRoutes.js    # /api/v1/admin routes
│   │
│   ├── services/             # Reusable business logic & integrations
│   │   ├── authService.js    # Core authentication & password logic
│   │   └── otpService.js     # OTP generation, storage, and dispatch
│   │
│   ├── utils/                # Helper utilities
│   │   ├── generateToken.js  # JWT signing & verification helpers
│   │   ├── generateOtp.js    # Secure numeric OTP generator
│   │   └── response.js       # Standardized API response formatters
│   │
│   ├── validations/          # Request payload validators
│   │   ├── authValidation.js # Auth request schemas
│   │   ├── userValidation.js # User profile update schemas
│   │   └── adminValidation.js# Admin operations schemas
│   │
│   ├── app.js                # Express app initialization & route registration
│   └── server.js             # Server startup, DB connection & process listeners
│
├── uploads/                  # Static file uploads directory
├── .env                      # Local environment configuration (git ignored)
├── .env.example              # Sample environment template
├── .gitignore                # Git ignore rules
├── package.json              # Project dependencies & scripts
└── README.md                 # Documentation
```

---

## 🛠️ Tech Stack

* **Runtime:** Node.js (ES Modules `"type": "module"`)
* **Framework:** Express.js
* **Database:** MongoDB
* **ODM:** Mongoose
* **Authentication:** JSON Web Tokens (`jsonwebtoken`)
* **Password Hashing:** `bcryptjs`
* **Configuration:** `dotenv`
* **CORS:** `cors`

---

## 🚀 Getting Started

### 1. Prerequisites

* Node.js (v18 or higher recommended)
* MongoDB instance running locally (`mongodb://localhost:27017`) or a MongoDB Atlas URI

### 2. Installation

Navigate to the `backend` directory and install dependencies:

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file from `.env.example`:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=mongodb://localhost:27017/auriva_db

JWT_SECRET=your_secure_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d

SMS_API_KEY=
SMS_SENDER_ID=AURIVA
SMS_TEMPLATE_ID=
```

### 4. Run the Server

#### Development Mode (with hot-reload via nodemon):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

---

## 📡 Standard API Response Format

All endpoints follow a unified response structure:

### Success Response (`HTTP 200/201`)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response (`HTTP 400/401/403/404/422/500`)
```json
{
  "success": false,
  "message": "Error description",
  "error": { ... }
}
```

---

## 📑 API Endpoints Summary

Base URL: `/api/v1`

### 1. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register a new user account & dispatch OTP |
| `POST` | `/api/v1/auth/login` | Public | Authenticate user & receive JWT token |
| `POST` | `/api/v1/auth/verify-otp` | Public | Verify OTP code & activate account |
| `POST` | `/api/v1/auth/resend-otp` | Public | Request a new OTP |
| `POST` | `/api/v1/auth/forgot-password` | Public | Request OTP for password reset |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password with valid OTP |

### 2. User Panel Endpoints (`/api/v1/users`)

*All user endpoints require `Authorization: Bearer <token>` header.*

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/profile` | Authenticated User | Get authenticated user profile |
| `PUT` | `/api/v1/users/profile` | Authenticated User | Update profile (name, phone, address, avatar) |
| `PUT` | `/api/v1/users/change-password`| Authenticated User | Change current account password |
| `DELETE` | `/api/v1/users/account` | Authenticated User | Delete own account |

### 3. Admin Panel Endpoints (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/login` | Public | Admin login & receive admin JWT token |
| `GET` | `/api/v1/admin/profile` | Admin Only | Get admin profile |
| `GET` | `/api/v1/admin/users` | Admin Only | List all registered users (supports pagination & filter) |
| `PATCH`| `/api/v1/admin/users/:id/status`| Admin Only | Update user status (`ACTIVE`, `INACTIVE`, `BLOCKED`) |

---

## 📈 Scalability & Adding New Modules

To add a new module in the future (e.g., `products`, `orders`, `categories`, `payments`):

1. **Model:** Create `src/models/<ModelName>.js`
2. **Validation:** Create `src/validations/<module>Validation.js`
3. **Service:** Create `src/services/<module>Service.js` (for complex business rules)
4. **Controller:** Create `src/controllers/<module>Controller.js`
5. **Route:** Create `src/routes/<module>Routes.js`
6. **Mount in app.js:** Register `app.use('/api/v1/<module>', <module>Routes);`
