import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { clearanceAPI, indigencyAPI, residencyAPI, permitAPI, paymentAPI } from '../../utils/api';
import { MdBadge, MdDescription, MdHome, MdBusiness, MdReceiptLong, MdHourglassEmpty, MdCheckCircle } from 'react-icons/md';

const SERVICES = [
  { to: '/portal/clearance', icon: '🪪', label: 'Barangay Clearance', desc: 'General clearance certificate', color: 'blue' },
  { to: '/portal/indigency', icon: '📄', label: 'Cert. of Indigency',  desc: 'Certificate of indigency',    color: 'indigo' },
  { to: '/portal/residency', icon: '🏠', label: 'Cert. of Residency',  desc: 'Proof of residency',          color: 'green' },
  { to: '/portal/permit',    icon: '🏢', label: 'Business Permit',     desc: 'Barangay business permit',    color: 'cyan' },
];

export default function ResidentHome() {
  const { user }            = useAuth();
  const [counts, setCounts] = useState({ pending: 0, approved: 0, payments: 0 });

  useEffect(() => {
    Promise.all([
      clearanceAPI.getMy(), indigencyAPI.getMy(), residencyAPI.getMy(), permitAPI.getMy(),
      paymentAPI.getMy(),
    ]).then(([clr, ind, res, per, pay]) => {
      // FIX #6: API returns { data: [...] }, so use .data.data
      const all = [
        ...(clr.data.data || []),
        ...(ind.data.data || []),
        ...(res.data.data || []),
        ...(per.data.data || []),
      ];
      setCounts({
        pending:  all.filter(d => d.status === 'Pending').length,
        approved: all.filter(d => d.status === 'Approved').length,
        payments: (pay.data.data || []).length,
      });
    }).catch(() => {});
  }, []);

  const now      = new Date();
  const hour     = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div>
      {/* Banner */}
      <div className="dashboard-banner" style={{ marginBottom: 20 }}>
        <div>
          <div className="banner-greeting">{greeting}, {user?.first_name}! 👋</div>
          <div className="banner-sub">Welcome to the Barangay Sto. Tomas Resident Portal</div>
        </div>
        <div className="banner-stats">
          <div className="banner-stat">
            <div className="n">{counts.pending}</div>
            <div className="l">Pending</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div className="banner-stat">
            <div className="n">{counts.approved}</div>
            <div className="l">Approved</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stat-grid col-3" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon amber"><MdHourglassEmpty /></div>
          <div><div className="stat-label">Pending Requests</div><div className="stat-value">{counts.pending}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><MdCheckCircle /></div>
          <div><div className="stat-label">Approved</div><div className="stat-value">{counts.approved}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><MdReceiptLong /></div>
          <div><div className="stat-label">My Payments</div><div className="stat-value">{counts.payments}</div></div>
        </div>
      </div>

      {/* Services */}
      <div className="card">
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Available Services</div>
        <div className="stat-grid col-4">
          {SERVICES.map(s => (
            <Link key={s.to} to={s.to} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, cursor: 'pointer', transition: 'transform .15s', padding: '18px 16px' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                <div style={{ fontSize: 28 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{s.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
