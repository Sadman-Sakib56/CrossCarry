import { useEffect } from 'react';
import { useLang } from '../context/LanguageContext';

// window.confirm এর বদলে নিজস্ব dialog: মোবাইলে সুন্দর দেখায় আর ভাষা বদলায়
const ConfirmDialog = ({ open, title, body, confirmLabel, tone = 'primary', busy, onConfirm, onCancel }) => {
  const { t } = useLang();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;
  const btn = tone === 'danger' ? 'cc-btn-danger-solid' : tone === 'success' ? 'cc-btn-success' : 'cc-btn-primary';

  return (
    <div className="cc-modal-overlay" onClick={onCancel}>
      <div className="cc-modal" role="alertdialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="cc-modal-head"><h2 className="cc-h2">{title}</h2></div>
        <p className="cc-muted" style={{ marginBottom: 20 }}>{body}</p>
        <div className="cc-row" style={{ gap: 10 }}>
          <button type="button" className="cc-btn cc-btn-secondary" style={{ flex: 1 }} onClick={onCancel} disabled={busy}>{t('common.back')}</button>
          <button type="button" className={`cc-btn ${btn}`} style={{ flex: 1.4 }} onClick={onConfirm} disabled={busy}>
            {busy ? t('common.processing') : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
