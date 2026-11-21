-- Gale World Wide Movers Pvt Ltd — Partner Onboarding database schema
-- Run with: mysql -u root -p gwm_onboarding < sql/schema.sql

-- ===================== ADMIN USERS =====================
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin','operations','accounts') NOT NULL DEFAULT 'operations',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== PARTY CODE COUNTERS =====================
-- One row per role, atomically incremented to generate CL-0001 / TR-0001 / VN-0001.
CREATE TABLE IF NOT EXISTS party_code_counters (
  role VARCHAR(20) PRIMARY KEY,
  last_number INT NOT NULL DEFAULT 0
);
INSERT INTO party_code_counters (role, last_number) VALUES
  ('client', 0), ('transporter', 0), ('vendor', 0)
ON DUPLICATE KEY UPDATE role = role;

-- ===================== SUBMISSIONS (the onboarding record) =====================
-- Section A (common) fields are real columns, since they're consistent across
-- every role and the admin list/filter/search/export all need to query them
-- directly. Section B (role-specific: B1 client / B2 transporter / B3 vendor)
-- varies enormously by role and is stored as structured JSON in
-- role_specific_data — every field from the spec is still captured, just not
-- as 80 extra sparse columns that are NULL for 2 of every 3 roles.
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  party_code VARCHAR(20) UNIQUE,                -- e.g. CL-0001, assigned on approval
  role ENUM('client','transporter','vendor') NOT NULL,
  sub_role VARCHAR(50),                         -- e.g. Consignor / Consignee / Fleet owner / Broker / Fuel / Tyres...
  status ENUM('draft','submitted','under_review','need_more_info','approved','rejected')
    NOT NULL DEFAULT 'draft',

  -- Section A: common identity
  legal_name VARCHAR(200),
  trade_name VARCHAR(200),
  constitution VARCHAR(50),
  gstin VARCHAR(15),
  gst_registration_type VARCHAR(20),
  no_gstin_reason VARCHAR(255),
  pan VARCHAR(10),
  cin_llpin VARCHAR(30),
  udyam_number VARCHAR(30),
  udyam_category VARCHAR(20),

  -- Section A: registered address
  reg_address_line1 VARCHAR(255),
  reg_address_line2 VARCHAR(255),
  reg_landmark VARCHAR(150),
  reg_city VARCHAR(100),
  reg_district VARCHAR(100),
  reg_state VARCHAR(100),
  reg_state_gst_code VARCHAR(2),
  reg_pincode VARCHAR(6),
  reg_country VARCHAR(100) DEFAULT 'India',

  -- Section A: billing address (JSON: {sameAsRegistered, line1, line2, city, state, pincode})
  billing_address_json JSON,

  -- Section A: contacts (JSON: {owner:{}, operations:{}, accounts:{}, emergencyNumber})
  contacts_json JSON,

  website VARCHAR(255),
  year_established VARCHAR(4),

  -- Section A: repeatable branches (JSON array)
  branches_json JSON,

  -- Section B: everything specific to the chosen role (JSON — see frontend
  -- src/data/formSchema.js for the exact field list captured per role)
  role_specific_data JSON,

  -- Section D: declaration & consent
  signatory_name VARCHAR(150),
  signatory_designation VARCHAR(100),
  declaration_accepted BOOLEAN DEFAULT FALSE,
  dpdp_consent_accepted BOOLEAN DEFAULT FALSE,
  declaration_date DATE,

  -- Contact + draft/resume
  mobile VARCHAR(10),
  email VARCHAR(150),
  draft_token VARCHAR(64) UNIQUE,               -- used with mobile OTP to resume a draft

  -- Encrypted sensitive fields (bank details; see utils/crypto.js)
  bank_account_holder VARCHAR(150),
  bank_account_number_encrypted TEXT,
  bank_ifsc VARCHAR(11),
  bank_upi VARCHAR(100),

  language VARCHAR(2) DEFAULT 'en',
  reference_number VARCHAR(20) UNIQUE,          -- shown to the submitter after final submit

  submitted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_state (reg_state),
  INDEX idx_gstin (gstin),
  INDEX idx_pan (pan),
  INDEX idx_mobile (mobile)
);

-- ===================== VEHICLES (transporter role, repeatable) =====================
-- Kept as real rows (not JSON) because the document-expiry dashboard needs to
-- query across ALL vehicles efficiently (insurance/fitness/permit/PUC expiry).
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  registration_number VARCHAR(15) NOT NULL,
  vehicle_type VARCHAR(30),
  body_length_ft DECIMAL(5,2),
  capacity_mt DECIMAL(6,2),
  make_model VARCHAR(150),
  manufacture_year VARCHAR(4),
  ownership ENUM('own','attached') DEFAULT 'own',
  rc_owner_name VARCHAR(150),
  rc_validity DATE,
  fitness_expiry DATE,
  permit_type VARCHAR(50),
  permit_expiry DATE,
  insurance_policy_no VARCHAR(50),
  insurance_insurer VARCHAR(150),
  insurance_expiry DATE,
  puc_expiry DATE,
  road_tax_validity DATE,
  gps_provider VARCHAR(100),
  gps_tracking_link VARCHAR(255),
  fastag_id VARCHAR(50),
  reefer_unit_make_model VARCHAR(150),
  reefer_temp_range VARCHAR(50),
  reefer_last_service_date DATE,
  reefer_data_logger BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  INDEX idx_submission (submission_id),
  INDEX idx_reg_number (registration_number)
);

-- ===================== DRIVERS (transporter role, repeatable, linked to a vehicle) =====================
CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  vehicle_id INT,
  name VARCHAR(150) NOT NULL,
  mobile VARCHAR(10) NOT NULL,
  dl_number VARCHAR(30),
  dl_type VARCHAR(30),
  dl_expiry DATE,
  id_proof_masked VARCHAR(20),                  -- only last 4 digits ever stored, never full Aadhaar
  experience_years DECIMAL(4,1),
  reefer_experience BOOLEAN DEFAULT FALSE,
  emergency_contact VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  INDEX idx_submission (submission_id),
  INDEX idx_dl_expiry (dl_expiry)
);

-- ===================== DOCUMENTS (uploaded files, all roles) =====================
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  doc_type VARCHAR(100) NOT NULL,               -- e.g. 'gst_certificate', 'vehicle_rc', 'driver_dl'
  related_vehicle_id INT,
  related_driver_id INT,
  original_name VARCHAR(255),
  stored_path VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes INT,
  expiry_date DATE,                             -- optional, mirrors FSSAI/drug-licence expiry etc.
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (related_vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL,
  FOREIGN KEY (related_driver_id) REFERENCES drivers(id) ON DELETE SET NULL,
  INDEX idx_submission (submission_id)
);

-- ===================== OTP CODES (draft resume via mobile OTP) =====================
CREATE TABLE IF NOT EXISTS otp_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mobile VARCHAR(10) NOT NULL,
  code_hash VARCHAR(255) NOT NULL,
  purpose ENUM('draft_resume','mobile_verify') NOT NULL DEFAULT 'draft_resume',
  attempts INT DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_mobile (mobile)
);

-- ===================== CAPTCHA CHALLENGES =====================
CREATE TABLE IF NOT EXISTS captcha_challenges (
  id VARCHAR(36) PRIMARY KEY,
  answer_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===================== AUDIT LOG =====================
CREATE TABLE IF NOT EXISTS audit_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  submission_id INT NOT NULL,
  admin_user_id INT,
  action VARCHAR(50) NOT NULL,                  -- 'status_change', 'edit', 'document_request'
  from_status VARCHAR(30),
  to_status VARCHAR(30),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  INDEX idx_submission (submission_id)
);

-- NOTE: no admin login is seeded here. A hardcoded bcrypt hash in a SQL file
-- is a common source of "it just doesn't work" bugs (hashes are tied to a
-- specific bcrypt version/salt and are easy to get subtly wrong by hand).
-- Run `node seed-admin.js` after `npm install` instead — it hashes a real
-- password with the actual bcryptjs library your server uses, guaranteeing
-- the login that gets created actually works. See that file and the README.
