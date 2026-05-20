import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import {
  MdDashboard, MdPeople, MdShield, MdGavel,
  MdBadge, MdDescription, MdHome,
  MdBusiness, MdHistory, MdVerifiedUser, MdLogout, MdReceiptLong
} from 'react-icons/md';

const navItems = [
  { label: 'Main', items: [
    { to: '/admin',           icon: <MdDashboard />,    label: 'Dashboard',      end: true },
    { to: '/admin/residents', icon: <MdPeople />,       label: 'Residents' },
    { to: '/admin/officials', icon: <MdShield />,       label: 'Officials' },
    { to: '/admin/blotter',   icon: <MdGavel />,        label: 'Blotter Records' },
  ]},
  { label: 'Documents', items: [
    { to: '/admin/clearance', icon: <MdBadge />,        label: 'Clearance' },
    { to: '/admin/indigency', icon: <MdDescription />,  label: 'Indigency' },
    { to: '/admin/residency', icon: <MdHome />,         label: 'Residency' },
    { to: '/admin/permits',   icon: <MdBusiness />,     label: 'Business Permit' },
  ]},
  { label: 'System', items: [
    { to: '/admin/payments',  icon: <MdReceiptLong />,  label: 'Payments' },
    { to: '/admin/history',   icon: <MdHistory />,      label: 'Doc. History' },
    { to: '/admin/verify',    icon: <MdVerifiedUser />, label: 'Verify Accounts' },
  ]},
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase();
  const fullName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/seal.png" alt="seal" style={{ width:40, height:40, objectFit:'contain', flexShrink:0 }} />
          <div className="sidebar-logo-text">
            <strong>E-Sto.Tomas</strong>
            <small>Magarao, Cam. Sur</small>
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
