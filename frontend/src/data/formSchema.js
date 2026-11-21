// Every field in the spec, as data. One reusable <DynamicField> component
// (see src/components/DynamicField.jsx) renders whatever this schema
// describes — adding or relabeling a field going forward means editing
// this file, not hunting through page components.
//
// Field shape: { key, label, type, required, help, options, placeholder }
// type: text | textarea | select | radio | checkbox | tel | email | number | date | repeatable
// For type 'repeatable', `fields` holds the per-item field list.

export const CONSTITUTION_OPTIONS = [
  'Proprietorship', 'Partnership', 'LLP', 'Pvt Ltd', 'Public Ltd', 'Trust/Society', 'Government', 'Individual'
];

export const GST_REG_TYPE_OPTIONS = ['Regular', 'Composition', 'SEZ', 'Unregistered'];

export const SUB_ROLE_OPTIONS = {
  client: ['Consignor', 'Consignee', 'Billing party', 'All'],
  transporter: ['Fleet owner', 'Transport company', 'Broker/commission agent', 'Owner-driver', 'GTA'],
  vendor: [
    'Fuel', 'Tyres', 'Spares', 'Workshop/Garage', 'Reefer service/AMC', 'GPS/FASTag/Telematics',
    'Warehouse/Cold storage', 'Labour/Loading contractor', 'Packaging', 'Insurance', 'Driver/Staff agency', 'IT', 'Other'
  ]
};

// ===================== SECTION A — COMMON (all roles) =====================
export const COMMON_IDENTITY_FIELDS = [
  { key: 'legalName', label: 'Legal Name', type: 'text', required: true },
  { key: 'tradeName', label: 'Trade Name', type: 'text' },
  { key: 'constitution', label: 'Constitution', type: 'select', required: true, options: CONSTITUTION_OPTIONS },
  { key: 'gstin', label: 'GSTIN', type: 'text', required: true, help: '15 characters, e.g. 27ABCDE1234F1Z5', placeholder: '27ABCDE1234F1Z5' },
  { key: 'noGstin', label: "I don't have a GSTIN", type: 'checkbox' },
  { key: 'noGstinReason', label: 'Reason for no GSTIN', type: 'text', showIf: { field: 'noGstin', equals: true } },
  { key: 'gstRegistrationType', label: 'GST Registration Type', type: 'select', options: GST_REG_TYPE_OPTIONS },
  { key: 'pan', label: 'PAN', type: 'text', required: true, help: 'Auto-filled from GSTIN when possible', placeholder: 'ABCDE1234F' },
  { key: 'cinLlpin', label: 'CIN / LLPIN', type: 'text' },
  { key: 'udyamNumber', label: 'Udyam (MSME) Number', type: 'text' },
  { key: 'udyamCategory', label: 'Udyam Category', type: 'select', options: ['Micro', 'Small', 'Medium'] }
];

export const COMMON_ADDRESS_FIELDS = [
  { key: 'regAddressLine1', label: 'Address Line 1', type: 'text', required: true },
  { key: 'regAddressLine2', label: 'Address Line 2', type: 'text' },
  { key: 'regLandmark', label: 'Landmark', type: 'text' },
  { key: 'regCity', label: 'City', type: 'text', required: true },
  { key: 'regDistrict', label: 'District', type: 'text' },
  { key: 'regState', label: 'State', type: 'gstState', required: true },
  { key: 'regPincode', label: 'Pincode', type: 'text', required: true, help: '6 digits' },
  { key: 'regCountry', label: 'Country', type: 'text', defaultValue: 'India' }
];

export const BILLING_ADDRESS_FIELDS = [
  { key: 'sameAsRegistered', label: 'Same as registered address', type: 'checkbox' },
  { key: 'line1', label: 'Address Line 1', type: 'text', showIf: { field: 'sameAsRegistered', equals: false } },
  { key: 'line2', label: 'Address Line 2', type: 'text', showIf: { field: 'sameAsRegistered', equals: false } },
  { key: 'city', label: 'City', type: 'text', showIf: { field: 'sameAsRegistered', equals: false } },
  { key: 'state', label: 'State', type: 'gstState', showIf: { field: 'sameAsRegistered', equals: false } },
  { key: 'pincode', label: 'Pincode', type: 'text', showIf: { field: 'sameAsRegistered', equals: false } }
];

export const CONTACT_SUBFIELDS = [
  { key: 'name', label: 'Name', type: 'text', required: true },
  { key: 'mobile', label: 'Mobile', type: 'tel', required: true },
  { key: 'email', label: 'Email', type: 'email' }
];

export const COMMON_MISC_FIELDS = [
  { key: 'website', label: 'Website', type: 'text' },
  { key: 'yearEstablished', label: 'Year of Establishment', type: 'number' }
];

export const BRANCH_FIELDS = [
  { key: 'officeName', label: 'Office Name', type: 'text', required: true },
  { key: 'address', label: 'Address', type: 'text', required: true },
  { key: 'city', label: 'City', type: 'text', required: true },
  { key: 'state', label: 'State', type: 'gstState' },
  { key: 'pincode', label: 'Pincode', type: 'text' },
  { key: 'branchGstin', label: 'Branch GSTIN', type: 'text' },
  { key: 'contactPerson', label: 'Contact Person', type: 'text' },
  { key: 'phone', label: 'Phone', type: 'tel' }
];

// ===================== SECTION B1 — CLIENT / CUSTOMER =====================
export const CLIENT_COMMERCIAL_FIELDS = [
  { key: 'advancePercent', label: 'Advance % Required', type: 'number' },
  { key: 'creditDays', label: 'Credit Days', type: 'number', required: true },
  { key: 'billingCycle', label: 'Billing Cycle', type: 'select', required: true, options: ['Per trip', 'Weekly', 'Fortnightly', 'Monthly'] },
  { key: 'invoiceEmail', label: 'Invoice Email', type: 'email', required: true },
  { key: 'poRequired', label: 'PO Required', type: 'radio', options: ['Yes', 'No'] },
  { key: 'invoiceSubmissionPortal', label: 'Invoice Submission Portal', type: 'text' },
  { key: 'eInvoicingApplicable', label: 'E-Invoicing Applicable', type: 'radio', options: ['Yes', 'No'] },
  { key: 'gstTreatment', label: 'Who pays GST on freight?', type: 'select', required: true,
    options: ['Consignor', 'Consignee', 'Transporter under RCM', 'Forward charge', 'Exempt'] },
  { key: 'tdsApplicable', label: 'TDS Applicable', type: 'radio', options: ['Yes', 'No'] },
  { key: 'tdsSectionRate', label: 'TDS Section and Rate', type: 'text', showIf: { field: 'tdsApplicable', equals: 'Yes' } },
  { key: 'detentionFreeHours', label: 'Detention-Free Hours', type: 'number' },
  { key: 'loadingUnloadingHandledBy', label: 'Who handles loading/unloading?', type: 'text' }
];

export const CLIENT_SHIPMENT_FIELDS = [
  { key: 'commodities', label: 'Commodities', type: 'text', required: true },
  { key: 'materialGroup', label: 'Material Group', type: 'select', required: true,
    options: ['Food/perishable', 'Dry', 'Pharma', 'Hazardous', 'Fragile', 'FMCG', 'Other'] },
  { key: 'packagingType', label: 'Packaging Type', type: 'text' },
  { key: 'avgWeightPerLoadMt', label: 'Average Weight per Load (MT)', type: 'number' },
  { key: 'declaredValuePerLoad', label: 'Declared Value per Load (₹)', type: 'number' },
  { key: 'cargoInsuranceArrangedBy', label: 'Who arranges cargo insurance?', type: 'text' },
  { key: 'temperatureRequirement', label: 'Temperature Requirement', type: 'select', required: true,
    options: ['Dry/ambient', '0-5°C', '2-8°C', '10-15°C', '15-20°C', '-18°C', '-22°C', 'Custom'] },
  { key: 'preCoolingNeeded', label: 'Pre-Cooling Needed', type: 'radio', options: ['Yes', 'No'] },
  { key: 'temperatureLogRequired', label: 'Temperature Log Required', type: 'radio', options: ['Yes', 'No'] },
  { key: 'humidityVentilationNeeds', label: 'Humidity / Ventilation Needs', type: 'text' },
  { key: 'maxTransitTime', label: 'Maximum Transit Time', type: 'text' },
  { key: 'expectedMonthlyVolume', label: 'Expected Monthly Volume', type: 'text' },
  { key: 'seasonality', label: 'Seasonality', type: 'text' },
  { key: 'vehicleTypeNeeded', label: 'Vehicle Type Needed', type: 'select', options: ['Open', 'Closed', 'Reefer', 'Container'] },
  { key: 'vehicleSize', label: 'Vehicle Size', type: 'select', options: ['20 ft', '32 ft', '40 ft'] },
  { key: 'vehicleCapacityMt', label: 'Vehicle Capacity (MT)', type: 'number' },
  { key: 'multiPointLoading', label: 'Multi-Point Loading', type: 'radio', options: ['Yes', 'No'] },
  { key: 'fssaiNumber', label: 'FSSAI Number', type: 'text' },
  { key: 'fssaiExpiry', label: 'FSSAI Expiry', type: 'date' },
  { key: 'drugLicence', label: 'Drug Licence Number', type: 'text' },
  { key: 'otherLicences', label: 'Other Licences', type: 'text' }
];

export const CLIENT_LANE_FIELDS = [
  { key: 'fromCityState', label: 'From (City, State)', type: 'text', required: true },
  { key: 'toCityState', label: 'To (City, State)', type: 'text', required: true },
  { key: 'tripsPerMonth', label: 'Trips per Month', type: 'number' }
];

export const CLIENT_LOCATION_FIELDS = [
  { key: 'locationName', label: 'Location Name', type: 'text', required: true },
  { key: 'locationType', label: 'Type', type: 'select', options: ['Factory', 'Godown', 'Cold storage', 'Mandi', 'Port', 'Door'] },
  { key: 'fullAddress', label: 'Full Address', type: 'textarea', required: true },
  { key: 'pincode', label: 'Pincode', type: 'text' },
  { key: 'gpsPin', label: 'GPS Pin', type: 'text', help: 'Paste a Google Maps link or lat,long' },
  { key: 'locationGstin', label: 'GSTIN of this Location', type: 'text' },
  { key: 'contactPerson', label: 'Contact Person', type: 'text' },
  { key: 'contactMobile', label: 'Contact Mobile', type: 'tel' },
  { key: 'loadingHours', label: 'Loading/Unloading Hours', type: 'text' },
  { key: 'daysClosed', label: 'Days Closed', type: 'text' },
  { key: 'appointmentRequired', label: 'Appointment Required', type: 'radio', options: ['Yes', 'No'] },
  { key: 'truckEntryRestrictions', label: 'Truck Entry Restrictions', type: 'text', help: 'City entry timings, height/size limits' },
  { key: 'loadingMethod', label: 'Loading Method', type: 'select', options: ['Manual', 'Forklift', 'Dock'] },
  { key: 'ewayBillGeneratedBy', label: 'E-way Bill Generated By', type: 'select', options: ['Consignor', 'Us'] }
];

export const CLIENT_SERVICE_FIELDS = [
  { key: 'podFormat', label: 'POD Format', type: 'select', options: ['Hard copy', 'Scanned', 'e-POD'] },
  { key: 'podDeadline', label: 'POD Deadline', type: 'text' },
  { key: 'claimPolicy', label: 'Claim Policy', type: 'textarea', help: 'Damage / shortage / delay' },
  { key: 'slaExpectations', label: 'SLA Expectations', type: 'textarea' },
  { key: 'trackingLinkNeeded', label: 'Tracking Link Needed', type: 'radio', options: ['Yes', 'No'] },
  { key: 'preferredCommunication', label: 'Preferred Communication', type: 'select', options: ['WhatsApp', 'Email', 'Call'] },
  { key: 'specialInstructions', label: 'Special Instructions', type: 'textarea' }
];

// ===================== SECTION B2 — TRANSPORTER / FLEET OWNER / BROKER =====================
export const TRANSPORTER_PROFILE_FIELDS = [
  { key: 'yearsInBusiness', label: 'Years in Business', type: 'number' },
  { key: 'vehiclesOwned', label: 'Vehicles Owned', type: 'number', required: true },
  { key: 'attachedVehicles', label: 'Attached Vehicles', type: 'number' },
  { key: 'operatingStates', label: 'Operating States', type: 'text', required: true, help: 'Comma-separated' },
  { key: 'returnLoadAvailability', label: 'Return-Load Availability', type: 'text' }
];

export const TRANSPORTER_LANE_FIELDS = [
  { key: 'fromCityState', label: 'From (City, State)', type: 'text', required: true },
  { key: 'toCityState', label: 'To (City, State)', type: 'text', required: true },
  { key: 'expectedRatePerTrip', label: 'Expected Rate per Trip (₹)', type: 'number' }
];

export const TRANSPORTER_TAX_FIELDS = [
  { key: 'gstStatus', label: 'GST Status', type: 'select', options: GST_REG_TYPE_OPTIONS },
  { key: 'gtaOption', label: 'GTA Option', type: 'radio', options: ['Forward charge', 'RCM'] },
  { key: 'tdsDeclaration194C6', label: 'TDS Declaration (Sec 194C(6) — owns 10 or fewer goods carriages)', type: 'radio', options: ['Yes', 'No'] },
  { key: 'msmeStatus', label: 'MSME Status', type: 'text' }
];

export const TRANSPORTER_BANK_FIELDS = [
  { key: 'bankAccountHolder', label: 'Account Holder Name', type: 'text', required: true, help: 'Must match PAN/GST name' },
  { key: 'bankAccountNumber', label: 'Account Number', type: 'text', required: true },
  { key: 'bankIfsc', label: 'IFSC Code', type: 'text', required: true },
  { key: 'bankUpi', label: 'UPI ID (optional)', type: 'text' }
];

export const TRANSPORTER_PAYMENT_TERMS_FIELDS = [
  { key: 'advancePercent', label: 'Advance %', type: 'number', required: true },
  { key: 'balanceAfterPodDays', label: 'Balance After POD (Days)', type: 'number', required: true },
  { key: 'podSubmissionCommitment', label: 'POD Submission Commitment', type: 'text' },
  { key: 'detentionRate', label: 'Detention Rate (₹/hour or day)', type: 'text' },
  { key: 'loadingUnloadingCharges', label: 'Loading/Unloading Charges', type: 'text' },
  { key: 'tollFuelAllowanceBearer', label: 'Who bears toll/fuel/driver allowance?', type: 'text' }
];

export const VEHICLE_FIELDS = [
  { key: 'registrationNumber', label: 'Registration Number', type: 'text', required: true, placeholder: 'MH17CV6950' },
  { key: 'vehicleType', label: 'Type', type: 'select', required: true, options: ['Open', 'Closed', 'Container', 'Reefer', 'Trailer', 'Tanker'] },
  { key: 'bodyLengthFt', label: 'Body Length (ft)', type: 'number' },
  { key: 'capacityMt', label: 'Capacity (MT)', type: 'number', required: true },
  { key: 'makeModel', label: 'Make / Model', type: 'text' },
  { key: 'manufactureYear', label: 'Year', type: 'number' },
  { key: 'ownership', label: 'Ownership', type: 'radio', options: ['Own', 'Attached'] },
  { key: 'rcOwnerName', label: 'RC Owner Name', type: 'text' },
  { key: 'rcValidity', label: 'RC Validity', type: 'date' },
  { key: 'fitnessExpiry', label: 'Fitness Expiry', type: 'date', required: true },
  { key: 'permitType', label: 'Permit Type', type: 'text' },
  { key: 'permitExpiry', label: 'Permit Expiry', type: 'date', required: true },
  { key: 'insurancePolicyNo', label: 'Insurance Policy No.', type: 'text' },
  { key: 'insuranceInsurer', label: 'Insurer', type: 'text' },
  { key: 'insuranceExpiry', label: 'Insurance Expiry', type: 'date', required: true },
  { key: 'pucExpiry', label: 'PUC Expiry', type: 'date', required: true },
  { key: 'roadTaxValidity', label: 'Road Tax Validity', type: 'date' },
  { key: 'gpsProvider', label: 'GPS Provider', type: 'text' },
  { key: 'gpsTrackingLink', label: 'GPS Tracking Link', type: 'text' },
  { key: 'fastagId', label: 'FASTag ID', type: 'text' },
  { key: 'reeferUnitMakeModel', label: 'Reefer Unit Make/Model', type: 'text' },
  { key: 'reeferTempRange', label: 'Reefer Temperature Range', type: 'text' },
  { key: 'reeferLastServiceDate', label: 'Last Reefer Service Date', type: 'date' },
  { key: 'reeferDataLogger', label: 'Temperature Data Logger', type: 'checkbox' }
];

export const DRIVER_FIELDS = [
  { key: 'name', label: 'Driver Name', type: 'text', required: true },
  { key: 'mobile', label: 'Mobile', type: 'tel', required: true },
  { key: 'dlNumber', label: 'DL Number', type: 'text', required: true },
  { key: 'dlType', label: 'DL Type', type: 'text' },
  { key: 'dlExpiry', label: 'DL Expiry', type: 'date', required: true },
  { key: 'idProofLast4', label: 'ID Proof (last 4 digits only)', type: 'text', help: 'Aadhaar or Voter ID — only the last 4 digits are ever stored' },
  { key: 'experienceYears', label: 'Experience (Years)', type: 'number' },
  { key: 'reeferExperience', label: 'Reefer Experience', type: 'checkbox' },
  { key: 'emergencyContact', label: 'Emergency Contact', type: 'tel' }
];

export const TRANSPORTER_SAFETY_FIELDS = [
  { key: 'goodsInTransitInsurance', label: 'Goods-in-Transit Insurance', type: 'radio', options: ['Yes', 'No'] },
  { key: 'goodsInsuranceDetails', label: 'Insurance Details', type: 'text', showIf: { field: 'goodsInTransitInsurance', equals: 'Yes' } },
  { key: 'accidentClaimHistory', label: 'Accident/Claim History', type: 'textarea' },
  { key: 'blacklistLegalCases', label: 'Blacklist / Legal Cases Declaration', type: 'textarea', help: 'Declare any, or write "None"' },
  { key: 'dispatcherContact', label: '24x7 Dispatcher Contact', type: 'tel' },
  { key: 'reference1Company', label: 'Reference 1 — Company', type: 'text' },
  { key: 'reference1Contact', label: 'Reference 1 — Contact & Phone', type: 'text' },
  { key: 'reference2Company', label: 'Reference 2 — Company', type: 'text' },
  { key: 'reference2Contact', label: 'Reference 2 — Contact & Phone', type: 'text' }
];

// ===================== SECTION B3 — VENDOR =====================
export const VENDOR_PROFILE_FIELDS = [
  { key: 'productsServicesOffered', label: 'Products/Services Offered', type: 'textarea', required: true },
  { key: 'hsnSacCodes', label: 'HSN/SAC Codes', type: 'text' },
  { key: 'coverageAreas', label: 'Coverage Areas', type: 'text', help: 'Cities / highways' },
  { key: 'breakdownSupport247', label: '24x7 Breakdown Support', type: 'radio', options: ['Yes', 'No'] },
  { key: 'responseTime', label: 'Response Time', type: 'text' },
  { key: 'workshopAddress', label: 'Workshop / Godown Address', type: 'textarea' }
];

export const VENDOR_COMMERCIAL_FIELDS = [
  { key: 'creditDays', label: 'Credit Days', type: 'number' },
  { key: 'advancePercent', label: 'Advance %', type: 'number' },
  { key: 'paymentMode', label: 'Payment Mode', type: 'text' },
  { key: 'gstRate', label: 'GST Rate', type: 'text' },
  { key: 'msmeStatus', label: 'MSME Status', type: 'text' }
];

export const VENDOR_LICENCE_FIELDS = [
  { key: 'dealerTradeLicence', label: 'Dealer / Trade Licence', type: 'text' },
  { key: 'pollutionLicence', label: 'Pollution Licence', type: 'text' },
  { key: 'fssaiColdStorage', label: 'FSSAI (Cold Storage)', type: 'text' },
  { key: 'insuranceDetails', label: 'Insurance Details', type: 'text' },
  { key: 'reference1', label: 'Reference 1 (Company, Contact, Phone)', type: 'text' },
  { key: 'reference2', label: 'Reference 2 (Company, Contact, Phone)', type: 'text' },
  { key: 'existingClients', label: 'Existing Clients', type: 'textarea' }
];

export const VENDOR_CONTACT_FIELDS = [
  { key: 'salesContact', label: 'Sales Contact', type: 'text' },
  { key: 'accountsContact', label: 'Accounts Contact', type: 'text' },
  { key: 'emergencyContact', label: 'Emergency Contact', type: 'tel' }
];

// ===================== SECTION C — DOCUMENT REQUIREMENTS =====================
export const DOCUMENT_REQUIREMENTS = {
  common: [
    { key: 'gst_certificate', label: 'GST Certificate' },
    { key: 'pan_card', label: 'PAN Card' },
    { key: 'registration_proof', label: 'Registration Proof', help: 'Incorporation / partnership deed / Udyam' },
    { key: 'signatory_id', label: "Authorised Signatory ID & Authorisation Letter" },
    { key: 'visiting_card', label: 'Visiting Card / Letterhead' },
    { key: 'rate_agreement', label: 'Signed Rate Agreement (if available)', optional: true }
  ],
  client: [
    { key: 'fssai_drug_licence', label: 'FSSAI / Drug Licence', optional: true },
    { key: 'po_or_rate_contract', label: 'PO Format or Rate Contract', optional: true }
  ],
  transporter: [
    { key: 'cancelled_cheque', label: 'Cancelled Cheque' },
    { key: 'tds_pan_declaration', label: 'TDS / PAN Declaration', optional: true },
    { key: 'gta_declaration', label: 'GTA Declaration', optional: true }
    // Per-vehicle RC/insurance/fitness/permit/PUC and per-driver DL/photos are
    // uploaded against each vehicle/driver row directly (see the Vehicles and
    // Drivers repeatable groups in Section B), not listed again here.
  ],
  vendor: [
    { key: 'cancelled_cheque', label: 'Cancelled Cheque' },
    { key: 'price_list', label: 'Price List / Quotation' },
    { key: 'trade_service_licences', label: 'Trade / Service Licences', optional: true }
  ]
};
