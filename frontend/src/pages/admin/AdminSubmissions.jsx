import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import StateMessage from '../../components/StateMessage';

const STATUS_OPTIONS = ['submitted', 'under_review', 'need_more_info', 'approved', 'rejected'];
const ROLE_OPTIONS = ['client', 'transporter', 'vendor'];

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ role: '', status: '', state: '', search: '' });
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  function load() {
    setLoading(true);
    api.getSubmissions(filters)
      .then(setSubmissions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [filters.role, filters.status, filters.state]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    load();
  }

  async function handleExport() {
    setExporting(true);
    setExportError('');
    try {
      await api.downloadApprovedExport();
    } catch (err) {
      setExportError(err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <div className="admin-toolbar">
        <h2 style={{ margin: 0 }}>Submissions</h2>
        <button className="btn btn-accent btn-sm" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting...' : '⬇ Export Approved (CSV)'}
        </button>
      </div>
      {exportError && <p className="field-error mb-16">{exportError}</p>}

      <form onSubmit={handleSearchSubmit} className="filter-bar">
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input
          type="text" placeholder="Search name, GSTIN, PAN, mobile, reference..."
          value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          style={{ minWidth: 240 }}
        />
        <button type="submit" className="btn btn-outline btn-sm">Search</button>
      </form>

      {loading ? (
        <StateMessage type="loading" title="Loading submissions..." />
      ) : error ? (
        <StateMessage type="error" title="Couldn't load submissions" description={error} />
      ) : submissions.length === 0 ? (
        <StateMessage type="empty" title="No submissions found" />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th><th>Role</th><th>Legal Name</th><th>GSTIN</th><th>City/State</th>
                <th>Mobile</th><th>Status</th><th>Submitted</th><th></th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id}>
                  <td>{s.party_code || '—'}</td>
                  <td>{s.role}</td>
                  <td>{s.legal_name || s.trade_name || '—'}</td>
                  <td>{s.gstin || '—'}</td>
                  <td>{[s.reg_city, s.reg_state].filter(Boolean).join(', ') || '—'}</td>
                  <td>{s.mobile}</td>
                  <td><span className={`badge badge-${s.status}`}>{s.status.replace(/_/g, ' ')}</span></td>
                  <td>{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}</td>
                  <td><Link to={`/admin/submissions/${s.id}`} className="btn btn-outline btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
