import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import StatusBadge from './StatusBadge';
import { getStage, getGroup } from '../utils/stage';

// role: 'sender' (আমি পাঠাচ্ছি) অথবা 'traveller' (আমি বহন করছি)
const RequestCard = ({ request, role }) => {
  const { t, fmtMoney, fmtDate } = useLang();
  const stage = getStage(request);
  const group = getGroup(request, role);
  const other = role === 'sender' ? request.traveller : request.sender;

  return (
    <Link to={`/requests/${request._id}`} className={`cc-card cc-card-hover cc-rcard${group === 'action' ? ' action' : ''}`}>
      <div className="cc-rcard-top">
        <h3 className="cc-rcard-title">{request.itemName}</h3>
      </div>
      <div style={{ marginTop: 8 }}>
        <StatusBadge stage={stage} role={role} />
      </div>

      <div className="cc-route">
        <div className="city"><b>{request.pickupCity}</b><small>{request.pickupCountry}</small></div>
        <span className="line" aria-hidden="true" />
        <div className="city" style={{ textAlign: 'right' }}><b>{request.destinationCity}</b><small>{request.destinationCountry}</small></div>
      </div>

      <div className="cc-rcard-foot">
        <span>
          {role === 'sender'
            ? (other?.name ? `${t('card.traveller')}: ${other.name}` : t('card.noTraveller'))
            : `${t('card.sender')}: ${other?.name || '—'}`}
          <br />
          <small>{t('card.by')} {fmtDate(request.requiredDate)}</small>
        </span>
        <span className="cc-fee">{fmtMoney(request.offeredFee, request.currency)}</span>
      </div>
    </Link>
  );
};

export default RequestCard;
