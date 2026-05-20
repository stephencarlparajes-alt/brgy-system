// Officials.jsx
import { useEffect, useState } from 'react';
import { officialsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { MdAdd, MdEdit, MdDelete, MdSearch } from 'react-icons/md';

const EMPTY = { last_name:'', first_name:'', middle_name:'', suffix:'', position:'Kagawad', committee:'', term_start:'', term_end:'', status:'active' };
const POSITIONS = ['Punong Barangay','Kagawad','SK Chairman','Barangay Secretary','Barangay Treasurer'];

export default function Officials() {
  const [rows,    setRows]    = useState([]);
  const [modal,   setModal]   = useState(null);
  const [selected,setSelected]= useState(null);
  const [form,    setForm]    = useState(EMPTY);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { const r = await officialsAPI.getAll(); setRows(r.data.data); }
    catch { toast.error('Failed to load officials.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
  const toYear = v => { if (!v) return ''; const y = new Date(v).getFullYear(); return isNaN(y) ? v : String(y); };
  const openAdd  = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = r  => { setSelected(r); setForm({ ...r, term_start: toYear(r.term_start), term_end: toYear(r.term_end) }); setModal('edit'); };
  const openDel  = r  => { setSelected(r); setModal('delete'); };
  const close    = () => { setModal(null); setSelected(null); };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true);
    try {
      if (modal === 'add') { await officialsAPI.create(form); toast.success('Official added.'); }
      else { await officialsAPI.update(selected.id, form); toast.success('Official updated.'); }
      close(); load();
    } catch { toast.error('Failed to save.'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try { await officialsAPI.remove(selected.id); toast.success('Official deleted.'); close(); load(); }
    catch { toast.error('Failed to delete.'); } finally { setSaving(false); }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Officials</h1><p>Manage barangay elected officials</p></div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd /> Add Official</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Position</th><th>Committee</th><th>Term</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ textAlign:'center', padding:40 }}><div className="spinner" style={{ margin:'0 auto' }} /></td></tr>
            : rows.length === 0 ? <tr><td colSpan={7}><div className="empty-state"><p>No officials found.</p></div></td></tr>
            : rows.map((r, i) => (
              <tr key={r.id}>
                <td style={{ color:'var(--muted)', fontSize:12 }}>{i+1}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div className="avatar" style={{ width:30, height:30, fontSize:11, flexShrink:0, background:'linear-gradient(135deg,#c7d8f8,#8fb4ee)', color:'#1f56b0' }}>{r.first_name[0]}{r.last_name[0]}</div>
                    {r.last_name}, {r.first_name} {r.middle_name || ''} {r.suffix || ''}
                  </div>
                </td>
                <td>
                  <span style={{ background: r.position === 'Punong Barangay' ? 'rgba(13,27,62,0.08)' : 'rgba(58,123,213,0.08)', color: r.position === 'Punong Barangay' ? '#0d1b3e' : '#1f56b0', padding:'3px 10px', borderRadius:6, fontSize:12, fontWeight:600 }}>
                    {r.position === 'Punong Barangay' && '⭐ '}{r.position}
                  </span>
                </td>
                <td>{r.committee || '—'}</td>
                <td style={{ fontSize:12, color:'var(--muted)' }}>{r.term_start ? toYear(r.term_start) : '—'}{r.term_end ? ` – ${toYear(r.term_end)}` : ''}</td>
                <td><Badge status={r.status === 'active' || r.status == null ? 'Active' : 'Inactive'} /></td>
                <td><div className="td-actions">
                  <button className="icon-btn edit" onClick={() => openEdit(r)}><MdEdit /></button>
                  <button className="icon-btn del"  onClick={() => openDel(r)}><MdDelete /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">{rows.length} official(s)</div>
      </div>

      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Official' : 'Edit Official'} onClose={close}
          footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
          <form onSubmit={handleSave}>
            <div className="form-row col-3">
              <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" value={form.last_name} onChange={set('last_name')} required /></div>
              <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={form.first_name} onChange={set('first_name')} required /></div>
              <div className="form-group"><label className="form-label">Middle Name</label><input className="form-input" value={form.middle_name} onChange={set('middle_name')} /></div>
            </div>
            <div className="form-row col-2">
              <div className="form-group"><label className="form-label">Position *</label>
                <select className="form-select" value={form.position} onChange={set('position')}>{POSITIONS.map(p => <option key={p}>{p}</option>)}</select>
              </div>
              <div className="form-group"><label className="form-label">Committee</label><input className="form-input" value={form.committee} onChange={set('committee')} /></div>
            </div>
            <div className="form-row col-3">
              <div className="form-group"><label className="form-label">Term Start</label><input className="form-input" type="number" value={form.term_start} onChange={set('term_start')} placeholder="2022" /></div>
              <div className="form-group"><label className="form-label">Term End</label><input className="form-input" type="number" value={form.term_end} onChange={set('term_end')} placeholder="2025" /></div>
              <div className="form-group"><label className="form-label">Status</label>
                <select className="form-select" value={form.status} onChange={set('status')}><option value="active">Active</option><option value="inactive">Inactive</option></select>
              </div>
            </div>
          </form>
        </Modal>
      )}
      {modal === 'delete' && (
        <Modal title="Delete Official" onClose={close} size="sm"
          footer={<><button className="btn btn-ghost" onClick={close}>Cancel</button><button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button></>}>
          <p style={{ fontSize:14 }}>Delete <strong>{selected?.first_name} {selected?.last_name}</strong>? This cannot be undone.</p>
        </Modal>
      )}
    </div>
  );
}
