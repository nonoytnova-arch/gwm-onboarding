import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import StateMessage from '../../components/StateMessage';

const STATUS_OPTIONS = ['submitted', 'under_review', 'need_more_info', 'approved', 'rejected'];

function Row({ label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return <div className="review-row"><span className="label">{label}</span><span className="value">{String(value)}</span></div>;
}

export default function AdminSubmissionDetail() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [comment, setComment] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  function load() {
    setLoading(true);
    api.getSubmission(id)
      .then((data) => {
        setSubmission(data);
        setStatus(data.status);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function handleStatusUpdate() {
    setUpdating(true);
    setUpdateError('');
    try {
      await api.updateSubmissionStatus(id, status, comment);
      setComment('');
      load();
    } catch (err) {
      setUpdateError(err.message);
    } finally {
      setUpdating(false);
    }
  }

  async function handleViewDocument(docId) {
    try {
      await api.openDocumentFile(docId);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <StateMessage type="loading" title="Loading submission..." />;
  if (error || !submission) return <StateMessage type="error" title="Couldn't load submission" description={error} />;

  let roleSpecificData = {};
  try { roleSpecificData = submission.role_specific_data ? JSON.parse(submission.role_specific_data) : {}; } catch { /* ignore */ }
  let contacts = {};
  try { contacts = submission.contacts_json ? JSON.parse(submission.contacts_json) : {}; } catch { /* ignore */ }

  return (
    <div>
      <Link to="/admin" className="text-sm text-muted">← Back to Submissions</Link>

      <div className="flex justify-between items-center mt-16 mb-16" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>{submission.legal_name || submission.trade_name} {submission.party_code && `(${submission.party_code})`}</h2>
        <span className={`badge badge-${submission.status}`}>{submission.status.replace(/_/g, ' ')}</span>
      </div>

      <div className="card card-pad review-section">
        <h3>Identity</h3>
        <Row label="Role" value={`${submission.role} / ${submission.sub_role}`} />
        <Row label="Constitution" value={submission.constitution} />
        <Row label="GSTIN" value={submission.gstin} />
        <Row label="PAN" value={submission.pan} />
        <Row label="Reference Number" value={submission.reference_number} />
        <Row label="Address" value={[submission.reg_address_line1, submission.reg_city, submission.reg_state, submission.reg_pincode].filter(Boolean).join(', ')} />
        <Row label="Mobile" value={submission.mobile} />
        <Row label="Email" value={submission.email} />
        <Row label="Owner Contact" value={contacts.owner ? `${contacts.owner.name} — ${contacts.owner.mobile}` : ''} />
        <Row label="Bank Account on File" value={submission.hasBankAccountOnFile ? 'Yes (encrypted)' : 'No'} />
      </div>

      {submission.role === 'client' && (
        <div className="card card-pad review-section">
          <h3>Shipment Profile</h3>
          <Row label="Commodities" value={roleSpecificData.commodities} />
          <Row label="Material Group" value={roleSpecificData.materialGroup} />
          <Row label="Temperature Requirement" value={roleSpecificData.temperatureRequirement} />
          <Row label="Credit Days" value={roleSpecificData.creditDays} />
        </div>
      )}

      {submission.vehicles?.length > 0 && (
        <div className="card card-pad review-section">
          <h3>Vehicles ({submission.vehicles.length})</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Reg No.</th><th>Type</th><th>Capacity (MT)</th><th>Insurance Exp.</th><th>Fitness Exp.</th><th>Permit Exp.</th></tr></thead>
              <tbody>
                {submission.vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.registration_number}</td><td>{v.vehicle_type}</td><td>{v.capacity_mt}</td>
                    <td>{v.insurance_expiry ? new Date(v.insurance_expiry).toLocaleDateString() : '—'}</td>
                    <td>{v.fitness_expiry ? new Date(v.fitness_expiry).toLocaleDateString() : '—'}</td>
                    <td>{v.permit_expiry ? new Date(v.permit_expiry).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {submission.drivers?.length > 0 && (
        <div className="card card-pad review-section">
          <h3>Drivers ({submission.drivers.length})</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Name</th><th>Mobile</th><th>DL Number</th><th>DL Expiry</th></tr></thead>
              <tbody>
                {submission.drivers.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td><td>{d.mobile}</td><td>{d.dl_number}</td>
                    <td>{d.dl_expiry ? new Date(d.dl_expiry).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card card-pad review-section">
        <h3>Documents ({submission.documents?.length || 0})</h3>
        {(submission.documents || []).map((doc) => (
          <div className="review-row" key={doc.id}>
            <span className="label">{doc.doc_type} — {doc.original_name}</span>
            <button className="btn btn-outline btn-sm" onClick={() => handleViewDocument(doc.id)}>View</button>
          </div>
        ))}
      </div>

      <div className="card card-pad review-section">
        <h3>Update Status</h3>
        <div className="field-group">
          <label className="field-label">Status</label>
          <select className="field-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label className="field-label">Comment (sent to the submitter for "need more info" / "rejected")</label>
          <textarea className="field-textarea" value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        {updateError && <p className="field-error mb-16">{updateError}</p>}
        <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={updating}>
          {updating ? 'Updating...' : 'Update Status'}
        </button>
      </div>

      <div className="card card-pad review-section">
        <h3>Audit Log</h3>
        {(submission.auditLog || []).length === 0 ? (
          <p className="text-muted text-sm">No changes recorded yet.</p>
        ) : (
          submission.auditLog.map((entry) => (
            <div className="review-row" key={entry.id}>
              <span className="label">
                {new Date(entry.created_at).toLocaleString()} — {entry.admin_name || 'System'}: {entry.from_status} → {entry.to_status}
                {entry.comment && ` ("${entry.comment}")`}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
