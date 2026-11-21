import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 48, textAlign: 'center' }}>
      <h1>{t('home_title')}</h1>
      <p style={{ maxWidth: 560, margin: '0 auto 28px', color: 'var(--color-text-muted)' }}>
        {t('home_subtitle')}
      </p>
      <div className="flex gap-12" style={{ justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/register" className="btn btn-primary">{t('home_cta')}</Link>
        <Link to="/resume" className="btn btn-outline">{t('home_resume')}</Link>
      </div>

      <div className="card card-pad mt-24" style={{ textAlign: 'left', maxWidth: 560, margin: '40px auto 0' }}>
        <h3>About Gale World Wide Movers</h3>
        <p className="text-muted text-sm">
          A 31-truck road-freight (FTL) fleet specialising in temperature-controlled (reefer) and dry cargo —
          fruits, meat, chicken, frozen food, pharma, FMCG and dry goods — moving across India.
        </p>
      </div>
    </div>
  );
}
