export default function StateMessage({ type = 'loading', title, description, action }) {
  const icon = { loading: null, empty: '📭', error: '⚠️' }[type];
  return (
    <div className="state-message">
      {type === 'loading' ? <div className="spinner" /> : <div style={{ fontSize: 32 }}>{icon}</div>}
      {title && <h3>{title}</h3>}
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
