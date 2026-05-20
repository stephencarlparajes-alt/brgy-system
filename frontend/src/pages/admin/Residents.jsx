import { useEffect, useState, useCallback } from 'react';
import { residentsAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { MdAdd, MdEdit, MdDelete, MdSearch, MdPeople, MdMale, MdFemale, MdAccessible } from 'react-icons/md';

const EMPTY = {
  last_name:'', first_name:'', middle_name:'', suffix:'',
  gender:'Male', birthdate:'', age:'', civil_status:'Single',
  address:'', purok:'', contact:'',
  is_pwd:false, is_senior:false, is_minor:false, is_voter:false,
};

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [stats,     setStats]     = useState({});
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | 'add' | 'edit' | 'delete'
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [search,    setSearch]    = useState('');
  const [purok,     setPurok]     = useState('');
  const [saving,    setSaving]    = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await residentsAPI.getAll({ search, purok });
      setResidents(res.data.data);
      setStats(res.data.stats || {});
    } catch { toast.error('Failed to load residents.'); }
    finally { setLoading(false); }
  }, [search, purok]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (r) => { setSelected(r); setForm({ ...r, is_pwd: !!r.is_pwd, is_senior: !!r.is_senior, is_minor: !!r.is_minor, is_voter: !!r.is_voter }); setModal('edit'); };
  const openDel  = (r) => { setSelected(r); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (k === 'birthdate' && val) {
      // Auto-calculate age, is_minor, is_senior from birthdate
      const birth    = new Date(val);
      const today    = new Date();
      const ageYears = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
      setForm(p => ({
        ...p,
        birthdate:  val,
        age:        ageYears >= 0 ? ageYears : 0,
        is_minor:   ageYears < 18,
        is_senior:  ageYears >= 60,
      }));
    } else {
      setForm(p => ({ ...p, [k]: val }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') {
        await residentsAPI.create(form);
        toast.success('Resident added.');
      } else {
        await residentsAPI.update(selected.id, form);
        toast.success('Resident updated.');
      }
      closeModal(); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await residentsAPI.remove(selected.id);
      toast.success('Resident deleted.');
      closeModal(); load();
    } catch { toast.error('Failed to delete.'); }
    finally { setSaving(false); }
  };

  const fullName = (r) => `${r.last_name}, ${r.first_name}${r.middle_name ? ' ' + r.middle_name[0] + '.' : ''}${r.suffix ? ' ' + r.suffix : ''}`;

  return (
    <div>
      <div className="page-header">
        <div><h1>Residents</h1><p>Manage barangay resident records</p></div>
        <button className="btn btn-primary" onClick={openAdd}><MdAdd /> Add Resident</button>
      </div>

      {/* Stats */}
      <div className="stat-grid col-6" style={{ marginBottom: 16 }}>
        {[
          { label:'Total', value: stats.total || 0, icon:<MdPeople />, color:'blue' },
          { label:'Male',  value: stats.male  || 0, icon:<MdMale />,  color:'cyan' },
          { label:'Female',value: stats.female|| 0, icon:<MdFemale />,color:'indigo' },
          { label:'PWD',   value: stats.pwd   || 0, icon:<MdAccessible />, color:'purple' },
          { label:'Senior',value: stats.senior|| 0, icon:'👴', color:'amber' },
          { label:'Minor', value: stats.minor || 0, icon:'👶', color:'green' },
        ].map(s => (
          <div className="stat-card" style={{ flexDirection:'column', alignItems:'flex-start', gap:6, padding:'14px 16px' }} key={s.label}>
            <div className={`stat-icon ${s.color}`} style={{ width:34, height:34, fontSize:15 }}>{s.icon}</div>
            <div><div className="stat-label">{s.label}</div><div className="stat-value" style={{ fontSize:22 }}>{s.value}</div></div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="search-bar">
        <div className="search-wrap">
          <MdSearch />
          <input className="search-input" placeholder="Search name or contact…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <input className="filter-select" placeholder="Filter by zone…"
          value={purok} onChange={e => setPurok(e.target.value)} style={{ width: 160 }} />
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead><tr>
            <th>#</th><th>Name</th><th>Gender</th><th>Age</th>
            <th>Zone</th><th>Contact</th><th>Tags</th><th>Actions</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40 }}>
                <div className="spinner" style={{ margin:'0 auto' }} />
              </td></tr>
            ) : residents.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><p>No residents found.</p></div></td></tr>
            ) : residents.map((r, i) => (
              <tr key={r.id}>
                <td style={{ color:'var(--muted)', fontSize:12 }}>{i + 1}</td>
                <td>
                  <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                    <div className="avatar" style={{ width:30, height:30, fontSize:11, flexShrink:0,
                      background: r.gender==='Female' ? 'linear-gradient(135deg,#f8b4c8,#e879a0)' : 'linear-gradient(135deg,#c7d8f8,#8fb4ee)',
                      color: r.gender==='Female' ? '#a0185c' : '#1f56b0' }}>
                      {r.first_name[0]}{r.last_name[0]}
                    </div>
                    {fullName(r)}
                  </div>
                </td>
                <td>
                  <span style={{ background: r.gender==='Male' ? 'rgba(14,165,233,0.1)' : 'rgba(236,72,153,0.1)',
                    color: r.gender==='Male' ? '#0369a1' : '#db2777',
                    padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:600 }}>
                    {r.gender}
                  </span>
                </td>
                <td>{r.age}</td>
                <td>{r.purok}</td>
                <td>{r.contact || '—'}</td>
                <td>
                  <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                    {!!r.is_pwd    && <Badge status="PWD" />}
                    {!!r.is_senior && <Badge status="Senior" />}
                    {!!r.is_minor  && <Badge status="Minor" />}
                    {!!r.is_voter  && <Badge status="Voter" />}
                  </div>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="icon-btn edit"  onClick={() => openEdit(r)}><MdEdit /></button>
                    <button className="icon-btn del"   onClick={() => openDel(r)}><MdDelete /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="table-footer">{residents.length} resident(s) shown</div>
      </div>

      {/* Add / Edit Modal */}
      {(modal === 'add' || modal === 'edit') && (
        <Modal title={modal === 'add' ? 'Add Resident' : 'Edit Resident'} onClose={closeModal} size="lg"
          footer={<>
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>}>
          <form onSubmit={handleSave}>
            <div className="form-row col-3">
              <div className="form-group"><label className="form-label">Last Name *</label><input className="form-input" value={form.last_name} onChange={set('last_name')} required /></div>
              <div className="form-group"><label className="form-label">First Name *</label><input className="form-input" value={form.first_name} onChange={set('first_name')} required /></div>
              <div className="form-group"><label className="form-label">Middle Name</label><input className="form-input" value={form.middle_name} onChange={set('middle_name')} /></div>
            </div>
            <div className="form-row col-3">
              <div className="form-group"><label className="form-label">Suffix</label><input className="form-input" value={form.suffix} onChange={set('suffix')} placeholder="Jr., Sr." /></div>
              <div className="form-group"><label className="form-label">Gender *</label>
                <select className="form-select" value={form.gender} onChange={set('gender')}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="form-group"><label className="form-label">Civil Status</label>
                <select className="form-select" value={form.civil_status} onChange={set('civil_status')}>
                  {['Single','Married','Widowed','Separated','Annulled'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row col-2">
              <div className="form-group"><label className="form-label">Birthdate *</label><input className="form-input" type="date" value={form.birthdate} onChange={set('birthdate')} required /></div>
              <div className="form-group"><label className="form-label">Age *</label><input className="form-input" type="number" value={form.age} onChange={set('age')} required min={0} max={150} /></div>
            </div>
            <div className="form-row col-2">
              <div className="form-group"><label className="form-label">Address *</label><input className="form-input" value={form.address} onChange={set('address')} required /></div>
              <div className="form-group"><label className="form-label">Zone *</label>
                <select className="form-select" value={form.purok} onChange={set('purok')} required>
                  <option value="">Select Zone</option>
                  {['Zone 1','Zone 2','Zone 3','Zone 4','Zone 5','Zone 6'].map(z => <option key={z} value={z}>{z}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group"><label className="form-label">Contact Number</label><input className="form-input" value={form.contact} onChange={set('contact')} placeholder="09XXXXXXXXX" /></div>
            <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginTop:4 }}>
              {[['is_pwd','PWD'],['is_senior','Senior Citizen'],['is_minor','Minor'],['is_voter','Registered Voter']].map(([k,l]) => (
                <label key={k} style={{ display:'flex', alignItems:'center', gap:7, fontSize:13, cursor:'pointer' }}>
                  <input type="checkbox" checked={!!form[k]} onChange={set(k)} /> {l}
                </label>
              ))}
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {modal === 'delete' && (
        <Modal title="Delete Resident" onClose={closeModal} size="sm"
          footer={<>
            <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</button>
          </>}>
          <p style={{ fontSize:14, color:'var(--text)' }}>
            Are you sure you want to delete <strong>{selected && fullName(selected)}</strong>? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
