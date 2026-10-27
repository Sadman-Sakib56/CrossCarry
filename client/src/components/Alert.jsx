import { IconAlert, IconCheck, IconInfo } from './Icons';

// tone: error | success | warn | info
const Alert = ({ tone = 'error', children }) => {
  if (!children) return null;
  const Icon = tone === 'success' ? IconCheck : tone === 'info' ? IconInfo : IconAlert;
  return (
    <div className={`cc-alert ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} />
      <div>{children}</div>
    </div>
  );
};

export default Alert;
