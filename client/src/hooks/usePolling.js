import { useEffect, useRef } from 'react';

// ছোট polling hook: tab খোলা থাকলে প্রতি কয়েক সেকেন্ড পরপর fn চালায়
// একাধিক user এক সাথে থাকলে অন্যের করা পরিবর্তন (যেমন কেউ parcel accept করেছে) নিজে থেকে দেখা যায়
// tab লুকানো থাকলে (বা ফোন lock থাকলে) বন্ধ থাকে, তাই battery/data বাঁচে; ফিরে এলে সাথে সাথে refresh
export default function usePolling(fn, ms = 20000, enabled = true) {
  const saved = useRef(fn);
  useEffect(() => { saved.current = fn; }, [fn]);

  useEffect(() => {
    if (!enabled) return undefined;
    const tick = () => { if (document.visibilityState === 'visible') saved.current(); };
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [ms, enabled]);
}
