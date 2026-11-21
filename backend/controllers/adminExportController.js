const db = require('../config/db');

// Column order and mapping match the FleetX client-report format given in
// the spec. A few column names are generic enough that their exact intended
// source field is a judgment call on our side — these are noted below so
// your team can quickly remap if FleetX expects something different:
//   - "Client"      -> legal_name (the registered legal entity name)
//   - "Office Name" -> trade_name (assumed to mean the trading/brand name,
//                      not a specific branch — branches are a separate
//                      repeatable field not included in this flat export)
//   - "Office Type" -> constitution (Proprietorship / Pvt Ltd / etc.)
//   - "GST Nature"  -> gst_registration_type (Regular / Composition / SEZ / Unregistered)
//   - "Type"        -> role (client / transporter / vendor)
//   - "Contact Person" -> the owner/director contact from Section A, falling
//                      back to the authorised signatory if that's missing
const COLUMNS = [
  'Client', 'Email', 'Mobile', 'Address', 'GST Number', 'PAN', 'Type', 'Code',
  'Address Line 1', 'Address Line 2', 'City', 'State', 'Country', 'Postal Code',
  'Contact Person', 'Office Name', 'Office Type', 'GST Nature'
];

function csvEscape(value) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function buildFullAddress(row) {
  return [row.reg_address_line1, row.reg_address_line2, row.reg_city, row.reg_state, row.reg_pincode]
    .filter(Boolean)
    .join(', ');
}

function getContactPerson(row) {
  try {
    const contacts = row.contacts_json ? JSON.parse(row.contacts_json) : null;
    if (contacts?.owner?.name) return contacts.owner.name;
  } catch {
    // ignore malformed JSON, fall through to signatory
  }
  return row.signatory_name || '';
}

async function exportApproved(req, res) {
  try {
    const [rows] = await db.query("SELECT * FROM submissions WHERE status = 'approved' ORDER BY party_code ASC");

    const lines = [COLUMNS.join(',')];
    for (const row of rows) {
      const values = [
        row.legal_name, row.email, row.mobile, buildFullAddress(row), row.gstin, row.pan,
        row.role, row.party_code, row.reg_address_line1, row.reg_address_line2, row.reg_city,
        row.reg_state, row.reg_country, row.reg_pincode, getContactPerson(row), row.trade_name,
        row.constitution, row.gst_registration_type
      ];
      lines.push(values.map(csvEscape).join(','));
    }

    const csv = lines.join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="gwm-approved-partners-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { exportApproved };
