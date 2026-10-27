import { useEffect, useState } from 'react';
import { useLang } from '../context/LanguageContext';
import { IconX, IconPlus } from './Icons';

const FAQ_KEYS = ['what', 'money', 'traveller', 'banned', 'fee', 'admin'];

const FaqModal = ({ isOpen, onClose }) => {
  const { t } = useLang();
  const [openIdx, setOpenIdx] = useState(0);

  // Esc চাপলে বন্ধ, আর খোলা থাকলে পেছনের page scroll হবে না
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="cc-modal-overlay" onClick={onClose}>
      <div className="cc-modal" role="dialog" aria-modal="true" aria-label={t('faq.title')} onClick={(e) => e.stopPropagation()}>
        <div className="cc-modal-head">
          <h2 className="cc-h2">{t('faq.title')}</h2>
          <button type="button" className="cc-icon-btn" onClick={onClose} aria-label={t('common.close')}><IconX /></button>
        </div>
        {FAQ_KEYS.map((k, i) => (
          <div className="cc-faq-item" key={k}>
            <button type="button" className="cc-faq-q" aria-expanded={openIdx === i} onClick={() => setOpenIdx(openIdx === i ? -1 : i)}>
              {t(`faq.${k}.q`)}
              <span className="plus"><IconPlus size={16} /></span>
            </button>
            {openIdx === i && <p className="cc-faq-a">{t(`faq.${k}.a`)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FaqModal;
