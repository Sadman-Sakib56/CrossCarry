import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();
const STORAGE_KEY = 'cc_lang';

// প্রথমবার: browser এর ভাষা বাংলা হলে বাংলা, নাহলে English। এরপর user এর পছন্দ মনে রাখা হয়
const detectInitial = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'bn' || saved === 'en') return saved;
  } catch { /* private mode এ localStorage বন্ধ থাকতে পারে */ }
  return navigator.language?.toLowerCase().startsWith('bn') ? 'bn' : 'en';
};

const LOCALE = { en: 'en-GB', bn: 'bn-BD' }; // bn-BD মানে বাংলা সংখ্যা (১২৩) আর বাংলা মাসের নাম
const SYMBOL = { BDT: '৳', USD: '$' };

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(detectInitial);

  const setLang = useCallback((next) => {
    setLangState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* ignore */ }
  }, []);

  // <html lang> বদলানো হয়, তাই CSS এ বাংলার জন্য আলাদা font/spacing ধরা যায়, screen reader ও ঠিক উচ্চারণ করে
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = translations[lang]['meta.title'];
  }, [lang]);

  const value = useMemo(() => {
    const dict = translations[lang];
    const fallback = translations.en;
    const locale = LOCALE[lang];

    // t('key', { name: 'Rafi' }) — {name} জায়গায় মান বসে
    const t = (key, vars) => {
      let str = dict[key] ?? fallback[key] ?? key;
      if (vars) Object.entries(vars).forEach(([k, v]) => { str = str.replaceAll(`{${k}}`, v); });
      return str;
    };

    const has = (key) => key in dict;
    const fmtNum = (n, opts) => Number(n || 0).toLocaleString(locale, { maximumFractionDigits: 2, ...opts });
    const fmtMoney = (amount, currency = 'BDT') => `${SYMBOL[currency] || ''}${fmtNum(amount)}`;
    const fmtDate = (d) =>
      d ? new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const fmtDateTime = (d) =>
      d ? new Date(d).toLocaleString(locale, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '—';

    // server এর error code থেকে বাংলা/English message। code না চিনলে server এর message, তাও না থাকলে fallback
    const apiError = (err, fallbackKey = 'err.generic') => {
      const code = err?.response?.data?.code;
      if (code && has(`err.${code}`)) return t(`err.${code}`);
      if (!err?.response) return t('err.NETWORK');
      return t(fallbackKey);
    };

    return { lang, setLang, t, fmtNum, fmtMoney, fmtDate, fmtDateTime, apiError };
  }, [lang, setLang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLang = () => useContext(LanguageContext);
