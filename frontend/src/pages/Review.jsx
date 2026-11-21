import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormWizard } from '../context/FormContext';
import { useLanguage } from '../context/LanguageContext';
import ProgressBar from '../components/ProgressBar';
import CaptchaBox from '../components/CaptchaBox';
import { STEPS } from './SectionA';

function Row({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="review-row">
      <span className="label">{label}</span>
      <span className="value">{String(value)}</span>
    </div>
  );
}

export default function Review() {
  const { t } = useLanguage();
  const { formData, role, submitFinal } = useFormWizard();
  const navigate = useNavigate();
  const [captchaId, setCaptchaId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!role) navigate('/register');
  }, [role, navigate]);

  if (!role) return null;

  async function handleSubmit() {
    setError('');
    if (!captchaAnswer) return setError('Please answer the security check');
    setSubmitting(true);
    try {
      const result = await submitFinal(captchaId, captchaAnswer);
      navigate('/success', { state: { referenceNumber: result.referenceNumber } });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <ProgressBar steps={STEPS} currentIndex={4} />
      <h2>{t('review_title')}</h2>
      <p className="text-muted mb-16">{t('review_subtitle')}</p>

      <div className="card card-pad review-section">
        <h3>
          Basic Details
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/register/basic-details')}>{t('edit')}</button>
        </h3>
        <Row label={t('legal_name')} value={formData.legalName} />
        <Row label={t('trade_name')} value={formData.tradeName} />
        <Row label={t('constitution')} value={formData.constitution} />
        <Row label={t('gstin')} value={formData.gstin || (formData.noGstin ? 'Not registered' : '')} />
        <Row label={t('pan')} value={formData.pan} />
        <Row label="Address" value={[formData.regAddressLine1, formData.regCity, formData.regState, formData.regPincode].filter(Boolean).join(', ')} />
        <Row label="Owner Contact" value={`${formData.contacts.owner.name} — ${formData.contacts.owner.mobile}`} />
      </div>

      <div className="card card-pad review-section">
        <h3>
          Role Details ({role})
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/register/role-details')}>{t('edit')}</button>
        </h3>
        {role === 'transporter' && (
          <>
            <Row label="Vehicles" value={`${formData.vehicles.length} vehicle(s) listed`} />
            <Row label="Drivers" value={`${formData.drivers.length} driver(s) listed`} />
            <Row label="Bank Account Holder" value={formData.bankAccountHolder} />
            <Row label="IFSC" value={formData.bankIfsc} />
          </>
        )}
        {role === 'client' && (
          <>
            <Row label="Commodities" value={formData.roleSpecificData.commodities} />
            <Row label="Temperature Requirement" value={formData.roleSpecificData.temperatureRequirement} />
            <Row label="Regular Lanes" value={`${(formData.roleSpecificData.lanes || []).length} lane(s)`} />
          </>
        )}
        {role === 'vendor' && (
          <>
            <Row label="Products/Services Offered" value={formData.roleSpecificData.productsServicesOffered} />
            <Row label="Bank Account Holder" value={formData.bankAccountHolder} />
          </>
        )}
      </div>

      <div className="card card-pad review-section">
        <h3>
          Documents
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/register/documents')}>{t('edit')}</button>
        </h3>
        <Row label="Uploaded" value={`${formData.documents.length} document(s)`} />
      </div>

      <div className="card card-pad review-section">
        <h3>
          Declaration
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/register/declaration')}>{t('edit')}</button>
        </h3>
        <Row label={t('signatory_name')} value={formData.signatoryName} />
        <Row label={t('signatory_designation')} value={formData.signatoryDesignation} />
        <Row label="Declaration Accepted" value={formData.declarationAccepted ? 'Yes' : 'No'} />
        <Row label="DPDP Consent" value={formData.dpdpConsentAccepted ? 'Yes' : 'No'} />
      </div>

      <div className="card card-pad mt-16">
        <CaptchaBox onAnswerChange={setCaptchaAnswer} onCaptchaIdChange={setCaptchaId} />
        {error && <p className="field-error mb-16">{error}</p>}
        <button className="btn btn-primary btn-block" onClick={handleSubmit} disabled={submitting}>
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </div>
  );
}
