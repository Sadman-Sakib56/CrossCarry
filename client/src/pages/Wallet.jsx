import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useLang } from '../context/LanguageContext';
import usePolling from '../hooks/usePolling';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { IconCoins } from '../components/Icons';

const Wallet = () => {
  const { t, fmtMoney, fmtDate, apiError } = useLang();
  const [data, setData] = useState({ walletBalance: 0, walletBalanceUSD: 0, pending: { BDT: 0, USD: 0 }, payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await api.get('/payments/mine');
      setData(res.data);
      setError('');
    } catch (err) {
      setError(apiError(err, 'err.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [apiError]);

  useEffect(() => { load(); }, [load]);
  usePolling(load, 30000);

  if (loading) return <Loader />;

  const hasUSD = data.walletBalanceUSD > 0 || data.pending.USD > 0;
  const pendingText = [
    data.pending.BDT > 0 && fmtMoney(data.pending.BDT, 'BDT'),
    data.pending.USD > 0 && fmtMoney(data.pending.USD, 'USD'),
  ].filter(Boolean).join(' + ');

  return (
    <div className="cc-container cc-page narrow">
      <div className="cc-page-head"><h1 className="cc-h1">{t('wallet.title')}</h1></div>

      <div className="cc-stack">
        <Alert tone="error">{error}</Alert>

        <section className="cc-balance">
          <small>{t('wallet.balance')}</small>
          <div className="amount">{fmtMoney(data.walletBalance, 'BDT')}</div>
          {hasUSD && <div className="sub">+ {fmtMoney(data.walletBalanceUSD, 'USD')}</div>}
          {pendingText && <div className="sub" style={{ marginTop: 6 }}>{t('wallet.pending', { amount: pendingText })}</div>}

          {/* Withdraw এখনো চালু হয়নি: বোতামটা আছে কিন্তু disabled, পাশে (Coming soon) */}
          <button type="button" className="cc-btn" disabled aria-disabled="true" title={t('common.soon')}>
            <IconCoins size={18} /> {t('wallet.withdraw')} <span className="cc-soon">({t('common.soon')})</span>
          </button>
        </section>

        <h2 className="cc-h2" style={{ marginTop: 8 }}>{t('wallet.history')}</h2>
        {data.payments.length === 0 ? (
          <div className="cc-empty">
            <div className="cc-empty-icon"><IconCoins size={26} /></div>
            <h3>{t('wallet.emptyTitle')}</h3>
            <p>{t('wallet.emptyText')}</p>
            <Link to="/find-parcels" className="cc-btn cc-btn-primary">{t('dash.browse')}</Link>
          </div>
        ) : (
          data.payments.map((p) => (
            <Link key={p._id} to={`/requests/${p.request?._id || ''}`} className="cc-card cc-card-hover cc-tx">
              <div style={{ minWidth: 0 }}>
                <b style={{ overflowWrap: 'anywhere' }}>{p.request?.itemName || t('wallet.deleted')}</b>
                <div className="cc-small cc-muted">{p.request?.destinationCity}, {p.request?.destinationCountry}</div>
                <div className="cc-small cc-muted">
                  {p.status === 'released' ? t('wallet.releasedOn', { date: fmtDate(p.releasedAt) }) : t('wallet.stillHeld')}
                </div>
              </div>
              <div>
                <div className={`amt ${p.status === 'released' ? 'in' : 'hold'}`}>
                  {p.status === 'released' ? '+' : ''}{fmtMoney(p.status === 'released' ? p.travellerAmount : Math.round(p.amount * 70) / 100, p.currency)}
                </div>
                <span className={`cc-badge tone-${p.status === 'released' ? 'green' : 'amber'}`}>{t(`pay.${p.status}`)}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Wallet;
