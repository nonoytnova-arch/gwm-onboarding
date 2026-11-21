import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormWizard } from '../context/FormContext';
import { useLanguage } from '../context/LanguageContext';
import { SUB_ROLE_OPTIONS } from '../data/formSchema';
import { validateMobile } from '../utils/validators';

const ROLES = [
  { value: 'client', icon: '📦' },
  { value: 'transporter', icon: '🚛' },
  { value: 'vendor', icon: '🔧' }
];

export default function RoleSelect() {
  const { t, language } = useLanguage();
  const { startDraft } = useFormWizard();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [subRole, setSubRole] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    setError('');
    if (!subRole) return setError('Please select a sub-category');
    const mobileError = validateMobile(mobile);
    if (mobileError) return setError(mobileError);

    setLoading(true);
    try {
      await startDraft(selectedRole, subRole, mobile, email, language);
      navigate('/register/basic-details');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!selectedRole) {
    return (
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <h2>{t('role_select_title')}</h2>
        <p className="text-muted mb-16">{t('role_select_subtitle')}</p>
        <div className="role-grid">
          {ROLES.map((r) => (
            <button key={r.value} className="role-card" onClick={() => setSelectedRole(r.value)}>
              <div className="icon">{r.icon}</div>
              <h3>{t(`role_${r.value}`)}</h3>
              <p>{t(`role_${r.value}_desc`)}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 48, maxWidth: 480 }}>
      <button className="btn btn-ghost btn-sm" onClick={() => setSelectedRole(null)}>← Back</button>
      <h2 className="mt-16">{t(`role_${selectedRole}`)}</h2>

      <div className="card card-pad mt-16">
        <div className="field-group">
          <label className="field-label">Sub-category<span className="required">*</span></label>
          <select className="field-select" value={subRole} onChange={(e) => setSubRole(e.target.value)}>
            <option value="">Select...</option>
            {SUB_ROLE_OPTIONS[selectedRole].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">{t('mobile')}<span className="required">*</span></label>
          <input className="field-input" type="tel" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="10-digit mobile number" />
          <p className="field-help">We'll use this to save your progress and let you resume later via OTP.</p>
        </div>
        <div className="field-group">
          <label className="field-label">{t('email')}</label>
          <input className="field-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <p className="field-error mb-16">{error}</p>}
        <button className="btn btn-primary btn-block" onClick={handleContinue} disabled={loading}>
          {loading ? t('saving') : t('next')}
        </button>
      </div>
    </div>
  );
}
