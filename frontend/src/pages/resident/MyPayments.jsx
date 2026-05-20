import { useEffect, useState } from 'react';
import { paymentAPI } from '../../utils/api';
import { printPaymentReceipt } from '../../utils/printReceipt';
import toast from 'react-hot-toast';
import { MdReceiptLong } from 'react-icons/md';

const DOC_LABELS = {
  clearance_requests: 'Barangay Clearance',
  indigency_requests: 'Cert. of Indigency',
  residency_requests: 'Cert. of Residency',
  permit_requests:    'Business Permit',
};

const STATUS_STYLES = {
  Paid:     { bg:'rgba(31,170,107,0.1)',  color:'#1faa6b', dot:'#1faa6b' },
  Pending:  { bg:'rgba(245,158,11,0.1)', color:'#f59e0b', dot:'#f59e0b' },
  Rejected: { bg:'rgba(229,57,53,0.1)',  color:'#e53935', dot:'#e53935' },
};

const METHOD_EMOJI = { GCash:'💙', Maya:'💚', Cash:'💵' };

export default function MyPayments() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    paymentAPI.getMy()
      .then(r => setPayments(r.data.data || []))
      .catch(() => toast.error('Failed to load payments.'))
      .finally(() => setLoading(false));
  }, []);

  // FIX #16: build proper request object using stored first_name/last_name
  const handlePrintReceipt = (p) => {
    const request = {
      ref_number: p.doc_ref_number,
      full_name:  `${p.first_name || ''} ${p.last_name || ''}`.trim() || '—',
      purpose:    '—',
    };
    const docType = DOC_LABELS[p.doc_table] || p.doc_table;
    printPaymentReceipt(p, request, docType);
  };

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Payments</h1>
          <p>Track your document payment transactions and receipts</p>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'60px 20px' }}>
          <div style={{ fontSize:48, marginBottom:14, opacity:0.3 }}>🧾</div>
          <p style={{ color:'var(--muted)', fontSize:14 }}>No payment records yet.</p>
          <p style={{ color:'var(--muted)', fontSize:13, marginTop:6 }}>
            Payments will appear here after you submit a document request.
          </p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12, maxWidth:680 }}>
          {payments.map(p => {
            // FIX #9: use payment_status (not status)
            const ss      = STATUS_STYLES[p.payment_status] || STATUS_STYLES.Pending;
            const docType = DOC_LABELS[p.doc_table] || p.doc_table;
            return (
              <div key={p.id}
                style={{ background:'var(--card)', border:'1px solid var(--bdr)', borderRadius:'var(--radius)', padding:'18px 20px', boxShadow:'var(--shadow)' }}>

                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ fontSize:28 }}>{METHOD_EMOJI[p.payment_method] || '💳'}</div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14.5, color:'var(--text)' }}>{docType}</div>
                      <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
                        via <strong>{p.payment_method}</strong>
                        {p.gcash_number && ` · ${p.gcash_number}`}
                        {p.maya_number  && ` · ${p.maya_number}`}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, background:ss.bg, color:ss.color, padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:700, flexShrink:0 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:ss.dot, display:'inline-block' }}></span>
                    {p.payment_status}
                  </div>
                </div>

                <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 20px' }}>
                  <div>
                    <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>Transaction Ref</div>
                    <div style={{ fontFamily:'var(--ffm)', fontSize:12.5, fontWeight:700, color:'var(--blue)' }}>{p.transaction_ref}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>Document Ref</div>
                    <div style={{ fontFamily:'var(--ffm)', fontSize:12.5, fontWeight:700, color:'var(--blue)' }}>{p.doc_ref_number}</div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>Amount</div>
                    <div style={{ fontSize:18, fontWeight:700, color: p.payment_status === 'Paid' ? 'var(--green)' : 'var(--amber)' }}>
                      ₱{Number(p.amount).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:2 }}>
                      {p.payment_status === 'Paid' ? 'Date Paid' : 'Date Submitted'}
                    </div>
                    <div style={{ fontSize:13, fontWeight:500 }}>
                      {new Date(p.paid_at || p.created_at).toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' })}
                    </div>
                  </div>
                </div>

                {p.payment_status === 'Pending' && (
                  <div style={{ marginTop:12, background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:8, padding:'9px 13px', fontSize:12.5, color:'var(--amber)' }}>
                    ⏳ Awaiting admin confirmation. Please wait before claiming your document.
                  </div>
                )}

                <div style={{ display:'flex', justifyContent:'flex-end', marginTop:14 }}>
                  <button
                    onClick={() => handlePrintReceipt(p)}
                    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(58,123,213,0.08)', color:'var(--blue)', border:'1px solid rgba(58,123,213,0.2)', borderRadius:9, fontSize:12.5, fontWeight:500, cursor:'pointer', fontFamily:'var(--ff)' }}>
                    <MdReceiptLong /> Print Receipt
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
