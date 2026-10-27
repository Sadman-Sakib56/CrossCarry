import { useState } from 'react';
import { useLang } from '../context/LanguageContext';
import Brand from './Brand';
import FaqModal from './FaqModal';

const Footer = () => {
  const { t, fmtNum } = useLang();
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    <footer className="cc-footer">
      <div className="cc-footer-inner">
        <div>
          <Brand />
          <p>{t('footer.tagline')}</p>
        </div>
        <div className="cc-footer-meta">
          <span>© {fmtNum(new Date().getFullYear(), { useGrouping: false })} CrossCarry</span>
          <span>{t('footer.support')}: crosscarry@gmail.com</span>
          <span>{t('footer.contact')}: +8801700000000</span>
        </div>
        <div className="cc-footer-actions">
          <span className="cc-muted cc-small">{t('footer.agent')} <span className="cc-soon">{t('common.soon')}</span></span>
          <button type="button" className="cc-link-btn" onClick={() => setFaqOpen(true)}>{t('footer.faq')} ↗</button>
        </div>
      </div>
      <FaqModal isOpen={faqOpen} onClose={() => setFaqOpen(false)} />
    </footer>
  );
};

export default Footer;
