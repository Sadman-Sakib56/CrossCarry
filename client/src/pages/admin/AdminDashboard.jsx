import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useLang } from '../../context/LanguageContext';
import usePolling from '../../hooks/usePolling';
import Loader from '../../components/Loader';
import Alert from '../../components/Alert';
import { IconUsers, IconList, IconCard, IconAlert } from '../../components/Icons';

const Stat = ({ label, children, sm }) => (
  <div className="cc-card cc-stat">
    <small>{label}</small>
    <b className={sm ? 'sm' : ''}>{children}</b>
  </div>
);

const AdminDashboard = () => {
  const { t, fmtNum, fmtMoney, apiError } = useLang();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
      setError('');
    } catch (err) {
      setError(apiError(err, 'err.loadFailed'));
    }
  }, [apiError]);

  useEffect(() => { load(); }, [load]);
  usePolling(load, 30000);

  if (!stats && !error) return <Loader />;

  // BDT আর USD আলাদা করে দেখানো হয়, যোগ করে নয়
  const money = (obj) => [obj?.BDT > 0 && fmtMoney(obj.BDT, 'BDT'), obj?.USD > 0 && fmtMoney(obj.USD, 'USD')].filter(Boolean).join(' + ') || fmtMoney(0, 'BDT');

  return (
    <div className="cc-container cc-page">
      <div className="cc-page-head">
        <div><h1 className="cc-h1">{t('admin.title')}</h1><p className="cc-sub">{t('admin.sub')}</p></div>
      </div>
      <Alert tone="error">{error}</Alert>

      {stats && (
        <>
          {stats.pendingVerifications > 0 && (
            <Link to="/admin/users" className="cc-alert warn cc-card-hover" style={{ marginBottom: 16, display: 'flex' }}>
              <IconAlert size={18} />
              <div>{t('admin.pendingAlert', { n: fmtNum(stats.pendingVerifications) })} →</div>
            </Link>
          )}

          <div className="cc-grid-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginBottom: 14 }}>
            <Stat label={t('admin.stat.users')}>{fmtNum(stats.totalUsers)}</Stat>
            <Stat label={t('admin.stat.requests')}>{fmtNum(stats.totalRequests)}</Stat>
            <Stat label={t('admin.stat.open')}>{fmtNum(stats.openRequests)}</Stat>
            <Stat label={t('admin.stat.completed')}>{fmtNum(stats.totalDelivered)}</Stat>
            <Stat label={t('admin.stat.held')} sm>{money(stats.heldByCurrency)}</Stat>
            <Stat label={t('admin.stat.earned')} sm>{money(stats.platformEarnings)}</Stat>
          </div>

          <div className="cc-grid-3" style={{ marginTop: 22 }}>
            {[
              { to: '/admin/users', Icon: IconUsers, k: 'users' },
              { to: '/admin/requests', Icon: IconList, k: 'requests' },
              { to: '/admin/payments', Icon: IconCard, k: 'payments' },
            ].map(({ to, Icon, k }) => (
              <Link key={k} to={to} className="cc-card cc-card-hover cc-link-card">
                <span className="cc-next-icon" style={{ marginBottom: 12 }}><Icon size={22} /></span>
                <h3>{t(`admin.link.${k}.t`)}</h3>
                <p>{t(`admin.link.${k}.d`)}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
