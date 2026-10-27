import { Link } from 'react-router-dom';
import { IconBox } from './Icons';
import { useLang } from '../context/LanguageContext';

const Brand = () => {
  const { t } = useLang();
  return (
    <Link to="/" className="cc-brand" aria-label={t('nav.home')}>
      <span className="cc-brand-mark"><IconBox /></span>
      <span>Cross<em>Carry</em></span>
    </Link>
  );
};

export default Brand;
