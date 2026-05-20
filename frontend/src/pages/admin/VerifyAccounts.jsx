import { useEffect, useState, useCallback } from 'react';
import { verifyAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import {
  MdCheck, MdClose, MdVerifiedUser, MdPersonOff,
  MdHourglassEmpty, MdLockReset, MdDelete, MdSearch,
  MdVisibility, MdBlock, MdLockOpen, MdRefresh,
} from 'react-icons/md';

/* ── helpers ─────────────────────────────────────────────── */
const fmt  = d => d ? new Date(d).toLocaleDateString('en-PH', { year:'numeric', month:'short', day:'numeric' }) : '—';
const full = r => `${r.last_name}, ${r.first_name}${r.middle_name ? ' ' + r.middle_name : ''}${r.suffix ? ' ' + r.suffix : ''}`;

function InfoRow({ label, value }) {
  return (
    <div style={{ display:'flex', gap:8, padding:'6px 0', borderBottom:'1px solid #f0f3fa' }}>
      <span style={{ fontSize:11, color:'var(--muted)', minWidth:130, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:13, color:'var(--text)', fontWeight:500, wordBreak:'break-word' }}>{value || '—'}</span>
    </div>
  );
}

const TABS = [
  { key:'pending',     label:'Pending',     bg:'245,158,11', color:'var(--amber)' },
  { key:'verified',    label:'Verified',    bg:'31,170,107', color:'var(--green)' },
  { key:'deactivated', label:'Deactivated', bg:'229,57,53',  color:'var(--red)'   },
  { key:'rejected',    label:'Rejected',    bg:'122,138,170',color:'var(--muted)' },
];

export default function VerifyAccounts() {
  const [data,        setData]        = useState({ pending:[], verified:[], deactivated:[], rejected:[], stats:{} });
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('pending');
  const [saving,      setSaving]      = useState(null);
  const [search,      setSearch]      = useState('');
  const [viewModal,   setViewModal]   = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason,setRejectReason]= useState('');
  const [pwModal,     setPwModal]     = useState(null);
  const [newPw,       setNewPw]       = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [savingPw,    setSavingPw]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await verifyAPI.getAll(search);
      setData({
        pending:     res.data.pending     || [],
        verified:    res.data.verified    || [],
        deactivated: res.data.deactivated || [],
        rejected:    res.data.rejected    || [],
        stats:       res.data.stats       || {},
      });
    } catch { toast.error('Failed to load accounts.'); }
    finally  { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setSaving(id);
    try { await verifyAPI.approve(id); toast.success('Account approved!'); load(); }
    catch { toast.error('Failed to approve.'); }
    finally { setSaving(null); }
  };

  const openRejectModal = (user) => { setRejectModal(user); setRejectReason(''); };
  const handleReject = async () => {
    if (!rejectModal) return;
    setSaving(rejectModal.id);
    try {
      await verifyAPI.reject(rejectModal.id, { reason: rejectReason });
      toast.success('Account rejected.');
      setRejectModal(null);
      load();
    } catch { toast.error('Failed to reject.'); }
    finally { setSaving(null); }
  };

  const handleReevaluate = async (user) => {
    if (!window.confirm(`Move ${user.first_name} ${user.last_name}'s account back to Pending for re-evaluation?`)) return;
    setSaving(user.id);
    try {
      await verifyAPI.reevaluate(user.id);
      toast.success('Account moved back to Pending.');
      setTab('pending');
      load();
    } catch { toast.error('Failed to re-evaluate.'); }
    finally { setSaving(null); }
  };

  const handleToggleStatus = async (user) => {
    const isDeactivated = user.status === 'deactivated';
    const msg = isDeactivated
      ? `Reactivate account of ${user.first_name} ${user.last_name}?`
      : `Deactivate account of ${user.first_name} ${user.last_name}? They will not be able to log in.`;
    if (!window.confirm(msg)) return;
    setSaving(user.id);
    try {
      await verifyAPI.toggleStatus(user.id);
      toast.success(isDeactivated ? 'Account reactivated.' : 'Account deactivated.');
      load();
    } catch { toast.error('Failed to update status.'); }
    finally { setSaving(null); }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Permanently delete the account of ${user.first_name} ${user.last_name}? This cannot be undone.`)) return;
    setSaving(user.id);
    try { await verifyAPI.deleteAccount(user.id); toast.success('Account deleted.'); load(); }
    catch { toast.error('Failed to delete account.'); }
    finally { setSaving(null); }
  };

  const openPwModal = (user) => { setPwModal(user); setNewPw(''); setShowPw(false); };
  const handleResetPassword = async () => {
    if (newPw.length < 8) { toast.error('Password must be at least 8 characters.'); return; }
    setSavingPw(true);
    try {
      await verifyAPI.resetPassword(pwModal.id, { new_password: newPw });
      toast.success(`Password reset for ${pwModal.first_name}!`);
      setPwModal(null);
    } catch(err) {
      toast.error(err?.response?.data?.message || 'Failed to reset password.');
    } finally { setSavingPw(false); }
  };

  const rows = data[tab] || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Account Verification</h1>
          <p>Approve, manage, or remove resident accounts</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid col-4" style={{ maxWidth:620, marginBottom:20 }}>
        <div className="stat-card">
          <div className="stat-icon amber"><MdHourglassEmpty /></div>
          <div><div className="stat-label">Pending</div><div className="stat-value">{data.stats.pending ?? 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><MdVerifiedUser /></div>
          <div><div className="stat-label">Verified</div><div className="stat-value">{data.stats.verified ?? 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><MdBlock /></div>
          <div><div className="stat-label">Deactivated</div><div className="stat-value">{data.stats.deactivated ?? 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background:'rgba(122,138,170,.12)', color:'var(--muted)' }}><MdPersonOff /></div>
          <div><div className="stat-label">Rejected</div><div className="stat-value">{data.stats.rejected ?? 0}</div></div>
        </div>
      </div>

      {/* Search */}
      <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
        <div style={{ position:'relative', flex:1, maxWidth:320 }}>
          <MdSearch style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--muted)', fontSize:17 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or username…"
            style={{ width:'100%', padding:'8px 10px 8px 32px', border:'1px solid var(--border)', borderRadius:8, fontSize:13, fontFamily:'var(--ff)', outline:'none', background:'#fff', color:'var(--text)' }}
            onFocus={e => e.target.style.borderColor = 'var(--blue)'}
            onBlur={e  => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
        {search && (
          <button onClick={() => setSearch('')}
            style={{ fontSize:12, color:'var(--muted)', background:'none', border:'none', cursor:'pointer' }}>
            Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'2px solid #e8ecf5', marginBottom:16 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:'9px 20px', background:'none', border:'none', fontFamily:'var(--ff)', fontSize:13.5, fontWeight:600, cursor:'pointer', color: tab === t.key ? 'var(--blue)' : 'var(--muted)', borderBottom: tab === t.key ? '2px solid var(--blue)' : '2px solid transparent', marginBottom:-2, display:'flex', alignItems:'center', gap:8 }}>
            {t.label}
            {(data.stats[t.key] ?? 0) > 0 && (
              <span style={{ background:`rgba(${t.bg},.12)`, color:t.color, fontSize:11, padding:'1px 7px', borderRadius:10, fontWeight:700 }}>
                {data.stats[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Rejected tab info banner */}
      {tab === 'rejected' && (
        <div style={{ padding:'10px 14px', background:'rgba(122,138,170,.08)', border:'1px solid rgba(122,138,170,.2)', borderRadius:8, fontSize:12.5, color:'var(--muted)', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
          <MdPersonOff style={{ fontSize:16, flexShrink:0 }} />
          These accounts were rejected during registration. You can permanently delete them or move them back to Pending for re-evaluation.
        </div>
      )}

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>#</th>
            <th>Name</th>
            <th>Username</th>
            <th>Zone / Purok</th>
            <th>Registered</th>
            <th>Status</th>
            {tab === 'rejected' && <th>Rejection Reason</th>}
            <th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={tab === 'rejected' ? 8 : 7} style={{ textAlign:'center', padding:40 }}>
                <div className="spinner" style={{ margin:'0 auto' }} />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={tab === 'rejected' ? 8 : 7}>
                <div className="empty-state">
                  <p>
                    {search
                      ? `No ${tab} accounts matching "${search}".`
                      : tab === 'pending'     ? 'No pending accounts.'
                      : tab === 'verified'    ? 'No verified accounts yet.'
                      : tab === 'deactivated' ? 'No deactivated accounts.'
                      :                         'No rejected accounts.'}
                  </p>
                </div>
              </td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id}>
                <td style={{ color:'var(--muted)', fontSize:12 }}>{i + 1}</td>

                {/* Name */}
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div className="avatar" style={{ width:30, height:30, fontSize:11, flexShrink:0,
                      opacity: (r.status === 'deactivated' || r.status === 'rejected') ? 0.45 : 1 }}>
                      {r.first_name[0]}{r.last_name[0]}
                    </div>
                    <span style={{ color: (r.status === 'deactivated' || r.status === 'rejected') ? 'var(--muted)' : 'var(--text)' }}>
                      {full(r)}
                    </span>
                  </div>
                </td>

                <td><span style={{ fontFamily:'var(--ffm)', fontSize:12, color:'var(--muted)' }}>{r.username}</span></td>
                <td style={{ fontSize:12, color:'var(--muted)' }}>{r.purok || '—'}</td>
                <td style={{ fontSize:12, color:'var(--muted)' }}>{fmt(r.created_at)}</td>

                {/* Status badge */}
                <td>
                  {r.status === 'pending'     && <span className="badge badge-pending">Pending</span>}
                  {r.status === 'verified'    && <span className="badge badge-released">Verified</span>}
                  {r.status === 'deactivated' && <span className="badge badge-rejected">Deactivated</span>}
                  {r.status === 'rejected'    && <span className="badge badge-dismissed">Rejected</span>}
                </td>

                {/* Rejection reason column — only on rejected tab */}
                {tab === 'rejected' && (
                  <td style={{ fontSize:12, color:'var(--muted)', maxWidth:200 }}>
                    {r.rejection_reason
                      ? <span style={{ color:'var(--red)', fontStyle:'italic' }}>{r.rejection_reason}</span>
                      : <span style={{ opacity:0.4 }}>No reason given</span>}
                  </td>
                )}

                {/* Actions */}
                <td>
                  <div className="td-actions">
                    {/* View profile — always */}
                    <button className="icon-btn view" onClick={() => setViewModal(r)} title="View Full Profile">
                      <MdVisibility />
                    </button>

                    {/* Pending actions */}
                    {tab === 'pending' && (<>
                      <button className="icon-btn approve" onClick={() => handleApprove(r.id)} disabled={saving === r.id} title="Approve">
                        {saving === r.id ? '…' : <MdCheck />}
                      </button>
                      <button className="icon-btn reject" onClick={() => openRejectModal(r)} disabled={saving === r.id} title="Reject">
                        <MdClose />
                      </button>
                    </>)}

                    {/* Verified / Deactivated actions */}
                    {(tab === 'verified' || tab === 'deactivated') && (<>
                      {tab === 'verified' && (
                        <button className="icon-btn edit" onClick={() => openPwModal(r)} disabled={saving === r.id} title="Reset Password"
                          style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', fontSize:12, width:'auto' }}>
                          <MdLockReset style={{ fontSize:15 }} /> Reset PW
                        </button>
                      )}
                      <button
                        className={`icon-btn ${r.status === 'deactivated' ? 'approve' : 'reject'}`}
                        onClick={() => handleToggleStatus(r)} disabled={saving === r.id}
                        title={r.status === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', fontSize:12, width:'auto' }}>
                        {r.status === 'deactivated'
                          ? <><MdLockOpen style={{ fontSize:15 }} /> Reactivate</>
                          : <><MdBlock   style={{ fontSize:15 }} /> Deactivate</>}
                      </button>
                      <button className="icon-btn del" onClick={() => handleDelete(r)} disabled={saving === r.id} title="Delete Account"
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', fontSize:12, width:'auto' }}>
                        <MdDelete style={{ fontSize:15 }} /> Delete
                      </button>
                    </>)}

                    {/* Rejected tab actions */}
                    {tab === 'rejected' && (<>
                      <button className="icon-btn approve" onClick={() => handleReevaluate(r)} disabled={saving === r.id} title="Move back to Pending"
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', fontSize:12, width:'auto' }}>
                        <MdRefresh style={{ fontSize:15 }} /> Re-evaluate
                      </button>
                      <button className="icon-btn del" onClick={() => handleDelete(r)} disabled={saving === r.id} title="Permanently Delete"
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'5px 10px', fontSize:12, width:'auto' }}>
                        <MdDelete style={{ fontSize:15 }} /> Delete
                      </button>
                    </>)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">{rows.length} account(s){search ? ` matching "${search}"` : ''}</div>
      </div>

      {/* ── VIEW PROFILE MODAL ── */}
      {viewModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,50,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:500, boxShadow:'0 20px 60px rgba(0,0,0,0.18)', maxHeight:'90vh', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div className="avatar" style={{ width:44, height:44, fontSize:16, flexShrink:0 }}>
                  {viewModal.first_name[0]}{viewModal.last_name[0]}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:16 }}>{full(viewModal)}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>
                    <span style={{ fontFamily:'var(--ffm)' }}>@{viewModal.username}</span>
                    &nbsp;·&nbsp;
                    {viewModal.status === 'pending'     && <span className="badge badge-pending"  style={{ fontSize:10 }}>Pending</span>}
                    {viewModal.status === 'verified'    && <span className="badge badge-released" style={{ fontSize:10 }}>Verified</span>}
                    {viewModal.status === 'deactivated' && <span className="badge badge-rejected" style={{ fontSize:10 }}>Deactivated</span>}
                    {viewModal.status === 'rejected'    && <span className="badge badge-dismissed"style={{ fontSize:10 }}>Rejected</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:20 }}><MdClose /></button>
            </div>

            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginBottom:8 }}>Personal Information</div>
            <InfoRow label="Full Name"      value={full(viewModal)} />
            <InfoRow label="Gender"         value={viewModal.gender} />
            <InfoRow label="Age"            value={viewModal.age} />
            <InfoRow label="Civil Status"   value={viewModal.civil_status} />
            <InfoRow label="Birthdate"      value={fmt(viewModal.birthdate)} />

            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginTop:16, marginBottom:8 }}>Contact & Address</div>
            <InfoRow label="Zone / Purok"   value={viewModal.purok} />
            <InfoRow label="Address"        value={viewModal.address} />
            <InfoRow label="Contact Number" value={viewModal.contact_number || viewModal.contact} />
            <InfoRow label="Email"          value={viewModal.email} />

            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginTop:16, marginBottom:8 }}>Classification</div>
            <InfoRow label="Voter"          value={viewModal.is_voter  ? '✅ Yes' : 'No'} />
            <InfoRow label="PWD"            value={viewModal.is_pwd    ? '✅ Yes' : 'No'} />
            <InfoRow label="Senior Citizen" value={viewModal.is_senior ? '✅ Yes' : 'No'} />
            <InfoRow label="Minor"          value={viewModal.is_minor  ? '✅ Yes' : 'No'} />

            <div style={{ fontSize:11, fontWeight:700, letterSpacing:1, textTransform:'uppercase', color:'var(--muted)', marginTop:16, marginBottom:8 }}>Account</div>
            <InfoRow label="Registered"     value={fmt(viewModal.created_at)} />
            <InfoRow label="Status"         value={viewModal.status.charAt(0).toUpperCase() + viewModal.status.slice(1)} />

            {/* Rejection reason — shown if rejected */}
            {viewModal.status === 'rejected' && (
              <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(122,138,170,.08)', border:'1px solid rgba(122,138,170,.2)', borderRadius:8 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', marginBottom:4 }}>REJECTION REASON</div>
                <div style={{ fontSize:13, color: viewModal.rejection_reason ? 'var(--text)' : 'var(--muted)', fontStyle: viewModal.rejection_reason ? 'normal' : 'italic' }}>
                  {viewModal.rejection_reason || 'No reason provided.'}
                </div>
              </div>
            )}

            {/* Pending quick actions */}
            {viewModal.status === 'pending' && (
              <div style={{ display:'flex', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid #f0f3fa' }}>
                <button onClick={() => { handleApprove(viewModal.id); setViewModal(null); }}
                  style={{ flex:1, padding:10, borderRadius:8, border:'none', background:'rgba(31,170,107,.1)', color:'var(--green)', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <MdCheck /> Approve
                </button>
                <button onClick={() => { setViewModal(null); openRejectModal(viewModal); }}
                  style={{ flex:1, padding:10, borderRadius:8, border:'none', background:'rgba(229,57,53,.1)', color:'var(--red)', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <MdClose /> Reject
                </button>
              </div>
            )}

            {/* Rejected quick actions */}
            {viewModal.status === 'rejected' && (
              <div style={{ display:'flex', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid #f0f3fa' }}>
                <button onClick={() => { handleReevaluate(viewModal); setViewModal(null); }}
                  style={{ flex:1, padding:10, borderRadius:8, border:'none', background:'rgba(31,170,107,.1)', color:'var(--green)', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <MdRefresh /> Re-evaluate
                </button>
                <button onClick={() => { setViewModal(null); handleDelete(viewModal); }}
                  style={{ flex:1, padding:10, borderRadius:8, border:'none', background:'rgba(229,57,53,.1)', color:'var(--red)', fontWeight:600, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <MdDelete /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REJECT MODAL ── */}
      {rejectModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,50,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:420, boxShadow:'0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>Reject Account</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                  {rejectModal.first_name} {rejectModal.last_name} &nbsp;·&nbsp;
                  <span style={{ fontFamily:'var(--ffm)' }}>@{rejectModal.username}</span>
                </div>
              </div>
              <button onClick={() => setRejectModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:20 }}><MdClose /></button>
            </div>
            <div style={{ padding:'10px 14px', background:'rgba(122,138,170,.08)', border:'1px solid rgba(122,138,170,.2)', borderRadius:8, fontSize:12, color:'var(--muted)', marginBottom:16 }}>
              The account will be moved to the <strong>Rejected</strong> tab. You can re-evaluate it later or delete it permanently.
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>
                Rejection Reason <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(optional)</span>
              </label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="e.g. Incomplete information, duplicate account, unverifiable address…"
                rows={3}
                style={{ width:'100%', padding:'10px 13px', borderRadius:8, border:'1px solid var(--border)', fontSize:13, fontFamily:'var(--ff)', boxSizing:'border-box', outline:'none', resize:'vertical' }}
                onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>Visible in the Rejected tab and saved to activity log.</div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setRejectModal(null)}
                style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff)' }}>
                Cancel
              </button>
              <button onClick={handleReject} disabled={saving === rejectModal?.id}
                style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'var(--red)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff)', display:'flex', alignItems:'center', gap:6, opacity: saving === rejectModal?.id ? 0.6 : 1 }}>
                <MdPersonOff style={{ fontSize:15 }} />
                {saving === rejectModal?.id ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── RESET PASSWORD MODAL ── */}
      {pwModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(10,20,50,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:20 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:28, width:'100%', maxWidth:400, boxShadow:'0 20px 60px rgba(0,0,0,0.18)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:16 }}>Reset Password</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                  {pwModal.first_name} {pwModal.last_name} &nbsp;·&nbsp;
                  <span style={{ fontFamily:'var(--ffm)' }}>@{pwModal.username}</span>
                </div>
              </div>
              <button onClick={() => setPwModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:20 }}><MdClose /></button>
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em', display:'block', marginBottom:6 }}>New Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ width:'100%', padding:'10px 40px 10px 13px', borderRadius:8, border:'1px solid var(--border)', fontSize:13.5, fontFamily:'var(--ff)', boxSizing:'border-box', outline:'none' }}
                  onFocus={e => e.target.style.borderColor = 'var(--blue)'}
                  onBlur={e  => e.target.style.borderColor = 'var(--border)'} />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--muted)', fontSize:14 }}>
                  {showPw ? '🙈' : '👁️'}
                </button>
              </div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:5 }}>This immediately replaces the resident's current password.</div>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setPwModal(null)}
                style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--muted)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff)' }}>
                Cancel
              </button>
              <button onClick={handleResetPassword} disabled={savingPw || newPw.length < 8}
                style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'var(--blue)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff)', opacity:(savingPw || newPw.length < 8) ? 0.6 : 1, display:'flex', alignItems:'center', gap:6 }}>
                <MdLockReset style={{ fontSize:16 }} />
                {savingPw ? 'Saving…' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
