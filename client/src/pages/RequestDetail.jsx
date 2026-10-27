import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import usePolling from '../hooks/usePolling';
import { getStage, isPaid, STATUS_FLOW } from '../utils/stage';
import Loader from '../components/Loader';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { IconClock, IconCheck, IconPhone, IconSend, IconShield, IconInfo } from '../components/Icons';

const NEXT_STATUS = { Matched: 'PickedUp', PickedUp: 'InTransit', InTransit: 'Delivered' };

const Person = ({ label, person, show }) => {
  const { t } = useLang();
  return (
    <div className="cc-person">
      <span className="cc-avatar">{person?.name?.[0]?.toUpperCase() || '?'}</span>
      <div>
        <small className="cc-muted cc-small">{label}</small>
        <b>{person?.name || t('detail.none')}</b>
        {show && person?.phone && <a href={`tel:${person.phone}`}><IconPhone size={14} /> {person.phone}</a>}
      </div>
    </div>
  );
};

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t, fmtMoney, fmtDate, fmtDateTime, fmtNum, apiError } = useLang();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fatal, setFatal] = useState('');
  const [confirm, setConfirm] = useState(null);
  const [videoOk, setVideoOk] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data);
      setFatal('');
    } catch (err) {
      // একবার লোড হয়ে গেলে, polling এর সাময়িক সমস্যায় পুরো page ভাঙা হবে না
      setRequest((prev) => { if (!prev) setFatal(apiError(err, 'err.loadFailed')); return prev; });
    } finally {
      setLoading(false);
    }
  }, [id, apiError]);

  useEffect(() => { setLoading(true); load(); }, [load]);
  usePolling(load, 15000);

  const run = async (fn) => {
    setError('');
    setBusy(true);
    try {
      await fn();
      setConfirm(null);
      await load();
    } catch (err) {
      setConfirm(null);
      setError(apiError(err, 'err.actionFailed'));
      await load(); // অন্য কেউ আগেই state বদলে দিলে নতুন অবস্থা দেখানো হয়
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loader />;
  if (!request) {
    return (
      <div className="cc-container cc-page narrow">
        <Alert tone="error">{fatal || t('err.NOT_FOUND')}</Alert>
        <Link to="/dashboard" className="cc-btn cc-btn-secondary" style={{ marginTop: 16 }}>← {t('detail.back')}</Link>
      </div>
    );
  }

  const role = request.viewerRole; // sender | traveller | admin | browser
  const status = request.status;
  const paid = isPaid(request);
  const nextStatus = NEXT_STATUS[status];
  const stage = getStage({ ...request, paymentStatus: request.payment?.status });
  const matched = !!request.traveller;
  const approved = user?.verificationStatus === 'approved';
  const backTo = role === 'admin' ? '/admin/requests' : role === 'browser' ? '/find-parcels' : '/dashboard';

  // এই মুহূর্তে কী হচ্ছে আর পরে কী হবে, সহজ ভাষায়
  const nextKey = role === 'admin' ? null : `next.${role}.${stage}`;
  const needsMyAction = (role === 'sender' && (stage === 'awaitingPayment' || stage === 'delivered'))
    || (role === 'traveller' && (stage === 'readyPickup' || stage === 'onTheWay'));

  const flowIdx = STATUS_FLOW.indexOf(status);

  const ask = (cfg) => setConfirm(cfg);

  // status ইতিহাসের সাথে payment এর ঘটনাও সময় অনুযায়ী সাজিয়ে একটা timeline বানানো হচ্ছে
  const timeline = [
    ...(request.statusHistory || []).map((h, i) => ({ key: `s${i}`, label: t(`status.${h.status}`), at: h.timestamp })),
    ...(request.payment ? [{ key: 'pay-held', label: t('detail.tl.held'), at: request.payment.createdAt }] : []),
    ...(request.payment?.status === 'released' ? [{ key: 'pay-rel', label: t('detail.tl.released'), at: request.payment.releasedAt }] : []),
  ].sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <div className="cc-container cc-page narrow">
      <Link to={backTo} className="cc-link-btn" style={{ display: 'inline-block', marginBottom: 14 }}>← {t('detail.back')}</Link>

      <div className="cc-stack">
        <Alert tone="error">{error}</Alert>

        {/* ---------- Header ---------- */}
        <section className="cc-card">
          <div className="cc-row cc-between wrap" style={{ alignItems: 'flex-start', gap: 10 }}>
            <div style={{ minWidth: 0, flex: '1 1 180px' }}>
              <h1 className="cc-h1" style={{ fontSize: 'clamp(1.35rem,4.5vw,1.8rem)', overflowWrap: 'break-word' }}>{request.itemName}</h1>
              <p className="cc-sub">{t(`cat.${request.category}`)}</p>
            </div>
            {role === 'admin' || role === 'browser'
              ? <StatusBadge status={status} />
              : <StatusBadge stage={stage} role={role} />}
          </div>

          {status !== 'Cancelled' && role !== 'browser' && (
            <div className="cc-progress" style={{ marginTop: 20 }} aria-label={t('detail.progress')}>
              {STATUS_FLOW.map((s, i) => (
                <div key={s} className={`step${i < flowIdx ? ' done' : ''}${i === flowIdx ? ' current' : ''}`}>
                  <div className="bar"><i /></div>
                  <span>{t(`status.${s}`)}</span>
                </div>
              ))}
            </div>
          )}
          {status === 'Cancelled' && <div style={{ marginTop: 14 }}><Alert tone="error">{t('detail.cancelled')}</Alert></div>}
        </section>

        {/* ---------- এখন কী করতে হবে ---------- */}
        {nextKey && status !== 'Cancelled' && status !== 'Completed' && (
          <section className={`cc-card cc-next ${needsMyAction ? 'action' : ''}`}>
            <span className="cc-next-icon">{needsMyAction ? <IconSend size={22} /> : <IconClock size={22} />}</span>
            <div>
              <h3>{needsMyAction ? t('detail.yourTurn') : t('detail.whatsNext')}</h3>
              <p>{t(`${nextKey}.d`)}</p>
            </div>
          </section>
        )}
        {status === 'Completed' && role !== 'admin' && (
          <section className="cc-card cc-next">
            <span className="cc-next-icon"><IconCheck size={22} /></span>
            <div><h3>{t('detail.doneTitle')}</h3><p>{t(`next.${role === 'sender' ? 'sender' : 'traveller'}.completed.d`)}</p></div>
          </section>
        )}

        {/* ---------- Actions ---------- */}
        {role !== 'admin' && (
          <section className="cc-card cc-stack">
            <h2 className="cc-h2">{t('detail.actions')}</h2>

            {/* Browser: অন্য verified traveller open request দেখছে */}
            {role === 'browser' && (
              approved ? (
                <>
                  <label className={`cc-check${videoOk ? ' on' : ''}`}>
                    <input type="checkbox" checked={videoOk} onChange={(e) => setVideoOk(e.target.checked)} />
                    <span>{t('find.videoCheck')}</span>
                  </label>
                  <button type="button" className="cc-btn cc-btn-primary block" disabled={!videoOk || busy}
                    onClick={() => run(async () => { await api.put(`/requests/${id}/accept`, { travellerVideoConfirmed: true }); navigate(`/requests/${id}`, { replace: true }); })}>
                    {busy ? t('find.accepting') : t('find.accept')}
                  </button>
                </>
              ) : (
                <Alert tone="warn">{t('find.needVerify')} <Link to="/profile">{t('find.uploadPassport')}</Link></Alert>
              )
            )}

            {/* Sender */}
            {role === 'sender' && status === 'Matched' && !paid && (
              <button type="button" className="cc-btn cc-btn-primary block" disabled={busy}
                onClick={() => ask({
                  title: t('act.pay.title'), body: t('act.pay.body', { amount: fmtMoney(request.offeredFee, request.currency) }),
                  label: t('act.pay.btn', { amount: fmtMoney(request.offeredFee, request.currency) }),
                  fn: () => api.post(`/payments/${id}/hold`),
                })}>
                <IconShield size={18} /> {t('act.pay.btn', { amount: fmtMoney(request.offeredFee, request.currency) })}
              </button>
            )}
            {role === 'sender' && status === 'Delivered' && (
              <button type="button" className="cc-btn cc-btn-success block" disabled={busy}
                onClick={() => ask({
                  title: t('act.confirm.title'), body: t('act.confirm.body'), label: t('act.confirm.btn'), tone: 'success',
                  fn: async () => { await api.put(`/payments/${id}/release`); await refreshUser(); },
                })}>
                <IconCheck size={18} /> {t('act.confirm.btn')}
              </button>
            )}
            {role === 'sender' && ['Requested', 'Matched'].includes(status) && !request.paymentHeld && !paid && (
              <button type="button" className="cc-btn cc-btn-danger block" disabled={busy}
                onClick={() => ask({
                  title: t('act.cancel.title'), body: t('act.cancel.body'), label: t('act.cancel.btn'), tone: 'danger',
                  fn: () => api.put(`/requests/${id}/cancel`),
                })}>
                {t('act.cancel.btn')}
              </button>
            )}

            {/* Traveller */}
            {role === 'traveller' && nextStatus && (
              status === 'Matched' && !paid ? (
                <Alert tone="warn">{t('act.waitPay')}</Alert>
              ) : (
                <button type="button" className="cc-btn cc-btn-primary block" disabled={busy}
                  onClick={() => ask({
                    title: t('act.mark.title'), body: t('act.mark.body', { status: t(`act.mark.${nextStatus}`) }), label: t(`act.mark.${nextStatus}`),
                    fn: () => api.put(`/requests/${id}/status`, { status: nextStatus }),
                  })}>
                  {t(`act.mark.${nextStatus}`)}
                </button>
              )
            )}

            {/* কোনো action না থাকলে */}
            {!(
              role === 'browser'
              || (role === 'sender' && ((status === 'Matched' && !paid) || status === 'Delivered' || (['Requested', 'Matched'].includes(status) && !request.paymentHeld && !paid)))
              || (role === 'traveller' && nextStatus)
            ) && <p className="cc-muted cc-small">{t('detail.noActions')}</p>}
          </section>
        )}
        {role === 'admin' && <Alert tone="info">{t('detail.adminReadonly')}</Alert>}

        {/* ---------- Details ---------- */}
        <section className="cc-card">
          <div className="cc-route" style={{ marginTop: 0 }}>
            <div className="city"><b style={{ fontSize: '1.1rem' }}>{request.pickupCity}</b><small>{request.pickupCountry}</small></div>
            <span className="line" aria-hidden="true" />
            <div className="city" style={{ textAlign: 'right' }}><b style={{ fontSize: '1.1rem' }}>{request.destinationCity}</b><small>{request.destinationCountry}</small></div>
          </div>
          <div className="cc-facts" style={{ marginTop: 16 }}>
            <div className="cc-fact"><small>{t('detail.weight')}</small><b>{fmtNum(request.weightKg)} {t('common.kg')}</b></div>
            <div className="cc-fact"><small>{t('detail.date')}</small><b>{fmtDate(request.requiredDate)}</b></div>
            <div className="cc-fact"><small>{t('detail.fee')}</small><b style={{ color: 'var(--c-primary-d)' }}>{fmtMoney(request.offeredFee, request.currency)}</b></div>
            {request.description && <div className="cc-fact wide"><small>{t('detail.description')}</small><b style={{ fontWeight: 500 }}>{request.description}</b></div>}
          </div>

          {request.payment && (
            <div className="cc-alert info" style={{ marginTop: 18 }}>
              <IconShield size={18} />
              <div>
                {request.payment.status === 'held'
                  ? t('detail.payHeld', { amount: fmtMoney(request.payment.amount, request.payment.currency) })
                  : t('detail.payReleased', { trav: fmtMoney(request.payment.travellerAmount, request.payment.currency), fee: fmtMoney(request.payment.platformFee, request.payment.currency) })}
              </div>
            </div>
          )}
        </section>

        {/* ---------- People ---------- */}
        <section className="cc-card cc-stack">
          <h2 className="cc-h2">{t('detail.people')}</h2>
          <div className="cc-grid-2">
            <Person label={t('card.sender')} person={request.sender} show={role !== 'browser'} />
            <Person label={t('card.traveller')} person={request.traveller} show={matched} />
          </div>
          {role === 'browser' && <p className="cc-hint"><IconInfo size={14} /> {t('detail.contactLater')}</p>}
        </section>

        {/* ---------- Timeline ---------- */}
        {timeline.length > 0 && (
          <section className="cc-card">
            <h2 className="cc-h2" style={{ marginBottom: 16 }}>{t('detail.timeline')}</h2>
            <ol className="cc-timeline">
              {timeline.map((e) => (
                <li key={e.key}><b>{e.label}</b><small>{fmtDateTime(e.at)}</small></li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm} title={confirm?.title} body={confirm?.body} confirmLabel={confirm?.label} tone={confirm?.tone} busy={busy}
        onCancel={() => !busy && setConfirm(null)} onConfirm={() => run(confirm.fn)}
      />
    </div>
  );
};

export default RequestDetail;
