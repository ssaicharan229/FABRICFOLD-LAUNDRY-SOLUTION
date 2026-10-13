# FABRICFOLD LAUNDRY SOLUTION — Database Architecture & Schema Specification
> **“Smart Laundry Management for Hostels”**

This document details the PostgreSQL schema, relational integrity, constraints, stored procedures, Row Level Security (RLS) policies, and private Storage policies implemented in Supabase for **FABRICFOLD LAUNDRY SOLUTION**.

The complete, executable SQL migration script is located at [`supabase/schema.sql`](./supabase/schema.sql).

---

## 🏛️ Entity Relationship Diagram

```
       ┌────────────────────────┐
       │        HOSTELS         │
       │────────────────────────│
       │ id (PK)                │
       │ name (UNIQUE)          │
       │ code (UNIQUE)          │
       │ is_active              │
       └───────────┬────────────┘
                   │ 1
                   │
                   │ N
       ┌───────────▼────────────┐           ┌────────────────────────┐
       │       CUSTOMERS        │     N     │        PACKAGES        │
       │────────────────────────│◄──────────│────────────────────────│
       │ id (PK)                │     1     │ id (PK)                │
       │ customer_id (UNIQUE)   │           │ name (UNIQUE)          │
       │ name                   │           │ price                  │
       │ hostel_id (FK)         │           │ annual_wash_limit (34) │
       │ room_number (NULLABLE) │           │ is_active              │
       │ mobile                 │           └────────────────────────┘
       │ email (NULLABLE)       │
       │ package_id (FK)        │
       │ total_washes (34)      │
       │ used_washes (0)        │
       │ remaining_washes (calc)│
       │ status ('Active', ...) │
       │ is_deleted (BOOLEAN)   │
       └───────────┬────────────┘
                   │ 1
       ┌───────────┴────────────────────────┐
       │ 1                                  │ 1
       │                                    │
       │ N                                  │ N
┌──────▼─────────────────┐          ┌───────▼────────────────┐
│     LAUNDRY_ORDERS     │          │       COMPLAINTS       │
│────────────────────────│          │────────────────────────│
│ id (PK)                │          │ id (PK)                │
│ order_id (UNIQUE)      │          │ complaint_number (UQ)  │
│ customer_id (FK)       │          │ customer_id (FK)       │
│ clothes_count          │          │ order_id (FK, NULL)    │
│ status (Sub/Wash/Comp) │          │ subject                │
│ wash_counted (BOOLEAN) │          │ category               │
│ submitted_at           │          │ description            │
│ completed_at           │          │ status (Sub/Rev/Res/Cl)│
│ sms_status             │          │ priority               │
│ email_status           │          └───────────┬────────────┘
└──────────┬─────────────┘                      │ 1
           │ 1                      ┌───────────┼───────────┐
           │                        │ 1         │ 1         │ 1
           │ N                      │ N         │ N         │ N
┌──────────▼─────────────┐   ┌──────▼─────┐ ┌───▼────┐ ┌────▼───────┐
│   NOTIFICATION_LOGS    │   │ ATTACHMENTS│ │RESPONS.│ │ AUDIT_LOG  │
│────────────────────────│   │────────────│ │────────│ │────────────│
│ id (PK)                │   │ id (PK)    │ │id (PK) │ │ id (PK)    │
│ order_id (FK, NULL)    │   │complaint_id│ │compl_id│ │complaint_id│
│ customer_id (FK)       │   │file_name   │ │author  │ │actor_name  │
│ channel ('sms'|'email')│   │file_path   │ │message │ │actor_role  │
│ recipient              │   │file_type   │ │is_inter│ │action      │
│ message                │   │file_size   │ │created │ │prev_status │
│ status (Sent/Fail/Mock)│   └────────────┘ └────────┘ │new_status  │
│ provider               │                             │created_at  │
│ response_payload       │                             └────────────┘
└────────────────────────┘
```

---

## 📋 Table Specifications

### 1. `hostels`
Stores university campus hostel residences.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Internal unique identifier |
| `name` | VARCHAR(100) | NOT NULL, UNIQUE | Hostel name (e.g., `Ganga Hostel`) |
| `code` | VARCHAR(20) | NOT NULL, UNIQUE | Abbreviated code (e.g., `GH`) |
| `description` | TEXT | NULLABLE | Campus sector or building details |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active service status |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Timestamp of creation |

---

### 2. `packages` (Preserved Schema)
Defines laundry subscription tiers, prices, and yearly wash limits. Preserved in database to maintain referential integrity with customer records.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Package identifier |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE | Tier name: `BASIC`, `SPLIT PLAN`, `PREMIUM` |
| `price` | NUMERIC(10,2) | NOT NULL | Price in INR (e.g., `6500.00`) |
| `annual_wash_limit`| INTEGER | NOT NULL, DEFAULT 34 | Yearly wash quota |
| `description` | TEXT | NULLABLE | Service overview |
| `features` | JSONB | DEFAULT '[]'::jsonb | Feature checklist items |
| `is_active` | BOOLEAN | DEFAULT TRUE | Availability status |

---

### 3. `customers`
Stores student customer subscription profiles. Unsupplied fields (`room_number`, `email`, `package_start_date`, `package_end_date`) are nullable to prevent inventing missing data.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Internal primary key |
| `customer_id` | VARCHAR(30) | NOT NULL, UNIQUE | Business ID (e.g., `FFL-0001`) |
| `name` | VARCHAR(120) | NOT NULL | Student's full name |
| `hostel_id` | UUID | REFERENCES hostels(id) | Assigned hostel residence |
| `room_number` | VARCHAR(20) | NULLABLE | Room number (unsupplied = NULL) |
| `mobile` | VARCHAR(15) | NOT NULL | Indian mobile number (`+91...` or 10 digits) |
| `email` | VARCHAR(120) | NULLABLE | Optional student email address |
| `package_id` | UUID | REFERENCES packages(id)| Subscribed package plan |
| `total_washes` | INTEGER | NOT NULL, DEFAULT 34 | Total annual wash quota |
| `used_washes` | INTEGER | NOT NULL, DEFAULT 0 | Count of completed washes |
| `remaining_washes`| INTEGER | GENERATED ALWAYS AS (total_washes - used_washes) STORED | Automatically computed balance |
| `status` | VARCHAR(20) | CHECK (status IN ('Active', 'Suspended', 'Expired')) | Account status |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |

---

### 4. `laundry_orders`
Tracks individual clothes submissions and wash status.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Order internal ID |
| `order_id` | VARCHAR(30) | NOT NULL, UNIQUE | Customer-facing token (e.g., `LD-000001`) |
| `customer_id` | UUID | NOT NULL, REFERENCES customers(id) | Submitting customer |
| `clothes_count`| INTEGER | NOT NULL, CHECK (clothes_count > 0 AND clothes_count <= 100) | Number of garments |
| `status` | VARCHAR(20) | CHECK (status IN ('Submitted', 'Washing', 'Completed')) | Current order stage |
| `wash_counted` | BOOLEAN | NOT NULL, DEFAULT FALSE | Exactly-once wash deduction flag |
| `submitted_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Order intake timestamp |
| `completed_at` | TIMESTAMPTZ | NULLABLE | Completion timestamp |
| `created_by` | VARCHAR(80) | DEFAULT 'Staff Attendant' | Attendant identity |
| `sms_status` | VARCHAR(20) | DEFAULT 'Not Sent' | SMS alert status |
| `email_status` | VARCHAR(20) | DEFAULT 'Not Sent' | Email alert status |

---

### 5. `notification_logs`
Multi-channel audit log for SMS and Email notifications.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Notification unique ID |
| `order_id` | UUID | REFERENCES laundry_orders(id) ON DELETE SET NULL | Associated order |
| `customer_id` | UUID | REFERENCES customers(id) ON DELETE SET NULL | Target customer |
| `channel` | VARCHAR(20) | NOT NULL, CHECK (channel IN ('sms', 'email')) | Channel used |
| `recipient` | VARCHAR(120) | NOT NULL | Mobile number or email address |
| `message` | TEXT | NOT NULL | Body dispatched |
| `status` | VARCHAR(30) | NOT NULL, CHECK (status IN ('Sent', 'Failed', 'Mock_Delivered')) | Delivery status |
| `provider` | VARCHAR(60) | NOT NULL | Gateway name (e.g., `MSG91`, `Resend`, `Mock`) |
| `response_payload`| JSONB | NULLABLE | Raw gateway response |
| `sent_at` | TIMESTAMPTZ | DEFAULT NOW() | Timestamp dispatched |

---

### 6. `complaints`
Student problem reports and service requests.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Complaint internal ID |
| `complaint_number`| VARCHAR(30) | NOT NULL, UNIQUE | Reference number (e.g., `CMP-0001`) |
| `customer_id` | UUID | NOT NULL, REFERENCES customers(id) | Submitting student |
| `order_id` | UUID | NULLABLE, REFERENCES laundry_orders(id) | Optional linked laundry order |
| `subject` | VARCHAR(200) | NOT NULL | Short summary of issue |
| `category` | VARCHAR(60) | NOT NULL, CHECK (category IN ('Stained / Discolored', 'Damaged Garment', 'Missing Cloth', 'Delivery Delay', 'Fold & Iron Quality', 'Other')) | Issue category |
| `description` | TEXT | NOT NULL | Detailed problem description |
| `status` | VARCHAR(30) | DEFAULT 'Submitted', CHECK (status IN ('Submitted', 'Under Review', 'Resolved', 'Closed')) | Resolution status |
| `priority` | VARCHAR(20) | DEFAULT 'Normal', CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')) | Urgency tier |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Submission time |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last updated time |

---

### 7. `complaint_attachments`
Photo evidence linked to complaints.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Attachment ID |
| `complaint_id` | UUID | NOT NULL, REFERENCES complaints(id) ON DELETE CASCADE | Parent complaint |
| `file_name` | VARCHAR(255) | NOT NULL | Original filename |
| `file_path` | TEXT | NOT NULL | Storage path in `complaint-photos` bucket |
| `file_type` | VARCHAR(100) | NOT NULL | MIME type (e.g., `image/jpeg`) |
| `file_size` | INTEGER | NOT NULL | File size in bytes (max 5MB) |
| `uploaded_at` | TIMESTAMPTZ | DEFAULT NOW() | Upload timestamp |

---

### 8. `complaint_responses`
Public student replies and internal staff notes.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Response ID |
| `complaint_id` | UUID | NOT NULL, REFERENCES complaints(id) ON DELETE CASCADE | Parent complaint |
| `author_name` | VARCHAR(120) | NOT NULL | Author display name |
| `author_role` | VARCHAR(20) | NOT NULL, CHECK (author_role IN ('admin', 'staff', 'student')) | Role of responder |
| `message` | TEXT | NOT NULL | Response content |
| `is_internal` | BOOLEAN | NOT NULL, DEFAULT FALSE | **CRITICAL**: TRUE = internal staff note (HIDDEN from students); FALSE = visible to student |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Timestamp posted |

---

### 9. `complaint_audit_log`
Immutable audit history for compliance and oversight.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Audit record ID |
| `complaint_id` | UUID | NOT NULL, REFERENCES complaints(id) ON DELETE CASCADE | Parent complaint |
| `actor_name` | VARCHAR(120) | NOT NULL | User who performed the action |
| `actor_role` | VARCHAR(20) | NOT NULL | Role of actor |
| `action` | VARCHAR(200) | NOT NULL | Action description |
| `previous_status`| VARCHAR(30) | NULLABLE | Status before change |
| `new_status` | VARCHAR(30) | NULLABLE | Status after change |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Event timestamp |

---

## 🔒 Row Level Security (RLS) Approach

Row Level Security is enabled across all tables:

```sql
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;
```

### Staff & Admin Access
Staff and administrators have full operational read and write access to process laundry and manage complaints.

### Student Access (Strict Isolation)
1. **Own Customer Profile**: Students can SELECT only their own record:
   ```sql
   USING (auth.uid() = id OR mobile = (auth.jwt() ->> 'phone'))
   ```
2. **Own Orders**: Students can SELECT only orders where `customer_id` matches their own customer ID.
3. **Own Complaints**: Students can INSERT and SELECT complaints only where `customer_id` matches their account.
4. **Internal Notes Hidden**: Students can SELECT complaint responses **only** where `is_internal = FALSE`:
   ```sql
   CREATE POLICY "Student select visible responses" ON public.complaint_responses 
   FOR SELECT TO authenticated 
   USING (
       is_internal = FALSE AND 
       complaint_id IN (
           SELECT id FROM public.complaints 
           WHERE customer_id = (SELECT id FROM public.customers WHERE id = auth.uid() OR mobile = (auth.jwt() ->> 'phone'))
       )
   );
   ```

---

## 🗃️ Private Supabase Storage Policies (`complaint-photos`)

The `complaint-photos` bucket is created with `public = false`. File access is governed by Supabase storage RLS:

- **Upload Policy**: Authenticated users can upload to the `complaint-photos` bucket (enforcing a 5MB size limit and MIME types `image/jpeg`, `image/png`, `image/webp`).
- **Read Policy**: Only the student who uploaded the file or authorized staff/admin members can read files from the bucket.
- **Anonymous / Public Access**: Disallowed. No unauthenticated user can browse or access uploaded complaint photos.

---

## ⚡ Concurrency & Exactly-Once Wash Deduction

To prevent race conditions, double-counting, or negative balances, the stored procedure `complete_laundry_order(p_order_id UUID)` executes inside an explicit transaction with row-level locks:

```sql
CREATE OR REPLACE FUNCTION public.complete_laundry_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_customer RECORD;
    v_new_used_washes INTEGER;
BEGIN
    -- 1. Row-lock order
    SELECT * INTO v_order FROM public.laundry_orders
    WHERE id = p_order_id FOR UPDATE;

    -- If already completed and wash counted, prevent duplicate deduction
    IF v_order.status = 'Completed' AND v_order.wash_counted = TRUE THEN
        RETURN jsonb_build_object('success', true, 'message', 'Wash previously counted');
    END IF;

    -- 2. Row-lock customer
    SELECT * INTO v_customer FROM public.customers
    WHERE id = v_order.customer_id FOR UPDATE;

    -- Verify balance
    IF v_customer.used_washes >= v_customer.total_washes THEN
        RETURN jsonb_build_object('success', false, 'error', 'Annual wash limit reached');
    END IF;

    v_new_used_washes := v_customer.used_washes + 1;

    -- 3. Atomic increment
    UPDATE public.customers
    SET used_washes = v_new_used_washes, updated_at = NOW()
    WHERE id = v_customer.id;

    -- 4. Mark order Completed with wash_counted = TRUE
    UPDATE public.laundry_orders
    SET status = 'Completed', wash_counted = TRUE, completed_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object('success', true, 'used_washes', v_new_used_washes);
END;
$$;
```
