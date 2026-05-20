import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook } from 'react-icons/fa';
import { officialsAPI } from '../utils/api';

const SERVICES = [
  { icon: '🪪', title: 'Barangay Clearance',       desc: 'For employment, travel, and legal requirements.' },
  { icon: '📄', title: 'Certificate of Indigency', desc: 'For PhilHealth, 4Ps, and scholarship applications.' },
  { icon: '🏠', title: 'Certificate of Residency', desc: 'Proof of residency for school and government transactions.' },
  { icon: '🏢', title: 'Business Permit',          desc: 'Barangay clearance for business operations.' },
];

const POSITION_ORDER = [
  'Punong Barangay', 'Barangay Secretary', 'Barangay Treasurer',
  'Kagawad', 'SK Chairman',
];

function sortOfficials(officials) {
  return [...officials].sort((a, b) => {
    const ai = POSITION_ORDER.findIndex(p => a.position?.includes(p));
    const bi = POSITION_ORDER.findIndex(p => b.position?.includes(p));
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

export default function Landing() {
  const [officials, setOfficials] = useState([]);

  // FIX: Fetch officials from database instead of hardcoded list
  useEffect(() => {
    officialsAPI.getAll()
      .then(r => setOfficials(sortOfficials(r.data.data || [])))
      .catch(() => setOfficials([]));
  }, []);

  const punong   = officials.find(o => o.position?.includes('Punong Barangay'));
  const kagawads = officials.filter(o => !o.position?.includes('Punong Barangay'));

  return (
    <div style={{ fontFamily: 'var(--ff)', color: 'var(--text)', minHeight: '100vh', background: '#f0f3fa' }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        background: 'var(--navy)', padding: '0 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64, position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 16px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/seal.png" alt="seal" style={{ width:36, height:36, objectFit:'contain' }} />
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, lineHeight: 1.2 }}>E-Sto.Tomas</div>
            <div style={{ color: 'rgba(200,215,255,0.5)', fontSize: 11 }}>Magarao, Camarines Sur</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <a href="#services"  style={{ color: 'rgba(200,215,255,0.7)', fontSize: 13.5, textDecoration: 'none', padding: '6px 12px' }}>Services</a>
          <a href="#officials" style={{ color: 'rgba(200,215,255,0.7)', fontSize: 13.5, textDecoration: 'none', padding: '6px 12px' }}>Officials</a>
          <a href="#contact"   style={{ color: 'rgba(200,215,255,0.7)', fontSize: 13.5, textDecoration: 'none', padding: '6px 12px' }}>Contact</a>
          <Link to="/login" style={{
            background: 'var(--blue)', color: '#fff', padding: '8px 20px',
            borderRadius: 8, fontSize: 13.5, fontWeight: 600, textDecoration: 'none', marginLeft: 8,
          }}>Login</Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy) 0%, #1a3a7a 60%, var(--blue) 100%)',
        padding: '80px 40px 90px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:300, height:300, borderRadius:'50%', background:'rgba(58,123,213,0.15)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, left:-80, width:400, height:400, borderRadius:'50%', background:'rgba(255,255,255,0.04)', pointerEvents:'none' }} />
        <div style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <img src="/seal.png" alt="Brgy. Sto. Tomas Seal" style={{ width:120, height:120, objectFit:'contain', margin:'0 auto 18px', display:'block', border:'none', borderRadius:0, boxShadow:'none', background:'transparent' }} />
          <h1 style={{ color: '#fff', fontSize: 36, fontWeight: 800, margin: '0 0 14px', lineHeight: 1.2 }}>
            E-Sto.Tomas<br />
            <span style={{ color: '#5b9cf6' }}>Document Request Management System</span>
          </h1>
          <p style={{ color: 'rgba(200,215,255,0.75)', fontSize: 16, margin: '0 0 36px', lineHeight: 1.7 }}>
            Your one-stop online portal for barangay document requests,<br />
            resident services, and community information.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" style={{ background:'var(--blue)', color:'#fff', padding:'14px 32px', borderRadius:10, fontSize:15, fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8, boxShadow:'0 4px 20px rgba(58,123,213,0.4)' }}>
              🔑 Login to Portal
            </Link>
            <Link to="/register" style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.25)', padding:'14px 32px', borderRadius:10, fontSize:15, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              📝 Create an Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: 'var(--blue)', padding: '28px 40px' }}>
        <div style={{ maxWidth:900, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20 }}>
          {[['24/7','Online Services'],['4','Document Types'],['Fast','Processing Time'],['Free','Account Registration']].map(([v,l]) => (
            <div key={l} style={{ textAlign:'center' }}>
              <div style={{ color:'#fff', fontSize:26, fontWeight:800 }}>{v}</div>
              <div style={{ color:'rgba(200,235,255,0.8)', fontSize:12, marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'64px 40px', background:'#fff' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ color:'var(--blue)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>How It Works</div>
            <h2 style={{ fontSize:24, fontWeight:800 }}>Request documents in 3 easy steps</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, maxWidth:700, margin:'0 auto' }}>
            {[
              { n:'1', icon:'📝', title:'Create an Account', desc:'Register with your personal information and wait for admin verification.' },
              { n:'2', icon:'📋', title:'Submit a Request',  desc:'Select the document you need and fill out the online form with your purpose.' },
              { n:'3', icon:'🏛️', title:'Claim Your Document', desc:'Pay the fee online or at the barangay hall. Pick up your document when released.' },
            ].map(s => (
              <div key={s.n} style={{ textAlign:'center', padding:'28px 20px', background:'#f8faff', borderRadius:14, border:'1px solid #eef2fa' }}>
                <div style={{ width:44, height:44, borderRadius:'50%', background:'var(--blue)', color:'#fff', fontWeight:800, fontSize:18, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>{s.n}</div>
                <div style={{ fontSize:32, marginBottom:12 }}>{s.icon}</div>
                <div style={{ fontWeight:700, fontSize:14, marginBottom:8 }}>{s.title}</div>
                <div style={{ color:'var(--muted)', fontSize:13, lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding:'64px 40px', background:'#f0f3fa' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ color:'var(--blue)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Our Services</div>
            <h2 style={{ fontSize:24, fontWeight:800 }}>Available Document Requests</h2>
            <p style={{ color:'var(--muted)', marginTop:10, fontSize:14 }}>All documents can be requested online. Create an account to get started.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
            {SERVICES.map(s => (
              <div key={s.title} style={{ display:'flex', alignItems:'flex-start', gap:16, background:'#fff', border:'1px solid #eef2fa', borderRadius:12, padding:'20px 22px' }}>
                <div style={{ fontSize:36, flexShrink:0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:5 }}>{s.title}</div>
                  <div style={{ color:'var(--muted)', fontSize:13, lineHeight:1.6 }}>{s.desc}</div>
                  <Link to="/register" style={{ color:'var(--blue)', fontSize:12.5, fontWeight:600, textDecoration:'none', marginTop:8, display:'inline-block' }}>Request now →</Link>
                </div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', marginTop:32 }}>
            <Link to="/register" style={{ background:'var(--blue)', color:'#fff', padding:'13px 32px', borderRadius:10, fontSize:14, fontWeight:700, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
              📝 Register to Request Documents
            </Link>
          </div>
        </div>
      </section>

      {/* ── OFFICIALS ── */}
      <section id="officials" style={{ padding:'64px 40px', background:'#fff' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ color:'var(--blue)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Barangay Officials</div>
            <h2 style={{ fontSize:24, fontWeight:800 }}>Your Elected Leaders</h2>
            <p style={{ color:'var(--muted)', marginTop:8, fontSize:14 }}>Term: 2023 – 2026</p>
          </div>

          {officials.length === 0 ? (
            <div style={{ textAlign:'center', color:'var(--muted)', padding:'40px 0' }}>Loading officials...</div>
          ) : (
            <>
              {/* Punong Barangay — featured */}
              {punong && (
                <div style={{ display:'flex', justifyContent:'center', marginBottom:24 }}>
                  <div style={{ background:'linear-gradient(135deg,var(--navy),#1a3a7a)', borderRadius:16, padding:'24px 40px', textAlign:'center', color:'#fff', minWidth:280 }}>
                    <div style={{ width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 12px' }}>👑</div>
                    <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>
                      Hon. {punong.first_name} {punong.last_name}
                    </div>
                    <div style={{ fontSize:12, color:'rgba(200,215,255,0.7)' }}>{punong.position}</div>
                  </div>
                </div>
              )}

              {/* Other officials grid */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                {kagawads.map(o => (
                  <div key={o.id} style={{ background:'#f8faff', border:'1px solid #eef2fa', borderRadius:12, padding:'18px 16px', textAlign:'center' }}>
                    <div style={{ width:44, height:44, borderRadius:'50%', background:'rgba(58,123,213,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, margin:'0 auto 10px' }}>🧑‍💼</div>
                    <div style={{ fontWeight:700, fontSize:13, marginBottom:4 }}>
                      Hon. {o.first_name} {o.last_name}
                    </div>
                    <div style={{ color:'var(--blue)', fontSize:11.5, fontWeight:600 }}>{o.position}</div>
                    {o.committee && <div style={{ color:'var(--muted)', fontSize:11, marginTop:3 }}>{o.committee}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding:'64px 40px', background:'#f0f3fa' }}>
        <div style={{ maxWidth:700, margin:'0 auto', textAlign:'center' }}>
          <div style={{ color:'var(--blue)', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>Contact Us</div>
          <h2 style={{ fontSize:24, fontWeight:800, margin:'0 0 32px' }}>Barangay Hall Information</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:36 }}>
            {[
              { icon:'📍', label:'Address',      value:'Zone 6, Sto. Tomas\nMagarao, Camarines Sur' },
              { icon:'🕐', label:'Office Hours', value:'Monday – Friday\n8:00 AM – 5:00 PM' },
              { icon:'📞', label:'Contact',      value:'09324567123' },
              { icon:null, label:'Facebook',     value:'Brgy. Sto. Tomas Magarao', link:'https://www.facebook.com/brgy.sto.tomas.magarao' },
            ].map(c => (
              <div key={c.label} style={{ background:'#fff', border:'1px solid #eef2fa', borderRadius:12, padding:'20px 16px' }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{c.icon ?? <FaFacebook style={{ color:'#1877F2', fontSize:32 }} />}</div>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>{c.label}</div>
                {c.link
                  ? <a href={c.link} target="_blank" rel="noopener noreferrer" style={{ color:'var(--blue)', fontSize:12.5, lineHeight:1.6, whiteSpace:'pre-line', textDecoration:'none', fontWeight:600 }}>{c.value}</a>
                  : <div style={{ color:'var(--muted)', fontSize:12.5, lineHeight:1.6, whiteSpace:'pre-line' }}>{c.value}</div>
                }
              </div>
            ))}
          </div>
          <div style={{ background:'linear-gradient(135deg,var(--navy),#1a3a7a)', borderRadius:16, padding:'36px 32px', color:'#fff' }}>
            <div style={{ fontSize:32, marginBottom:12 }}>🚀</div>
            <h3 style={{ margin:'0 0 10px', fontSize:20, fontWeight:800 }}>Ready to get started?</h3>
            <p style={{ color:'rgba(200,215,255,0.75)', margin:'0 0 24px', fontSize:14 }}>
              Create your account today and access barangay services online.
            </p>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <Link to="/register" style={{ background:'var(--blue)', color:'#fff', padding:'12px 28px', borderRadius:9, fontSize:14, fontWeight:700, textDecoration:'none' }}>Create Account</Link>
              <Link to="/login"    style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'1px solid rgba(255,255,255,0.2)', padding:'12px 28px', borderRadius:9, fontSize:14, fontWeight:600, textDecoration:'none' }}>Login</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background:'var(--navy)', color:'rgba(200,215,255,0.4)', textAlign:'center', padding:'24px 40px', fontSize:12.5 }}>
        © 2026 E-Sto.Tomas · Barangay Sto. Tomas, Magarao, Camarines Sur. All rights reserved.
        <span style={{ margin:'0 12px' }}>·</span>
        <Link to="/login"    style={{ color:'rgba(200,215,255,0.4)', textDecoration:'none' }}>Login</Link>
        <span style={{ margin:'0 12px' }}>·</span>
        <Link to="/register" style={{ color:'rgba(200,215,255,0.4)', textDecoration:'none' }}>Register</Link>
      </footer>

    </div>
  );
}
