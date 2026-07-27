# Koyo (コヨ) — Frictionless Dining QR Ordering & Management

Koyo is a high-performance, product-focused QR-code ordering and kitchen management platform designed to eliminate dining floor bottlenecks and eliminate overpriced POS hardware. 

Empower your guests to scan, order, and pay instantly at their table—either via credit/debit card, cash at counter, or at the end of their meal. Behind the scenes, Koyo provides a real-time kitchen feed and robust administrative tooling for managers and owners to control layouts, menus, staff, and analytics.

---

## 🚀 Key Features

### 🍽️ Customer-Facing Dining PWA
*   **Instant QR Entry:** Scannable table-specific QR codes instantly load the restaurant's menu with their table context predefined.
*   **Interactive Menu Browsing:** Sleek, responsive layout with visual filters for dietary preferences (Veg/Non-Veg), categories, and real-time availability.
*   **Frictionless Cart & Checkout:** Quick-add items, customize notes (e.g., cooking instructions), and choose preferred payment methods.
*   **Flexible Payment Modes:**
    *   **Online Checkout:** Secured credit/debit card, UPI, and wallet payments powered by Razorpay.
    *   **Online-at-End:** Keep a running tab and pay before leaving.
    *   **Cash at Counter:** Place the order and pay cash directly to the cashier.

### 🍳 Live Kitchen Feed (Back of House)
*   **Real-time Ticket Tracking:** Double-column live board displaying active tickets grouped by status (`received` → `preparing` → `ready` → `served`).
*   **Detailed Kitchen Metrics:** Ticket age, table numbers, staff notes, and individual item progress indicators.
*   **Instant Updates:** Single-tap stage progression for kitchen crew to alert service staff when food is ready.

### 📊 Staff & Admin Management
*   **Multi-Restaurant Management:** Scalable database structure supporting multiple restaurant profiles and staff assignments.
*   **Dynamic Menu Editor:** Add, update, toggle availability, or upload images for menu items instantly.
*   **Table Layout Builder:** Manage physical table numbers and automatically generate custom QR codes matching each table's unique path.
*   **High-Fidelity Analytics:** Tracking gross sales, daily orders, average order value, and visual performance charts.

---

## 🛠️ Technology Stack

*   **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Server Actions, React 19)
*   **Language:** TypeScript
*   **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) & custom CSS variable design system
*   **Database & Auth:** [Supabase](https://supabase.com/) (Postgres, Row Level Security, Auth schemas)
*   **Payments Integration:** [Razorpay Node SDK](https://razorpay.com/)
*   **QR Generation:** `node-qrcode`
*   **Package Manager:** [Bun](https://bun.sh/)

---

## 📁 Repository Structure

```text
├── .agents/               # Agentic customizations and workflows
├── supabase/              # Supabase schema definitions & migration logs
│   └── migrations/        # SQL migration scripts (Tables, RLS, functions)
├── src/
│   ├── app/
│   │   ├── admin/         # Authenticated admin routes (restaurants, staff, layouts)
│   │   ├── api/           # API routes (Razorpay orders, verification, webhooks)
│   │   ├── dashboard/     # Restaurant staff kitchen boards & operations dashboards
│   │   ├── menu/          # Customer-facing PWA routing ([restaurantId]/[tableId])
│   │   ├── layout.tsx     # Global Next.js page layout
│   │   └── globals.css    # Core CSS & Tailwind config utilities
│   ├── components/        # Reusable component library
│   ├── context/           # App-wide React contexts
│   └── lib/               # Utility libraries (Supabase client/server, rate-limiters)
├── DESIGN.md              # Fine-grained styling tokens and design specifications
├── package.json           # Dependencies and build script specifications
└── README.md              # Project documentation
```

---

## ⚙️ Local Setup & Configuration

### Prerequisites
Make sure you have [Bun](https://bun.sh/) installed locally on your system.

### 1. Clone & Install Dependencies
```bash
bun install
```

### 2. Configure Environment Variables
Copy `.env.local.example` to `.env.local` in the root directory:
```bash
cp .env.local.example .env.local
```

Fill in the required configuration keys:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_yourkeyid
RAZORPAY_KEY_SECRET=yourkeysecret
```

### 3. Run Database Migrations
Koyo uses Supabase CLI or SQL migrations. You can apply the migrations located in `supabase/migrations/` sequentially directly into your Supabase SQL editor:
1. Initialize the tables (`0001_init_schema.sql`).
2. Configure staff authentication & tables RLS (`0002_staff_auth.sql` to `0005_harden_security.sql`).
3. Create database functions for analytics aggregation (`0006_analytics_functions.sql`).

### 4. Launch the Development Server
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Security & Database Policies

Koyo operates on strict **Postgres Row Level Security (RLS)** to protect customer checkout details and business metrics:
*   **Public Access:** Customers can read restaurant info, menu items, and active tables, and insert new orders/payments anonymously without registration.
*   **Staff Access:** Restricted to authenticated users mapped to specific `restaurant_id` entries inside the `staff` table. Only assigned staff can view, update, and manage orders or analytics for their specific restaurant.
*   **Recursive Security Filters:** RLS queries utilize optimized join structures to prevent performance bottlenecks.

---

## 📄 License

This project is proprietary and private. All rights reserved.
