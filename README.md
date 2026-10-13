# FABRICFOLD LAUNDRY SOLUTION
> **“Smart Laundry Management for Hostels”**

A responsive hostel laundry management application built with React and TypeScript. Supabase Auth/schema support is present, while operational customer, order, complaint, and notification data currently use browser LocalStorage.

---

## 📋 Table of Contents
1. [Application Overview](#-application-overview)
2. [Landing Page & Three Login Portals](#-landing-page--three-login-portals)
3. [Core Laundry Management & Counter Workflows](#-core-laundry-management--counter-workflows)
4. [Complaints Management System](#-complaints-management-system)
5. [Automated Wash Completion Notifications (SMS & Email)](#-automated-wash-completion-notifications-sms--email)
6. [Package Management Changes](#-package-management-changes)
7. [Initial Real Customer Data](#-initial-real-customer-data)
8. [Public Deployment & Mobile Experience](#-public-deployment--mobile-experience)
9. [Installation & Startup Instructions](#-installation--startup-instructions)
10. [Required Environment Variables & Supabase Connection](#-required-environment-variables--supabase-connection)
11. [Database Migrations & Private Storage Setup](#-database-migrations--private-storage-setup)
12. [Data Import Workflow](#-data-import-workflow)
13. [Troubleshooting](#-troubleshooting)

---

## 🌟 Application Overview

**FABRICFOLD LAUNDRY SOLUTION** automates and governs laundry operations in campus residence hostels. It enforces annual student quota limits (default 34 washes/year), tracks garment lifecycle transitions (`Submitted` ➔ `Washing` ➔ `Completed`), deducts washes atomically exactly once upon completion, automatically dispatches pickup notices via SMS and Email, and offers an integrated student complaint workflow with photo evidence and audit logging.

---

## 🔐 Landing Page & Three Login Portals

When anyone opens the website, they are presented with a professional landing page showcasing three distinct login choices:

| Portal | Intended Users | Primary Capabilities |
| :--- | :--- | :--- |
| **Staff Login** | Counter Attendants | Garment intake, live washing progress, order completion, student lookup, complaints handling. |
| **Student Login** | Hostel Residents | Wash quota balance meter, order readiness tracking, complaint filing with photo uploads, notification receipts. |
| **Admin Login** | Facility Supervisors | Business analytics, customer directory, complaints audit oversight, hostel residences, reports export, data imports, settings. |

### Secure Role Verification
- **Anti-Impersonation Protection**: Selecting a login card on the landing page does **not** grant permissions by itself. The user's actual role (`admin`, `staff`, or `student`) is strictly verified against the database/auth record upon submission.
- **Role Boundary Enforcement**:
  - If a user attempts to enter the **Admin Portal** using student or staff credentials, access is blocked with a clear error: *"Role Mismatch: Your account has '[role]' privileges. You cannot sign in to the Admin Portal."*
  - Students cannot access staff or admin operational views by manipulating tabs or URLs; their navigation is locked strictly to their authorized student portal.
  - Staff members have operational access but cannot access admin-only tabs (e.g., Hostels, Reports, Data Import, or system reset).

---

## 👕 Core Laundry Management & Counter Workflows

1. **Student Lookup**: Search instantly by Customer ID (`FFL-0001`), Student Name (`Gampa Saicharan`), or Mobile Number (`9948445878`).
2. **Quota Limit Safeguard**:
   - Computes `remaining_washes = total_washes - used_washes`.
   - Displays a low-balance warning banner when remaining washes are **5 or fewer**.
   - If a customer's remaining balance is `0`, new submissions are strictly blocked with the message:
     > *"This customer's yearly wash limit of 34 washes has been reached."*
3. **Stage Transitions**: `Submitted` ➔ `Washing` ➔ `Completed`.
4. **Exactly-Once Atomic Wash Deduction**:
   - Wash deduction occurs **only** when an order first transitions to `Completed`.
   - Concurrency safety is guaranteed by an atomic stored PostgreSQL function (`complete_laundry_order`) and local transactional logic guarded by the `wash_counted` boolean flag.
   - If an order is already completed, subsequent edits never double-deduct washes.
5. **Printable Tokens**: Generates printable thermal-style deposit receipts with order ID, clothes count, and submission timestamps.

---

## 📢 Complaints Management System

An integrated complaint reporting and resolution workflow designed specifically for hostel laundry service:

### Student Experience
- **Submission Form**:
  - Select category: *Damaged Garment*, *Stained / Discolored*, *Missing Cloth*, *Delivery Delay*, *Fold & Iron Quality*, or *Other*.
  - Link to a specific previous laundry order (optional).
  - Multi-photo upload supporting **JPEG, PNG, and WebP** formats up to **5MB** per file.
  - Client-side validation with real-time upload progress, preview thumbnails, and clear error banners.
  - Associated strictly with the authenticated student's customer record (`customer_id`). Students cannot view or file complaints for any other resident.
- **My Complaints View**:
  - Tracks status in real time: `Submitted`, `Under Review`, `Resolved`, or `Closed`.
  - Displays evidence photo lightbox.
  - Displays resolution messages sent by staff.
  - **Internal staff notes are strictly hidden from students.**

### Staff & Admin Handling
- **Operational Review**: Search by Complaint ID (`CMP-0001`), student name, or category.
- **Status Updates**: Advance status across `Submitted` ➔ `Under Review` ➔ `Resolved` ➔ `Closed`.
- **Public vs. Internal Messaging**:
  - **Public Response**: Visible to the student in their portal.
  - **Internal Staff Note**: Flagged with a prominent lock badge; visible only to staff and admin for technician investigation notes.
- **Audit Trail**: Every status transition and staff response is appended to an immutable audit timeline recording actor name, role, previous status, new status, and timestamp.
- **Ownership Safeguard**: Staff cannot delete complaint history or alter student ownership.

---

## 📲 Automated Wash Completion Notifications (SMS & Email)

When staff marks a student's laundry order **Completed**, the system automatically dispatches wash-completion notifications using the contact information saved on the student's profile.

### Multi-Channel Strategy
- **SMS Gateway Abstraction**:
  - Mock Mode (sandbox simulator with delivery latency simulation).
  - MSG91 (DLT approved template integration).
  - Twilio Programmable SMS.
  - Textlocal India.
  - One-click WhatsApp Web link generation.
- **Email Gateway Abstraction**:
  - Mock Mode (instant sandbox tester).
  - Resend API.
  - SendGrid Mail API.
  - Custom SMTP server.
- **Flexible Channel Modes**: Configure in Settings to dispatch via `both` (SMS & Email), `sms` only, `email` only, or `none`.
- **Standardized Content**:
  > *"Dear [Student Name], your laundry order [Order ID] has been completed and is ready for collection at FABRICFOLD LAUNDRY SOLUTION. Customer ID: [Customer ID]. Thank you."*
- **Audit Logs**: Every notification records channel, recipient address, provider, status (`Sent`, `Failed`, or `Mock_Delivered`), response payload, and timestamp.

---

## 📦 Package Management Changes

As required by the updated specifications:
- **Navigation Update**: The "Packages" section and management page have been **removed** from application navigation.
- **Controls Removed**: No user (Admin, Staff, or Student) can create, edit, or delete package definitions through the application UI.
- **Data Integrity Preserved**: Existing package information attached to customer profiles (e.g., Gampa Saicharan's `PREMIUM` package, ₹6,500, 34 washes) is fully retained and visible in customer profiles, renew dialogs, and reports. Database relationships remain intact.

---

## 👤 Initial Real Customer Data

The application is pre-seeded strictly with real customer details:

- **Student Name:** Gampa Saicharan
- **Customer ID:** `FFL-0001`
- **Hostel Name:** Ganga Hostel
- **Mobile Number:** `9948445878`
- **Package:** PREMIUM (₹6,500 / 34 washes)
- **Used Washes:** 0
- **Remaining Washes:** 34
- **Room Number / Package Dates:** Left blank / unsupplied (zero invented data).
- **Fake / Sample Records:** Zero fake orders, zero fake complaints, zero fake hostels. Empty states are displayed for unentered records.

---

## 🌐 Public Deployment & Mobile Experience

The application is pre-configured with complete SPA routing rules for public HTTPS deployment on **Vercel**, **Netlify**, or **Cloudflare Pages**:

- **Pre-Configured Files**:
  - [`vercel.json`](./vercel.json) — Route rewrites (`/(.*) ➔ /index.html`)
  - [`netlify.toml`](./netlify.toml) & [`public/_redirects`](./public/_redirects) — SPA rewrite fallback (`/* /index.html 200`)
  - See detailed steps in the [**Full Deployment Guide (`DEPLOYMENT.md`)**](./DEPLOYMENT.md).
- **Mobile Experience**:
  - Touch-friendly responsive layouts across all mobile phones (Android & iPhone).
  - Wide tables convert into responsive mobile cards with quick tap-to-call links and big action buttons.
  - Camera photo capture support for filing garment complaints directly at the counter (`capture="environment"`).
  - Mobile slide-out drawer navigation with user role indication.
  - Pinch-to-zoom enabled with mobile theme colors (`#0d9488`).
- **Protected Access Control**:
  - Production demo shortcuts and browser-stored roles are disabled; configured Supabase Auth roles are required.
  - Role boundaries are enforced in the UI and defined in the Supabase RLS schema.
  - Operational records are currently stored in browser LocalStorage, not Supabase. Do not use this version for shared production records.

---

## 🛠️ Installation & Startup Instructions

### Prerequisites
- **Node.js**: LTS version 18, 20, or 24+ (`node -v`)
- **npm**: 9+ (`npm -v`)
- **Modern Browser**: Chrome, Edge, Firefox, or Safari

### Local Setup
```bash
# 1. Open project directory
cd "c:\Users\ssaic\OneDrive\Desktop\project"

# 2. Install dependencies
npm install

# 3. Start Vite local development server
npm run dev
# The application will run at: http://localhost:5173/

# 4. Build for production (compiles TypeScript & bundles assets)
npm run build
```

---

## 🔑 Required Environment Variables & Supabase Connection

Copy `.env.example` to `.env` in the project root to run the application against Supabase:

```env
# Required for production authentication. Local demo sign-in is development-only.
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Multi-Channel Notification Provider Config
VITE_SMS_PROVIDER=mock
VITE_SMS_SENDER_ID=FABRIC
VITE_EMAIL_PROVIDER=mock
```

You can also enter your Supabase URL and anon key directly in **Settings ➔ Supabase Cloud Database & Auth** inside the running application.
Without Supabase, demo sign-in is available only on the Vite development server; production builds do not accept demo credentials or trust a browser-stored role.

---

## 🗄️ Database Migrations & Private Storage Setup

All tables, indexes, constraints, atomic functions, and storage configurations are contained in [`supabase/schema.sql`](./supabase/schema.sql).

### Running Migrations in Supabase
1. Open the [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor**.
3. Paste the contents of `supabase/schema.sql` and click **Run**.
4. The script will create:
   - `hostels`, `packages`, `customers`, `laundry_orders`
   - `complaints`, `complaint_attachments`, `complaint_responses`, `complaint_audit_log`
   - `notification_logs`, `system_settings`
   - Atomic function `complete_laundry_order(p_order_id UUID)`
   - Private Supabase Storage bucket `complaint-photos` (5MB limit, JPEG/PNG/WebP only)
   - Row Level Security (RLS) policies for Staff, Admin, and Student roles.

---

## 📥 Data Import Workflow

To import existing student records from Excel or CSV:
1. Log in as **Admin**.
2. Navigate to **Import Data** in the sidebar.
3. Upload your CSV file (or download the clean template).
4. Review column mapping (auto-detects Student Name, Mobile, Hostel, Room, Washes).
5. Inspect pre-commit duplicate checks (choose to **Skip** duplicates or **Update** existing records).
6. Click **Confirm & Import** to commit records with zero data fabrication.

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Access Denied: Role Mismatch"** | Attempted to log into the wrong portal. | Log in using the portal matching your assigned role (Student vs. Staff vs. Admin). |
| **Submission blocked at 0 washes** | Customer has exhausted their 34 annual washes. | Use the "Renew Package" action on the customer's profile to allocate a fresh yearly wash quota. |
| **SMS/Email in "Mock_Delivered" status** | Gateway is running in Mock sandbox mode. | Configure API credentials in Settings or your `.env` file to switch to live MSG91/Twilio/Resend. |
| **Images rejected during complaint upload** | File exceeds 5MB or is not JPEG/PNG/WebP. | Convert images to JPEG/PNG/WebP format under 5MB each. |
| **Local storage out of sync** | Browser cache holding stale data. | Navigate to **Settings** and click **Reset Real State** to restore initial verified records. |
