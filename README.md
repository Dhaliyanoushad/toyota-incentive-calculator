# Toyota Incentive Calculator

Simple sales portal to view and manage sales incentives.

---

## 🔐 Login Credentials

Use these credentials to log in:

| Role | Link | Email | Password | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `/login/admin` | `admin@toyota.in` | `toyota` | Manage slabs, cars, sales, and exports |
| **Sales Officer 1** | `/login/officer` | `sales1@toyota.in` | `toyota` | Submit sales and preview incentives |
| **Sales Officer 2** | `/login/officer` | `sales2@toyota.in` | `toyota` | Submit sales and preview incentives |

---

## 🛠️ Local Setup

Follow these steps to run the application locally:

### Prerequisite: MongoDB Connection
You need a running MongoDB database.

### Step 1: Add Environment Variables
Create a `.env.local` file in the root directory:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/toyota_db

# JWT Secret Key
JWT_SECRET=super-secret-key-change-in-production
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📈 Seeding the Database

To reset and seed the database with mock cars, slabs, and sales:
1. Log in as **Admin** (`admin@toyota.in` / `toyota`).
2. Click the **Reset & Seed DB** button on the page.

---

## 🌟 Features

### 1. Simple Landing Page
- Direct buttons to Admin and Officer portals.

### 2. Admin Portal `/admin/*`
- **Dashboard**: Simple charts and summary metrics (total cars sold, total payouts, leaderboard).
- **Cars**: Add, edit, or retire car models.
- **Slabs**: Edit volume tiers and incentive rates.
- **Sales**: View all sales logs and export them to a CSV file.

### 3. Officer Portal `/officer/*`
- **Sales Input**: Log sales quantities for the month and see live incentive calculations.
- **History**: View past monthly sales logs and payouts.
