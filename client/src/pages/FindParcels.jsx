import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import usePolling from '../hooks/usePolling';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { IconRefresh, IconSearch } from '../components/Icons';

const FindParcels = () => {
  const { user } = useAuth();
  const { t, fmtNum, fmtMoney, fmtDate, apiError } = useLang();

  const [requests, setRequests] = useState([]);
  const [country, setCountry] = useState('all');
  const [sort, setSort] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [acceptingId, setAcceptingId] = useState(null);
  const [videoConfirm, setVideoConfirm] = useState({});

  const load = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await api.get('/requests/open');
      setRequests(res.data);
    } catch (err) {
      setError(apiError(err, 'err.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiError]);

  useEffect(() => { load(); }, [load]);
  // অন্য traveller কোনো parcel নিয়ে নিলে সেটা নিজে থেকেই তালিকা থেকে সরে যায়
  usePolling(load, 15000);

  // আগের version এর bug: filter দিলে dropdown এর বাকি দেশগুলো উধাও হয়ে যেত।
  // এখন সব request আনা হয় আর filter হয় এখানেই, তাই দেশের তালিকা সবসময় পূর্ণ থাকে
  const countries = useMemo(() => [...new Set(requests.map((r) => r.destinationCountry))].sort(), [requests]);

  const visible = useMemo(() => {
    const list = country === 'all' ? [...requests] : requests.filter((r) => r.destinationCountry === country);
    if (sort === 'fee') list.sort((a, b) => b.offeredFee - a.offeredFee);
    else if (sort === 'date') list.sort((a, b) => new Date(a.requiredDate) - new Date(b.requiredDate));
    return list;
  }, [requests, country, sort]);

  const status = user?.verificationStatus;
  const approved = status === 'approved';

  const handleAccept = async (requestId) => {
    if (!videoConfirm[requestId]) { setError(t('err.VIDEO_REQUIRED')); return; }
    setError('');
    setNotice('');
    setAcceptingId(requestId);
    try {
      await api.put(`/requests/${requestId}/accept`, { travellerVideoConfirmed: true });
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      setNotice(t('find.accepted'));
    } catch (err) {
      setError(apiError(err, 'err.acceptFailed'));
      // অন্য কেউ আগে নিয়ে গেলে বা মেয়াদ শেষ হলে card টা সাথে সাথে সরিয়ে ফেলা হয়
      if (['ALREADY_TAKEN', 'EXPIRED', 'NOT_FOUND'].includes(err.response?.data?.code)) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
      }
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="cc-container cc-page">
      <div className="cc-page-head">
        <div>
          <h1 className="cc-h1">{t('find.title')}</h1>
          <p className="cc-sub">{t('find.sub')}</p>
        </div>
        <button type="button" className="cc-btn cc-btn-secondary sm" onClick={() => load(true)} disabled={refreshing}>
          <IconRefresh size={16} /> {refreshing ? t('common.loading') : t('common.refresh')}
        </button>
      </div>

      {!approved && (
        <div style={{ marginBottom: 16 }}>
          <Alert tone="warn">
            {status === 'pending' ? t('find.pending') : status === 'rejected' ? t('find.rejected') : t('find.needVerify')}{' '}
            <Link to="/profile">{status === 'pending' ? t('find.viewProfile') : t('find.uploadPassport')}</Link>
          </Alert>
        </div>
      )}

      <div className="cc-stack">
        <Alert tone="error">{error}</Alert>
        {notice && (
          <Alert tone="success">
            {notice} <Link to="/dashboard" onClick={() => localStorage.setItem('cc_dash_tab', 'carrying')}>{t('find.goDashboard')}</Link>
          </Alert>
        )}
      </div>

      {requests.length > 0 && (
        <div className="cc-row wrap cc-between" style={{ margin: '16px 0' }}>
          <div className="cc-chips" style={{ flex: '1 1 260px' }}>
            <button type="button" className={`cc-chip${country === 'all' ? ' active' : ''}`} onClick={() => setCountry('all')}>{t('find.all')} ({fmtNum(requests.length)})</button>
            {countries.map((c) => (
              <button key={c} type="button" className={`cc-chip${country === c ? ' active' : ''}`} onClick={() => setCountry(c)}>{c}</button>
            ))}
          </div>
          <select className="cc-select" style={{ width: 'auto', minHeight: 44 }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label={t('find.sort')}>
            <option value="newest">{t('find.sort.newest')}</option>
            <option value="fee">{t('find.sort.fee')}</option>
            <option value="date">{t('find.sort.date')}</option>
          </select>
        </div>
      )}

      {visible.length === 0 ? (
        <div className="cc-empty">
          <div className="cc-empty-icon"><IconSearch size={26} /></div>
          <h3>{t('find.emptyTitle')}</h3>
          <p>{t('find.emptyText')}</p>
        </div>
      ) : (
        <div className="cc-grid-2">
          {visible.map((req) => (
            <article key={req._id} className="cc-card cc-card-hover cc-rcard" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="cc-rcard-top">
                <h3 className="cc-rcard-title">{req.itemName}</h3>
                <span className="cc-badge nodot tone-gray">{t(`cat.${req.category}`)}</span>
              </div>

              <div className="cc-route">
                <div className="city"><b>{req.pickupCity}</b><small>{req.pickupCountry}</small></div>
                <span className="line" aria-hidden="true" />
                <div className="city" style={{ textAlign: 'right' }}><b>{req.destinationCity}</b><small>{req.destinationCountry}</small></div>
              </div>

              <div className="cc-row wrap cc-small cc-muted" style={{ gap: '4px 16px', marginBottom: 12 }}>
                <span>{t('find.weight')}: <b style={{ color: 'var(--c-ink-2)' }}>{fmtNum(req.weightKg)} {t('common.kg')}</b></span>
                <span>{t('card.by')} <b style={{ color: 'var(--c-ink-2)' }}>{fmtDate(req.requiredDate)}</b></span>
                <span>{t('card.sender')}: <b style={{ color: 'var(--c-ink-2)' }}>{req.sender?.name}</b></span>
              </div>

              <div className="cc-row cc-between" style={{ marginBottom: 12 }}>
                <span className="cc-small cc-muted">{t('find.youEarn')}</span>
                <span className="cc-fee">{fmtMoney(Math.round(req.offeredFee * 70) / 100, req.currency)}</span>
              </div>

              <label className={`cc-check${videoConfirm[req._id] ? ' on' : ''}`} style={{ marginBottom: 12 }}>
                <input type="checkbox" checked={!!videoConfirm[req._id]} onChange={(e) => setVideoConfirm({ ...videoConfirm, [req._id]: e.target.checked })} />
                <span>{t('find.videoCheck')}</span>
              </label>

              <div className="cc-row" style={{ marginTop: 'auto', gap: 10 }}>
                <Link to={`/requests/${req._id}`} className="cc-btn cc-btn-secondary" style={{ flex: 1 }}>{t('find.details')}</Link>
                <button type="button" className="cc-btn cc-btn-primary" style={{ flex: 1 }} onClick={() => handleAccept(req._id)} disabled={!approved || acceptingId === req._id}>
                  {acceptingId === req._id ? t('find.accepting') : t('find.accept')}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default FindParcels;
