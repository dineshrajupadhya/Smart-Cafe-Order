# Smart Cafeteria Management System

A full-stack cafeteria management system with React, Node.js, Express, MongoDB, and Tailwind CSS.

## Features

### Customer Features
- User registration and login (JWT authentication)
- Browse menu with categories, search, and filters (vegetarian, spice level, price)
- Add to cart with special instructions
- Apply coupon discounts
- Multiple order types (Dine-in, Takeaway, Delivery)
- Multiple payment methods (Cash, Card, UPI)
- Real-time order tracking with Socket.IO
- Order history and ratings
- AI-powered food recommendations
- QR code ordering
- User profile and preferences

### Admin Features
- Dashboard with analytics (revenue, orders, top products)
- Product management (CRUD, stock updates)
- Order management with status updates
- Stock management with low-stock alerts
- User management (roles, active/inactive)
- Coupon management
- Sales, inventory, customer, and payment reports
- Real-time order notifications

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, React Router, Chart.js, Socket.IO Client
- **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.IO, JWT
- **Services:** Nodemailer (Email), Twilio (SMS), QRCode generation

## Prerequisites

- Node.js (v16+)
- MongoDB (local or Atlas)
- npm or yarn

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd Smart-Cafe-Order-main
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Update `.env` with your MongoDB URI and other credentials:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-cafe
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

Seed the database:
```bash
npm run seed
```

Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file:
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

Start the frontend:
```bash
npm start
```

### 4. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Demo Credentials

**Admin:**
- Email: admin@smartcafe.com
- Password: admin123

**User:**
- Email: john@example.com
- Password: user123

## API Endpoints

### Auth
- POST `/api/auth/register` - Register
- POST `/api/auth/login` - Login
- GET `/api/auth/me` - Get current user
- PUT `/api/auth/profile` - Update profile
- PUT `/api/auth/password` - Update password

### Products
- GET `/api/products` - Get all products (with filters)
- GET `/api/products/:id` - Get single product
- POST `/api/products` - Create product (admin)
- PUT `/api/products/:id` - Update product (admin)
- DELETE `/api/products/:id` - Delete product (admin)
- PUT `/api/products/:id/stock` - Update stock (admin)

### Categories
- GET `/api/categories` - Get all categories
- POST `/api/categories` - Create category (admin)
- PUT `/api/categories/:id` - Update category (admin)
- DELETE `/api/categories/:id` - Delete category (admin)

### Cart
- GET `/api/cart` - Get cart
- POST `/api/cart/add` - Add to cart
- PUT `/api/cart/item/:itemId` - Update cart item
- DELETE `/api/cart/item/:itemId` - Remove from cart
- DELETE `/api/cart/clear` - Clear cart
- POST `/api/cart/coupon` - Apply coupon

### Orders
- POST `/api/orders` - Create order
- GET `/api/orders/my-orders` - Get my orders
- GET `/api/orders/:id` - Get order
- PUT `/api/orders/:id/status` - Update status (admin)
- PUT `/api/orders/:id/cancel` - Cancel order
- PUT `/api/orders/:id/rate` - Rate order

### Payments
- POST `/api/payments/process` - Process payment
- GET `/api/payments` - Get all payments (admin)
- PUT `/api/payments/:id/refund` - Refund (admin)

### Admin
- GET `/api/admin/dashboard` - Dashboard stats
- GET `/api/admin/users` - Get all users
- PUT `/api/admin/users/:id/role` - Update user role
- PUT `/api/admin/users/:id/toggle-active` - Toggle user status
- GET `/api/admin/orders` - Get all orders

### Reports
- GET `/api/reports/sales` - Sales report
- GET `/api/reports/inventory` - Inventory report
- GET `/api/reports/customers` - Customer report
- GET `/api/reports/payments` - Payment report

### Recommendations
- GET `/api/recommendations` - Get recommendations
- POST `/api/recommendations/track` - Track preference
- GET `/api/recommendations/popular` - Popular items
- GET `/api/recommendations/trending` - Trending items

### QR
- POST `/api/qr/table/generate` - Generate table QR (admin)
- POST `/api/qr/order/generate` - Generate order QR (admin)
- GET `/api/qr/tables` - Get all tables
- GET `/api/qr/tables/:tableNumber` - Get table info

## Project Structure

```
Smart-Cafe-Order-main/
├── backend/
│   ├── config/         # Database config
│   ├── controllers/    # Route handlers
│   ├── middleware/      # Auth, error handling
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   ├── services/       # Email, SMS services
│   ├── utils/          # Seed data
│   ├── server.js       # Entry point
│   └── package.json
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/ # Reusable components
│       ├── context/    # React contexts
│       ├── pages/
│       │   ├── auth/   # Login, Signup
│       │   ├── customer/ # Home, Menu, Cart, etc.
│       │   └── admin/  # Dashboard, Products, etc.
│       ├── services/   # API service
│       ├── App.js
│       └── index.js
└── README.md
```

## Deployment

### Backend (Render/Railway)
1. Push code to GitHub
2. Create new project on Render/Railway
3. Add environment variables
4. Deploy

### Frontend (Vercel)
1. Push code to GitHub
2. Import project on Vercel
3. Set build command: `npm run build`
4. Add environment variables
5. Deploy

## License

MIT
