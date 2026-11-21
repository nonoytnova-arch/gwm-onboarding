import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormWizard } from '../context/FormContext';
import { useLanguage } from '../context/LanguageContext';
import ProgressBar from '../components/ProgressBar';
import StepNav from '../components/StepNav';
import { STEPS } from './SectionA';

export default function SectionD() {
  const { t } = useLanguage();
  const { formData, setField, saveNow, role } = useFormWizard();
  const navigate = useNavigate();

  useEffect(() => {
    if (!role) navigate('/register');
  }, [role, navigate]);

  if (!role) return null;

  const canProceed = formData.signatoryName && formData.signatoryDesignation &&
    formData.declarationAccepted && formData.dpdpConsentAccepted;

  async function handleNext() {
    if (!formData.declarationDate) {
      setField('declarationDate', new Date().toISOString().slice(0, 10));
    }
    await saveNow();
    navigate('/register/review');
  }

  return (
    <div className="container" style={{ paddingBottom: 48 }}>
      <ProgressBar steps={STEPS} currentIndex={3} />
      <h2>{t('declaration_title')}</h2>

      <div className="card card-pad mt-16">
        <div className="field-group">
          <label className="field-label">{t('signatory_name')}<span className="required">*</span></label>
          <input className="field-input" value={formData.signatoryName} onChange={(e) => setField('signatoryName', e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">{t('signatory_designation')}<span className="required">*</span></label>
          <input className="field-input" value={formData.signatoryDesignation} onChange={(e) => setField('signatoryDesignation', e.target.value)} />
        </div>
        <div className="field-group">
          <label className="field-label">{t('declaration_date')}</label>
          <input
            className="field-input" type="date"
            value={formData.declarationDate || new Date().toISOString().slice(0, 10)}
            onChange={(e) => setField('declarationDate', e.target.value)}
          />
        </div>

        <div className="checkbox-row mb-16">
          <input
            type="checkbox" id="declarationAccepted" checked={formData.declarationAccepted}
            onChange={(e) => setField('declarationAccepted', e.target.checked)}
          />
          <label htmlFor="declarationAccepted">{t('declaration_text')}</label>
        </div>

        <div className="checkbox-row">
          <input
            type="checkbox" id="dpdpConsentAccepted" checked={formData.dpdpConsentAccepted}
            onChange={(e) => setField('dpdpConsentAccepted', e.target.checked)}
          />
          <label htmlFor="dpdpConsentAccepted">{t('dpdp_text')}</label>
        </div>
      </div>

      <StepNav onBack={() => navigate('/register/documents')} onNext={handleNext} nextDisabled={!canProceed} nextLabel={t('step_review')} />
    </div>
  );
}
