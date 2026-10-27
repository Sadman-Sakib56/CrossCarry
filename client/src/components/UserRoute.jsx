import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// সাধারণ user এর page (Dashboard, Send, Find, Wallet)। Admin এখানে ঢুকলে নিজের panel এ ফিরে যায়,
// কারণ admin parcel পাঠাতেও পারবে না, নিতেও পারবে না
const UserRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
};

export default UserRoute;
