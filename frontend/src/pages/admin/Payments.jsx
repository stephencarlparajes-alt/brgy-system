import { useEffect, useState, useCallback } from 'react';
import { paymentAPI } from '../../utils/api';
import { printPaymentReceipt } from '../../utils/printReceipt';
import toast from 'react-hot-toast';
import Badge from '../../components/ui/Badge';
import { MdSearch, MdCheckCircle, MdCancel, MdPrint, MdPayment, MdAttachMoney, MdPointOfSale } from 'react-icons/md';

const METHOD_COLORS = {
  GCash: { bg:'rgba(0,102,204,0.08)', color:'#0066cc', emoji:'💙' },
  Maya:  { bg:'rgba(0,166,81,0.08)',  color:'#00a651', emoji:'💚' },
  Cash:  { bg:'rgba(31,170,107,0.08)',color:'#1faa6b', emoji:'💵' },
};

const DOC_LABELS = {
  clearance_requests: 'Barangay Clearance',
  indigency_requests: 'Cert. of Indigency',
  residency_requests: 'Cert. of Residency',
  permit_requests:    'Business Permit',
};

export default function Payments() {
  const [rows,    setRows]    = useState([]);
  const [stats,   setStats]   = useState({});
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState('');
  const [method,  setMethod]  = useState('');
  const [search,  setSearch]  = useState('');
  const [saving,  setSaving]  = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentAPI.getAll({ status, method });
      setRows(res.data.data);
      setStats(res.data.stats || {});
    } catch { toast.error('Failed to load payments.'); }
    finally { setLoading(false); }
  }, [status, method]);

  useEffect(() => { load(); }, [load]);

  const handleAcceptCash = async (id, name, ref) => {
    if (!window.confirm(`Accept cash payment at the barangay hall for ${name} (${ref})?\n\nThis will mark the payment as Paid and release the document.`)) return;
    setSaving(id);
    try {
      await paymentAPI.acceptCash(id);
      toast.success('Cash payment accepted & document released! 💵');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to accept cash payment.');
    } finally { setSaving(null); }
  };

  const handleConfirm = async (id) => {
    setSaving(id);
    try {
      await paymentAPI.confirm(id);
      toast.success('Payment confirmed! ✅');
      load();
    } catch { toast.error('Failed to confirm.'); }
    finally { setSaving(null); }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Reject this payment?')) return;
    setSaving(id);
    try {
      await paymentAPI.reject(id);
      toast.success('Payment rejected.');
      load();
    } catch { toast.error('Failed to reject.'); }
    finally { setSaving(null); }
  };

  const handlePrintReceipt = (row) => {
    // Build a fake request object for the receipt
    const request = { ref_number: row.doc_ref_number, full_name: `${row.first_name} ${row.last_name}`, purpose: '—' };
    const docType = DOC_LABELS[row.doc_table] || row.doc_table;
    printPaymentReceipt(row, request, docType);
  };

  // Filter by search
  const filtered = rows.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      r.transaction_ref?.toLowerCase().includes(s) ||
      r.doc_ref_number?.toLowerCase().includes(s)  ||
      r.first_name?.toLowerCase().includes(s)       ||
      r.last_name?.toLowerCase().includes(s)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div><h1>Payments</h1><p>Track and manage document payment transactions</p></div>
      </div>

      {/* Stat cards */}
      <div className="stat-grid col-4" style={{ marginBottom:18 }}>
        <div className="stat-card">
          <div className="stat-icon blue"><MdPayment /></div>
          <div><div className="stat-label">Total Transactions</div><div className="stat-value">{stats.total || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><MdPayment /></div>
          <div><div className="stat-label">Pending</div><div className="stat-value">{stats.pending || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><MdCheckCircle /></div>
          <div><div className="stat-label">Confirmed Paid</div><div className="stat-value">{stats.paid || 0}</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><MdAttachMoney /></div>
          <div>
            <div className="stat-label">Total Collected</div>
            <div className="stat-value" style={{ fontSize:20 }}>₱{Number(stats.total_collected || 0).toLocaleString('en-PH', { minimumFractionDigits:2 })}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="search-bar">
        <div className="search-wrap">
          <MdSearch />
          <input className="search-input" placeholder="Search transaction ref, name…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="Awaiting Payment">Awaiting Payment</option>
          <option value="Pending">Pending (Submitted)</option>
          <option value="Paid">Paid</option>
          <option value="Failed">Failed</option>
        </select>
        <select className="filter-select" value={method} onChange={e => setMethod(e.target.value)}>
          <option value="">All Methods</option>
          <option>GCash</option>
          <option>Maya</option>
          <option>Cash</option>
          <option>Walk-in</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Transaction Ref</th>
              <th>Document Ref</th>
              <th>Document Type</th>
              <th>Resident</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign:'center', padding:40 }}>
                <div className="spinner" style={{ margin:'0 auto' }} />
              </td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty-state"><p>No payment records found.</p></div>
              </td></tr>
            ) : filtered.map(r => {
              const mc = METHOD_COLORS[r.payment_method] || METHOD_COLORS.Cash;
              const statusClass = r.payment_status === 'Paid' ? 'Released'
                : r.payment_status === 'Pending' ? 'Pending'
                : r.payment_status === 'Awaiting Payment' ? 'Awaiting'
                : 'Rejected';
              const residentName = r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—';
              const initials = residentName !== '—' ? residentName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : '?';
              return (
                <tr key={r.id}>
                  <td>
                    <span className="ref-num">{r.transaction_ref || <span style={{color:'var(--muted)',fontStyle:'italic'}}>Not yet paid</span>}</span>
                  </td>
                  <td>
                    <span className="ref-num">{r.doc_ref_number}</span>
                  </td>
                  <td>
                    <span style={{ background:'rgba(58,123,213,0.08)', color:'#1f56b0', padding:'3px 9px', borderRadius:6, fontSize:11.5, fontWeight:600 }}>
                      {r.doc_type || DOC_LABELS[r.doc_table] || r.doc_table}
                    </span>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="avatar" style={{ width:28, height:28, fontSize:11, flexShrink:0 }}>
                        {initials}
                      </div>
                      {residentName}
                    </div>
                  </td>
                  <td>
                    {r.payment_method ? (
                      <span style={{ background:mc.bg, color:mc.color, padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:600 }}>
                        {mc.emoji} {r.payment_method}
                      </span>
                    ) : (
                      <span style={{ color:'var(--muted)', fontSize:12, fontStyle:'italic' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontWeight:700, color:'var(--green)', fontSize:14 }}>
                      ₱{Number(r.amount).toFixed(2)}
                    </span>
                  </td>
                  <td style={{ fontSize:12, color:'var(--muted)' }}>
                    {r.submitted_at
                      ? new Date(r.submitted_at).toLocaleDateString('en-PH')
                      : new Date(r.created_at).toLocaleDateString('en-PH')}
                  </td>
                  <td>
                    {r.payment_status === 'Awaiting Payment' ? (
                      <span style={{ background:'rgba(99,102,241,0.1)', color:'#6366f1', padding:'3px 10px', borderRadius:20, fontSize:11.5, fontWeight:600 }}>
                        ⏳ Awaiting Payment
                      </span>
                    ) : (
                      <Badge status={statusClass} />
                    )}
                  </td>
                  <td>
                    <div className="td-actions">
                      {/* Print receipt — only if payment submitted */}
                      {r.payment_status !== 'Awaiting Payment' && (
                        <button className="icon-btn print" onClick={() => handlePrintReceipt(r)} title="Print Receipt">
                          <MdPrint />
                        </button>
                      )}
                      {/* Accept Cash — for online requests where resident paid at the hall */}
                      {r.payment_status === 'Awaiting Payment' && (
                        <button className="icon-btn approve" onClick={() => handleAcceptCash(r.id, residentName, r.doc_ref_number)}
                          disabled={saving === r.id} title="Accept Cash Payment at Hall"
                          style={{ display:'flex', alignItems:'center', gap:4, padding:'5px 10px', fontSize:12, borderRadius:8, background:'rgba(31,170,107,0.12)', color:'var(--green)', border:'1px solid rgba(31,170,107,0.3)', cursor:'pointer', fontFamily:'var(--ff)', fontWeight:600, whiteSpace:'nowrap' }}>
                          {saving === r.id ? '…' : <><MdPointOfSale style={{ fontSize:15 }} /> Cash</>}
                        </button>
                      )}
                      {/* Confirm — only for Pending (submitted by resident) */}
                      {r.payment_status === 'Pending' && (
                        <button className="icon-btn approve" onClick={() => handleConfirm(r.id)}
                          disabled={saving === r.id} title="Confirm Payment">
                          {saving === r.id ? '…' : <MdCheckCircle />}
                        </button>
                      )}
                      {/* Reject — only for Pending */}
                      {r.payment_status === 'Pending' && (
                        <button className="icon-btn reject" onClick={() => handleReject(r.id)}
                          disabled={saving === r.id} title="Reject Payment">
                          <MdCancel />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="table-footer">{filtered.length} payment(s)</div>
      </div>
    </div>
  );
}
