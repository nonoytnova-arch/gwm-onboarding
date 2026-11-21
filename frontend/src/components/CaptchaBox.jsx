import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function CaptchaBox({ onAnswerChange, onCaptchaIdChange }) {
  const [question, setQuestion] = useState('');
  const [captchaId, setCaptchaId] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');

  async function loadCaptcha() {
    try {
      const result = await api.getCaptcha();
      setQuestion(result.question);
      setCaptchaId(result.captchaId);
      setAnswer('');
      onAnswerChange('');
      onCaptchaIdChange(result.captchaId);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadCaptcha();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleAnswerChange(e) {
    setAnswer(e.target.value);
    onAnswerChange(e.target.value);
  }

  return (
    <div className="field-group">
      <label className="field-label">Security Check<span className="required">*</span></label>
      <div className="captcha-box">
        <span>{question || 'Loading...'}</span>
        <input type="text" className="field-input" value={answer} onChange={handleAnswerChange} placeholder="Your answer" />
        <button type="button" className="captcha-refresh" onClick={loadCaptcha}>Refresh</button>
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
