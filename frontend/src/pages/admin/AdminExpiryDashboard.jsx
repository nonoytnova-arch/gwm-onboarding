import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import StateMessage from '../../components/StateMessage';

export default function AdminExpiryDashboard() {
  const [items, setItems] = useState([]);
  const [withinDays, setWithinDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.getExpiryDashboard(withinDays)
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [withinDays]);

  return (
    <div>
      <div className="admin-toolbar">
        <h2 style={{ margin: 0 }}>Document Expiry Dashboard</h2>
        <select className="status-select" value={withinDays} onChange={(e) => setWithinDays(Number(e.target.value))}>
          <option value={7}>Next 7 days</option>
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
        </select>
      </div>

      {loading ? (
        <StateMessage type="loading" title="Loading..." />
      ) : error ? (
        <StateMessage type="error" title="Couldn't load" description={error} />
      ) : items.length === 0 ? (
        <StateMessage type="empty" title="Nothing expiring" description={`No documents expiring within ${withinDays} days.`} />
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>Party</th><th>Type</th><th>Item</th><th>Expires</th><th>Days Left</th><th>Contact</th></tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>{item.partyName} {item.partyCode && `(${item.partyCode})`}</td>
                  <td>{item.docLabel}</td>
                  <td>{item.registrationNumber || item.driverName || '—'}</td>
                  <td>{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${item.status}`}>{item.daysLeft < 0 ? `${Math.abs(item.daysLeft)}d overdue` : `${item.daysLeft}d left`}</span></td>
                  <td>{item.mobile}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
