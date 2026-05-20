import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function RequestForm({ title, subtitle, icon, api, extraFields = [] }) {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [purpose, setPurpose] = useState('');
  const [extra,   setExtra]   = useState({});
  const [loading, setLoading] = useState(false);

  const setE = k => e => setExtra(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.create({ purpose, ...extra });
      // FIX #11: backend now returns ref_number (was reference_no before)
      toast.success(`Request submitted! Ref #: ${res.data.ref_number}`);
      navigate('/portal/requests');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    } finally { setLoading(false); }
  };

  const fullName = `${user?.first_name || ''} ${user?.middle_name ? user.middle_name + ' ' : ''}${user?.last_name || ''}${user?.suffix ? ' ' + user.suffix : ''}`.trim();

  return (
    <div style={{ maxWidth:560 }}>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="card">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, paddingBottom:18, borderBottom:'1px solid #f0f3fa' }}>
          <div style={{ fontSize:32 }}>{icon}</div>
          <div>
            <div style={{ fontWeight:600, fontSize:15 }}>{title}</div>
            <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:2 }}>Fill out the form below to submit your request</div>
          </div>
        </div>

        {/* Applicant info (read-only) */}
        <div style={{ background:'#f8faff', border:'1px solid #eef2fa', borderRadius:10, padding:'12px 16px', marginBottom:20 }}>
          <div style={{ fontSize:10.5, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', color:'var(--muted)', marginBottom:6 }}>Applicant Information</div>
          <div style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{fullName}</div>
          <div style={{ fontSize:12.5, color:'var(--muted)', marginTop:2 }}>Username: {user?.username}</div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Purpose *</label>
            <textarea className="form-textarea" value={purpose} onChange={e => setPurpose(e.target.value)}
              required placeholder="State the purpose of this request…" />
          </div>

          {extraFields.map(field => (
            <div className="form-group" key={field.key}>
              <label className="form-label">{field.label}{field.required && ' *'}</label>
              {field.type === 'select' ? (
                <select className="form-select" value={extra[field.key] || ''} onChange={setE(field.key)} required={field.required}>
                  <option value="">Select…</option>
                  {field.options.map(o => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input className="form-input" type={field.type || 'text'}
                  value={extra[field.key] || ''} onChange={setE(field.key)}
                  placeholder={field.placeholder || ''} required={field.required} />
              )}
            </div>
          ))}

          <div style={{ background:'rgba(58,123,213,0.06)', border:'1px solid rgba(58,123,213,0.15)', borderRadius:8, padding:'10px 14px', fontSize:12.5, color:'var(--blue)', marginBottom:20 }}>
            ℹ️ Processing time: <strong>1–3 business days</strong>. You will be notified once your request is approved. Visit the barangay hall to claim released documents.
          </div>

          <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/portal')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
