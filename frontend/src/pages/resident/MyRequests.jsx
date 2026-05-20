import { useEffect, useState, useCallback } from 'react';
import { clearanceAPI, indigencyAPI, residencyAPI, permitAPI, paymentAPI } from '../../utils/api';
import Badge from '../../components/ui/Badge';
import PaymentModal from '../../components/ui/PaymentModal';
import { MdBadge, MdDescription, MdHome, MdBusiness } from 'react-icons/md';
import { printDocument } from '../../utils/printDocument';

const DOC_ICON = {
  "Barangay Clearance": { icon: "🪪", color: "blue",   table: "clearance_requests" },
  "Cert. of Indigency": { icon: "📄", color: "indigo", table: "indigency_requests" },
  "Cert. of Residency": { icon: "🏠", color: "green",  table: "residency_requests" },
  "Business Permit":    { icon: "🏢", color: "cyan",   table: "permit_requests"    },
};

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [payments, setPayments] = useState({}); // keyed by doc_ref_number
  const [loading,  setLoading]  = useState(true);
  const [payModal, setPayModal] = useState(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [clr, ind, res, per] = await Promise.all([
        clearanceAPI.getMy(),
        indigencyAPI.getMy(),
        residencyAPI.getMy(),
        permitAPI.getMy(),
      ]);

      const all = [
        ...clr.data.data.map(r => ({ ...r, doc_type: "Barangay Clearance" })),
        ...ind.data.data.map(r => ({ ...r, doc_type: "Cert. of Indigency" })),
        ...res.data.data.map(r => ({ ...r, doc_type: "Cert. of Residency" })),
        ...per.data.data.map(r => ({ ...r, doc_type: "Business Permit" })),
      ];
      all.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRequests(all);

      // Fetch payment status for EACH document individually by ref_number
      // This ensures Awaiting Payment records created by admin are always visible
      const payEntries = await Promise.all(
        all.map(r =>
          paymentAPI.getForDoc(r.ref_number)
            .then(res => [r.ref_number, res.data.data])
            .catch(() => [r.ref_number, null])
        )
      );
      const payMap = {};
      payEntries.forEach(([ref, payment]) => {
        if (payment) payMap[ref] = payment;
      });
      setPayments(payMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handlePrint = (r) => printDocument(r, r.doc_type);

  if (loading) return <div className="spinner-wrap"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Requests</h1>
          <p>Track the status of all your submitted applications</p>
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign:"center", padding:"60px 20px" }}>
          <div style={{ fontSize:48, marginBottom:14, opacity:0.3 }}>📄</div>
          <p style={{ color:"var(--muted)", fontSize:14 }}>You have no requests yet.</p>
          <p style={{ color:"var(--muted)", fontSize:13, marginTop:6 }}>Go to the services section to submit your first request.</p>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:12, maxWidth:700 }}>
          {requests.map(r => {
            const d = DOC_ICON[r.doc_type] || { icon:"📄", color:"blue", table:"clearance_requests" };
            const payment = payments[r.ref_number];
            const payStatus = payment?.payment_status;

            return (
              <div key={`${r.doc_type}-${r.id}`}
                style={{ background:"var(--card)", border:"1px solid var(--bdr)", borderRadius:"var(--radius)", padding:"18px 20px", boxShadow:"var(--shadow)" }}>

                {/* Top row */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
                  <div className={`stat-icon ${d.color}`} style={{ width:42, height:42, fontSize:20, flexShrink:0 }}>
                    {d.icon}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:"var(--text)", marginBottom:3 }}>{r.doc_type}</div>
                    <div style={{ fontSize:12.5, color:"var(--muted)" }}>Purpose: {r.purpose}</div>
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:5 }}>
                    <span className="ref-num">{r.ref_number}</span>
                    <Badge status={r.status} />
                    <span style={{ fontSize:11, color:"var(--muted)" }}>
                      {new Date(r.created_at).toLocaleDateString("en-PH")}
                    </span>
                  </div>
                </div>

                {/* ── STATUS BANNERS ── */}

                {/* PENDING — waiting for admin */}
                {r.status === "Pending" && (
                  <div style={{ marginTop:12, background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"10px 14px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--amber)", marginBottom:3 }}>⏳ Waiting for Admin Review</div>
                    <div style={{ fontSize:12.5, color:"var(--muted)" }}>Your request has been submitted and is waiting for admin approval.</div>
                  </div>
                )}

                {/* APPROVED + Awaiting Payment — resident needs to pay */}
                {r.status === "Approved" && payStatus === "Awaiting Payment" && (
                  <div style={{ marginTop:12, background:"rgba(58,123,213,0.05)", border:"1px solid rgba(58,123,213,0.2)", borderRadius:8, padding:"10px 14px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--blue)", marginBottom:3 }}>✅ Request Approved — Payment Required</div>
                    <div style={{ fontSize:12.5, color:"var(--muted)", marginBottom:10 }}>
                      Your request has been approved. Please select a payment method to proceed.
                    </div>
                    <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
                      <button className="btn btn-primary" style={{ padding:"7px 16px", fontSize:12.5 }}
                        onClick={() => setPayModal({ request:r, docType:r.doc_type })}>
                        💳 Pay Now
                      </button>
                    </div>
                  </div>
                )}

                {/* APPROVED + Pending — resident paid, waiting admin to confirm */}
                {r.status === "Approved" && payStatus === "Pending" && (
                  <div style={{ marginTop:12, background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:8, padding:"10px 14px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--amber)", marginBottom:3 }}>⏳ Payment Submitted — Awaiting Confirmation</div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:8 }}>
                      Your payment has been submitted via <strong>{payment.payment_method}</strong>.
                      The admin is reviewing your payment.
                    </div>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
                      <div>
                        <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>Transaction Ref</div>
                        <div style={{ fontFamily:"var(--ffm)", fontSize:12.5, fontWeight:700, color:"var(--blue)" }}>{payment.transaction_ref}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>Amount</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--amber)" }}>₱{Number(payment.amount).toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* APPROVED + Paid — payment confirmed, go to barangay hall */}
                {r.status === "Approved" && payStatus === "Paid" && (
                  <div style={{ marginTop:12, background:"rgba(31,170,107,0.06)", border:"1px solid rgba(31,170,107,0.25)", borderRadius:8, padding:"12px 14px" }}>
                    <div style={{ fontSize:11, fontWeight:700, color:"var(--green)", marginBottom:4 }}>✅ Payment Confirmed!</div>
                    <div style={{ fontSize:12.5, color:"var(--text)", fontWeight:600, marginBottom:4 }}>
                      🏛️ Please visit the Barangay Hall to claim your document.
                    </div>
                    <div style={{ fontSize:12, color:"var(--muted)", marginBottom:10 }}>
                      Bring a valid ID and your reference number <strong style={{ fontFamily:"var(--ffm)" }}>{r.ref_number}</strong>.
                    </div>
                    <div style={{ display:"flex", gap:16, flexWrap:"wrap", padding:"10px 12px", background:"rgba(31,170,107,0.06)", borderRadius:6 }}>
                      <div>
                        <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>Transaction Ref</div>
                        <div style={{ fontFamily:"var(--ffm)", fontSize:12.5, fontWeight:700, color:"var(--green)" }}>{payment.transaction_ref}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>Amount Paid</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"var(--green)" }}>₱{Number(payment.amount).toFixed(2)}</div>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>Method</div>
                        <div style={{ fontSize:13, fontWeight:600 }}>
                          {payment.payment_method === "GCash" ? "💙" : payment.payment_method === "Maya" ? "💚" : "💵"} {payment.payment_method}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* RELEASED */}
                {r.status === "Released" && (
                  <div style={{ marginTop:12, background:"rgba(31,170,107,0.06)", border:"1px solid rgba(31,170,107,0.2)", borderRadius:8, padding:"10px 14px" }}>
                    <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.5px", color:"var(--green)", marginBottom:8 }}>
                      ✅ Document Released
                    </div>
                    <div style={{ display:"flex", gap:24, flexWrap:"wrap" }}>
                      {r.or_number && (
                        <div>
                          <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>OR Number</div>
                          <div style={{ fontFamily:"var(--ffm)", fontSize:13.5, fontWeight:700, color:"var(--green)" }}>{r.or_number}</div>
                        </div>
                      )}
                      {r.date_issued && (
                        <div>
                          <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>Date Issued</div>
                          <div style={{ fontSize:13, fontWeight:600, color:"var(--green)" }}>
                            {new Date(r.date_issued).toLocaleDateString("en-PH", { year:"numeric", month:"long", day:"numeric" })}
                          </div>
                        </div>
                      )}
                      {r.issued_by && (
                        <div>
                          <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:2 }}>Issued By</div>
                          <div style={{ fontSize:13, fontWeight:600, color:"var(--green)" }}>{r.issued_by}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* REJECTED */}
                {r.status === "Rejected" && r.rejection_reason && (
                  <div style={{ marginTop:12, background:"rgba(229,57,53,0.06)", border:"1px solid rgba(229,57,53,0.15)", borderRadius:8, padding:"10px 14px", fontSize:12.5, color:"var(--red)" }}>
                    <strong>Reason for Rejection:</strong> {r.rejection_reason}
                  </div>
                )}

                {/* Print button when Released */}
                {r.status === "Released" && (
                  <div style={{ display:"flex", gap:8, marginTop:14, justifyContent:"flex-end" }}>
                    <button style={{ padding:"7px 14px", fontSize:12.5, background:"rgba(31,170,107,0.1)", color:"var(--green)", border:"none", borderRadius:10, display:"flex", alignItems:"center", gap:6, cursor:"pointer", fontFamily:"var(--ff)", fontWeight:500 }}
                      onClick={() => handlePrint(r)}>
                      🖨️ Print Document
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {payModal && (
        <PaymentModal
          request={payModal.request}
          docType={payModal.docType}
          onClose={() => setPayModal(null)}
          onSuccess={loadAll}
        />
      )}
    </div>
  );
}
