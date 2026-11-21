import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useFormWizard } from '../context/FormContext';
import { useLanguage } from '../context/LanguageContext';
import { validateMobile } from '../utils/validators';

export default function ResumeDraft() {
  const { t } = useLanguage();
  const { resumeDraft } = useFormWizard();
  const navigate = useNavigate();
  const [step, setStep] = useState('mobile'); // mobile -> otp
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSendOtp() {
    setError('');
    const mobileError = validateMobile(mobile);
    if (mobileError) return setError(mobileError);
    setLoading(true);
    try {
      const result = await api.sendOtp(mobile);
      setStep('otp');
      if (result.devOtp) setDevOtp(result.devOtp); // see utils/notify.js — no SMS provider configured yet
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError('');
    setLoading(true);
    try {
      const result = await api.verifyOtp(mobile, code);
      if (!result.draft) {
        setError('No saved draft found for this mobile number.');
        return;
      }
      await resumeDraft(result.draft.id, result.draft.draftToken);
      navigate('/register/basic-details');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 48, maxWidth: 440 }}>
      <h2>{t('resume_title')}</h2>
      <p className="text-muted mb-16">{t('resume_subtitle')}</p>

      <div className="card card-pad">
        <div className="field-group">
          <label className="field-label">{t('mobile')}<span className="required">*</span></label>
          <input
            className="field-input" type="tel" maxLength={10} value={mobile} disabled={step === 'otp'}
            onChange={(e) => setMobile(e.target.value)}
          />
        </div>

        {step === 'otp' && (
          <div className="field-group">
            <label className="field-label">{t('otp_code')}<span className="required">*</span></label>
            <input className="field-input" type="text" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} />
            {devOtp && (
              <p className="field-help">
                No SMS provider is configured yet, so for testing only, your OTP is: <strong>{devOtp}</strong>
              </p>
            )}
          </div>
        )}

        {error && <p className="field-error mb-16">{error}</p>}

        {step === 'mobile' ? (
          <button className="btn btn-primary btn-block" onClick={handleSendOtp} disabled={loading}>
            {loading ? t('saving') : t('send_otp')}
          </button>
        ) : (
          <button className="btn btn-primary btn-block" onClick={handleVerify} disabled={loading}>
            {loading ? t('saving') : t('verify_otp')}
          </button>
        )}
      </div>
    </div>
  );
}
