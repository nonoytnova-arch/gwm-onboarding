/*
const db = require('../config/db');
const gstin = require('../utils/gstin');
const { isValidPan, isValidMobile } = require('../utils/validators');
const { encrypt } = require('../utils/crypto');
const { generateReferenceNumber, generateDraftToken } = require('../utils/referenceNumber');
const { verifyCaptcha } = require('./captchaController');
const { sendConfirmation } = require('../utils/notify');

// --- helpers -------------------------------------------------------------

async function checkDuplicates({ gstinValue, panValue, mobile, excludeId }) {
  const conditions = [];
  const params = [];
  if (gstinValue) { conditions.push('gstin = ?'); params.push(gstinValue); }
  if (panValue) { conditions.push('pan = ?'); params.push(panValue); }
  if (mobile) { conditions.push('mobile = ?'); params.push(mobile); }
  if (conditions.length === 0) return [];

  let sql = `SELECT id, role, gstin, pan, mobile FROM submissions
             WHERE status != 'draft' AND (${conditions.join(' OR ')})`;
  if (excludeId) { sql += ' AND id != ?'; params.push(excludeId); }

  const [rows] = await db.query(sql, params);
  const duplicates = [];
  for (const row of rows) {
    if (gstinValue && row.gstin === gstinValue) duplicates.push({ field: 'gstin', message: 'This GSTIN is already registered with us.' });
    if (panValue && row.pan === panValue) duplicates.push({ field: 'pan', message: 'This PAN is already registered with us.' });
    if (mobile && row.mobile === mobile) duplicates.push({ field: 'mobile', message: 'This mobile number is already registered with us.' });
  }
  return duplicates;
}

async function checkVehicleDuplicates(vehicles, excludeSubmissionId) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) return [];
  const regNumbers = vehicles.map((v) => (v.registrationNumber || '').toUpperCase()).filter(Boolean);
  if (regNumbers.length === 0) return [];

  const placeholders = regNumbers.map(() => '?').join(',');
  let sql = `SELECT v.registration_number FROM vehicles v
             JOIN submissions s ON v.submission_id = s.id
             WHERE s.status != 'draft' AND v.registration_number IN (${placeholders})`;
  const params = [...regNumbers];
  if (excludeSubmissionId) { sql += ' AND v.submission_id != ?'; params.push(excludeSubmissionId); }

  const [rows] = await db.query(sql, params);
  return rows.map((r) => ({ field: 'vehicles', message: `Vehicle ${r.registration_number} is already registered with us.` }));
}

// --- draft lifecycle -------------------------------------------------------

async function createDraft(req, res) {
  try {
    const { role, subRole, mobile, email, language } = req.body;
    if (!['client', 'transporter', 'vendor'].includes(role)) {
      return res.status(400).json({ message: 'role must be client, transporter or vendor' });
    }
    const draftToken = generateDraftToken();

    const [result] = await db.query(
      `INSERT INTO submissions (role, sub_role, mobile, email, language, draft_token, status)
       VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
      [role, subRole || null, mobile || null, email || null, language || 'en', draftToken]
    );

    res.status(201).json({ id: result.insertId, draftToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Authorizes access to a draft: the caller must know its draftToken. This is
// a lightweight substitute for a full account/login system on the public
// form — anyone with the token (saved on their device, or recovered via
// mobile OTP) can resume/edit; nobody else can guess their way in.
async function authorizeDraft(id, draftToken) {
  const [rows] = await db.query('SELECT * FROM submissions WHERE id = ?', [id]);
  if (rows.length === 0) return { error: 404, message: 'Submission not found' };
  const submission = rows[0];
  if (submission.draft_token !== draftToken) return { error: 403, message: 'Invalid draft token' };
  if (submission.status !== 'draft') return { error: 409, message: 'This submission has already been finalized and can no longer be edited here' };
  return { submission };
}

async function getDraft(req, res) {
  try {
    const { draftToken } = req.query;
    const auth = await authorizeDraft(req.params.id, draftToken);
    if (auth.error) return res.status(auth.error).json({ message: auth.message });

    // ORDER BY id matches insertion order (drivers/vehicles are inserted in
    // the array order the frontend sent) — the frontend relies on that to
    // re-map a driver's chosen "vehicle at index N" back to a real vehicle
    // ID after a save. See FormContext.jsx's saveNow/scheduleSave.
    const [vehicles] = await db.query('SELECT * FROM vehicles WHERE submission_id = ? ORDER BY id ASC', [req.params.id]);
    const [drivers] = await db.query('SELECT * FROM drivers WHERE submission_id = ? ORDER BY id ASC', [req.params.id]);
    const [documents] = await db.query(
      'SELECT id, doc_type, original_name, related_vehicle_id, related_driver_id, uploaded_at FROM documents WHERE submission_id = ?',
      [req.params.id]
    );

    res.json({ ...auth.submission, vehicles, drivers, documents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Autosave: accepts a partial set of Section A/B fields and merges them.
// Called repeatedly as the user moves through the wizard.
async function updateDraft(req, res) {
  try {
    const { draftToken, vehicles, drivers, ...fields } = req.body;
    const auth = await authorizeDraft(req.params.id, draftToken);
    if (auth.error) return res.status(auth.error).json({ message: auth.message });

    const columnMap = {
      subRole: 'sub_role', legalName: 'legal_name', tradeName: 'trade_name', constitution: 'constitution',
      gstin: 'gstin', gstRegistrationType: 'gst_registration_type', noGstinReason: 'no_gstin_reason',
      pan: 'pan', cinLlpin: 'cin_llpin', udyamNumber: 'udyam_number', udyamCategory: 'udyam_category',
      regAddressLine1: 'reg_address_line1', regAddressLine2: 'reg_address_line2', regLandmark: 'reg_landmark',
      regCity: 'reg_city', regDistrict: 'reg_district', regState: 'reg_state', regStateGstCode: 'reg_state_gst_code',
      regPincode: 'reg_pincode', regCountry: 'reg_country',
      website: 'website', yearEstablished: 'year_established',
      mobile: 'mobile', email: 'email', language: 'language',
      signatoryName: 'signatory_name', signatoryDesignation: 'signatory_designation',
      declarationAccepted: 'declaration_accepted', dpdpConsentAccepted: 'dpdp_consent_accepted',
      declarationDate: 'declaration_date',
      bankAccountHolder: 'bank_account_holder', bankIfsc: 'bank_ifsc', bankUpi: 'bank_upi'
    };
    const jsonColumnMap = {
      billingAddress: 'billing_address_json',
      contacts: 'contacts_json',
      branches: 'branches_json',
      roleSpecificData: 'role_specific_data'
    };

        const dateColumns = new Set(['declaration_date']);

    const setClauses = [];
    const params = [];

    for (const [key, column] of Object.entries(columnMap)) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        setClauses.push(`${column} = ?`);
        const value = fields[key];
        params.push(dateColumns.has(column) && value === '' ? null : value);
      }
    for (const [key, column] of Object.entries(jsonColumnMap)) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        setClauses.push(`${column} = ?`);
        params.push(JSON.stringify(fields[key]));
      }
    }
    // Bank account number: encrypted before storage, never kept in plain text.
    if (Object.prototype.hasOwnProperty.call(fields, 'bankAccountNumber') && fields.bankAccountNumber) {
      setClauses.push('bank_account_number_encrypted = ?');
      params.push(encrypt(fields.bankAccountNumber));
    }

    if (setClauses.length > 0) {
      params.push(req.params.id);
      await db.query(`UPDATE submissions SET ${setClauses.join(', ')} WHERE id = ?`, params);
    }

    // Transporter vehicles/drivers: replace-all sync for the draft stage —
    // simplest correct behavior while the wizard is still being filled in.
    if (Array.isArray(vehicles)) {
      await db.query('DELETE FROM vehicles WHERE submission_id = ?', [req.params.id]);
      for (const v of vehicles) {
        await db.query(
          `INSERT INTO vehicles (submission_id, registration_number, vehicle_type, body_length_ft, capacity_mt,
             make_model, manufacture_year, ownership, rc_owner_name, rc_validity, fitness_expiry, permit_type,
             permit_expiry, insurance_policy_no, insurance_insurer, insurance_expiry, puc_expiry, road_tax_validity,
             gps_provider, gps_tracking_link, fastag_id, reefer_unit_make_model, reefer_temp_range,
             reefer_last_service_date, reefer_data_logger)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            req.params.id, (v.registrationNumber || '').toUpperCase(), v.vehicleType || null,
            v.bodyLengthFt || null, v.capacityMt || null, v.makeModel || null, v.manufactureYear || null,
            v.ownership || 'own', v.rcOwnerName || null, v.rcValidity || null, v.fitnessExpiry || null,
            v.permitType || null, v.permitExpiry || null, v.insurancePolicyNo || null, v.insuranceInsurer || null,
            v.insuranceExpiry || null, v.pucExpiry || null, v.roadTaxValidity || null, v.gpsProvider || null,
            v.gpsTrackingLink || null, v.fastagId || null, v.reeferUnitMakeModel || null, v.reeferTempRange || null,
            v.reeferLastServiceDate || null, !!v.reeferDataLogger
          ]
        );
      }
    }
    if (Array.isArray(drivers)) {
      await db.query('DELETE FROM drivers WHERE submission_id = ?', [req.params.id]);
      for (const d of drivers) {
        await db.query(
          `INSERT INTO drivers (submission_id, vehicle_id, name, mobile, dl_number, dl_type, dl_expiry,
             id_proof_masked, experience_years, reefer_experience, emergency_contact)
           VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [
            req.params.id, d.vehicleId || null, d.name || null, d.mobile || null, d.dlNumber || null,
            d.dlType || null, d.dlExpiry || null, d.idProofLast4 || null, d.experienceYears || null,
            !!d.reeferExperience, d.emergencyContact || null
          ]
        );
      }
    }

    res.json({ message: 'Draft saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Final submit: validates CAPTCHA + declaration/consent, checks for
// duplicates, generates the reference number, and sends a best-effort
// confirmation (see utils/notify.js for why delivery isn't guaranteed yet).
async function finalSubmit(req, res) {
  try {
    const { draftToken, captchaId, captchaAnswer } = req.body;
    const auth = await authorizeDraft(req.params.id, draftToken);
    if (auth.error) return res.status(auth.error).json({ message: auth.message });
    const submission = auth.submission;

    const captchaOk = await verifyCaptcha(captchaId, captchaAnswer);
    if (!captchaOk) {
      return res.status(400).json({ message: 'CAPTCHA answer is incorrect or has expired. Please try again.' });
    }

    if (!submission.declaration_accepted || !submission.dpdp_consent_accepted) {
      return res.status(400).json({ message: 'You must accept the declaration and data-consent before submitting' });
    }
    if (!submission.signatory_name || !submission.signatory_designation) {
      return res.status(400).json({ message: 'Authorised signatory name and designation are required' });
    }

    if (submission.gstin && !gstin.validate(submission.gstin).valid) {
      return res.status(400).json({ message: 'GSTIN on file is invalid — please go back and correct it' });
    }
    if (submission.pan && !isValidPan(submission.pan)) {
      return res.status(400).json({ message: 'PAN on file is invalid — please go back and correct it' });
    }
    if (!submission.mobile || !isValidMobile(submission.mobile)) {
      return res.status(400).json({ message: 'A valid mobile number is required' });
    }

    const duplicates = await checkDuplicates({
      gstinValue: submission.gstin,
      panValue: submission.pan,
      mobile: submission.mobile,
      excludeId: submission.id
    });
    if (duplicates.length > 0) {
      return res.status(409).json({ message: 'Duplicate record detected', errors: duplicates });
    }

    if (submission.role === 'transporter') {
      const [vehicles] = await db.query('SELECT registration_number AS registrationNumber FROM vehicles WHERE submission_id = ?', [submission.id]);
      if (vehicles.length === 0) {
        return res.status(400).json({ message: 'At least one vehicle is required for the transporter role' });
      }
      const vehicleDuplicates = await checkVehicleDuplicates(vehicles, submission.id);
      if (vehicleDuplicates.length > 0) {
        return res.status(409).json({ message: 'Duplicate vehicle detected', errors: vehicleDuplicates });
      }
    }

    const referenceNumber = generateReferenceNumber();
    await db.query(
      `UPDATE submissions SET status = 'submitted', submitted_at = NOW(), reference_number = ? WHERE id = ?`,
      [referenceNumber, submission.id]
    );

    const confirmation = await sendConfirmation({
      mobile: submission.mobile,
      email: submission.email,
      subject: 'Gale World Wide Movers — Submission Received',
      message: `Thank you. Your reference number is ${referenceNumber}. Our team will review your submission and contact you if anything further is needed.`
    });

    res.json({
      message: 'Submitted successfully',
      referenceNumber,
      notificationsSent: confirmation
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { createDraft, getDraft, updateDraft, finalSubmit };
*/

const db = require('../config/db');
const gstin = require('../utils/gstin');
const { isValidPan, isValidMobile } = require('../utils/validators');
const { encrypt } = require('../utils/crypto');
const {
  generateReferenceNumber,
  generateDraftToken
} = require('../utils/referenceNumber');
const { verifyCaptcha } = require('./captchaController');
const { sendConfirmation } = require('../utils/notify');

// -------------------------------------------------------------------------
// HELPERS
// -------------------------------------------------------------------------

async function checkDuplicates({
  gstinValue,
  panValue,
  mobile,
  excludeId
}) {
  const conditions = [];
  const params = [];

  if (gstinValue) {
    conditions.push('gstin = ?');
    params.push(gstinValue);
  }

  if (panValue) {
    conditions.push('pan = ?');
    params.push(panValue);
  }

  if (mobile) {
    conditions.push('mobile = ?');
    params.push(mobile);
  }

  if (conditions.length === 0) return [];

  let sql = `
    SELECT id, role, gstin, pan, mobile
    FROM submissions
    WHERE status != 'draft'
    AND (${conditions.join(' OR ')})
  `;

  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }

  const [rows] = await db.query(sql, params);

  const duplicates = [];

  for (const row of rows) {
    if (gstinValue && row.gstin === gstinValue) {
      duplicates.push({
        field: 'gstin',
        message: 'This GSTIN is already registered with us.'
      });
    }

    if (panValue && row.pan === panValue) {
      duplicates.push({
        field: 'pan',
        message: 'This PAN is already registered with us.'
      });
    }

    if (mobile && row.mobile === mobile) {
      duplicates.push({
        field: 'mobile',
        message: 'This mobile number is already registered with us.'
      });
    }
  }

  return duplicates;
}

async function checkVehicleDuplicates(
  vehicles,
  excludeSubmissionId
) {
  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    return [];
  }

  const regNumbers = vehicles
    .map((v) => (v.registrationNumber || '').toUpperCase())
    .filter(Boolean);

  if (regNumbers.length === 0) return [];

  const placeholders = regNumbers.map(() => '?').join(',');

  let sql = `
    SELECT v.registration_number
    FROM vehicles v
    JOIN submissions s ON v.submission_id = s.id
    WHERE s.status != 'draft'
    AND v.registration_number IN (${placeholders})
  `;

  const params = [...regNumbers];

  if (excludeSubmissionId) {
    sql += ' AND v.submission_id != ?';
    params.push(excludeSubmissionId);
  }

  const [rows] = await db.query(sql, params);

  return rows.map((row) => ({
    field: 'vehicles',
    message: `Vehicle ${row.registration_number} is already registered with us.`
  }));
}

// -------------------------------------------------------------------------
// DRAFT LIFECYCLE
// -------------------------------------------------------------------------

async function createDraft(req, res) {
  try {
    const {
      role,
      subRole,
      mobile,
      email,
      language
    } = req.body;

    if (!['client', 'transporter', 'vendor'].includes(role)) {
      return res.status(400).json({
        message: 'role must be client, transporter or vendor'
      });
    }

    const draftToken = generateDraftToken();

    const [result] = await db.query(
      `INSERT INTO submissions
       (role, sub_role, mobile, email, language, draft_token, status)
       VALUES (?, ?, ?, ?, ?, ?, 'draft')`,
      [
        role,
        subRole || null,
        mobile || null,
        email || null,
        language || 'en',
        draftToken
      ]
    );

    return res.status(201).json({
      id: result.insertId,
      draftToken
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
}

// -------------------------------------------------------------------------
// DRAFT AUTHORIZATION
// -------------------------------------------------------------------------

async function authorizeDraft(id, draftToken) {
  const [rows] = await db.query(
    'SELECT * FROM submissions WHERE id = ?',
    [id]
  );

  if (rows.length === 0) {
    return {
      error: 404,
      message: 'Submission not found'
    };
  }

  const submission = rows[0];

  if (!draftToken || submission.draft_token !== draftToken) {
    return {
      error: 403,
      message: 'Invalid draft token'
    };
  }

  if (submission.status !== 'draft') {
    return {
      error: 409,
      message: 'This submission has already been finalized and can no longer be edited here'
    };
  }

  return { submission };
}

// -------------------------------------------------------------------------
// GET DRAFT
// -------------------------------------------------------------------------

async function getDraft(req, res) {
  try {
    const { draftToken } = req.query;

    const auth = await authorizeDraft(
      req.params.id,
      draftToken
    );

    if (auth.error) {
      return res.status(auth.error).json({
        message: auth.message
      });
    }

    const [vehicles] = await db.query(
      `SELECT *
       FROM vehicles
       WHERE submission_id = ?
       ORDER BY id ASC`,
      [req.params.id]
    );

    const [drivers] = await db.query(
      `SELECT *
       FROM drivers
       WHERE submission_id = ?
       ORDER BY id ASC`,
      [req.params.id]
    );

    const [documents] = await db.query(
      `SELECT
         id,
         doc_type,
         original_name,
         related_vehicle_id,
         related_driver_id,
         uploaded_at
       FROM documents
       WHERE submission_id = ?`,
      [req.params.id]
    );

    return res.json({
      ...auth.submission,
      vehicles,
      drivers,
      documents
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
}

// -------------------------------------------------------------------------
// UPDATE DRAFT / AUTOSAVE
// -------------------------------------------------------------------------

async function updateDraft(req, res) {
  try {
    const {
      draftToken,
      vehicles,
      drivers,
      ...fields
    } = req.body;

    const auth = await authorizeDraft(
      req.params.id,
      draftToken
    );

    if (auth.error) {
      return res.status(auth.error).json({
        message: auth.message
      });
    }

    const columnMap = {
      subRole: 'sub_role',
      legalName: 'legal_name',
      tradeName: 'trade_name',
      constitution: 'constitution',
      gstin: 'gstin',
      gstRegistrationType: 'gst_registration_type',
      noGstinReason: 'no_gstin_reason',
      pan: 'pan',
      cinLlpin: 'cin_llpin',
      udyamNumber: 'udyam_number',
      udyamCategory: 'udyam_category',

      regAddressLine1: 'reg_address_line1',
      regAddressLine2: 'reg_address_line2',
      regLandmark: 'reg_landmark',
      regCity: 'reg_city',
      regDistrict: 'reg_district',
      regState: 'reg_state',
      regStateGstCode: 'reg_state_gst_code',
      regPincode: 'reg_pincode',
      regCountry: 'reg_country',

      website: 'website',
      yearEstablished: 'year_established',

      mobile: 'mobile',
      email: 'email',
      language: 'language',

      signatoryName: 'signatory_name',
      signatoryDesignation: 'signatory_designation',

      declarationAccepted: 'declaration_accepted',
      dpdpConsentAccepted: 'dpdp_consent_accepted',
      declarationDate: 'declaration_date',

      bankAccountHolder: 'bank_account_holder',
      bankIfsc: 'bank_ifsc',
      bankUpi: 'bank_upi'
    };

    const jsonColumnMap = {
      billingAddress: 'billing_address_json',
      contacts: 'contacts_json',
      branches: 'branches_json',
      roleSpecificData: 'role_specific_data'
    };

    const dateColumns = new Set([
      'declaration_date'
    ]);

    const setClauses = [];
    const params = [];

    // Save ordinary database columns.
    for (const [key, column] of Object.entries(columnMap)) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        setClauses.push(`${column} = ?`);

        const value = fields[key];

        params.push(
          dateColumns.has(column) && value === ''
            ? null
            : value
        );
      }
    }

    // Save JSON columns.
    for (const [key, column] of Object.entries(jsonColumnMap)) {
      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        setClauses.push(`${column} = ?`);
        params.push(JSON.stringify(fields[key]));
      }
    }

    // Encrypt bank account number before saving.
    if (
      Object.prototype.hasOwnProperty.call(fields, 'bankAccountNumber') &&
      fields.bankAccountNumber
    ) {
      setClauses.push('bank_account_number_encrypted = ?');
      params.push(encrypt(fields.bankAccountNumber));
    }

    // Update submission fields.
    if (setClauses.length > 0) {
      params.push(req.params.id);

      await db.query(
        `UPDATE submissions
         SET ${setClauses.join(', ')}
         WHERE id = ?`,
        params
      );
    }

    // Synchronize vehicles during draft autosave.
    if (Array.isArray(vehicles)) {
      await db.query(
        'DELETE FROM vehicles WHERE submission_id = ?',
        [req.params.id]
      );

      for (const v of vehicles) {
        await db.query(
          `INSERT INTO vehicles (
            submission_id,
            registration_number,
            vehicle_type,
            body_length_ft,
            capacity_mt,
            make_model,
            manufacture_year,
            ownership,
            rc_owner_name,
            rc_validity,
            fitness_expiry,
            permit_type,
            permit_expiry,
            insurance_policy_no,
            insurance_insurer,
            insurance_expiry,
            puc_expiry,
            road_tax_validity,
            gps_provider,
            gps_tracking_link,
            fastag_id,
            reefer_unit_make_model,
            reefer_temp_range,
            reefer_last_service_date,
            reefer_data_logger
          )
          VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
          [
            req.params.id,
            (v.registrationNumber || '').toUpperCase(),
            v.vehicleType || null,
            v.bodyLengthFt || null,
            v.capacityMt || null,
            v.makeModel || null,
            v.manufactureYear || null,
            v.ownership || 'own',
            v.rcOwnerName || null,
            v.rcValidity || null,
            v.fitnessExpiry || null,
            v.permitType || null,
            v.permitExpiry || null,
            v.insurancePolicyNo || null,
            v.insuranceInsurer || null,
            v.insuranceExpiry || null,
            v.pucExpiry || null,
            v.roadTaxValidity || null,
            v.gpsProvider || null,
            v.gpsTrackingLink || null,
            v.fastagId || null,
            v.reeferUnitMakeModel || null,
            v.reeferTempRange || null,
            v.reeferLastServiceDate || null,
            !!v.reeferDataLogger
          ]
        );
      }
    }

    // Synchronize drivers during draft autosave.
    if (Array.isArray(drivers)) {
      await db.query(
        'DELETE FROM drivers WHERE submission_id = ?',
        [req.params.id]
      );

      for (const d of drivers) {
        await db.query(
          `INSERT INTO drivers (
            submission_id,
            vehicle_id,
            name,
            mobile,
            dl_number,
            dl_type,
            dl_expiry,
            id_proof_masked,
            experience_years,
            reefer_experience,
            emergency_contact
          )
          VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
          [
            req.params.id,
            d.vehicleId || null,
            d.name || null,
            d.mobile || null,
            d.dlNumber || null,
            d.dlType || null,
            d.dlExpiry || null,
            d.idProofLast4 || null,
            d.experienceYears || null,
            !!d.reeferExperience,
            d.emergencyContact || null
          ]
        );
      }
    }

    return res.json({
      message: 'Draft saved'
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
}

// -------------------------------------------------------------------------
// FINAL SUBMISSION
// -------------------------------------------------------------------------

async function finalSubmit(req, res) {
  try {
    const {
      draftToken,
      captchaId,
      captchaAnswer
    } = req.body;

    const auth = await authorizeDraft(
      req.params.id,
      draftToken
    );

    if (auth.error) {
      return res.status(auth.error).json({
        message: auth.message
      });
    }

    const submission = auth.submission;

    // Verify CAPTCHA.
    const captchaOk = await verifyCaptcha(
      captchaId,
      captchaAnswer
    );

    if (!captchaOk) {
      return res.status(400).json({
        message: 'CAPTCHA answer is incorrect or has expired. Please try again.'
      });
    }

    // Required declarations.
    if (
      !submission.declaration_accepted ||
      !submission.dpdp_consent_accepted
    ) {
      return res.status(400).json({
        message: 'You must accept the declaration and data-consent before submitting'
      });
    }

    if (
      !submission.signatory_name ||
      !submission.signatory_designation
    ) {
      return res.status(400).json({
        message: 'Authorised signatory name and designation are required'
      });
    }

    // Validate GSTIN.
    if (
      submission.gstin &&
      !gstin.validate(submission.gstin).valid
    ) {
      return res.status(400).json({
        message: 'GSTIN on file is invalid — please go back and correct it'
      });
    }

    // Validate PAN.
    if (
      submission.pan &&
      !isValidPan(submission.pan)
    ) {
      return res.status(400).json({
        message: 'PAN on file is invalid — please go back and correct it'
      });
    }

    // Validate mobile.
    if (
      !submission.mobile ||
      !isValidMobile(submission.mobile)
    ) {
      return res.status(400).json({
        message: 'A valid mobile number is required'
      });
    }

    // Check duplicate submissions.
    const duplicates = await checkDuplicates({
      gstinValue: submission.gstin,
      panValue: submission.pan,
      mobile: submission.mobile,
      excludeId: submission.id
    });

    if (duplicates.length > 0) {
      return res.status(409).json({
        message: 'Duplicate record detected',
        errors: duplicates
      });
    }

    // Transporter must have at least one vehicle.
    if (submission.role === 'transporter') {
      const [vehicles] = await db.query(
        `SELECT registration_number AS registrationNumber
         FROM vehicles
         WHERE submission_id = ?`,
        [submission.id]
      );

      if (vehicles.length === 0) {
        return res.status(400).json({
          message: 'At least one vehicle is required for the transporter role'
        });
      }

      const vehicleDuplicates = await checkVehicleDuplicates(
        vehicles,
        submission.id
      );

      if (vehicleDuplicates.length > 0) {
        return res.status(409).json({
          message: 'Duplicate vehicle detected',
          errors: vehicleDuplicates
        });
      }
    }

    // Generate reference number and finalize submission.
    const referenceNumber = generateReferenceNumber();

    await db.query(
      `UPDATE submissions
       SET status = 'submitted',
           submitted_at = NOW(),
           reference_number = ?
       WHERE id = ?`,
      [referenceNumber, submission.id]
    );

    // Send confirmation.
    const confirmation = await sendConfirmation({
      mobile: submission.mobile,
      email: submission.email,
      subject: 'Gale World Wide Movers — Submission Received',
      message: `Thank you. Your reference number is ${referenceNumber}. Our team will review your submission and contact you if anything further is needed.`
    });

    return res.json({
      message: 'Submitted successfully',
      referenceNumber,
      notificationsSent: confirmation
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
}

// -------------------------------------------------------------------------
// EXPORTS
// -------------------------------------------------------------------------

module.exports = {
  createDraft,
  getDraft,
  updateDraft,
  finalSubmit
};
