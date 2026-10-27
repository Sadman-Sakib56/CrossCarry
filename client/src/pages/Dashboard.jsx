import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import usePolling from '../hooks/usePolling';
import { getGroup } from '../utils/stage';
import RequestCard from '../components/RequestCard';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import { IconPlus, IconSearch, IconBox, IconChevron, IconCheck, IconClock } from '../components/Icons';

const TAB_KEY = 'cc_dash_tab';

// একটা role (sender/traveller) এর সব request কে তিনটা পরিষ্কার ভাগে দেখায়:
// "তোমার কাজ" / "চলছে বা অপেক্ষায়" / "ইতিহাস"। আগে সব একসাথে মিশে থাকত
const Section = ({ role, requests, emptyIcon: EmptyIcon, emptyTitle, emptyText, emptyCta }) => {
  const { t, fmtNum } = useLang();
  const [showHistory, setShowHistory] = useState(false);

  const groups = useMemo(() => {
    const g = { action: [], progress: [], history: [] };
    requests.forEach((r) => g[getGroup(r, role)].push(r));
    return g;
  }, [requests, role]);

  if (requests.length === 0) {
    return (
      <div className="cc-empty">
        <div className="cc-empty-icon"><EmptyIcon size={26} /></div>
        <h3>{emptyTitle}</h3>
        <p>{emptyText}</p>
        {emptyCta}
      </div>
    );
  }

  const renderList = (list) => (
    <div className="cc-grid-2">
      {list.map((r) => <RequestCard key={r._id} request={r} role={role} />)}
    </div>
  );

  return (
    <div>
      {groups.action.length > 0 && (
        <>
          <div className="cc-group-title action"><span className="dot" />{t('dash.group.action')} <span className="cc-count alert">{fmtNum(groups.action.length)}</span></div>
          {renderList(groups.action)}
        </>
      )}

      {groups.progress.length > 0 && (
        <>
          <div className="cc-group-title"><span className="dot" />{t(`dash.group.progress.${role}`)} <span className="cc-count">{fmtNum(groups.progress.length)}</span></div>
          {renderList(groups.progress)}
        </>
      )}

      {groups.action.length === 0 && groups.progress.length === 0 && (
        <p className="cc-muted cc-small" style={{ marginTop: 10 }}>{t('dash.allClear')}</p>
      )}

      {groups.history.length > 0 && (
        <>
          <button type="button" className="cc-disclosure" aria-expanded={showHistory} onClick={() => setShowHistory((s) => !s)}>
            <span className="cc-row"><span className="cc-group-title history" style={{ margin: 0 }}><span className="dot" />{t('dash.group.history')}</span> <span className="cc-count">{fmtNum(groups.history.length)}</span></span>
            <span className="chev"><IconChevron size={20} /></span>
          </button>
          {showHistory && renderList(groups.history)}
        </>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { t, fmtNum } = useLang();
  const [sent, setSent] = useState([]);
  const [carrying, setCarrying] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState(() => localStorage.getItem(TAB_KEY) || 'sending');

  const load = useCallback(async () => {
    try {
      const [mine, accepted] = await Promise.all([api.get('/requests/mine'), api.get('/requests/accepted')]);
      setSent(mine.data);
      setCarrying(accepted.data);
      setError('');
    } catch {
      setError(t('dash.loadError'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);
  usePolling(load, 20000); // অন্য user কিছু করলে (accept, pay, deliver) নিজে থেকেই দেখা যাবে

  const changeTab = (next) => { setTab(next); localStorage.setItem(TAB_KEY, next); };

  if (loading) return <Loader />;

  // প্রতিটা tab এ কয়টা request এ "তোমার কাজ" বাকি, সেটা badge এ দেখানো হয়
  const actionCount = (list, role) => list.filter((r) => getGroup(r, role) === 'action').length;
  const sendAction = actionCount(sent, 'sender');
  const carryAction = actionCount(carrying, 'traveller');

  const verification = {
    approved: ['green', t('dash.verify.approved')],
    pending: ['amber', t('dash.verify.pending')],
    rejected: ['red', t('dash.verify.rejected')],
    not_submitted: ['gray', t('dash.verify.none')],
  }[user?.verificationStatus || 'not_submitted'];

  return (
    <div className="cc-container cc-page">
      <div className="cc-page-head">
        <div>
          <h1 className="cc-h1">{t('dash.welcome', { name: user?.name?.split(' ')[0] || '' })}</h1>
          <div className="cc-row wrap" style={{ marginTop: 8 }}>
            <span className="cc-muted cc-small">{t('dash.verification')}:</span>
            <Link to="/profile" className={`cc-badge tone-${verification[0]}`}>{verification[1]}</Link>
          </div>
        </div>
        <div className="cc-row wrap">
          <Link to="/requests/new" className="cc-btn cc-btn-primary"><IconPlus size={18} /> {t('dash.sendCta')}</Link>
          <Link to="/find-parcels" className="cc-btn cc-btn-secondary"><IconSearch size={18} /> {t('nav.find')}</Link>
        </div>
      </div>

      <Alert tone="error">{error}</Alert>

      {/* Sender আর Traveller এর কাজ এখন দুইটা আলাদা tab এ */}
      <div className="cc-seg" role="tablist" style={{ margin: '18px 0 6px' }}>
        <button type="button" role="tab" aria-selected={tab === 'sending'} className={tab === 'sending' ? 'active' : ''} onClick={() => changeTab('sending')}>
          {t('dash.tab.sending')}
          <span className={`cc-count${sendAction ? ' alert' : ''}`}>{fmtNum(sendAction || sent.length)}</span>
        </button>
        <button type="button" role="tab" aria-selected={tab === 'carrying'} className={tab === 'carrying' ? 'active' : ''} onClick={() => changeTab('carrying')}>
          {t('dash.tab.carrying')}
          <span className={`cc-count${carryAction ? ' alert' : ''}`}>{fmtNum(carryAction || carrying.length)}</span>
        </button>
      </div>

      {tab === 'sending' ? (
        <Section
          key="sending" role="sender" requests={sent} emptyIcon={IconBox}
          emptyTitle={t('dash.empty.sendTitle')} emptyText={t('dash.empty.sendText')}
          emptyCta={<Link to="/requests/new" className="cc-btn cc-btn-primary">{t('dash.sendCta')}</Link>}
        />
      ) : (
        <Section
          key="carrying" role="traveller" requests={carrying} emptyIcon={user?.verificationStatus === 'approved' ? IconCheck : IconClock}
          emptyTitle={t('dash.empty.carryTitle')} emptyText={t('dash.empty.carryText')}
          emptyCta={<Link to="/find-parcels" className="cc-btn cc-btn-primary">{t('dash.browse')}</Link>}
        />
      )}
    </div>
  );
};

export default Dashboard;
