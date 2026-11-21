import { GST_STATES } from '../data/gstStates';

// Renders one field from a formSchema.js definition. This is the one place
// that knows how to turn { key, label, type, options, ... } into an actual
// input — every section of the wizard reuses this instead of each having
// its own hand-written set of <input> tags.
export default function DynamicField({ field, value, onChange, error }) {
  const { label, type, required, help, options, placeholder } = field;

  function handleChange(e) {
    const raw = e.target;
    if (type === 'checkbox') return onChange(raw.checked);
    onChange(raw.value);
  }

  const inputClass = `field-input ${error ? 'has-error' : ''}`;

  let control;
  switch (type) {
    case 'textarea':
      control = <textarea className={`field-textarea ${error ? 'has-error' : ''}`} value={value || ''} onChange={handleChange} placeholder={placeholder} />;
      break;
    case 'select':
      control = (
        <select className={`field-select ${error ? 'has-error' : ''}`} value={value || ''} onChange={handleChange}>
          <option value="">Select...</option>
          {options?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
      break;
    case 'gstState':
      control = (
        <select className={`field-select ${error ? 'has-error' : ''}`} value={value || ''} onChange={handleChange}>
          <option value="">Select state...</option>
          {GST_STATES.map((s) => <option key={s.code} value={s.name}>{s.name}</option>)}
        </select>
      );
      break;
    case 'radio':
      control = (
        <div className="radio-pill-group">
          {options?.map((opt) => (
            <label key={opt} className="radio-pill">
              <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );
      break;
    case 'checkbox':
      control = (
        <div className="checkbox-row">
          <input type="checkbox" id={field.key} checked={!!value} onChange={handleChange} />
          <label htmlFor={field.key}>{label}</label>
        </div>
      );
      break;
    case 'tel':
      control = <input type="tel" className={inputClass} value={value || ''} onChange={handleChange} placeholder={placeholder || '10-digit mobile number'} maxLength={10} />;
      break;
    case 'email':
      control = <input type="email" className={inputClass} value={value || ''} onChange={handleChange} placeholder={placeholder} />;
      break;
    case 'number':
      control = <input type="number" className={inputClass} value={value ?? ''} onChange={handleChange} placeholder={placeholder} />;
      break;
    case 'date':
      control = <input type="date" className={inputClass} value={value || ''} onChange={handleChange} />;
      break;
    default:
      control = <input type="text" className={inputClass} value={value || ''} onChange={handleChange} placeholder={placeholder} />;
  }

  // Checkbox renders its own label inline, so skip the outer label row for it.
  if (type === 'checkbox') {
    return (
      <div className="field-group">
        {control}
        {help && <p className="field-help">{help}</p>}
        {error && <p className="field-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="field-group">
      <label className="field-label">
        {label}{required && <span className="required">*</span>}
      </label>
      {control}
      {help && <p className="field-help">{help}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
