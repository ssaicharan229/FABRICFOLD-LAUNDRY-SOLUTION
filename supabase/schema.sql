-- ============================================================================
-- FABRICFOLD LAUNDRY SOLUTION - DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- "Smart Laundry Management for Hostels"
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HOSTELS TABLE
CREATE TABLE IF NOT EXISTS public.hostels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PACKAGES TABLE (Preserved for existing customer relationships)
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    price NUMERIC(10, 2) NOT NULL,
    annual_wash_limit INTEGER NOT NULL DEFAULT 34,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id VARCHAR(30) NOT NULL UNIQUE, -- e.g. FFL-0001
    name VARCHAR(120) NOT NULL,
    hostel_id UUID REFERENCES public.hostels(id) ON DELETE RESTRICT,
    room_number VARCHAR(20), -- Optional: left blank if not supplied (do not invent)
    mobile VARCHAR(15) NOT NULL,
    email VARCHAR(120), -- Optional email address
    package_id UUID REFERENCES public.packages(id) ON DELETE RESTRICT,
    package_start_date DATE, -- Optional: left blank if not supplied
    package_end_date DATE, -- Optional: left blank if not supplied
    total_washes INTEGER NOT NULL DEFAULT 34,
    used_washes INTEGER NOT NULL DEFAULT 0,
    remaining_washes INTEGER GENERATED ALWAYS AS (total_washes - used_washes) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Suspended', 'Expired')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_washes_range CHECK (used_washes >= 0 AND used_washes <= total_washes),
    CONSTRAINT chk_mobile_format CHECK (mobile ~ '^\+?[0-9]{10,13}$')
);

CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON public.customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_hostel ON public.customers(hostel_id);

-- 4. LAUNDRY ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.laundry_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(30) NOT NULL UNIQUE, -- e.g. LD-000001
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    clothes_count INTEGER NOT NULL CHECK (clothes_count > 0 AND clothes_count <= 100),
    status VARCHAR(20) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Washing', 'Completed')),
    wash_counted BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    washing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by VARCHAR(80) NOT NULL DEFAULT 'Staff Attendant',
    notes TEXT,
    sms_status VARCHAR(20) NOT NULL DEFAULT 'Not Sent' CHECK (sms_status IN ('Not Sent', 'Ready', 'Sent', 'Failed', 'Mock_Delivered')),
    sms_sent_at TIMESTAMPTZ,
    sms_provider VARCHAR(50),
    email_status VARCHAR(20) NOT NULL DEFAULT 'Not Sent' CHECK (email_status IN ('Not Sent', 'Ready', 'Sent', 'Failed', 'Mock_Delivered')),
    email_sent_at TIMESTAMPTZ,
    email_provider VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id ON public.laundry_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.laundry_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.laundry_orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_submitted_at ON public.laundry_orders(submitted_at);

-- 5. NOTIFICATION LOGS TABLE (SMS + EMAIL)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.laundry_orders(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('sms', 'email')),
    recipient VARCHAR(120) NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Sent' CHECK (status IN ('Sent', 'Failed', 'Mock_Delivered')),
    provider VARCHAR(60) NOT NULL DEFAULT 'Mock Service',
    response_payload JSONB,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_order_id ON public.notification_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_notif_customer_id ON public.notification_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_notif_channel ON public.notification_logs(channel);

-- 6. COMPLAINTS TABLE
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_number VARCHAR(30) NOT NULL UNIQUE, -- e.g. CMP-0001
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
    order_id UUID REFERENCES public.laundry_orders(id) ON DELETE SET NULL,
    subject VARCHAR(200) NOT NULL,
    category VARCHAR(60) NOT NULL CHECK (category IN (
        'Stained / Discolored', 
        'Damaged Garment', 
        'Missing Cloth', 
        'Delivery Delay', 
        'Fold & Iron Quality', 
        'Other'
    )),
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Under Review', 'Resolved', 'Closed')),
    priority VARCHAR(20) NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Low', 'Normal', 'High', 'Urgent')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_customer_id ON public.complaints(customer_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at);

-- 7. COMPLAINT ATTACHMENTS TABLE
CREATE TABLE IF NOT EXISTS public.complaint_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL, -- Private path in Supabase Storage bucket 'complaint-photos'
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_complaint_id ON public.complaint_attachments(complaint_id);

-- 8. COMPLAINT RESPONSES TABLE
CREATE TABLE IF NOT EXISTS public.complaint_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    author_id UUID,
    author_name VARCHAR(120) NOT NULL,
    author_role VARCHAR(20) NOT NULL CHECK (author_role IN ('admin', 'staff', 'student')),
    message TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE: internal staff note (HIDDEN from student)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_complaint_id ON public.complaint_responses(complaint_id);

-- 9. COMPLAINT AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.complaint_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    actor_name VARCHAR(120) NOT NULL,
    actor_role VARCHAR(20) NOT NULL,
    action VARCHAR(200) NOT NULL,
    previous_status VARCHAR(30),
    new_status VARCHAR(30),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_complaint_id ON public.complaint_audit_log(complaint_id);

-- 10. SYSTEM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.system_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    business_name VARCHAR(100) NOT NULL DEFAULT 'FABRICFOLD LAUNDRY SOLUTION',
    business_mobile VARCHAR(20) NOT NULL DEFAULT '+91 9948445878',
    business_email VARCHAR(120) DEFAULT 'laundry@fabricfold.com',
    business_address TEXT NOT NULL DEFAULT 'Ganga Hostel Laundry Facility, Campus Central',
    notification_channels VARCHAR(20) NOT NULL DEFAULT 'both' CHECK (notification_channels IN ('both', 'sms', 'email', 'none')),
    sms_provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    sms_api_key TEXT,
    sms_sender_id VARCHAR(20) DEFAULT 'FABRIC',
    email_provider VARCHAR(50) NOT NULL DEFAULT 'mock',
    email_api_key TEXT,
    email_from_address VARCHAR(120) DEFAULT 'notifications@fabricfold.com',
    default_wash_limit INTEGER NOT NULL DEFAULT 34,
    low_balance_threshold INTEGER NOT NULL DEFAULT 5,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ATOMIC STORED FUNCTION: COMPLETE LAUNDRY ORDER AND COUNT EXACTLY ONE WASH
-- ============================================================================
CREATE OR REPLACE FUNCTION public.complete_laundry_order(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
    v_order RECORD;
    v_customer RECORD;
    v_new_used_washes INTEGER;
BEGIN
    IF auth.role() <> 'authenticated'
       OR COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') NOT IN ('admin', 'staff') THEN
        RAISE EXCEPTION 'Only authenticated staff or admins can complete laundry orders';
    END IF;

    -- 1. Fetch order with row lock
    SELECT * INTO v_order
    FROM public.laundry_orders
    WHERE id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- If already completed and wash counted, prevent duplicate counting
    IF v_order.status = 'Completed' AND v_order.wash_counted = TRUE THEN
        RETURN jsonb_build_object(
            'success', true, 
            'message', 'Order already completed and wash previously counted',
            'order_id', v_order.order_id,
            'wash_counted', true
        );
    END IF;

    -- 2. Fetch customer with row lock
    SELECT * INTO v_customer
    FROM public.customers
    WHERE id = v_order.customer_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
    END IF;

    -- Verify customer balance before incrementing
    IF v_customer.used_washes >= v_customer.total_washes THEN
        RETURN jsonb_build_object('success', false, 'error', 'Customer has reached the maximum annual wash limit of ' || v_customer.total_washes);
    END IF;

    v_new_used_washes := v_customer.used_washes + 1;

    -- 3. Update customer wash balance
    UPDATE public.customers
    SET used_washes = v_new_used_washes,
        updated_at = NOW()
    WHERE id = v_customer.id;

    -- 4. Update order to Completed with wash_counted = TRUE
    UPDATE public.laundry_orders
    SET status = 'Completed',
        wash_counted = TRUE,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id;

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order.order_id,
        'customer_id', v_customer.customer_id,
        'used_washes', v_new_used_washes,
        'total_washes', v_customer.total_washes,
        'remaining_washes', (v_customer.total_washes - v_new_used_washes)
    );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_laundry_order(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_laundry_order(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.complete_laundry_order(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.complete_laundry_order(UUID) TO authenticated;

-- ============================================================================
-- SEED INITIAL CONFIGURATION & REAL INITIAL CUSTOMER ONLY
-- ============================================================================
INSERT INTO public.system_settings (id, business_name, business_mobile, business_email, business_address, default_wash_limit)
VALUES ('default', 'FABRICFOLD LAUNDRY SOLUTION', '+91 9948445878', 'laundry@fabricfold.com', 'Ganga Hostel Laundry Facility, Campus Central', 34)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.packages (id, name, price, annual_wash_limit, description, features)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'BASIC', 4500.00, 34, 'Essential laundry care for individual students.', '["34 Washes per academic year", "Standard Wash & Fold", "SMS notification on completion"]'::jsonb),
    ('22222222-2222-2222-2222-222222222222', 'SPLIT PLAN', 5500.00, 34, 'Flexible bi-weekly plan with express ironing.', '["34 Washes per academic year", "Wash, Dry & Light Steam Press", "SMS alerts"]'::jsonb),
    ('33333333-3333-3333-3333-333333333333', 'PREMIUM', 6500.00, 34, 'Comprehensive fabric sanitization, steam press & express delivery.', '["34 Washes per academic year", "Delicate fabric handling", "Steam press included", "SMS updates"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Initial real hostel: Ganga Hostel
INSERT INTO public.hostels (id, name, code, description)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Ganga Hostel', 'GH', 'Campus Hostel Residence')
ON CONFLICT (name) DO NOTHING;

-- Initial real customer: Gampa Saicharan (No invented values)
INSERT INTO public.customers (
    customer_id,
    name,
    hostel_id,
    room_number,
    mobile,
    email,
    package_id,
    package_start_date,
    package_end_date,
    total_washes,
    used_washes,
    status
)
VALUES (
    'FFL-0001',
    'Gampa Saicharan',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    NULL, -- Left blank as not supplied (do not invent)
    '9948445878',
    NULL, -- Left blank as not supplied (do not invent)
    '33333333-3333-3333-3333-333333333333',
    NULL, -- Left blank as not supplied (do not invent)
    NULL, -- Left blank as not supplied (do not invent)
    34,
    0,
    'Active'
)
ON CONFLICT (customer_id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laundry_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Replace prior versions safely so rerunning this schema tightens existing policies.
DROP POLICY IF EXISTS "Staff full access to hostels" ON public.hostels;
DROP POLICY IF EXISTS "Authenticated users read hostels" ON public.hostels;
DROP POLICY IF EXISTS "Staff read packages" ON public.packages;
DROP POLICY IF EXISTS "Staff full access to customers" ON public.customers;
DROP POLICY IF EXISTS "Staff full access to orders" ON public.laundry_orders;
DROP POLICY IF EXISTS "Staff full access to notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Staff full access to complaints" ON public.complaints;
DROP POLICY IF EXISTS "Staff full access to attachments" ON public.complaint_attachments;
DROP POLICY IF EXISTS "Staff full access to responses" ON public.complaint_responses;
DROP POLICY IF EXISTS "Staff full access to audit" ON public.complaint_audit_log;
DROP POLICY IF EXISTS "Staff access to settings" ON public.system_settings;
DROP POLICY IF EXISTS "Student read own customer profile" ON public.customers;
DROP POLICY IF EXISTS "Student read own orders" ON public.laundry_orders;
DROP POLICY IF EXISTS "Student read own notifications" ON public.notification_logs;
DROP POLICY IF EXISTS "Student insert own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Student select own complaints" ON public.complaints;
DROP POLICY IF EXISTS "Student read own attachments" ON public.complaint_attachments;
DROP POLICY IF EXISTS "Student select visible responses" ON public.complaint_responses;
DROP POLICY IF EXISTS "Student insert response" ON public.complaint_responses;

-- Staff/admin role claims are stored in Supabase app_metadata, which users cannot edit.
CREATE POLICY "Staff full access to hostels" ON public.hostels FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "Authenticated users read hostels" ON public.hostels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff read packages" ON public.packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Staff full access to customers" ON public.customers FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "Staff full access to orders" ON public.laundry_orders FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "Staff full access to notifications" ON public.notification_logs FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "Staff full access to complaints" ON public.complaints FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "Staff full access to attachments" ON public.complaint_attachments FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "Staff full access to responses" ON public.complaint_responses FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "Staff full access to audit" ON public.complaint_audit_log FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));
CREATE POLICY "Staff access to settings" ON public.system_settings FOR ALL TO authenticated
USING (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'))
WITH CHECK (auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff'));

-- Students may identify their own profile using a server-managed customer UUID/ref or phone.
CREATE POLICY "Student read own customer profile" ON public.customers FOR SELECT TO authenticated
USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'student'
    AND (
        id = auth.uid()
        OR id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
        OR customer_id = auth.jwt() -> 'app_metadata' ->> 'customer_ref_id'
        OR regexp_replace(mobile, '\D', '', 'g') =
           regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
    )
);

CREATE POLICY "Student read own orders" ON public.laundry_orders FOR SELECT TO authenticated
USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'student'
    AND EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = laundry_orders.customer_id
          AND (
              c.id = auth.uid()
              OR c.id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
              OR c.customer_id = auth.jwt() -> 'app_metadata' ->> 'customer_ref_id'
              OR regexp_replace(c.mobile, '\D', '', 'g') =
                 regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
          )
    )
);

CREATE POLICY "Student read own notifications" ON public.notification_logs FOR SELECT TO authenticated
USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'student'
    AND EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = notification_logs.customer_id
          AND (
              c.id = auth.uid()
              OR c.id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
              OR c.customer_id = auth.jwt() -> 'app_metadata' ->> 'customer_ref_id'
              OR regexp_replace(c.mobile, '\D', '', 'g') =
                 regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
          )
    )
);

CREATE POLICY "Student insert own complaints" ON public.complaints FOR INSERT TO authenticated
WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'student'
    AND status = 'Submitted'
    AND EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = complaints.customer_id
          AND (
              c.id = auth.uid()
              OR c.id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
              OR c.customer_id = auth.jwt() -> 'app_metadata' ->> 'customer_ref_id'
              OR regexp_replace(c.mobile, '\D', '', 'g') =
                 regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
          )
    )
);

CREATE POLICY "Student select own complaints" ON public.complaints FOR SELECT TO authenticated
USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'student'
    AND EXISTS (
        SELECT 1 FROM public.customers c
        WHERE c.id = complaints.customer_id
          AND (
              c.id = auth.uid()
              OR c.id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
              OR c.customer_id = auth.jwt() -> 'app_metadata' ->> 'customer_ref_id'
              OR regexp_replace(c.mobile, '\D', '', 'g') =
                 regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
          )
    )
);

CREATE POLICY "Student read own attachments" ON public.complaint_attachments FOR SELECT TO authenticated
USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'student'
    AND EXISTS (
        SELECT 1 FROM public.complaints cmp
        WHERE cmp.id = complaint_attachments.complaint_id
          AND EXISTS (
              SELECT 1 FROM public.customers c
              WHERE c.id = cmp.customer_id
                AND (
                    c.id = auth.uid()
                    OR c.id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
                    OR c.customer_id = auth.jwt() -> 'app_metadata' ->> 'customer_ref_id'
                    OR regexp_replace(c.mobile, '\D', '', 'g') =
                       regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
                )
          )
    )
);

CREATE POLICY "Student select visible responses" ON public.complaint_responses FOR SELECT TO authenticated
USING (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'student'
    AND is_internal = FALSE
    AND EXISTS (
        SELECT 1 FROM public.complaints cmp
        WHERE cmp.id = complaint_responses.complaint_id
          AND EXISTS (
              SELECT 1 FROM public.customers c
              WHERE c.id = cmp.customer_id
                AND (
                    c.id = auth.uid()
                    OR c.id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
                    OR c.customer_id = auth.jwt() -> 'app_metadata' ->> 'customer_ref_id'
                    OR regexp_replace(c.mobile, '\D', '', 'g') =
                       regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
                )
          )
    )
);

CREATE POLICY "Student insert response" ON public.complaint_responses FOR INSERT TO authenticated
WITH CHECK (
    auth.jwt() -> 'app_metadata' ->> 'role' = 'student'
    AND author_id = auth.uid()
    AND author_role = 'student'
    AND is_internal = FALSE
    AND EXISTS (
        SELECT 1 FROM public.complaints cmp
        WHERE cmp.id = complaint_responses.complaint_id
          AND EXISTS (
              SELECT 1 FROM public.customers c
              WHERE c.id = cmp.customer_id
                AND (
                    c.id = auth.uid()
                    OR c.id::text = auth.jwt() -> 'app_metadata' ->> 'customer_id'
                    OR c.customer_id = auth.jwt() -> 'app_metadata' ->> 'customer_ref_id'
                    OR regexp_replace(c.mobile, '\D', '', 'g') =
                       regexp_replace(COALESCE(auth.jwt() ->> 'phone', ''), '\D', '', 'g')
                )
          )
    )
);

-- ============================================================================
-- PRIVATE SUPABASE STORAGE SETUP FOR COMPLAINT PHOTOS
-- ============================================================================
-- Create private bucket 'complaint-photos'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'complaint-photos', 
    'complaint-photos', 
    false, -- Private bucket! Not publicly accessible
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Storage Policies: Authorized Uploads and Private Access
DROP POLICY IF EXISTS "Authenticated users can upload complaint photos" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can read complaint photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload complaint photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'complaint-photos'
    AND auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff')
);

CREATE POLICY "Authorized users can read complaint photos"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'complaint-photos'
    AND auth.jwt() -> 'app_metadata' ->> 'role' IN ('admin', 'staff')
);
