# Smart Cafeteria Management System

A full-stack application for managing cafeteria orders, menu items, and sales reports.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/scripts run seed` — seed the MongoDB database with initial data
- Required env: `MONGODB_URI` — MongoDB connection string (e.g., `mongodb://localhost:27017/cafeteria`)
- Required env: `JWT_SECRET` — Secret key for signing authentication tokens

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: MongoDB + Mongoose
- Validation: Zod (`zod/v4`)
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/cafeteria` — React frontend
- `artifacts/api-server` — Express backend
- `lib/db` — MongoDB models and connection logic
- `lib/api-spec` — OpenAPI specification
- `lib/api-zod` — Generated Zod schemas
- `lib/api-client-react` — Generated React Query hooks

## Architecture decisions

- **Sequential IDs:** To maintain compatibility with existing API contracts and frontend logic, we use a `Counter` model to generate sequential integer IDs for Users, Products, and Orders.
- **Simulated Payments:** A simulated UPI/Card payment flow is implemented for demonstration purposes.
- **In-memory Aggregations:** Reports and dashboard stats are calculated via JavaScript aggregations on fetched documents, suitable for cafeteria-scale data.

## Product

- User authentication (Customer/Admin roles)
- Categorized menu browsing with search and recommendations
- Shopping cart and checkout flow
- Real-time order tracking with status updates
- Simulated UPI/Card payment integration
- Admin dashboard with revenue analytics and sales reports
- Stock management and low-stock alerts
- QR code menu access for specific tables

## Gotchas

- Ensure MongoDB is running and `MONGODB_URI` is correctly set before starting the API server.
- Run the seed script (`pnpm --filter @workspace/scripts run seed`) to populate the initial menu and admin account.
