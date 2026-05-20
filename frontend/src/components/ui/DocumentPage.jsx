import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { MdSearch, MdPrint, MdEdit, MdDelete, MdDirectionsWalk } from 'react-icons/md';
import { printDocument } from '../../utils/printDocument';

const FEES = { clearance: 50, indigency: 0, residency: 50, permits: 200 };

const WALKIN_EMPTY = {
  full_name: '', purpose: '', address: '',
  payment_method: 'Cash', amount: '', issued_by: '',
  gcash_number: '', maya_number: '',
};

export default function DocumentPage({
  title, subtitle, api, refPrefix, docKey,
  statCards,
  extraFormFields,
}) {
  const [rows,       setRows]       = useState([]);
  const [stats,      setStats]      = useState({});
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [modal,      setModal]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [statusForm, setStatusForm] = useState({ status:'', rejection_reason:'', issued_by:'' });
  const [walkinForm, setWalkinForm] = useState(WALKIN_EMPTY);
  const [saving,     setSaving]     = useState(false);

  // Set default fee when docKey changes
  useEffect(() => {
    if (docKey) setWalkinForm(p => ({ ...p, amount: FEES[docKey] ?? 50 }));
  }, [docKey]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getAll({ search, status });
      setRows(res.data.data);
      setStats(res.data.stats || {});
    } catch { toast.error(`Failed to load ${title}.`); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  const openStatus  = (row) => { setSelected(row); setStatusForm({ status: row.status, rejection_reason: row.rejection_reason || '', issued_by: row.issued_by || '' }); setModal('status'); };
  const openDelete  = (row) => { setSelected(row); setModal('delete'); };
  const openWalkin  = () => { setWalkinForm({ ...WALKIN_EMPTY, amount: FEES[docKey] ?? 50 }); setModal('walkin'); };
  const closeModal  = () => { setModal(null); setSelected(null); };

  const setW = k => e => setWalkinForm(p => ({ ...p, [k]: e.target.value }));

  const handleStatusUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.updateStatus(selected.id, statusForm);
      toast.success(`Status updated to ${statusForm.status}.`);
      closeModal(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update status.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await api.remove(selected.id); toast.success('Request deleted.'); closeModal(); load(); }
    catch { toast.error('Failed to delete.'); }
    finally { setSaving(false); }
  };

  const handleWalkin = async (e) => {
    e.preventDefault();
    if (!walkinForm.full_name.trim()) return toast.error('Full name is required.');
    if (!walkinForm.purpose.trim())   return toast.error('Purpose is required.');
    if (walkinForm.payment_method === 'GCash' && !walkinForm.gcash_number.trim())
      return toast.error('GCash number is required.');
    if (walkinForm.payment_method === 'Maya' && !walkinForm.maya_number.trim())
      return toast.error('Maya number is required.');
    setSaving(true);
    try {
      const res = await api.walkin(walkinForm);
      toast.success(`Walk-in processed! Ref: ${res.data.doc.ref_number}`);
      closeModal(); load();
      // Auto-print the document
      handlePrint(res.data.doc);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to process walk-in.'); }
    finally { setSaving(false); }
  };

  const handlePrint = (row) => printDocument(row, title);

  return (
    <div>
      <div className="page-header">
        <div><h1>{title}</h1><p>{subtitle}</p></div>
        {/* Walk-in button */}
        <button className="btn btn-primary" onClick={openWalkin}
          style={{ display:'flex', alignItems:'center', gap:7 }}>
          <MdDirectionsWalk style={{ fontSize:18 }} /> Walk-in Request
        </button>
      </div>

      {/* Stat Cards */}
      {statCards && (
        <div className="stat-grid col-4" style={{ marginBottom:16 }}>
          {statCards.map(s => (
            <div className="stat-card" key={s.label}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div><div className="stat-label">{s.label}</div><div className="stat-value">{stats[s.key] || 0}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div className="search-bar">
        <div className="search-wrap">
          <MdSearch />
          <input className="search-input" placeholder="Search name or ref#…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Pending</option><option>Approved</option>
          <option>Released</option><option>Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>Ref #</th><th>Resident Name</th><th>Purpose</th>
            <th>Type</th><th>OR Number</th><th>Date</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40 }}>
                <div className="spinner" style={{ margin:'0 auto' }} />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><p>No records found.</p></div></td></tr>
            ) : rows.map(row => (
              <tr key={row.id}>
                <td><span className="ref-num">{row.ref_number}</span></td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                    {!!row.walkin && (
                      <span style={{ background:'rgba(99,102,241,0.1)', color:'#6366f1', fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:10, whiteSpace:'nowrap' }}>
                        Walk-in
                      </span>
                    )}
                    {row.full_name}
                  </div>
                </td>
                <td>{row.purpose}</td>
                <td style={{ fontSize:11.5 }}>
                  {!!row.walkin
                    ? <span style={{ color:'#6366f1', fontWeight:600 }}>Walk-in</span>
                    : <span style={{ color:'var(--muted)' }}>Online</span>}
                </td>
                <td>{row.or_number ? <span className="ref-num">{row.or_number}</span> : '—'}</td>
                <td style={{ fontSize:12, color:'var(--muted)' }}>
                  {new Date(row.created_at).toLocaleDateString('en-PH')}
                </td>
                <td><Badge status={row.status} /></td>
                <td>
                  <div className="td-actions">
                    {row.status === 'Released' && (
                      <button className="icon-btn print" onClick={() => handlePrint(row)} title="Print"><MdPrint /></button>
                    )}
                    {!row.walkin && (
                      <button className="icon-btn edit" onClick={() => openStatus(row)} title="Update Status"><MdEdit /></button>
                    )}
                    <button className="icon-btn del" onClick={() => openDelete(row)} title="Delete"><MdDelete /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">{rows.length} record(s)</div>
      </div>

      {/* ── Walk-in Modal ── */}
      {modal === 'walkin' && (
        <Modal title={`Walk-in — ${title}`} onClose={closeModal} size="lg"
          footer={<>
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleWalkin} disabled={saving}>
              {saving ? 'Processing…' : '✅ Process & Release'}
            </button>
          </>}>
          <div style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)', borderRadius:10, padding:'10px 14px', marginBottom:18, fontSize:13, color:'#6366f1' }}>
            🚶 Walk-in requests are immediately <strong>Released</strong> and a <strong>Paid</strong> payment record is created. The document will auto-print after saving.
          </div>
          <form onSubmit={handleWalkin}>
            <div className="form-row col-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={walkinForm.full_name}
                  onChange={setW('full_name')} placeholder="e.g. Juan Dela Cruz" required />
              </div>
              <div className="form-group">
                <label className="form-label">Address / Zone</label>
                <input className="form-input" value={walkinForm.address}
                  onChange={setW('address')} placeholder="e.g. Zone 2" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Purpose *</label>
              <input className="form-input" value={walkinForm.purpose}
                onChange={setW('purpose')} placeholder="e.g. Employment, Travel, School" required />
            </div>
            <div className="form-row col-2">
              <div className="form-group">
                <label className="form-label">Issued By</label>
                <input className="form-input" value={walkinForm.issued_by}
                  onChange={setW('issued_by')} placeholder="Punong Barangay name" />
              </div>
              <div className="form-group">
                <label className="form-label">Amount (₱)</label>
                <input className="form-input" type="number" value={walkinForm.amount}
                  onChange={setW('amount')} min="0" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method *</label>
              <div style={{ display:'flex', gap:10 }}>
                {[
                  { id:'Cash',  emoji:'💵', label:'Cash'  },
                  { id:'GCash', emoji:'💙', label:'GCash' },
                  { id:'Maya',  emoji:'💚', label:'Maya'  },
                ].map(m => (
                  <button key={m.id} type="button"
                    onClick={() => setWalkinForm(p => ({ ...p, payment_method: m.id, gcash_number:'', maya_number:'' }))}
                    style={{
                      flex:1, padding:'10px 8px', borderRadius:10, cursor:'pointer',
                      border: walkinForm.payment_method === m.id ? '2px solid var(--blue)' : '1px solid #dde3f0',
                      background: walkinForm.payment_method === m.id ? 'rgba(58,123,213,0.06)' : '#fff',
                      fontFamily:'var(--ff)', fontSize:12.5, fontWeight:600,
                      color: walkinForm.payment_method === m.id ? 'var(--blue)' : 'var(--muted)',
                      display:'flex', flexDirection:'column', alignItems:'center', gap:4,
                    }}>
                    <span style={{ fontSize:22 }}>{m.emoji}</span>{m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* GCash number field */}
            {walkinForm.payment_method === 'GCash' && (
              <div className="form-group">
                <label className="form-label">💙 GCash Number *</label>
                <input className="form-input" value={walkinForm.gcash_number}
                  onChange={setW('gcash_number')} placeholder="09XXXXXXXXX" maxLength={11} />
                <span style={{ fontSize:11, color:'var(--muted)' }}>Enter the resident's GCash number used for payment</span>
              </div>
            )}

            {/* Maya number field */}
            {walkinForm.payment_method === 'Maya' && (
              <div className="form-group">
                <label className="form-label">💚 Maya Number *</label>
                <input className="form-input" value={walkinForm.maya_number}
                  onChange={setW('maya_number')} placeholder="09XXXXXXXXX" maxLength={11} />
                <span style={{ fontSize:11, color:'var(--muted)' }}>Enter the resident's Maya number used for payment</span>
              </div>
            )}

            {/* Cash note */}
            {walkinForm.payment_method === 'Cash' && (
              <div style={{ padding:'9px 13px', background:'rgba(31,170,107,0.06)', border:'1px solid rgba(31,170,107,0.2)', borderRadius:8, fontSize:12.5, color:'var(--green)' }}>
                💵 Cash payment — collect the amount at the window before processing.
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* ── Status Modal ── */}
      {modal === 'status' && (
        <Modal title="Update Status" onClose={closeModal} size="sm"
          footer={<>
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleStatusUpdate} disabled={saving}>{saving ? 'Saving…' : 'Update'}</button>
          </>}>
          <form onSubmit={handleStatusUpdate}>
            <div className="form-group">
              <label className="form-label">Ref # — {selected?.ref_number}</label>
              <p style={{ fontSize:13, color:'var(--muted)', marginBottom:12 }}>{selected?.full_name} · {selected?.purpose}</p>
            </div>
            <div className="form-group">
              <label className="form-label">Status *</label>
              <select className="form-select" value={statusForm.status}
                onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))}>
                <option>Pending</option><option>Approved</option>
                <option>Released</option><option>Rejected</option>
              </select>
            </div>
            {statusForm.status === 'Released' && (
              <div className="form-group">
                <label className="form-label">Issued By</label>
                <input className="form-input" value={statusForm.issued_by}
                  onChange={e => setStatusForm(p => ({ ...p, issued_by: e.target.value }))}
                  placeholder="Punong Barangay name" />
                <small style={{ fontSize:11, color:'var(--muted)' }}>OR Number will be auto-generated.</small>
              </div>
            )}
            {statusForm.status === 'Rejected' && (
              <div className="form-group">
                <label className="form-label">Rejection Reason</label>
                <textarea className="form-textarea" value={statusForm.rejection_reason}
                  onChange={e => setStatusForm(p => ({ ...p, rejection_reason: e.target.value }))}
                  placeholder="State reason for rejection…" />
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* ── Delete Modal ── */}
      {modal === 'delete' && (
        <Modal title="Delete Request" onClose={closeModal} size="sm"
          footer={<>
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
          </>}>
          <p style={{ fontSize:14 }}>Delete request <strong>{selected?.ref_number}</strong>? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
