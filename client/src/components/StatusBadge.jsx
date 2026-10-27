import { useLang } from '../context/LanguageContext';
import { STAGE_TONE, STATUS_TONE } from '../utils/stage';

// kind="status": raw status (Admin এ); kind="stage": user এর দৃষ্টিকোণের পরিষ্কার নাম (role দরকার)
const StatusBadge = ({ status, stage, role }) => {
  const { t } = useLang();
  if (stage) {
    return <span className={`cc-badge tone-${STAGE_TONE[stage]}`}>{t(`stage.${role}.${stage}`)}</span>;
  }
  return <span className={`cc-badge tone-${STATUS_TONE[status] || 'gray'}`}>{t(`status.${status}`)}</span>;
};

export default StatusBadge;
