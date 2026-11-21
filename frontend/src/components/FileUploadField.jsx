import { useRef, useState } from 'react';

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

// A single document upload slot: validates type/size client-side (the
// server re-validates independently), shows upload progress state, and
// lists what's already been uploaded for this doc type with a remove option.
export default function FileUploadField({ label, help, optional, onUpload, onRemove, uploaded }) {
  const inputRef = useRef(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleFile(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError('');

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Only PDF, JPG or PNG files are allowed');
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError('File is larger than 5 MB');
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="field-group">
      <label className="field-label">{label}{!optional && <span className="required">*</span>}</label>
      {!uploaded && (
        <div className="file-upload-box" onClick={() => inputRef.current.click()}>
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFile} />
          <strong>{uploading ? 'Uploading...' : 'Tap to upload'}</strong>
          <p className="hint">PDF, JPG or PNG — max 5 MB</p>
        </div>
      )}
      {uploaded && (
        <div className="file-preview-list">
          <div className="file-preview-row">
            <span className="name">📄 {uploaded.originalName || uploaded.original_name}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove}>Remove</button>
          </div>
        </div>
      )}
      {help && <p className="field-help">{help}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
