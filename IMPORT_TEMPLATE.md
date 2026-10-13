# FABRICFOLD LAUNDRY SOLUTION — Import Templates & Specification
> **“Smart Laundry Management for Hostels”**

This guide provides the schema specifications, header names, validation constraints, and blank CSV templates for uploading original data into **FABRICFOLD LAUNDRY SOLUTION**.

---

## 📁 Supported File Formats

- **Comma-Separated Values (`.csv`)** — Standard RFC 4180 formatted text.
- **Tab-Separated Values (`.tsv`)** or text files (`.txt`).
- **Encoding**: UTF-8 (Recommended).
- **Line Endings**: LF (`\n`) or CRLF (`\r\n`).

---

## 📋 1. Customer Import Specification

### Column Mapping Table

| Header Name (Aliases Accepted) | Required? | Accepted Format | Default if Blank | Description |
|---|---|---|---|---|
| `Student Name` (`Name`, `Student`, `Full Name`) | **YES** | Non-empty text string | *None (Error if missing)* | Student's full name |
| `Mobile Number` (`Mobile`, `Phone`, `Contact`) | **YES** | 10–13 digits (e.g. `9948445878` or `+919948445878`) | *None (Error if invalid)* | Indian mobile number for pickup SMS |
| `Email` (`Student Email`, `Email Address`) | No | Valid email (e.g. `student@ganga.hostel`) | `""` (Empty string) | Optional email for pickup notifications |
| `Hostel Name` (`Hostel`, `Residence`) | No | Text string | `Ganga Hostel` | Campus hostel residence. If new, auto-created as active. |
| `Room Number` (`Room`, `Room No`) | No | Text / alphanumeric (e.g. `A-204`) | `""` (Empty string) | Room number. Left blank if not supplied (not invented). |
| `Package` (`Package Name`, `Plan`) | No | `BASIC`, `SPLIT PLAN`, `PREMIUM` | `PREMIUM` | Subscribed laundry package |
| `Package Price` (`Price`) | No | Numeric (e.g. `6500`) | Linked to package tier | Price charged in INR |
| `Yearly Wash Limit` (`Total Washes`, `Quota`) | No | Positive integer (e.g. `34`) | `34` | Annual wash quota |
| `Used Washes` (`Washes Used`) | No | Integer (`0` to Wash Limit) | `0` | Number of washes previously used |
| `Package Start Date` (`Start Date`) | No | `YYYY-MM-DD` | `""` (Empty string) | Start of subscription period |
| `Package End Date` (`End Date`) | No | `YYYY-MM-DD` | `""` (Empty string) | Expiry of subscription period |
| `Customer ID` (`ID`, `Cust ID`) | No | Alphanumeric (e.g. `FFL-0001`) | Auto-generated sequentially (`FFL-XXXX`) | Unique customer identifier |

---

## 📅 Accepted Date & Mobile Number Formats

- **Mobile Numbers**:
  - `9948445878` (10-digit standard Indian format)
  - `+91 9948445878` (with country code and spaces)
  - `+919948445878` (E.164 international format)
  - Non-numeric characters (spaces, dashes, parentheses) are automatically sanitized.
- **Dates**:
  - `YYYY-MM-DD` (e.g. `2026-07-15`)
  - `YYYY/MM/DD` (e.g. `2026/07/15`)
  - If omitted, date fields remain blank without fabricating values.

---

## ⚠️ Duplicate & Invalid Row Handling

- **Duplicate Detection**:
  - A row is flagged as a duplicate if either its **Customer ID** or its **Mobile Number** matches a customer already in the system (or another row within the same file).
- **Duplicate Strategies**:
  1. **Skip Duplicates (Default)**: Existing customer records are untouched; the duplicate row is skipped and reported in the summary.
  2. **Update Existing**: Updates the existing record's details (such as room number or dates) with new values.
- **Invalid Rows**:
  - Rows with missing student names, mobile numbers shorter than 10 digits, or used washes greater than total washes are rejected with line-numbered error messages in the import summary.
  - Valid rows in the file are still processed safely.

---

## 📄 Blank Templates & CSV Snippets

### 1. Customer Import Template (with Real Example Record)

```csv
Student Name,Mobile Number,Email,Hostel Name,Room Number,Package,Package Price,Yearly Wash Limit,Used Washes,Package Start Date,Package End Date,Customer ID
Gampa Saicharan,9948445878,,Ganga Hostel,,Premium,6500,34,0,,,FFL-0001
```

### 2. Header-Only Customer CSV Template

```csv
Student Name,Mobile Number,Email,Hostel Name,Room Number,Package,Package Price,Yearly Wash Limit,Used Washes,Package Start Date,Package End Date,Customer ID
```

### 3. Header-Only Hostel Residence CSV Template

```csv
Hostel Name,Hostel Code,Total Rooms,Campus Description,Active Status
Ganga Hostel,GH,100,Campus Central Residence,Active
```

### 4. Header-Only Laundry Orders CSV Template

```csv
Customer ID,Student Name,Clothes Count,Status,Submitted At,Notes
FFL-0001,Gampa Saicharan,8,Submitted,2026-10-09T10:00:00Z,Regular wash
```

---

## 💾 How to Download from the App

Inside **FABRICFOLD LAUNDRY SOLUTION**:
1. Click **Import Data** in the left sidebar.
2. Click **Download Blank CSV Template** at the top-right.
3. Open the file in Excel or Google Sheets, enter your student data, save as `.csv`, and upload directly through the import wizard.
