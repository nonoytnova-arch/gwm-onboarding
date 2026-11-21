# Gale World Wide Movers Pvt Ltd — Partner Onboarding Portal

A mobile-first onboarding website for clients, transporters/fleet owners/brokers,
and vendors to register with Gale World Wide Movers — a 31-truck road-freight
(FTL) fleet specialising in temperature-controlled (reefer) and dry cargo
across India.

## Folder structure
```
gwm-onboarding/
├── backend/   (Express API + MySQL)
└── frontend/  (React + Vite)
```

## What's fully working
- Role selection (Client / Transporter / Vendor) with the complete field set
  from the spec for each role, rendered from a single schema file
  (`frontend/src/data/formSchema.js`) rather than hand-coded per field
- Multi-step wizard with autosave, draft/resume via mobile OTP
- Real GSTIN validation (format **and** check-digit algorithm), PAN, mobile,
  pincode and vehicle-number format checks — both client-side (instant
  feedback) and server-side (authoritative)
- Document upload with type/size validation (PDF/JPG/PNG, 5 MB max),
  including per-vehicle and per-driver documents for transporters
- A CAPTCHA (server-generated arithmetic challenge) and rate limiting on
  every public endpoint
- Bank account numbers encrypted at rest (AES-256-GCM); only the last 4
  digits of any ID proof are ever stored, never a full Aadhaar number
- Duplicate detection on GSTIN, PAN, mobile and vehicle number at submit time
- English/Hindi language toggle
- Admin panel: login (role-based: admin/operations/accounts), list/filter/
  search, status workflow (Submitted → Under review → Need more info →
  Approved/Rejected) with audit log, document expiry dashboard (30/60/90-day
  windows), party-code generation (CL-0001 etc.), CSV export matching the
  FleetX column list in the spec

## What's intentionally stubbed (and why)
Three pieces in the spec need a **paid third-party provider** that no amount
of code can substitute for — I built the real logic around each one and left
a single, clearly-marked function to swap in a real integration later,
rather than faking that something was sent/verified when it wasn't:

| Feature | File | What it needs |
|---|---|---|
| Real SMS/WhatsApp delivery | `backend/utils/notify.js` | MSG91/Twilio (SMS), Gupshup/Interakt (WhatsApp) |
| Live GST-registry lookup (auto-fill name/address from GSTIN) | `backend/utils/gstin.js` → `lookupGstin()` | A GSP (GST Suvidha Provider) API subscription |
| Bank penny-drop verification | *(not yet implemented)* | Razorpay/Cashfree or similar payout-verification API |

Until a provider is wired in, OTPs are only logged to the server console and
also returned in the API response as `devOtp` — **but only when
`NODE_ENV` is not `production`** — so you can test the whole flow today
without paying for SMS credits, without ever showing a real user a fake
"OTP sent" message.

## Setup

### 1. Install Node and MySQL/MariaDB, start the database
```
pkg install nodejs mariadb -y      # if on Termux; use your usual package manager otherwise
mysqld_safe --datadir=$PREFIX/var/lib/mysql &
mysql -u root
```
```sql
CREATE DATABASE gwm_onboarding;
EXIT;
```

### 2. Load the schema
```
cd gwm-onboarding/backend
mysql -u root gwm_onboarding < sql/schema.sql
```

### 3. Configure the backend
```
cp .env.example .env
```
Edit `.env`:
- Set `JWT_SECRET` to any random string
- Set `FIELD_ENCRYPTION_KEY` — generate one with `openssl rand -hex 32` (if that's not available, any 64 random hex characters work; this key encrypts bank account numbers, so keep it safe and never commit it)
- Leave the `*_PROVIDER_API_KEY` lines blank until you've signed up with a real provider (see table above)

### 4. Install dependencies, create your first admin login, start the server
```
npm install
node seed-admin.js "Your Name" "you@company.com" "YourPassword123" admin
npm start
```
The seed script hashes the password with the same library the server uses
to check logins — so unlike a hardcoded hash pasted into a SQL file, this is
guaranteed to actually work. Run it again anytime to reset a password.

### 5. Frontend
In a new terminal session:
```
cd gwm-onboarding/frontend
npm install
npm run dev
```
Open `http://localhost:5174` for the public form, or `http://localhost:5174/admin/login` for the admin panel.

## On the FleetX export column mapping
The spec lists FleetX's column names (Client, Office Name, Office Type, GST
Nature, etc.) without their exact field definitions. `backend/controllers/
adminExportController.js` documents the mapping I used for each ambiguous
column in a comment at the top of the file — worth a quick look before you
rely on the export, in case FleetX's actual meaning differs from the
reasonable-guess mapping I made.

## Security notes
- Uploaded documents (PAN cards, licences, cancelled cheques) are **never**
  served from a public folder — only through an authenticated admin route
  that re-checks the admin's role in the database on every request
- Every public endpoint is rate-limited
- File uploads are validated by both MIME type and size, server-side
- Bank account numbers are encrypted at rest; admins can see *that* one is
  on file, not the number itself, without a separate, audited decrypt step
  (not built here — add one deliberately if your workflow needs it)

## Honest limitation
I validated this entire project with static checks — syntax-checked every
file, cross-checked every `import`/`require` against real exports, and
traced data shapes between backend SQL columns and frontend field names. I
could not actually run `npm install` or start either server in the
environment I built this in (no internet access there), so please treat
first-run testing as still needed, and tell me the first error you hit.
