import { useLang } from '../context/LanguageContext';

// সবসময় উপরে দেখা যায়। ক্লিক করলে পুরো app (সব page) সাথে সাথে বদলে যায়
const LanguageToggle = () => {
  const { lang, setLang } = useLang();
  return (
    <div className="cc-lang" data-lang={lang} role="group" aria-label="Language / ভাষা">
      <button type="button" aria-pressed={lang === 'en'} onClick={() => setLang('en')} lang="en">EN</button>
      <button type="button" aria-pressed={lang === 'bn'} onClick={() => setLang('bn')} lang="bn">বাং</button>
    </div>
  );
};

export default LanguageToggle;
