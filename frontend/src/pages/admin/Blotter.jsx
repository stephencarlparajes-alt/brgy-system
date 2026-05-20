import { useEffect, useState, useCallback } from 'react';
import { blotterAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdBook } from 'react-icons/md';

const EMPTY = { complainant:'', respondent:'', incident_type:'', details:'', incident_date:'' };
const INCIDENT_TYPES = ['Physical Altercation','Property Dispute','Noise Complaint','Family Dispute','Theft','Trespassing','Harassment','Other'];
const STATUSES = ['Open','Ongoing','Settled','Dismissed'];

export default function Blotter() {
  const [rows,    setRows]    = useState([]);
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [modal,   setModal]   = useState(null);
  const [selected,setSelected]= useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await blotterAPI.getAll({ search, status });
      setRows(res.data.data);
      setStats(res.data.stats || {});
    } catch { toast.error('Failed to load blotter records.'); }
    finally { setLoading(false); }
  }, [search, status]);

  useEffect(() => { load(); }, [load]);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const openAdd  = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = r  => { setSelected(r); setForm({ complainant:r.complainant, respondent:r.respondent, incident_type:r.incident_type, details:r.details, incident_date:r.incident_date?.split('T')[0] || '', status:r.status }); setModal('edit'); };
  const openDel  = r  => { setSelected(r); setModal('delete'); };
  const close    = () => { setModal(null); setSelected(null); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') { await blotterAPI.create(form); toast.success('Blotter case filed.'); }
      else { await blotterAPI.update(selected.id, form); toast.success('Blotter updated.'); }
      close(); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await blotterAPI.remove(selected.id); toast.success('Blotter deleted.'); close(); load(); }
    catch { toast.error('Failed to delete.'); } finally { setSaving(false); }
  };

  const statCards = [
    { label:'Total',     value: stats.total     || 0, color:'#3a7bd5' },
    { label:'Open',      value: stats.open      || 0, color:'#e53935' },
    { label:'Ongoing',   value: stats.ongoing   || 0, color:'#f59e0b' },
    { label:'Settled',   value: stats.settled   || 0, color:'#1faa6b' },
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1>Blotter Records</h1><p>Manage barangay incident reports</p></div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd /> File Blotter</button>
      </div>

      {/* Stats */}
      <div className="stat-grid col-4" style={{ marginBottom:16 }}>
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon" style={{ background:`${s.color}18`, color:s.color, width:42, height:42, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
              <MdBook />
            </div>
            <div><div className="stat-label">{s.label}</div><div className="stat-value">{s.value}</div></div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="search-bar">
        <div className="search-wrap">
          <MdSearch />
          <input className="search-input" placeholder="Search case#, complainant, respondent…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>Case #</th><th>Complainant</th><th>Respondent</th>
            <th>Incident Type</th><th>Date Filed</th><th>Status</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}>
                <div className="spinner" style={{ margin:'0 auto' }} />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><p>No blotter records found.</p></div></td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td><span className="ref-num">{r.case_number}</span></td>
                <td>{r.complainant}</td>
                <td>{r.respondent}</td>
                <td>
                  <span style={{ background:'rgba(58,123,213,0.08)', color:'#1f56b0', padding:'3px 9px', borderRadius:6, fontSize:11.5, fontWeight:600 }}>
                    {r.incident_type}
                  </span>
                </td>
                <td style={{ fontSize:12, color:'var(--muted)' }}>
                  {r.created_at ? new Date(r.created_at).toLocaleDateString('en-PH') : '—'}
                </td>
                <td><Badge status={r.status} /></td>
                <td>
                  <div className="td-actions">
                    <button className="icon-btn edit" onClick={() => openEdit(r)} title="Edit"><MdEdit /></button>
                    <button className="icon-btn del"  onClick={() => openDel(r)}  title="Delete"><MdDelete /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">{rows.length} record(s)</div>
      </div>

      {/* Add/Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'File Blotter' : 'Edit Blotter Case'} onClose={close} size="lg"
          footer={<>
            <button className="btn btn-ghost" onClick={close}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>}>
          <form onSubmit={handleSave}>
            <div className="form-row col-2">
              <div className="form-group">
                <label className="form-label">Complainant *</label>
                <input className="form-input" value={form.complainant} onChange={set('complainant')} required />
              </div>
              <div className="form-group">
                <label className="form-label">Respondent *</label>
                <input className="form-input" value={form.respondent} onChange={set('respondent')} required />
              </div>
            </div>
            <div className="form-row col-2">
              <div className="form-group">
                <label className="form-label">Incident Type *</label>
                <select className="form-select" value={form.incident_type} onChange={set('incident_type')} required>
                  <option value="">Select type…</option>
                  {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Incident Date *</label>
                <input className="form-input" type="date" value={form.incident_date} onChange={set('incident_date')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Details *</label>
              <textarea className="form-textarea" value={form.details} onChange={set('details')} required placeholder="Describe the incident in detail…" />
            </div>
            {modal === 'edit' && (
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            )}
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modal === 'delete' && (
        <Modal title="Delete Blotter" onClose={close} size="sm"
          footer={<>
            <button className="btn btn-ghost" onClick={close}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
          </>}>
          <p style={{ fontSize:14 }}>Delete case <strong>{selected?.case_number}</strong>? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
