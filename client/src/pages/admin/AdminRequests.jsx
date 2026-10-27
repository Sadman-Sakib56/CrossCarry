import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useLang } from '../../context/LanguageContext';
import { STATUS_FLOW } from '../../utils/stage';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';

const STATUSES = [...STATUS_FLOW, 'Cancelled'];

const AdminRequests = () => {
  const { t, fmtNum, fmtMoney, apiError } = useLang();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/requests');
      setRequests(res.data);
    } catch (err) {
      setError(apiError(err, 'err.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [apiError]);

  useEffect(() => { load(); }, [load]);

  const filtered = statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter);

  if (loading) return <Loader />;

  return (
    <div className="cc-container cc-page">
      <div className="cc-page-head">
        <h1 className="cc-h1">{t('admin.req.title')} <span className="cc-count">{fmtNum(filtered.length)}</span></h1>
        <select className="cc-select" style={{ width: 'auto', minHeight: 44 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label={t('admin.req.filter')}>
          <option value="all">{t('admin.req.allStatuses')}</option>
          {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
      </div>

      <Alert tone="error">{error}</Alert>

      <div className="cc-table-wrap" style={{ marginTop: 12 }}>
        <table className="cc-table">
          <thead>
            <tr>
              <th>{t('admin.col.item')}</th><th>{t('card.sender')}</th><th>{t('card.traveller')}</th>
              <th>{t('admin.col.route')}</th><th>{t('detail.fee')}</th><th>{t('admin.col.status')}</th><th />
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r._id}>
                <td data-label={t('admin.col.item')}><b>{r.itemName}</b></td>
                <td data-label={t('card.sender')}>{r.sender?.name || '—'}</td>
                <td data-label={t('card.traveller')}>{r.traveller?.name || '—'}</td>
                <td data-label={t('admin.col.route')} className="cc-small cc-muted">{r.pickupCity} → {r.destinationCity}</td>
                <td data-label={t('detail.fee')}>{fmtMoney(r.offeredFee, r.currency)}</td>
                <td data-label={t('admin.col.status')}><StatusBadge status={r.status} /></td>
                <td data-label=""><Link to={`/requests/${r._id}`} className="cc-link-btn">{t('common.view')}</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="cc-empty" style={{ marginTop: 12 }}><h3>{t('admin.req.empty')}</h3></div>}
      </div>
    </div>
  );
};

export default AdminRequests;
