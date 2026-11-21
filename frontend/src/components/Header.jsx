import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Header() {
  const { language, changeLanguage, t } = useLanguage();
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link to="/" className="brand">
          {t('appName')}
          <span className="sub">{t('appTagline')}</span>
        </Link>
        <div className="header-actions">
          <div className="lang-toggle">
            <button className={language === 'en' ? 'active' : ''} onClick={() => changeLanguage('en')}>EN</button>
            <button className={language === 'hi' ? 'active' : ''} onClick={() => changeLanguage('hi')}>हिं</button>
          </div>
        </div>
      </div>
    </header>
  );
}
