# StudioSpace Server API 🎬

**Express.js & MongoDB Backend Service for StudioSpace Creative Workspace Platform**

Production backend microservice powering authentication, studio catalog discovery, schedule conflict prevention, and booking transactions.

---

## 🚀 Key Highlights & Architectural Features

1. **JWT Authentication in HTTPOnly Cookies (Challenge 1):**  
   Implements enterprise security storing signed JSON Web Tokens in HTTPOnly cookies to protect server-side mutations (`POST /api/studios`, `DELETE /api/studios/:id`, `PUT /api/studios/:id`, `POST /api/bookings`).
2. **Double-Booking Overlap Prevention (Challenge 2):**  
   Strict interval overlap verification checking `(newStart < existingEnd) && (newEnd > existingStart)` against confirmed/pending reservations in MongoDB, preventing scheduling collisions.
3. **MongoDB Aggregations & Query Filters:**  
   Dynamic studio searches with text indexing, category filtering, hourly rate thresholds, and `.limit(6)` featured studio endpoints.
4. **Resilient Dual Database Mode:**  
   Connects to MongoDB Cluster with an automated high-fidelity in-memory driver fallback for zero-downtime offline testing and evaluation.
5. **Examiner Seed Automation:**  
   Pre-seeds examiner accounts (`creator@studiospace.io`), production studios, and active schedule bookings on startup.

---

## 🔑 Examiner Test Credentials
- **Email:** `creator@studiospace.io`
- **Password:** `Studio@2026`
- **Name:** `Alex Rivera`

---

## 📡 Core API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create creator account with password complexity rules
- `POST /api/auth/login` - Verify credentials & issue HTTPOnly JWT cookie
- `POST /api/auth/google` - One-click Google Social Sign-In
- `POST /api/auth/logout` - Clear session cookie
- `GET /api/auth/me` - Read authenticated creator profile

### Studios Catalog (`/api/studios`)
- `GET /api/studios/featured` - Retrieve top 6 studios via `.limit(6)`
- `GET /api/studios` - Query studios with search, category, and price filters
- `GET /api/studios/:id` - Fetch single studio specs and host details
- `POST /api/studios` - (Protected) Add new creative studio listing
- `PUT /api/studios/:id` - (Protected) Update existing listing
- `DELETE /api/studios/:id` - (Protected) Remove owned studio listing
- `GET /api/studios/user/my-listings` - (Protected) Fetch user's listings

### Bookings (`/api/bookings`)
- `POST /api/bookings` - (Protected) Reserve studio slot with double-booking collision prevention
- `GET /api/bookings/my-bookings` - (Protected) Fetch creator's reservation history
- `PATCH /api/bookings/:id/cancel` - (Protected) Cancel pending reservation slot

### Saved Wishlist (`/api/wishlist`)
- `GET /api/wishlist/ids` - (Protected) Fetch IDs of wishlisted studios
- `GET /api/wishlist` - (Protected) Fetch wishlisted studio objects
- `POST /api/wishlist/toggle` - (Protected) Add or remove studio from wishlist

---

## 🛠️ Local Setup
```bash
npm install
npm run dev
# Starts on http://localhost:5000
```
