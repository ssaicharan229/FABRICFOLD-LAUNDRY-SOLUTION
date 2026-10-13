# FABRICFOLD LAUNDRY SOLUTION — User & Operations Guide
> **“Smart Laundry Management for Hostels”**

Welcome to the **FABRICFOLD LAUNDRY SOLUTION** operations guide. This manual provides clear, practical instructions for hostel students, counter attendants, and facility administrators.

---

## 📑 Contents
1. [Landing Page & Three Login Portals](#1-landing-page--three-login-portals)
2. [Student Resident Portal](#2-student-resident-portal)
3. [Student Complaints & Photo Upload Workflow](#3-student-complaints--photo-upload-workflow)
4. [Counter Staff: Student Lookup & Laundry Intake](#4-counter-staff-student-lookup--laundry-intake)
5. [Changing Order Statuses & Wash Lifecycle](#5-changing-order-statuses--wash-lifecycle)
6. [How Wash Counting Works](#6-how-wash-counting-works)
7. [Automated Wash Completion Notifications (SMS & Email)](#7-automated-wash-completion-notifications-sms--email)
8. [Staff & Admin Complaints Resolution](#8-staff--admin-complaints-resolution)
9. [Original Data Import Workflow (CSV/Excel)](#9-original-data-import-workflow-csvexcel)
10. [Exporting Reports and Roster Data](#10-exporting-reports-and-roster-data)

---

## 1. Landing Page & Three Login Portals

When you open the application (e.g., `http://localhost:5173/`), the home screen displays three dedicated login choices:

```
┌─────────────────────────────────────────────────────────────┐
│                 FABRICFOLD LAUNDRY SOLUTION                 │
│             Smart Laundry Management for Hostels            │
├───────────────────┬───────────────────┬─────────────────────┤
│   STAFF LOGIN     │   STUDENT LOGIN   │    ADMIN LOGIN      │
│ For counter staff │ For hostel        │ For supervisors to  │
│ managing clothes  │ residents to view │ oversee facilities, │
│ intake, washing,  │ quota, track      │ complaints audit,   │
│ & notifications.  │ orders & report.  │ & export reports.   │
└───────────────────┴───────────────────┴─────────────────────┘
```

### Logging In
1. **Choose your role card**: Click **Staff Login**, **Student Login**, or **Admin Login**.
2. **Enter your credentials**:
   - **Student Login**: Enter your registered 10-digit mobile number (`9948445878`) or Customer ID (`FFL-0001`) and password.
   - **Staff Login**: Enter your staff email (`attendant@fabricfold.com`) and password (`demo1234`).
   - **Admin Login**: Enter your supervisor email (`admin@fabricfold.com`) and password (`demo1234`).
3. **Local Development Sandbox**: One-click demo access buttons are shown only when running the Vite development server. They are not included in production builds.
4. **Role Verification Guard**:
   - Production accounts are authenticated by Supabase, and the role is read from server-managed account metadata.
   - If a student tries to sign in through the Admin portal, or vice-versa, the system blocks access with an explicit role mismatch warning.
5. **Signing Out**: Click the **Sign Out** icon in the sidebar or navbar to return to the landing page.

---

## 2. Student Resident Portal

Upon signing in as a student (e.g., **Gampa Saicharan**), you are taken to your personalized portal:

### Overview & Wash Meter
- **Wash Balance Display**: Shows your active package name (`PREMIUM`), total allocated washes (`34`), washes used (`0`), and remaining washes (`34`).
- **Quota Progress Bar**: Color-coded indicator displaying percentage of quota utilized.
- **Pickup Banner Alert**: When any laundry order is completed, a glowing banner appears at the top:
  > *"Laundry Ready for Pickup! Your clothes have finished washing and tumble folding. Please visit the Ganga Hostel laundry counter to collect Order #LD-XXXXXX."*

### My Laundry Orders
- View all past drop-offs with order ID, garment count, submission time, completion time, and live status (`Submitted` ➔ `Washing` ➔ `Completed`).
- View pickup token details.

### Pickup Notifications Log
- View all automated SMS and Email alerts dispatched to your registered contact number/email, including delivery timestamp and gateway confirmation.

---

## 3. Student Complaints & Photo Upload Workflow

If you experience an issue with your laundry (such as a damaged garment, stain, shortage, or delivery delay), you can report it directly from your portal:

### Filing a Complaint
1. In the Student Portal, click the **Complaints & Issues** tab.
2. Click **+ File New Complaint**.
3. **Select Issue Category**:
   - *Damaged Garment* (Tear, Burn, Stitching)
   - *Stained / Discolored* (Chemical stain, Color bleed)
   - *Missing Cloth* (Garment count shortage)
   - *Delivery Delay* (Order overdue)
   - *Fold & Iron Quality* (Pressing or packing issue)
   - *Other*
4. **Link Order (Optional)**: Choose from your recent laundry orders in the dropdown to link the complaint to a specific batch.
5. **Subject & Description**: Enter a descriptive title (e.g., *"Blue formal shirt torn at collar"*) and explain the issue in detail.
6. **Upload Problem Photos**:
   - Click the upload area or drag and drop photos.
   - **Supported formats**: JPEG, PNG, or WebP.
   - **Size limit**: Maximum **5MB** per photo.
   - Preview thumbnails appear with file size and an "X" button to remove unwanted images.
   - Photos are stored in secure private storage accessible only to you and authorized hostel staff.
7. Click **Submit Complaint**. A unique reference number is assigned (e.g., `CMP-0001`).

### Tracking Status & Staff Responses
- Your complaints appear in a list showing live status: `Submitted`, `Under Review`, `Resolved`, or `Closed`.
- Click on any attached photo to open the high-resolution lightbox.
- Read resolution messages posted by staff.
- **Privacy Assurance**: Internal staff notes are never shown in your portal. You only see official student-directed messages.

---

## 4. Counter Staff: Student Lookup & Laundry Intake

When a student arrives at the laundry counter:

1. Click **New Laundry** in the sidebar.
2. **Search Customer**:
   - Type their Customer ID (`FFL-0001`), Student Name (`Gampa Saicharan`), or Mobile Number (`9948445878`).
   - Click the student card from the dropdown.
3. **Quota Check**:
   - **Limit Reached (0 washes left)**: The submit button is blocked with the message:
     > *"WASH LIMIT REACHED: This customer's yearly wash limit of 34 washes has been reached."*
     Staff can click **Renew / Upgrade Package** to refill quota.
   - **Low Balance (≤ 5 washes left)**: A yellow warning card appears reminding staff to inform the student of their dwindling balance.
4. **Enter Clothes Count**:
   - Type the number of items or tap quick count chips (`5`, `8`, `10`, `12`, `15`, `20`).
   - Add notes if necessary (e.g., *"Separate white items, delicate wash"*).
5. **Click SUBMIT LAUNDRY**:
   - An order is generated with status `Submitted` and an ID like `LD-000001`.
   - The **Printable Token** modal opens. Click **Print Token** to print a paper slip for the student.

---

## 5. Changing Order Statuses & Wash Lifecycle

Laundry orders transition through three clear stages:

```
[Submitted]  ──(Start Washing)──>  [Washing]  ──(Mark Completed)──>  [Completed]
(Intake at counter)               (In wash machine)                (Clean & ready for pickup)
```

1. Navigate to **Laundry Orders**.
2. **To Start Washing**: Click **Start Washing** next to an order. The status changes to `Washing` with an active animation.
3. **To Complete Order**:
   - Click **Mark Completed**.
   - A confirmation dialog appears explaining that completion will atomically count 1 wash.
   - Click **Yes, Complete & Count 1 Wash**.
   - The system records the completion timestamp, deducts 1 wash, and **automatically dispatches pickup notices via SMS and Email**!

---

## 6. How Wash Counting Works

- **Total Washes**: Set by package tier (e.g., 34 washes for `PREMIUM`).
- **Remaining Washes**: Computed as `total_washes - used_washes`.
- **Exactly-Once Wash Deduction**:
  - A wash is deducted **only** when an order transitions to `Completed` for the first time.
  - The `wash_counted` boolean flag guarantees that orders never deduct more than once, even if reviewed or updated again.
- **Quota Enforcement**:
  - When remaining washes reach `0`, new order submissions are strictly blocked.

---

## 7. Automated Wash Completion Notifications (SMS & Email)

Staff do not need to re-enter mobile numbers or email addresses; the system retrieves contact details directly from the student record.

### What Happens on Completion
1. When staff clicks **Mark Completed**, the system checks configured notification channels (`both`, `sms`, `email`).
2. If SMS is configured, an SMS is dispatched with the standardized message:
   > *"Dear [Student Name], your laundry order [Order ID] has been completed. Please collect your clothes from FABRICFOLD LAUNDRY SOLUTION. Customer ID: [Customer ID]. Thank you."*
3. If Email is configured, a branded HTML email is dispatched with the order summary and collection hours.
4. Results are recorded in **Notification Logs** as `Sent`, `Failed`, or `Mock_Delivered` (sandbox mode).
5. If staff wants to resend or send a custom WhatsApp message, click **SEND SMS** on the order to open the manual dispatcher modal.

---

## 8. Staff & Admin Complaints Resolution

Staff and administrators can inspect and action student complaints from the **Complaints** section:

1. Click **Complaints** in the sidebar.
2. View KPI cards showing *Total Filed*, *Pending Action*, and *Resolved & Closed*.
3. Search by Complaint ID (`CMP-0001`), Student Name, or filter by category.
4. Click **Inspect & Action** on any complaint row.
5. **Inspect Details**:
   - Review the student's name, hostel, room, mobile, and linked order ID.
   - Click any attached photo to open the fullscreen lightbox.
6. **Update Status**:
   - Use the status bar to advance to `Under Review`, `Resolved`, or `Closed`.
7. **Add Notes & Responses**:
   - **Public to Student**: Type your message and click **Send Student Response**. The student will see this message in their portal.
   - **Internal Staff Note**: Switch to *Internal Staff Note*, enter technician remarks (e.g., *"Inspected garment: seam was frayed before washing"*), and save. This message is displayed with a yellow lock icon and is **completely hidden from the student**.
8. **Audit Trail**: Switch to the **Audit Trail** tab to view the timestamped log of all transitions and actor names.

---

## 9. Original Data Import Workflow (CSV/Excel)

To bulk-upload existing student rosters without manual data entry:

1. Log in as **Admin** and click **Import Data** in the sidebar.
2. **Step 1 — Upload**: Drag and drop your `.csv` or `.tsv` file, or click **Download Sample CSV Template**.
3. **Step 2 — Column Mapping**:
   - The wizard automatically detects matching columns for *Student Name*, *Mobile*, *Hostel*, *Room Number*, *Customer ID*, and *Wash Quotas*.
   - Adjust dropdowns if your header names differ.
4. **Step 3 — Validation & Duplicate Strategy**:
   - Inspect the validation table. Invalid rows (such as short mobile numbers) are flagged with specific errors.
   - Choose your duplicate handling rule:
     - **Skip Duplicates**: Preserves existing records; ignores duplicates in the import.
     - **Update Existing**: Updates matched student profiles with the newly imported data.
5. **Step 4 — Confirm & Import**: Click **Confirm & Import Records**. A summary report shows total rows imported, skipped, and failed.

---

## 10. Exporting Reports and Roster Data

1. In the sidebar, click **Reports**.
2. Select your date filter (*Today*, *This Week*, *This Month*, or *Custom date range*).
3. Review analytics charts: Daily Intake & Garment Volume, Hostel Distribution, and Package Breakdown.
4. Click **Export Orders CSV**, **Export Students CSV**, **Export Complaints CSV**, or **Export SMS Logs CSV** to download complete audit-ready spreadsheets.
5. In the **Complaints** view, staff and admins can also export the live filtered complaints list using the **Export CSV** button in the header banner.
