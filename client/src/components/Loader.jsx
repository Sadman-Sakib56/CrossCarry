import { useLang } from '../context/LanguageContext';

const Loader = ({ label }) => {
  const { t } = useLang();
  return (
    <div className="cc-loader" role="status" aria-live="polite">
      <div className="cc-spinner" />
      <span>{label || t('common.loading')}</span>
    </div>
  );
};

export default Loader;
