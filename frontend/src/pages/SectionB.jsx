import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormWizard } from '../context/FormContext';
import { useLanguage } from '../context/LanguageContext';
import ProgressBar from '../components/ProgressBar';
import FieldList from '../components/FieldList';
import RepeatableGroup from '../components/RepeatableGroup';
import StepNav from '../components/StepNav';
import { STEPS } from './SectionA';
import {
  CLIENT_COMMERCIAL_FIELDS, CLIENT_SHIPMENT_FIELDS, CLIENT_LANE_FIELDS, CLIENT_LOCATION_FIELDS, CLIENT_SERVICE_FIELDS,
  TRANSPORTER_PROFILE_FIELDS, TRANSPORTER_LANE_FIELDS, TRANSPORTER_TAX_FIELDS, TRANSPORTER_BANK_FIELDS,
  TRANSPORTER_PAYMENT_TERMS_FIELDS, VEHICLE_FIELDS, DRIVER_FIELDS, TRANSPORTER_SAFETY_FIELDS,
  VENDOR_PROFILE_FIELDS, VENDOR_COMMERCIAL_FIELDS, VENDOR_LICENCE_FIELDS, VENDOR_CONTACT_FIELDS
} from '../data/formSchema';
import { getMissingRequiredFields } from '../utils/formValidation';

const REQUIRED_FIELDS_BY_ROLE = {
  client: [...CLIENT_COMMERCIAL_FIELDS, ...CLIENT_SHIPMENT_FIELDS],
  transporter: [...TRANSPORTER_PROFILE_FIELDS, ...TRANSPORTER_TAX_FIELDS, ...TRANSPORTER_PAYMENT_TERMS_FIELDS],
  vendor: [...VENDOR_PROFILE_FIELDS, ...VENDOR_COMMERCIAL_FIELDS]
};

function emptyFromFields(fields) {
  const item = {};
  fields.forEach((f) => { item[f.key] = f.type === 'checkbox' ? false : ''; });
  return item;
}

export default function SectionB() {
  const { t } = useLanguage();
  const { formData, setField, addRepeatableItem, removeRepeatableItem, saveNow, role } = useFormWizard();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) navigate('/register');
  }, [role, navigate]);

  if (!role) return null;

  const roleData = formData.roleSpecificData;
  function handleRoleFieldChange(key, value) {
    setField(`roleSpecificData.${key}`, value);
  }

  function getMissingFields() {
    const missing = getMissingRequiredFields(REQUIRED_FIELDS_BY_ROLE[role] || [], roleData);
    if (role === 'transporter') {
      missing.push(...getMissingRequiredFields(TRANSPORTER_BANK_FIELDS, formData));
      if (formData.vehicles.length === 0) missing.push('At least one vehicle');
      else {
        formData.vehicles.forEach((v, i) => {
          getMissingRequiredFields(VEHICLE_FIELDS, v).forEach((label) => missing.push(`Vehicle ${i + 1} — ${label}`));
        });
      }
    }
    if (role === 'vendor') {
      missing.push(...getMissingRequiredFields(TRANSPORTER_BANK_FIELDS, formData));
    }
    return missing;
  }

  async function handleNext() {
    const missing = getMissingFields();
    if (missing.length > 0) {
      alert(`Please complete these required fields before continuing:\n\n${missing.join('\n')}`);
      return;
    }
    await saveNow();
    navigate('/register/documents');
  }

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <ProgressBar steps={STEPS} currentIndex={1} />
      <h2>{t('step_role_specific')}</h2>

      {role === 'client' && (
        <>
          <div className="card card-pad mt-16">
            <h3>Commercial &amp; Billing</h3>
            <FieldList fields={CLIENT_COMMERCIAL_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
          <div className="card card-pad mt-16">
            <h3>Shipment Profile</h3>
            <FieldList fields={CLIENT_SHIPMENT_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
          <div className="card card-pad mt-16">
            <h3>Regular Lanes</h3>
            <RepeatableGroup
              title="Lane" fields={CLIENT_LANE_FIELDS} items={roleData.lanes || []}
              onAdd={(item) => addRepeatableItem('roleSpecificData.lanes', item)}
              onRemove={(i) => removeRepeatableItem('roleSpecificData.lanes', i)}
              onItemChange={(i, k, v) => setField(`roleSpecificData.lanes.${i}.${k}`, v)}
            />
          </div>
          <div className="card card-pad mt-16">
            <h3>Pickup / Delivery Locations</h3>
            <RepeatableGroup
              title="Location" fields={CLIENT_LOCATION_FIELDS} items={roleData.locations || []}
              onAdd={(item) => addRepeatableItem('roleSpecificData.locations', item)}
              onRemove={(i) => removeRepeatableItem('roleSpecificData.locations', i)}
              onItemChange={(i, k, v) => setField(`roleSpecificData.locations.${i}.${k}`, v)}
            />
          </div>
          <div className="card card-pad mt-16">
            <h3>Service</h3>
            <FieldList fields={CLIENT_SERVICE_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
        </>
      )}

      {role === 'transporter' && (
        <>
          <div className="card card-pad mt-16">
            <h3>Profile</h3>
            <FieldList fields={TRANSPORTER_PROFILE_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
          <div className="card card-pad mt-16">
            <h3>Preferred Lanes</h3>
            <RepeatableGroup
              title="Lane" fields={TRANSPORTER_LANE_FIELDS} items={roleData.lanes || []}
              onAdd={(item) => addRepeatableItem('roleSpecificData.lanes', item)}
              onRemove={(i) => removeRepeatableItem('roleSpecificData.lanes', i)}
              onItemChange={(i, k, v) => setField(`roleSpecificData.lanes.${i}.${k}`, v)}
            />
          </div>
          <div className="card card-pad mt-16">
            <h3>Tax</h3>
            <FieldList fields={TRANSPORTER_TAX_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
          <div className="card card-pad mt-16">
            <h3>Bank Details</h3>
            <FieldList
              fields={TRANSPORTER_BANK_FIELDS} data={formData}
              onChange={(key, value) => setField(key, value)}
            />
          </div>
          <div className="card card-pad mt-16">
            <h3>Payment Terms</h3>
            <FieldList fields={TRANSPORTER_PAYMENT_TERMS_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>

          <div className="card card-pad mt-16">
            <h3>Vehicles <span className="required">*</span></h3>
            <RepeatableGroup
              title="Vehicle" fields={VEHICLE_FIELDS} items={formData.vehicles} minItems={1}
              onAdd={(item) => addRepeatableItem('vehicles', item)}
              onRemove={(i) => removeRepeatableItem('vehicles', i)}
              onItemChange={(i, k, v) => setField(`vehicles.${i}.${k}`, v)}
            />
          </div>

          <div className="card card-pad mt-16">
            <h3>Drivers</h3>
            {formData.drivers.map((driver, index) => (
              <div className="repeatable-item" key={index}>
                <div className="repeatable-item-header">
                  <h4>Driver {index + 1}</h4>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeRepeatableItem('drivers', index)}>Remove</button>
                </div>
                {formData.vehicles.length > 0 && (
                  <div className="field-group">
                    <label className="field-label">Linked Vehicle</label>
                    <select
                      className="field-select"
                      value={driver.vehicleIndex ?? ''}
                      onChange={(e) => setField(`drivers.${index}.vehicleIndex`, e.target.value)}
                    >
                      <option value="">Not linked to a specific vehicle</option>
                      {formData.vehicles.map((v, vi) => (
                        <option key={vi} value={vi}>{v.registrationNumber || `Vehicle ${vi + 1}`}</option>
                      ))}
                    </select>
                  </div>
                )}
                <FieldList fields={DRIVER_FIELDS} data={driver} onChange={(k, v) => setField(`drivers.${index}.${k}`, v)} />
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => addRepeatableItem('drivers', emptyFromFields(DRIVER_FIELDS))}>
              + Add Driver
            </button>
          </div>

          <div className="card card-pad mt-16">
            <h3>Safety &amp; Compliance</h3>
            <FieldList fields={TRANSPORTER_SAFETY_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
        </>
      )}

      {role === 'vendor' && (
        <>
          <div className="card card-pad mt-16">
            <h3>Profile</h3>
            <FieldList fields={VENDOR_PROFILE_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
          <div className="card card-pad mt-16">
            <h3>Commercial</h3>
            <FieldList fields={VENDOR_COMMERCIAL_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
          <div className="card card-pad mt-16">
            <h3>Bank Details</h3>
            <FieldList fields={TRANSPORTER_BANK_FIELDS} data={formData} onChange={(key, value) => setField(key, value)} />
          </div>
          <div className="card card-pad mt-16">
            <h3>Licences &amp; References</h3>
            <FieldList fields={VENDOR_LICENCE_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
          <div className="card card-pad mt-16">
            <h3>Contacts</h3>
            <FieldList fields={VENDOR_CONTACT_FIELDS} data={roleData} onChange={handleRoleFieldChange} />
          </div>
        </>
      )}

      <StepNav onBack={() => navigate('/register/basic-details')} onNext={handleNext} />
    </div>
  );
}
