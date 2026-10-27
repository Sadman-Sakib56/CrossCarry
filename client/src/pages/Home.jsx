import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import Reveal from '../components/Reveal';
import { IconBox, IconShield, IconVideo, IconLock, IconInfo, IconPlane } from '../components/Icons';

// landing এর নমুনা route। ক্লিক/ট্যাপ করলে card এর শহর বদলায় আর parcel আবার যাত্রা শুরু করে
const ROUTES = [
  { en: { a: 'Dhaka', ac: 'Bangladesh', b: 'London', bc: 'United Kingdom' }, bn: { a: 'ঢাকা', ac: 'বাংলাদেশ', b: 'লন্ডন', bc: 'যুক্তরাজ্য' } },
  { en: { a: 'Dhaka', ac: 'Bangladesh', b: 'Toronto', bc: 'Canada' }, bn: { a: 'ঢাকা', ac: 'বাংলাদেশ', b: 'টরন্টো', bc: 'কানাডা' } },
  { en: { a: 'Chattogram', ac: 'Bangladesh', b: 'New York', bc: 'USA' }, bn: { a: 'চট্টগ্রাম', ac: 'বাংলাদেশ', b: 'নিউ ইয়র্ক', bc: 'যুক্তরাষ্ট্র' } },
  { en: { a: 'Sylhet', ac: 'Bangladesh', b: 'Dubai', bc: 'UAE' }, bn: { a: 'সিলেট', ac: 'বাংলাদেশ', b: 'দুবাই', bc: 'সংযুক্ত আরব আমিরাত' } },
];

const Home = () => {
  const { user } = useAuth();
  const { t, lang, fmtMoney, fmtNum } = useLang();

  const [routeIdx, setRouteIdx] = useState(0);
  const [mode, setMode] = useState('send'); // "How it works" এর tab: send | carry
  const [fee, setFee] = useState(3000);
  const heroRef = useRef(null);
  const cardRef = useRef(null);

  const route = ROUTES[routeIdx][lang];

  // mouse (বা আঙুল) এর সাথে নরম আলো আর card এর হালকা কাত হওয়া
  const handleMove = (e) => {
    const hero = heroRef.current;
    const card = cardRef.current;
    if (!hero) return;
    const hr = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${e.clientX - hr.left}px`);
    hero.style.setProperty('--my', `${e.clientY - hr.top}px`);
    if (card && e.pointerType === 'mouse') {
      const cr = card.getBoundingClientRect();
      const px = (e.clientX - cr.left) / cr.width - 0.5;
      const py = (e.clientY - cr.top) / cr.height - 0.5;
      card.style.setProperty('--ry', `${Math.max(-1, Math.min(1, px)) * 7}deg`);
      card.style.setProperty('--rx', `${Math.max(-1, Math.min(1, py)) * -6}deg`);
    }
  };
  const resetTilt = () => {
    cardRef.current?.style.setProperty('--rx', '0deg');
    cardRef.current?.style.setProperty('--ry', '0deg');
  };

  const travellerGets = Math.round(fee * 0.7);
  const platform = fee - travellerGets;
  const fill = ((fee - 500) / (10000 - 500)) * 100;

  const steps = mode === 'send' ? ['s1', 's2', 's3'] : ['c1', 'c2', 'c3'];

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="cc-hero" ref={heroRef} onPointerMove={handleMove} onPointerLeave={resetTilt}>
        <div className="cc-container cc-hero-grid">
          <div>
            <span className="cc-eyebrow"><i /> {t('home.eyebrow')}</span>
            <h1>{t('home.title1')}<br /><span>{t('home.title2')}</span></h1>
            <p className="cc-hero-copy">{t('home.copy')}</p>

            <div className="cc-hero-actions">
              {user ? (
                <Link to={user.role === 'admin' ? '/admin' : '/dashboard'} className="cc-btn cc-btn-primary">
                  {t('home.goDashboard')} <span className="arrow">→</span>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="cc-btn cc-btn-primary">{t('nav.getStarted')} <span className="arrow">→</span></Link>
                  <Link to="/login" className="cc-btn cc-btn-secondary">{t('home.haveAccount')}</Link>
                </>
              )}
            </div>

            <div className="cc-trust">
              <span><IconShield /> {t('home.trust1')}</span>
              <span><IconLock /> {t('home.trust2')}</span>
              <span><IconVideo /> {t('home.trust3')}</span>
            </div>
          </div>

          <div className="cc-visual">
            <div className="cc-route-card" ref={cardRef}>
              <p className="cc-route-kicker">{t('home.cardKicker')}</p>
              <h2>{t('home.cardTitle')}</h2>

              <div className="cc-rchips" role="tablist" aria-label={t('home.pickRoute')}>
                {ROUTES.map((r, i) => (
                  <button key={i} type="button" role="tab" aria-selected={i === routeIdx} className={`cc-rchip${i === routeIdx ? ' active' : ''}`} onClick={() => setRouteIdx(i)}>
                    {r[lang].a} → {r[lang].b}
                  </button>
                ))}
              </div>

              <div className="cc-rline">
                <span className="cc-pin">A</span>
                <div className="cc-track"><span className="cc-parcel" key={routeIdx}><IconBox /></span></div>
                <span className="cc-pin b">B</span>
              </div>

              <div className="cc-places">
                <div className="cc-place" key={`a${routeIdx}${lang}`}><small>{t('home.from')}</small><strong>{route.a}</strong><span>{route.ac}</span></div>
                <div className="cc-place" key={`b${routeIdx}${lang}`}><small>{t('home.to')}</small><strong>{route.b}</strong><span>{route.bc}</span></div>
              </div>

              <div className="cc-route-note"><IconPlane size={18} /> {t('home.cardNote')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- How it works ---------- */}
      <section className="cc-section">
        <div className="cc-container">
          <Reveal className="cc-section-head">
            <span className="cc-eyebrow">{t('home.howEyebrow')}</span>
            <h2>{t('home.howTitle')}</h2>
            <p>{t('home.howSub')}</p>
          </Reveal>

          <div className="cc-seg cc-how-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'send'} className={mode === 'send' ? 'active' : ''} onClick={() => setMode('send')}>{t('home.tabSend')}</button>
            <button type="button" role="tab" aria-selected={mode === 'carry'} className={mode === 'carry' ? 'active' : ''} onClick={() => setMode('carry')}>{t('home.tabCarry')}</button>
          </div>

          {/* key বদলালে step গুলো আবার নরমভাবে ভেসে ওঠে */}
          <div className="cc-grid-3" key={mode}>
            {steps.map((s, i) => (
              <article className="cc-card cc-card-hover cc-step" key={s} style={{ '--d': `${i * 0.08}s` }}>
                <div className="cc-step-no">{fmtNum(i + 1)}</div>
                <h3>{t(`home.${s}.t`)}</h3>
                <p>{t(`home.${s}.d`)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Fee calculator ---------- */}
      <section className="cc-section" style={{ paddingTop: 10 }}>
        <div className="cc-container">
          <Reveal>
            <div className="cc-fee-card">
              <div>
                <span className="cc-eyebrow">{t('home.feeEyebrow')}</span>
                <h2 style={{ fontSize: 'clamp(1.5rem,5vw,2rem)', fontWeight: 800, margin: '12px 0 6px' }}>{t('home.feeTitle')}</h2>
                <p className="cc-muted">{t('home.feeSub')}</p>
              </div>
              <div>
                <label className="cc-label" htmlFor="fee-range">{t('home.feeLabel')}</label>
                <div className="cc-fee-amount">{fmtMoney(fee)}</div>
                <input
                  id="fee-range" className="cc-range" type="range" min="500" max="10000" step="100" value={fee}
                  style={{ '--fill': `${fill}%` }} onChange={(e) => setFee(Number(e.target.value))}
                />
                <div className="cc-split" style={{ marginTop: 12 }} aria-hidden="true">
                  <i className="a" style={{ width: '70%' }} /><i className="b" style={{ width: '30%' }} />
                </div>
                <div className="cc-split-legend">
                  <div><span className="k">{t('home.feeTraveller')} · {fmtNum(70)}%</span><b>{fmtMoney(travellerGets)}</b></div>
                  <div><span className="k">{t('home.feePlatform')} · {fmtNum(30)}%</span><b>{fmtMoney(platform)}</b></div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- Safety ---------- */}
      <section className="cc-section" style={{ paddingTop: 10 }}>
        <div className="cc-container">
          <Reveal className="cc-section-head">
            <h2>{t('home.safeTitle')}</h2>
          </Reveal>
          <div className="cc-grid-3">
            {[
              { k: 'v', Icon: IconShield },
              { k: 'p', Icon: IconLock },
              { k: 'h', Icon: IconVideo },
            ].map(({ k, Icon }, i) => (
              <Reveal key={k} delay={i * 0.08}>
                <div className="cc-card cc-card-hover cc-safe">
                  <span className="ic"><Icon /></span>
                  <div><h3>{t(`home.safe.${k}.t`)}</h3><p>{t(`home.safe.${k}.d`)}</p></div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="cc-note-box" style={{ marginTop: 16 }}><IconInfo size={20} /><span>{t('home.banned')}</span></div>
          </Reveal>
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      {!user && (
        <section className="cc-container">
          <Reveal>
            <div className="cc-cta">
              <h2>{t('home.ctaTitle')}</h2>
              <p>{t('home.ctaSub')}</p>
              <Link to="/register" className="cc-btn">{t('home.ctaBtn')} <span className="arrow">→</span></Link>
            </div>
          </Reveal>
        </section>
      )}
    </div>
  );
};

export default Home;
