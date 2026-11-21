export default function ProgressBar({ steps, currentIndex }) {
  const pct = ((currentIndex + 1) / steps.length) * 100;
  return (
    <div className="progress-wrap">
      <div className="progress-steps">
        {steps.map((step, i) => (
          <span key={step} className={i === currentIndex ? 'active-step' : ''}>{step}</span>
        ))}
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
