import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../api/axios';
import { useLang } from '../../context/LanguageContext';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import SecureImage from '../../components/SecureImage';

const TONE = { not_submitted: 'gray', pending: 'amber', approved: 'green', rejected: 'red' };

const AdminUsers = () => {
  const { t, fmtNum, fmtDate, apiError } = useLang();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('pending');
  const [actioningId, setActioningId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/users');
      setUsers(res.data);
    } catch (err) {
      setError(apiError(err, 'err.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [apiError]);

  useEffect(() => { load(); }, [load]);

  const verify = async (userId, status, reason) => {
    setActioningId(userId);
    setError('');
    try {
      await api.put(`/admin/users/${userId}/verify`, { status, reason });
      setRejectingId(null);
      setRejectReason('');
      await load();
    } catch (err) {
      setError(apiError(err, 'err.actionFailed'));
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = (userId) => {
    if (!rejectReason.trim()) { setError(t('admin.reasonNeeded')); return; }
    verify(userId, 'rejected', rejectReason.trim());
  };

  const counts = useMemo(() => ({
    pending: users.filter((u) => u.verificationStatus === 'pending').length,
    all: users.length,
  }), [users]);

  const list = filter === 'pending' ? users.filter((u) => u.verificationStatus === 'pending') : users;

  if (loading) return <Loader />;

  return (
    <div className="cc-container cc-page">
      <div className="cc-page-head"><h1 className="cc-h1">{t('admin.users.title')}</h1></div>

      <div className="cc-seg auto" style={{ marginBottom: 18 }}>
        <button type="button" className={filter === 'pending' ? 'active' : ''} onClick={() => setFilter('pending')}>
          {t('admin.users.pending')} <span className={`cc-count${counts.pending ? ' alert' : ''}`}>{fmtNum(counts.pending)}</span>
        </button>
        <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>
          {t('admin.users.all')} <span className="cc-count">{fmtNum(counts.all)}</span>
        </button>
      </div>

      <Alert tone="error">{error}</Alert>

      {list.length === 0 ? (
        <div className="cc-empty"><h3>{t('admin.users.empty')}</h3></div>
      ) : (
        <div className="cc-grid-2" style={{ marginTop: 12 }}>
          {list.map((u) => (
            <div key={u._id} className="cc-card cc-stack">
              <div className="cc-row cc-between" style={{ alignItems: 'flex-start' }}>
                <div className="cc-person">
                  <span className="cc-avatar">{u.name?.[0]?.toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <b>{u.name} {u.role === 'admin' && <span className="cc-badge nodot tone-teal">Admin</span>}</b>
                    <span className="cc-small cc-muted" style={{ overflowWrap: 'anywhere' }}>{u.email}<br />{u.phone}</span>
                  </div>
                </div>
                <span className={`cc-badge tone-${TONE[u.verificationStatus]}`}>{t(`verify.${u.verificationStatus}`)}</span>
              </div>

              <div className="cc-small cc-muted">{t('admin.users.joined')}: {fmtDate(u.createdAt)}</div>

              {u.passportImage && <SecureImage key={`${u._id}-${u.updatedAt}`} userId={u._id} alt={`${u.name} passport`} version={u.updatedAt} />}

              {u.verificationStatus === 'rejected' && u.rejectionReason && (
                <p className="cc-small" style={{ color: 'var(--c-red)' }}>{t('profile.reason')}: {u.rejectionReason}</p>
              )}

              {u.verificationStatus === 'pending' && (
                rejectingId === u._id ? (
                  <div className="cc-stack">
                    <input className="cc-input" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder={t('admin.users.reasonPh')} autoFocus />
                    <div className="cc-row" style={{ gap: 10 }}>
                      <button type="button" className="cc-btn cc-btn-ghost" onClick={() => { setRejectingId(null); setRejectReason(''); }}>{t('common.cancel')}</button>
                      <button type="button" className="cc-btn cc-btn-danger-solid" style={{ flex: 1 }} disabled={actioningId === u._id} onClick={() => handleReject(u._id)}>{t('admin.users.confirmReject')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="cc-row" style={{ gap: 10 }}>
                    <button type="button" className="cc-btn cc-btn-success" style={{ flex: 1 }} disabled={actioningId === u._id} onClick={() => verify(u._id, 'approved')}>{t('admin.users.approve')}</button>
                    <button type="button" className="cc-btn cc-btn-danger" style={{ flex: 1 }} onClick={() => setRejectingId(u._id)}>{t('admin.users.reject')}</button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
