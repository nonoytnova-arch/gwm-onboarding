import { useLanguage } from '../context/LanguageContext';
import { useFormWizard } from '../context/FormContext';

export default function StepNav({ onBack, onNext, nextLabel, nextDisabled, nextLoading }) {
  const { t } = useLanguage();
  const { saving, saveError } = useFormWizard();

  return (
    <div className="mt-24">
      {saveError && <p className="field-error mb-16">Autosave failed: {saveError}</p>}
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          {onBack && <button type="button" className="btn btn-outline" onClick={onBack}>{t('back')}</button>}
        </div>
        <div className="flex items-center gap-12">
          <span className="text-sm text-muted">{saving ? t('saving') : ''}</span>
          <button type="button" className="btn btn-primary" onClick={onNext} disabled={nextDisabled || nextLoading}>
            {nextLoading ? t('saving') : (nextLabel || t('next'))}
          </button>
        </div>
      </div>
    </div>
  );
}
