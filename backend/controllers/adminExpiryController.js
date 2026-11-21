const db = require('../config/db');

// Flags vehicle documents (insurance/fitness/permit/PUC/road tax) and driver
// licences that are already expired or expiring within the next 30 days,
// across all non-draft submissions. One combined, sorted list so operations
// can work through the most urgent items first.
async function getExpiryDashboard(req, res) {
  try {
    const withinDays = Number(req.query.withinDays) || 30;

    const [vehicleRows] = await db.query(
      `SELECT v.id AS vehicleId, v.submission_id AS submissionId, v.registration_number AS registrationNumber,
              s.legal_name AS partyName, s.party_code AS partyCode, s.mobile, s.email,
              v.insurance_expiry, v.fitness_expiry, v.permit_expiry, v.puc_expiry, v.road_tax_validity
       FROM vehicles v
       JOIN submissions s ON v.submission_id = s.id
       WHERE s.status != 'draft'
         AND (
           v.insurance_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) OR
           v.fitness_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) OR
           v.permit_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) OR
           v.puc_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY) OR
           v.road_tax_validity <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
         )`,
      [withinDays, withinDays, withinDays, withinDays, withinDays]
    );

    const items = [];
    const docFields = [
      ['insurance_expiry', 'Insurance'],
      ['fitness_expiry', 'Fitness Certificate'],
      ['permit_expiry', 'Permit'],
      ['puc_expiry', 'PUC'],
      ['road_tax_validity', 'Road Tax']
    ];
    for (const row of vehicleRows) {
      for (const [field, label] of docFields) {
        const dateVal = row[field];
        if (!dateVal) continue;
        const dueDate = new Date(dateVal);
        if (Number.isNaN(dueDate.getTime())) continue;
        const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= withinDays) {
          items.push({
            type: 'vehicle',
            docLabel: label,
            partyCode: row.partyCode,
            partyName: row.partyName,
            mobile: row.mobile,
            email: row.email,
            registrationNumber: row.registrationNumber,
            expiryDate: dateVal,
            daysLeft,
            status: daysLeft < 0 ? 'expired' : 'expiring_soon'
          });
        }
      }
    }

    const [driverRows] = await db.query(
      `SELECT d.id AS driverId, d.name, d.dl_number AS dlNumber, d.dl_expiry AS dlExpiry,
              s.legal_name AS partyName, s.party_code AS partyCode, s.mobile, s.email
       FROM drivers d
       JOIN submissions s ON d.submission_id = s.id
       WHERE s.status != 'draft' AND d.dl_expiry <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
      [withinDays]
    );
    for (const row of driverRows) {
      if (!row.dlExpiry) continue;
      const dueDate = new Date(row.dlExpiry);
      if (Number.isNaN(dueDate.getTime())) continue;
      const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      items.push({
        type: 'driver',
        docLabel: 'Driving Licence',
        partyCode: row.partyCode,
        partyName: row.partyName,
        mobile: row.mobile,
        email: row.email,
        driverName: row.name,
        dlNumber: row.dlNumber,
        expiryDate: row.dlExpiry,
        daysLeft,
        status: daysLeft < 0 ? 'expired' : 'expiring_soon'
      });
    }

    // Also surface any uploaded document with an explicit expiry_date set
    // (FSSAI, drug licence, etc. — these are captured at upload time).
    const [docRows] = await db.query(
      `SELECT doc.id, doc.doc_type AS docType, doc.expiry_date AS expiryDate,
              s.legal_name AS partyName, s.party_code AS partyCode, s.mobile, s.email
       FROM documents doc
       JOIN submissions s ON doc.submission_id = s.id
       WHERE s.status != 'draft' AND doc.expiry_date IS NOT NULL
         AND doc.expiry_date <= DATE_ADD(CURDATE(), INTERVAL ? DAY)`,
      [withinDays]
    );
    for (const row of docRows) {
      const dueDate = new Date(row.expiryDate);
      if (Number.isNaN(dueDate.getTime())) continue;
      const daysLeft = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      items.push({
        type: 'document',
        docLabel: row.docType,
        partyCode: row.partyCode,
        partyName: row.partyName,
        mobile: row.mobile,
        email: row.email,
        expiryDate: row.expiryDate,
        daysLeft,
        status: daysLeft < 0 ? 'expired' : 'expiring_soon'
      });
    }

    items.sort((a, b) => a.daysLeft - b.daysLeft);
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

module.exports = { getExpiryDashboard };
