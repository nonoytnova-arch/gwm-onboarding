import { useLocation, Link } from 'react-router-dom';
import { useFormWizard } from '../context/FormContext';
import { useLanguage } from '../context/LanguageContext';

export default function Success() {
  const { t } = useLanguage();
  const location = useLocation();
  const { reset } = useFormWizard();
  const referenceNumber = location.state?.referenceNumber;

  if (!referenceNumber) {
    return (
      <div className="container success-wrap">
        <h2>No submission found</h2>
        <p className="text-muted">If you just submitted a form, please check your email/SMS for your reference number.</p>
        <Link to="/" className="btn btn-primary mt-16" onClick={reset}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="container success-wrap">
      <div className="check">✅</div>
      <h2>{t('success_title')}</h2>
      <p className="text-muted">{t('success_subtitle')}</p>
      <div className="reference-box">{referenceNumber}</div>
      <p className="text-muted text-sm">{t('confirmation_sent')}</p>
      <Link to="/" className="btn btn-outline mt-24" onClick={reset}>Back to Home</Link>
    </div>
  );
}
