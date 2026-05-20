import { useEffect, useState } from 'react';
import { dashboardAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { MdPeople, MdHourglassEmpty, MdVerifiedUser, MdDescription } from 'react-icons/md';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BLOTTER_COLORS = { Open:'#e53935', Ongoing:'#f59e0b', Settled:'#1faa6b', Dismissed:'#7a8aaa', 'Under Investigation':'#6366f1' };
const ZONE_COLORS = ['#3a7bd5','#1faa6b','#f59e0b','#e53935','#6366f1','#0891b2'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getStats()
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  const monthlyData = MONTHS.map((m, i) => {
    const found = data?.monthly?.find(r => r.month === i + 1);
    return { month: m, requests: found?.count || 0 };
  });

  const blotterData = (data?.blotterStats || []).map(r => ({
    name: r.status, value: Number(r.count), color: BLOTTER_COLORS[r.status] || '#7a8aaa',
  }));

  const zoneData = (data?.zoneStats || []).map((r, i) => ({
    name: r.purok, value: Number(r.count), color: ZONE_COLORS[i % ZONE_COLORS.length],
  }));

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
  const dateStr = now.toLocaleDateString('en-PH', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

  return (
    <div>
      {/* Banner */}
      <div className="dashboard-banner">
        <div>
          <div className="banner-greeting">{greeting}, Admin! 👋</div>
          <div className="banner-sub">Here's what's happening in Barangay Sto. Tomas — {dateStr}</div>
        </div>
        <div className="banner-stats">
          <div className="banner-stat">
            <div className="n">{data?.stats?.totalDocs || 0}</div>
            <div className="l">Total Docs</div>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.1)' }} />
          <div className="banner-stat">
            <div className="n">{data?.stats?.residents || 0}</div>
            <div className="l">Residents</div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid col-4">
        <div className="stat-card">
          <div className="stat-icon amber"><MdHourglassEmpty /></div>
          <div><div className="stat-label">Pending Requests</div><div className="stat-value">{data?.stats?.pending || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><MdVerifiedUser /></div>
          <div><div className="stat-label">To Verify</div><div className="stat-value">{data?.stats?.toVerify || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><MdPeople /></div>
          <div><div className="stat-label">Total Residents</div><div className="stat-value">{data?.stats?.residents || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><MdDescription /></div>
          <div><div className="stat-label">Total Documents</div><div className="stat-value">{data?.stats?.totalDocs || 0}</div></div>
        </div>
      </div>

      {/* Charts: large bar left, zone + blotter stacked right */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, alignItems: 'start' }}>

        {/* LEFT: Document Requests — tall bar chart */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Document Requests This Year</div>
            <span style={{ background:'rgba(58,123,213,0.08)', color:'var(--blue)', fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20 }}>{now.getFullYear()}</span>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={monthlyData} margin={{ top:4, right:8, bottom:0, left:-16 }}>
              <XAxis dataKey="month" tick={{ fontSize: 11, fill:'#b0bcce' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill:'#b0bcce' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid #eef0f6' }} />
              <Bar dataKey="requests" fill="#3a7bd5" radius={[5,5,0,0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* RIGHT COLUMN: Zone + Blotter stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Residents by Zone donut */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Residents by Zone</div>
            {zoneData.length > 0 ? (
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie
                    data={zoneData}
                    cx="50%" cy="46%"
                    innerRadius={54} outerRadius={78}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {zoneData.map((z, i) => <Cell key={i} fill={z.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                  <Legend iconSize={9} wrapperStyle={{ fontSize:11, paddingTop: 6 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding: 24 }}>No data</div>}
          </div>

          {/* Blotter Status bar chart */}
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Blotter Status</div>
            {blotterData.length > 0 ? (
              <ResponsiveContainer width="100%" height={148}>
                <BarChart data={blotterData} margin={{ top:4, right:8, bottom:0, left:-16 }}>
                  <XAxis dataKey="name" tick={{ fontSize:10, fill:'#b0bcce' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#b0bcce' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }} />
                  <Bar dataKey="value" radius={[5,5,0,0]} maxBarSize={38}>
                    {blotterData.map((b, i) => <Cell key={i} fill={b.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="empty-state" style={{ padding: 24 }}>No data</div>}
          </div>

        </div>
      </div>
    </div>
  );
}
