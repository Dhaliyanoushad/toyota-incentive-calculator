# 🚗 Toyota Incentive Management Portal

Welcome to the **Toyota Incentive Management Portal**! This is a secure, full-stack enterprise B2B sales tracker and retroactive incentive calculator built using **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **MongoDB**, and **Mongoose ODM**.

The application is engineered to allow internal Administrative Officers to configure dynamic vehicle volume incentive tiers (slabs), manage active car inventories, and audit sales logs, while Sales Officers can log monthly sales quantities and preview their calculated payouts instantly.

---

## 🔐 Corporate Login Credentials

To bypass credential autofill issues and ensure secure manual entry, use the following credentials to access the segregated access portals:

| Portal Role | Access URL | Corporate Email | Password | Allowed Access |
| :--- | :--- | :--- | :--- | :--- |
| **Administrative Officer** | `/login/admin` | `admin@toyota.in` | `toyota` | Global slab edits, car CRUD, sales ledgers, CSV export, calculation toggle |
| **Sales Officer 1** | `/login/officer` | `officer1@toyota.in` | `toyota` | Monthly sales submissions, custom tiers visualizer, incentive preview |
| **Sales Officer 2** | `/login/officer` | `officer2@toyota.in` | `toyota` | Monthly sales submissions, custom tiers visualizer, incentive preview |

---

## 🛠️ Local Environment Setup

Follow these simple steps to set up and run the portal on your local machine:

### Prerequisite: Database URI
You need a running MongoDB database. You can use a local MongoDB instance or a free cluster on [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database).

### Step 1: Clone and Configuration
Create a `.env.local` file in the root directory of the project and add the following parameters:

```env
# MongoDB Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/toyota_db?retryWrites=true&w=majority

# JWT Authentication Secret Key
JWT_SECRET=super-secret-toyota-portal-key-change-this-in-production
```

### Step 2: Install Dependencies
Install the required packages using npm:
```bash
npm install
```

### Step 3: Start the Development Server
Run the local server in Turbopack development mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 📈 Database Initial Seeding

The application contains a pre-built data seeder that resets the database and populates it with standard mock parameters (real-world cars like Corolla, Camry, RAV4; dynamic volume slabs 1-3, 4-7, 8+; and historic logs).

To trigger the database seed:
1. Access the main login screen (e.g. `/login/admin`).
2. Log in using the **Admin** credentials (`admin@toyota.in` / `toyota`).
3. Click the **Reset & Seed DB** trigger (or make a secure POST request to `/api/auth/seed`). This initializes clean records instantly!

---

## 🌟 Key Application Features

### 1. Minimalist Full-Bleed Gateway Landing Page
- A premium entrance featuring a scenic scale-zooming `/supra.jpg` background overlay.
- High-contrast, sleek branding header displaying the corporate Toyota logo and name.
- Crisp, bold tagline: *"Toyota drives incentives."*
- Dual CTA portal options: **Admin Portal** and **Officer Portal** leading to clean, separate manual login screens.

### 2. Administrative Console `/admin/*`
- **Dashboard Overview**: Displays total corporate payouts (formatted in **₹** with Indian Currency formatting), average payouts, total cars sold, dynamic monthly performance charts, and live leaderboards.
- **Car Inventory Manager**: Add, edit, or toggle standard vehicle models (active vs retired).
- **Dynamic Slab Engine**: Configure custom sales tier bounds and retroactive flat-rate payouts (e.g. 1-3 cars @ ₹1,000/car, 4-7 @ ₹2,000/car, 8+ @ ₹3,500/car).
- **All Sales Ledger**: View global dealer logs with responsive detail drawers and click the **Export CSV Report** button to download full spreadsheets instantly.

### 3. Sales Officer Portal `/officer/*`
- **Log Monthly Sales Worksheet**: Switch periods, input exact sold quantities for active models, and preview retroactive flat-rate payouts in real time before submitting.
- **Segmented Tier Meter**: Visual progress bar tracking tier bounds and incentive increments.
- **Dynamic Gap Analyzer**: Instantly details exactly how many more cars the officer needs to sell to unlock the next dynamic payout slab.
- **Personal History Explorer**: Review, audit, and expand past monthly earnings logs.

---

## 🧪 Production Compilation Verification
The codebase is fully optimized, pass-verified, and statically compiled in **Next.js Turbopack** with zero type exceptions:
```txt
✓ Compiled successfully in 2.6s
  Running TypeScript ...
  Finished TypeScript in 3.4s ...
  Generating static pages (23/23) in 402ms
```
All routes are edge-safe and authenticated securely via standard cookies.
