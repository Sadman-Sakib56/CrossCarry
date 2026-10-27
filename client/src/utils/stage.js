// একটা request কে user এর দৃষ্টিকোণ (sender / traveller) থেকে বোঝার জন্য "stage" বের করা হয়
// আগে Matched আর Accepted একসাথে মিশে যেত; এখন প্রতিটা অবস্থার আলাদা, পরিষ্কার নাম আছে

export const isPaid = (r) => r.paymentStatus === 'held' || r.paymentStatus === 'released' || r.payment?.status === 'held' || r.payment?.status === 'released';

export const getStage = (r) => {
  switch (r.status) {
    case 'Requested': return 'waiting';
    case 'Matched': return isPaid(r) ? 'readyPickup' : 'awaitingPayment';
    case 'PickedUp':
    case 'InTransit': return 'onTheWay';
    case 'Delivered': return 'delivered';
    case 'Completed': return 'completed';
    case 'Cancelled': return 'cancelled';
    default: return 'waiting';
  }
};

// কোন group এ যাবে: action = এখন তোমার কিছু করার আছে, progress = অন্যের জন্য অপেক্ষা/চলমান, history = শেষ
const GROUPS = {
  sender: {
    action: ['awaitingPayment', 'delivered'],
    progress: ['waiting', 'readyPickup', 'onTheWay'],
    history: ['completed', 'cancelled'],
  },
  traveller: {
    action: ['readyPickup', 'onTheWay'],
    progress: ['awaitingPayment', 'delivered', 'waiting'],
    history: ['completed', 'cancelled'],
  },
};

export const getGroup = (r, role) => {
  const stage = getStage(r);
  const g = GROUPS[role];
  if (g.action.includes(stage)) return 'action';
  if (g.history.includes(stage)) return 'history';
  return 'progress';
};

export const STAGE_TONE = {
  waiting: 'gray', awaitingPayment: 'amber', readyPickup: 'teal', onTheWay: 'blue',
  delivered: 'purple', completed: 'green', cancelled: 'red',
};

export const STATUS_TONE = {
  Requested: 'gray', Matched: 'teal', PickedUp: 'blue', InTransit: 'blue',
  Delivered: 'purple', Completed: 'green', Cancelled: 'red',
};

// সব status ক্রম অনুযায়ী (progress bar এর জন্য)
export const STATUS_FLOW = ['Requested', 'Matched', 'PickedUp', 'InTransit', 'Delivered', 'Completed'];
