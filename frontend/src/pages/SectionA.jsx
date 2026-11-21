import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormWizard } from '../context/FormContext';
import { useLanguage } from '../context/LanguageContext';
import ProgressBar from '../components/ProgressBar';
import FieldList from '../components/FieldList';
import RepeatableGroup from '../components/RepeatableGroup';
import StepNav from '../components/StepNav';
import {
  COMMON_IDENTITY_FIELDS, COMMON_ADDRESS_FIELDS, BILLING_ADDRESS_FIELDS,
  CONTACT_SUBFIELDS, COMMON_MISC_FIELDS, BRANCH_FIELDS
} from '../data/formSchema';
import { validateGstin, validatePan, validateMobile, validatePincode, extractPanFromGstin } from '../utils/validators';
import { getMissingRequiredFields } from '../utils/formValidation';

const STEPS = ['Basic Details', 'Role Details', 'Documents', 'Declaration', 'Review'];

export default function SectionA() {
  const { t } = useLanguage();
  const { formData, setField, addRepeatableItem, removeRepeatableItem, saveNow, role } = useFormWizard();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) navigate('/register');
  }, [role, navigate]);

  if (!role) return null;

  function handleFieldChange(key, value) {
    setField(key, value);
    // Convenience auto-fill: a well-formed GSTIN embeds the PAN in characters 3-12.
    if (key === 'gstin' && value.length === 15) {
      const extractedPan = extractPanFromGstin(value);
      if (extractedPan) setField('pan', extractedPan);
    }
  }

  function handleContactChange(group, key, value) {
    setField(`contacts.${group}.${key}`, value);
  }

  const errors = {
    gstin: !formData.noGstin ? validateGstin(formData.gstin) : null,
    pan: validatePan(formData.pan),
    regPincode: validatePincode(formData.regPincode)
  };

  function getMissingFields() {
    // GSTIN is only mandatory when "no GSTIN" hasn't been checked — the spec
    // allows skipping it as long as a reason is given instead.
    let missing = [
      ...getMissingRequiredFields(COMMON_IDENTITY_FIELDS, formData),
      ...getMissingRequiredFields(COMMON_ADDRESS_FIELDS, formData),
      ...getMissingRequiredFields(CONTACT_SUBFIELDS, formData.contacts.owner).map((label) => `Owner Contact — ${label}`)
    ];
    if (formData.noGstin) missing = missing.filter((label) => label !== 'GSTIN');
    if (Object.values(errors).some(Boolean)) missing.push('Please fix the highlighted errors above');
    return missing;
  }

  async function handleNext() {
    const missing = getMissingFields();
    if (missing.length > 0) {
      alert(`Please complete these required fields before continuing:\n\n${missing.join('\n')}`);
      return;
    }
    await saveNow();
    navigate('/register/role-details');
  }

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <ProgressBar steps={STEPS} currentIndex={0} />
      <h2>{t('step_common')}</h2>

      <div className="card card-pad mt-16">
        <h3>Identity</h3>
        <FieldList fields={COMMON_IDENTITY_FIELDS} data={formData} onChange={handleFieldChange} errors={errors} />
      </div>

      <div className="card card-pad mt-16">
        <h3>{t('reg_address')}</h3>
        <FieldList fields={COMMON_ADDRESS_FIELDS} data={formData} onChange={handleFieldChange} errors={errors} />
      </div>

      <div className="card card-pad mt-16">
        <h3>{t('billing_address')}</h3>
        <FieldList
          fields={BILLING_ADDRESS_FIELDS}
          data={formData.billingAddress}
          onChange={(key, value) => setField(`billingAddress.${key}`, value)}
        />
      </div>

      <div className="card card-pad mt-16">
        <h3>{t('contacts')}</h3>
        <h4 className="text-sm text-muted">{t('owner_contact')}</h4>
        <FieldList fields={CONTACT_SUBFIELDS} data={formData.contacts.owner} onChange={(k, v) => handleContactChange('owner', k, v)} />
        <h4 className="text-sm text-muted mt-16">{t('operations_contact')}</h4>
        <FieldList fields={CONTACT_SUBFIELDS} data={formData.contacts.operations} onChange={(k, v) => handleContactChange('operations', k, v)} />
        <h4 className="text-sm text-muted mt-16">{t('accounts_contact')}</h4>
        <FieldList fields={CONTACT_SUBFIELDS} data={formData.contacts.accounts} onChange={(k, v) => handleContactChange('accounts', k, v)} />
        <div className="field-group mt-16">
          <label className="field-label">{t('emergency_number')}</label>
          <input
            className="field-input" type="tel" maxLength={10}
            value={formData.contacts.emergencyNumber}
            onChange={(e) => setField('contacts.emergencyNumber', e.target.value)}
          />
        </div>
      </div>

      <div className="card card-pad mt-16">
        <h3>Other Details</h3>
        <FieldList fields={COMMON_MISC_FIELDS} data={formData} onChange={handleFieldChange} />
      </div>

      <div className="card card-pad mt-16">
        <h3>{t('branches')}</h3>
        <RepeatableGroup
          title="Office"
          fields={BRANCH_FIELDS}
          items={formData.branches}
          onAdd={(item) => addRepeatableItem('branches', item)}
          onRemove={(index) => removeRepeatableItem('branches', index)}
          onItemChange={(index, key, value) => setField(`branches.${index}.${key}`, value)}
        />
      </div>

      <StepNav onNext={handleNext} />
    </div>
  );
}

export { STEPS };
