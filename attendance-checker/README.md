# University Student Attendance Checker (v5.0 Enterprise Edition)

A complete, production-ready Full Stack Web Application that calculates student attendance, predicts the number of required classes to maintain a 75% attendance criteria, and generates official PDF reports.

## System Architecture
This project translates a robust C++ attendance calculation logic into a modern, scalable web stack with a futuristic **Cyberpunk UI/UX**.

### The Mathematical Formula (Preserved from C++)
The core engine uses this exact logic to predict the required classes:
```cpp
float percentage = (attended / total) * 100;
int classesNeeded = (3 * total) - (4 * attended);
if (classesNeeded < 0) classesNeeded = 0;
```

### Technology Stack
- **Frontend**: HTML5, CSS3 (Vanilla + Cyberpunk Tokens), JavaScript (ES6), Bootstrap 5, Chart.js.
- **Backend**: Node.js, Express.js REST API.
- **Database**: MongoDB, Mongoose ODM.
- **Security**: JWT Authentication, Bcrypt Hashing, Helmet.js (HTTP Headers), Express Rate Limit, Express Mongo Sanitize, XSS-Clean.
- **Utilities**: PDFKit (PDF generation), ExcelJS/CSV-Writer (Data Export), QRCode.

## Project Structure
```text
attendance-checker/
├── client/                 # Frontend Static Assets & Pages
│   ├── assets/
│   │   ├── css/            # Cyberpunk Design System
│   │   └── js/             # Client-side Logic (DOM, Charts, API calls)
│   └── pages/              # HTML Views (Public & Admin)
├── server/                 # Backend REST API
│   ├── config/             # DB Connection
│   ├── controllers/        # Business Logic & Math Engine
│   ├── database/           # Seed Scripts
│   ├── middleware/         # Auth, Security & Tracking
│   ├── models/             # Mongoose Schemas (8 Models)
│   ├── routes/             # API Endpoints
│   └── utils/              # PDF, Excel, CSV, QR Generators
├── package.json
└── server.js               # Entry Point
```

## Setup & Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory (refer to `.env.example`).
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/attendance_checker
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   ADMIN_EMAIL=admin@university.edu
   ADMIN_PASSWORD=Admin@123
   ```

3. **Seed the Database**
   Run the seeder to create the default Admin account and system settings.
   ```bash
   node server/database/seed.js
   ```
   *Default Admin Credentials:*
   - Email: `admin@university.edu`
   - Password: `Admin@123`

4. **Start the Server**
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

## Key Features
- **Dynamic Attendance Calculator**: Calculate the exact number of classes required to hit 75%.
- **Official Reports**: Download PDF reports with QR verification codes.
- **Cyberpunk UI**: Glassmorphism, neon glows, dynamic particles, and glitch effects.
- **Complete Admin Panel**:
  - Deep Analytics & Data Visualization (Chart.js)
  - Real-time Visitor & IP Tracking
  - Full CRUD operations on Attendance Records
  - Secure Data Export (CSV/Excel)
- **Enterprise Security**: XSS protection, NoSQL injection prevention, brute-force protection via rate limiters.

## License
MIT
