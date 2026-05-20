import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  MdHome, MdBadge, MdDescription,
  MdBusiness, MdHistory, MdLogout, MdReceiptLong, MdPerson
} from 'react-icons/md';

const navItems = [
  { label: 'Portal', items: [
    { to: '/portal',          icon: <MdHome />,        label: 'Home',              end: true },
    { to: '/portal/requests', icon: <MdHistory />,     label: 'My Requests' },
    { to: '/portal/payments', icon: <MdReceiptLong />, label: 'My Payments' },
    { to: '/portal/profile',  icon: <MdPerson />,      label: 'My Profile' },
  ]},
  { label: 'Request', items: [
    { to: '/portal/clearance', icon: <MdBadge />,       label: 'Barangay Clearance' },
    { to: '/portal/indigency', icon: <MdDescription />, label: 'Cert. of Indigency' },
    { to: '/portal/residency', icon: <MdHome />,        label: 'Cert. of Residency' },
    { to: '/portal/permit',    icon: <MdBusiness />,    label: 'Business Permit' },
  ]},
];

export default function ResidentLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/seal.png" alt="seal" style={{ width:40, height:40, objectFit:'contain', flexShrink:0 }} />
          <div className="sidebar-logo-text">
            <strong>E-Sto.Tomas</strong>
            <small>Resident Portal</small>
          </div>
        </div>
        <nav>
          {navItems.map(group => (
            <div key={group.label}>
              <div className="sidebar-section-label">{group.label}</div>
              <ul>
                {group.items.map(item => (
                  <li key={item.to}>
                    <NavLink to={item.to} end={item.end}
                      className={({ isActive }) => isActive ? 'active' : ''}>
                      {item.icon} {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button onClick={handleLogout}
            style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'8px 12px', borderRadius:8, border:'none', cursor:'pointer', background:'transparent', fontSize:12.5, color:'rgba(200,215,255,0.5)', fontFamily:'var(--ff)', transition:'all .15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(229,57,53,0.12)'; e.currentTarget.style.color='#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(200,215,255,0.5)'; }}>
            <MdLogout style={{ width:15 }} /> Logout
          </button>
        </div>
      </aside>
      <div className="main-content">
        <header className="app-header">
          <div className="header-spacer" />
          <div className="header-user">
            <span>{fullName}</span>
            <div className="avatar">{initials}</div>
          </div>
        </header>
        <div className="page-body"><Outlet /></div>
      </div>
    </div>
  );
}
