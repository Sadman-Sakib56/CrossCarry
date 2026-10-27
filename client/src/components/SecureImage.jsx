import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useLang } from '../context/LanguageContext';

// version/userId বদলালে caller এ key দিয়ে component টা নতুন করে বানানো হয় (তাই এখানে state reset লাগে না)
// Passport ছবি এখন public URL এ নেই, তাই login token সহ blob হিসেবে এনে দেখানো হয়
const SecureImage = ({ userId, alt, version }) => {
  const { t } = useLang();
  const [src, setSrc] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let url;
    let cancelled = false;
    api.get(`/users/${userId}/passport`, { responseType: 'blob' })
      .then((res) => {
        if (cancelled) return;
        url = URL.createObjectURL(res.data);
        setSrc(url);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [userId, version]);

  if (failed) return <div className="cc-passport-ph">{t('common.imageFailed')}</div>;
  if (!src) return <div className="cc-passport-ph">{t('common.loading')}</div>;
  return <img src={src} alt={alt} className="cc-passport" />;
};

export default SecureImage;
