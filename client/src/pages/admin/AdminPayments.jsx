import { useState, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { useLang } from '../../context/LanguageContext';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';

const AdminPayments = () => {
  const { t, fmtMoney, apiError } = useLang();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/payments');
      setPayments(res.data);
    } catch (err) {
      setError(apiError(err, 'err.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [apiError]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Loader />;

  // currency অনুযায়ী আলাদা যোগফল
  const sum = (status, pick) => ['BDT', 'USD']
    .map((cur) => [cur, payments.filter((p) => p.status === status && p.currency === cur).reduce((s, p) => s + pick(p), 0)])
    .filter(([, v]) => v > 0)
    .map(([cur, v]) => fmtMoney(v, cur))
    .join(' + ') || fmtMoney(0, 'BDT');

  return (
    <div className="cc-container cc-page">
      <div className="cc-page-head"><h1 className="cc-h1">{t('admin.pay.title')}</h1></div>
      <Alert tone="error">{error}</Alert>

      <div className="cc-grid-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)', margin: '12px 0 18px' }}>
        <div className="cc-card cc-stat"><small>{t('admin.pay.held')}</small><b className="sm" style={{ color: 'var(--c-amber)' }}>{sum('held', (p) => p.amount)}</b></div>
        <div className="cc-card cc-stat"><small>{t('admin.pay.released')}</small><b className="sm" style={{ color: 'var(--c-green)' }}>{sum('released', (p) => p.amount)}</b></div>
      </div>

      <div className="cc-table-wrap">
        <table className="cc-table">
          <thead>
            <tr>
              <th>{t('admin.col.item')}</th><th>{t('card.sender')}</th><th>{t('card.traveller')}</th>
              <th>{t('admin.col.amount')}</th><th>{t('admin.col.split')}</th><th>{t('admin.col.status')}</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td data-label={t('admin.col.item')}><b>{p.request?.itemName || '—'}</b></td>
                <td data-label={t('card.sender')}>{p.sender?.name || '—'}</td>
                <td data-label={t('card.traveller')}>{p.traveller?.name || '—'}</td>
                <td data-label={t('admin.col.amount')}>{fmtMoney(p.amount, p.currency)}</td>
                <td data-label={t('admin.col.split')} className="cc-small cc-muted">
                  {p.status === 'released' ? `${fmtMoney(p.travellerAmount, p.currency)} / ${fmtMoney(p.platformFee, p.currency)}` : '—'}
                </td>
                <td data-label={t('admin.col.status')}><span className={`cc-badge tone-${p.status === 'released' ? 'green' : 'amber'}`}>{t(`pay.${p.status}`)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <div className="cc-empty" style={{ marginTop: 12 }}><h3>{t('admin.pay.empty')}</h3></div>}
      </div>
    </div>
  );
};

export default AdminPayments;
