// The backend stores vehicles/drivers with snake_case columns (matching
// SQL convention); the form schema (formSchema.js) uses camelCase keys
// (matching JS convention). These convert a DB row back into the shape
// the form fields expect, after a save round-trip hands real IDs back.

export function mapVehicleFromDb(row) {
  return {
    id: row.id,
    registrationNumber: row.registration_number || '',
    vehicleType: row.vehicle_type || '',
    bodyLengthFt: row.body_length_ft ?? '',
    capacityMt: row.capacity_mt ?? '',
    makeModel: row.make_model || '',
    manufactureYear: row.manufacture_year || '',
    ownership: row.ownership === 'attached' ? 'Attached' : 'Own',
    rcOwnerName: row.rc_owner_name || '',
    rcValidity: formatDate(row.rc_validity),
    fitnessExpiry: formatDate(row.fitness_expiry),
    permitType: row.permit_type || '',
    permitExpiry: formatDate(row.permit_expiry),
    insurancePolicyNo: row.insurance_policy_no || '',
    insuranceInsurer: row.insurance_insurer || '',
    insuranceExpiry: formatDate(row.insurance_expiry),
    pucExpiry: formatDate(row.puc_expiry),
    roadTaxValidity: formatDate(row.road_tax_validity),
    gpsProvider: row.gps_provider || '',
    gpsTrackingLink: row.gps_tracking_link || '',
    fastagId: row.fastag_id || '',
    reeferUnitMakeModel: row.reefer_unit_make_model || '',
    reeferTempRange: row.reefer_temp_range || '',
    reeferLastServiceDate: formatDate(row.reefer_last_service_date),
    reeferDataLogger: !!row.reefer_data_logger
  };
}

export function mapDriverFromDb(row, vehicles) {
  const vehicleIndex = row.vehicle_id ? vehicles.findIndex((v) => v.id === row.vehicle_id) : -1;
  return {
    id: row.id,
    vehicleIndex: vehicleIndex >= 0 ? vehicleIndex : '',
    name: row.name || '',
    mobile: row.mobile || '',
    dlNumber: row.dl_number || '',
    dlType: row.dl_type || '',
    dlExpiry: formatDate(row.dl_expiry),
    idProofLast4: row.id_proof_masked || '',
    experienceYears: row.experience_years ?? '',
    reeferExperience: !!row.reefer_experience,
    emergencyContact: row.emergency_contact || ''
  };
}

// MySQL returns DATE columns as full ISO datetimes; <input type="date">
// needs just the YYYY-MM-DD portion.
function formatDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

// Resolves each driver's chosen "vehicle at index N" (set via the dropdown
// in SectionB) to that vehicle's real database ID, so the server can store
// the actual foreign key. If the linked vehicle hasn't been saved yet (no ID
// assigned so far), this correctly sends null — the link is simply
// re-attempted on the next save once the vehicle has an ID.
export function resolveDriverVehicleIds(drivers, vehicles) {
  return drivers.map((driver) => {
    const idx = driver.vehicleIndex;
    const vehicleId = idx !== '' && idx !== null && idx !== undefined ? vehicles[idx]?.id ?? null : null;
    return { ...driver, vehicleId };
  });
}
