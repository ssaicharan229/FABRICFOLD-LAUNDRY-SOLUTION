# FABRICFOLD LAUNDRY SOLUTION — Deployment & Hosting Guide
> **"Smart Laundry Management for Hostels"**

This guide provides complete instructions to deploy **FABRICFOLD LAUNDRY SOLUTION** to GitHub Pages, Vercel, Netlify, or Cloudflare Pages so it can be accessed on mobile phones (Android & iPhone) and shared with other people securely over HTTPS.

---

## 🚀 Pre-Configured Deployment Files in this Project

The codebase has already been prepared and verified for single-page application (SPA) routing:

| File | Purpose | Target Provider |
| :--- | :--- | :--- |
| [`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml) | Builds the Vite app and deploys the `dist` output on pushes to `main` | **GitHub Pages** |
| [`vercel.json`](./vercel.json) | Configures SPA route rewrites (`/(.*)` ➔ `/index.html`) | **Vercel** |
| [`netlify.toml`](./netlify.toml) | Configures build command, `dist` publish dir, and 200 rewrite rule | **Netlify** |
| [`public/_redirects`](./public/_redirects) | Fallback SPA rewrite rule (`/* /index.html 200`) | **Netlify / Cloudflare Pages** |
| [`index.html`](./index.html) | Mobile viewport, touch-zoom enabled, theme color, Apple web app meta | **All Browsers** |

---

## GitHub Pages

This project is a Vite/React application. GitHub Pages must publish the production build in `dist`; do not publish the repository source root, because browsers cannot run the unbuilt `/src/main.tsx` entry.

The included GitHub Actions workflow builds the app with the repository base path `/FABRICFOLD-LAUNDRY-SOLUTION/` and deploys `dist` whenever code is pushed to `main`. In the repository, open **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**. The workflow then publishes the site at `https://ssaicharan229.github.io/FABRICFOLD-LAUNDRY-SOLUTION/`.

---

## 🛠️ Build Settings & Requirements

When setting up your hosting project, use these standard settings:

- **Framework Preset**: Vite / React
- **Build Command**: `npm run build`
- **Output / Publish Directory**: `dist`
- **Node.js Version**: 20.19+ or 22.12+ (required by the installed Vite version)
- **Install Command**: `npm install`

---

## 🔑 Environment Variables

Set these environment variables in your hosting provider's dashboard (e.g. Vercel Project Settings ➔ Environment Variables, or Netlify Site Configuration ➔ Environment Variables):

| Variable Name | Required? | Example / Value | Description |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Required for production login | `https://your-project-id.supabase.co` | Your live Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Optional | `eyJhbGciOiJIUzI1Ni...` | Supabase **public anonymous** key (safe for browser) |
| `VITE_SMS_PROVIDER` | Optional | `mock` (or `msg91` / `twilio`) | SMS notification gateway (defaults to mock) |
| `VITE_SMS_SENDER_ID` | Optional | `FABRIC` | 6-character registered sender header |

> ⚠️ **CRITICAL SECURITY RULE**: Never expose `SUPABASE_SERVICE_ROLE_KEY`, database passwords, or SMS gateway API secrets in frontend code or in `VITE_` variables. All frontend requests communicate with Supabase using the public anonymous key guarded by PostgreSQL Row Level Security (RLS).

Both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required for production login.
Local one-click demo login and browser-stored demo sessions are available only on the Vite development server. A production build without Supabase Auth will reject login; it will not expose demo administrator or staff access.

**Data persistence limitation:** Customer, order, complaint, and notification workflows still read/write browser LocalStorage; the Supabase schema/RLS policies are not yet wired into those CRUD workflows or Storage uploads. Do not use this build for multi-user production records until those services are connected and tested. SMS/email providers other than the explicitly simulated mock mode are not integrated and will be recorded as failed instead of being reported as sent.

---

## 🌐 Step-by-Step Deployment Instructions

### Option A: Deploy on Vercel (Recommended)

#### Method 1: Using the Vercel Web Dashboard (Simplest)
1. Push this project to your GitHub, GitLab, or Bitbucket account.
2. Go to [https://vercel.com](https://vercel.com) and log in.
3. Click **"Add New..."** ➔ **"Project"**.
4. Import your repository (`project` or `fabricfold-laundry`).
5. In the configuration screen:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Expand **Environment Variables** and enter:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Click **Deploy**.
8. In ~30 seconds, Vercel will generate your live HTTPS public link (e.g., `https://fabricfold.vercel.app`).

#### Method 2: Using Vercel CLI from your terminal
```bash
# 1. Login to Vercel
npx vercel login

# 2. Deploy to production
npx vercel --prod
```

---

### Option B: Deploy on Netlify

#### Method 1: Instant Drag & Drop (Zero Git required)
1. Run the local build command on your machine:
   ```bash
   npm run build
   ```
   *(This outputs the optimized production bundle into the `dist/` folder)*.
2. Go to [https://app.netlify.com/drop](https://app.netlify.com/drop) and log in.
3. Drag and drop the `dist` folder into the Netlify browser window.
4. Netlify will immediately publish your website and provide a live HTTPS link (e.g., `https://fabricfold-hostel.netlify.app`).

#### Method 2: Git-connected Deployment
1. Go to [https://app.netlify.com](https://app.netlify.com).
2. Click **"Add new site"** ➔ **"Import an existing project"**.
3. Select your Git repository.
4. Netlify will automatically detect settings from [`netlify.toml`](./netlify.toml):
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click **Deploy Site**.

---

## 🗄️ Connecting Your Production Supabase Project

To connect a live cloud database to your deployed site:

1. **Create a Supabase Project**:
   - Go to [https://supabase.com](https://supabase.com) and create an organization & project.
2. **Execute Database Migrations**:
   - In Supabase, open the **SQL Editor**.
   - Open [`supabase/schema.sql`](./supabase/schema.sql) from this project, copy all contents, and click **Run**.
   - This creates all 8 tables (`hostels`, `packages`, `customers`, `laundry_orders`, `complaints`, `complaint_attachments`, `complaint_responses`, `notification_logs`), stored functions, and Row Level Security policies.
3. **Configure Environment Variables**:
   - In Supabase, go to **Project Settings ➔ API**.
   - Copy the **Project URL** and the **`anon` `public` API key**.
   - Paste them into your Vercel or Netlify environment variables as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
   - Redeploy or trigger a build.

---

## 📱 Mobile Experience & Access Control

### 1. Mobile Usability Highlights
- **Responsive Layouts**: Designed for screens from 360px up to 4K displays.
- **Mobile-Friendly Cards**: On small screens (< 768px), wide customer and order tables automatically convert into clean, touch-friendly cards.
- **Mobile Menu Drawer**: Accessible sliding navigation menu on phone screens with quick sign out.
- **Camera & Photo Selection**: When students file a complaint on mobile, they can tap **"Take Photo"** to open their device camera directly (`capture="environment"`), or **"Choose Gallery"** to pick from existing photos.
- **Touch-Friendly Controls**: Large buttons (min 44px touch height) for incrementing laundry items, starting washing cycles, and completing orders.
- **Pinch-to-Zoom Enabled**: Standard zoom accessibility is preserved (no `user-scalable=no`).

### 2. Public Sharing & Security Access Control
- **Protected Landing Page**: When an unauthenticated visitor opens any public link or shared URL, they are **always** shown the login portal. No student records, laundry orders, complaints, or reports are visible without authentication.
- **Three Clear Login Portals**:
  1. **Staff Login** (`attendant@fabricfold.com` / `demo1234`)
  2. **Student Login** (Student Mobile `9948445878` or ID `FFL-0001` / `demo1234`)
  3. **Admin Login** (`admin@fabricfold.com` / `demo1234`)
- **Strict Role Boundaries**:
  - Selecting a portal card does not bypass verification; the account role is checked against the database upon login.
  - Students cannot view or open Admin or Staff tabs.
  - Staff cannot access Admin management views (Hostels, Reports, Data Import, System Reset).
  - Unauthenticated visitors cannot bypass authentication through URL manipulation.

---

## 🔄 How to Update and Redeploy the Website

When you make changes to the code:
1. **If using Git (Vercel / Netlify)**:
   ```bash
   git add .
   git commit -m "Update mobile layouts and features"
   git push origin main
   ```
   *Your hosting service will automatically trigger a new build and deploy the updates within seconds.*
2. **If using Netlify Drag & Drop**:
   ```bash
   npm run build
   ```
   *Upload the new `dist/` directory in Netlify ➔ Deploys.*

---

## 📋 Status & Action Items Requiring Your Account

Because third-party hosting platforms require account authentication:

| Component | Status | Action Needed by You |
| :--- | :--- | :--- |
| **Build & Compilation** | ✅ Verified (`dist/` generated with zero errors) | None |
| **SPA 404 Prevention** | ✅ `vercel.json`, `netlify.toml`, `public/_redirects` created | None |
| **Mobile Responsiveness** | ✅ Responsive cards, camera capture, touch controls enabled | None |
| **Auth & Access Control** | ⚠️ Demo roles are development-only; production requires Supabase Auth | Configure Supabase Auth users with server-managed `app_metadata.role` |
| **Public Hosting Deployment** | ⏳ Awaiting your hosting account credentials | Log into [Vercel](https://vercel.com) or [Netlify](https://netlify.com) and import the repository or drag `dist/` |
| **Production Supabase** | ⚠️ Required for login; operational data integration remains incomplete | Set both Supabase variables, then connect and verify data services before using production records |
