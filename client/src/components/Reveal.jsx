import { useEffect, useRef, useState } from 'react';

// scroll করে section এ পৌঁছালে নরমভাবে ভেসে ওঠে। reduced-motion এ CSS নিজেই বন্ধ করে দেয়
const Reveal = ({ children, delay = 0, as: Tag = 'div', className = '' }) => {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return undefined; }
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setShown(true); io.disconnect(); } },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return <Tag ref={ref} className={`cc-reveal${shown ? ' in' : ''} ${className}`} style={{ '--d': `${delay}s` }}>{children}</Tag>;
};

export default Reveal;
