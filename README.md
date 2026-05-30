# Toyota Incentive Calculator

## Task 2: Smart Incentive Calculator with Dynamic Slab Admin Panel

This project is my submission for the Nippon Toyota Internship Evaluation.

The application is a role-based internal portal that allows Toyota Sales Officers to calculate monthly incentives and enables administrators to manage vehicle inventory and incentive slabs.

---

## Live Demo

**Application:** https://toyota-incentive-calculator.vercel.app

**Repository:** https://github.com/Dhaliyanoushad/toyota-incentive-calculator

---

## Demo Credentials

### Admin

* Email: [admin@toyota.in](mailto:admin@toyota.in)
* Password: toyota

### Sales Officer 1

* Email: [sales1@toyota.in](mailto:sales1@toyota.in)
* Password: toyota

### Sales Officer 2

* Email: [sales2@toyota.in](mailto:sales2@toyota.in)
* Password: toyota

---

## Features

### Admin Portal

#### Vehicle Management

* Add vehicle models
* Edit vehicle details
* Retire vehicle models
* Manage model name, suffix, and variant information

#### Incentive Slab Management

Configure monthly incentive slabs dynamically.

Example:

| Cars Sold | Incentive per Car |
| --------- | ----------------- |
| 1 - 3     | ₹1,000            |
| 4 - 7     | ₹2,000            |
| 8+        | ₹3,500            |

#### Sales Records

* View submitted sales records
* Track incentives across officers
* Export records as CSV

#### Dashboard

* Total cars sold
* Total incentive payouts
* Monthly summaries
* Officer performance overview

---

### Sales Officer Portal

#### Monthly Sales Submission

* Select vehicles sold
* Enter quantities
* Submit monthly sales records

#### Incentive Calculator

* Calculates incentives instantly
* Updates automatically as values change
* Displays applicable slab and payout amount

#### History

* View previous submissions
* Review past incentive payouts

---

## Tech Stack

### Frontend

* Next.js 16
* React 19
* Tailwind CSS v4
* TypeScript

### Backend

* Next.js Route Handlers
* JWT Authentication
* Role-Based Access Control (RBAC)

### Database

* MongoDB
* Mongoose

---

## Installation

### Clone the Repository

```bash
git clone https://github.com/Dhaliyanoushad/toyota-incentive-calculator.git
cd toyota-incentive-calculator
```

### Configure Environment Variables

Create a `.env.local` file:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Install Dependencies

```bash
npm install
```

### Run the Application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Project Structure

```text
app/
├── admin/
├── officer/
├── login/
├── api/

components/
lib/
models/
```

---

## Key Functionality

* Role-based authentication
* Protected admin and officer routes
* Dynamic incentive slab configuration
* Real-time incentive calculation
* Vehicle inventory management
* Monthly sales tracking
* CSV export support
* Persistent MongoDB storage

---

## Notes

* Incentive rates are stored with each sales record so historical payouts remain unchanged even if slab configurations are updated later.
* The application is designed as an internal business tool and focuses on simplicity, usability, and maintainability.
