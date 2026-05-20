import { useState, useEffect } from "react";
import { paymentAPI } from "../../utils/api";
import { printPaymentReceipt } from "../../utils/printReceipt";
import toast from "react-hot-toast";
import Modal from "./Modal";
import { MdPhone } from "react-icons/md";

const FEES = {
  clearance_requests: 50,
  indigency_requests: 0,
  residency_requests: 50,
  permit_requests:    200,
};

const TABLE_MAP = {
  "Barangay Clearance": "clearance_requests",
  "Cert. of Indigency": "indigency_requests",
  "Cert. of Residency": "residency_requests",
  "Business Permit":    "permit_requests",
};

export default function PaymentModal({ request, docType, onClose, onSuccess }) {
  const [method,   setMethod]   = useState("GCash");
  const [number,   setNumber]   = useState("");
  const [loading,  setLoading]  = useState(false);
  const [payment,  setPayment]  = useState(null);   // single payment object or null
  const [checking, setChecking] = useState(true);

  const doc_table = TABLE_MAP[docType] || "clearance_requests";
  const amount    = FEES[doc_table] ?? 50;
  const isFree    = amount === 0;

  // FIX #7 #1: getForDoc now returns { data: paymentObject | null }
  useEffect(() => {
    paymentAPI.getForDoc(request.ref_number)
      .then(r => setPayment(r.data.data))   // data is a single object or null
      .catch(() => setPayment(null))
      .finally(() => setChecking(false));
  }, [request.ref_number]);

  const handlePay = async (e) => {
    e.preventDefault();
    if (!isFree && method !== "Cash" && !number) {
      return toast.error("Please enter your GCash/Maya number.");
    }
    setLoading(true);
    try {
      await paymentAPI.pay({
        doc_table,
        doc_ref_number: request.ref_number,  // FIX #2: send doc_ref_number
        payment_method: method,
        gcash_number:   method === "GCash" ? number : null,
        maya_number:    method === "Maya"  ? number : null,
      });
      toast.success("Payment submitted successfully!");
      // Reload payment info
      const updated = await paymentAPI.getForDoc(request.ref_number);
      setPayment(updated.data.data);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Modal title="Payment" onClose={onClose} size="sm">
        <div className="spinner-wrap"><div className="spinner" /></div>
      </Modal>
    );
  }

  // FIX #9: check payment.payment_status (not payment.status)
  if (payment?.payment_status === "Paid") {
    return (
      <Modal title="Payment Receipt" onClose={onClose} size="sm"
        footer={<>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary"
            onClick={() => printPaymentReceipt(payment, request, docType)}>
            🖨️ Print Receipt
          </button>
        </>}>
        <div style={{ textAlign:"center", padding:"16px 0" }}>
          <div style={{ fontSize:52, marginBottom:10 }}>✅</div>
          <div style={{ fontWeight:700, fontSize:17, color:"var(--green)", marginBottom:6 }}>Payment Confirmed!</div>
          <div style={{ fontSize:13, color:"var(--muted)", marginBottom:16 }}>
            Your payment has been received and confirmed.
          </div>
          <div style={{ background:"rgba(31,170,107,0.07)", border:"1px solid rgba(31,170,107,0.2)", borderRadius:10, padding:"14px 16px", textAlign:"left" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Transaction Ref</span>
              <span style={{ fontFamily:"var(--ffm)", fontSize:12.5, fontWeight:700, color:"var(--blue)" }}>{payment.transaction_ref}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Document Ref</span>
              <span style={{ fontFamily:"var(--ffm)", fontSize:12.5, fontWeight:700, color:"var(--blue)" }}>{payment.doc_ref_number}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Method</span>
              <span style={{ fontSize:13, fontWeight:600 }}>
                {payment.payment_method === "GCash" ? "💙" : payment.payment_method === "Maya" ? "💚" : "💵"} {payment.payment_method}
              </span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Amount</span>
              <span style={{ fontSize:16, fontWeight:700, color:"var(--green)" }}>₱{Number(payment.amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  if (payment?.payment_status === "Pending") {
    return (
      <Modal title="Payment Submitted" onClose={onClose} size="sm"
        footer={<>
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
          <button className="btn btn-primary"
            onClick={() => printPaymentReceipt(payment, request, docType)}>
            🖨️ Print Receipt
          </button>
        </>}>
        <div style={{ textAlign:"center", padding:"16px 0" }}>
          <div style={{ fontSize:52, marginBottom:10 }}>⏳</div>
          <div style={{ fontWeight:700, fontSize:17, color:"var(--amber)", marginBottom:6 }}>Awaiting Admin Confirmation</div>
          <div style={{ fontSize:13, color:"var(--muted)", marginBottom:16 }}>
            Your payment has been submitted and is pending admin confirmation.
          </div>
          <div style={{ background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, padding:"14px 16px", textAlign:"left" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Transaction Ref</span>
              <span style={{ fontFamily:"var(--ffm)", fontSize:12.5, fontWeight:700, color:"var(--blue)" }}>{payment.transaction_ref}</span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Method</span>
              <span style={{ fontSize:13, fontWeight:600 }}>
                {payment.payment_method === "GCash" ? "💙" : payment.payment_method === "Maya" ? "💚" : "💵"} {payment.payment_method}
              </span>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontSize:12, color:"var(--muted)" }}>Amount</span>
              <span style={{ fontSize:16, fontWeight:700, color:"var(--amber)" }}>₱{Number(payment.amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </Modal>
    );
  }

  // New payment form
  return (
    <Modal title="Online Payment" onClose={onClose} size="sm"
      footer={isFree ? (
        <><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handlePay} disabled={loading}>
          {loading ? "Submitting…" : "Submit (Free)"}
        </button></>
      ) : (
        <><button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handlePay} disabled={loading}>
          {loading ? "Processing…" : `Pay ₱${amount}.00`}
        </button></>
      )}>

      <div style={{ background:"#f8faff", border:"1px solid #eef2fa", borderRadius:10, padding:"12px 16px", marginBottom:20 }}>
        <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", color:"var(--muted)", marginBottom:6, letterSpacing:"0.5px" }}>Request Details</div>
        <div style={{ fontSize:14, fontWeight:600 }}>{docType}</div>
        {/* FIX #1: use ref_number (not reference_no) */}
        <div style={{ fontSize:12.5, color:"var(--muted)", marginTop:2 }}>Ref #: {request.ref_number}</div>
        <div style={{ fontSize:12.5, color:"var(--muted)" }}>Purpose: {request.purpose}</div>
      </div>

      {isFree ? (
        <div style={{ textAlign:"center", padding:"16px 0" }}>
          <div style={{ fontSize:48, marginBottom:10 }}>🎉</div>
          <div style={{ fontWeight:700, fontSize:16, color:"var(--green)" }}>This document is FREE!</div>
          <div style={{ fontSize:13, color:"var(--muted)", marginTop:6 }}>No payment required for Certificate of Indigency.</div>
        </div>
      ) : (
        <form onSubmit={handlePay}>
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:4 }}>Amount to Pay</div>
            <div style={{ fontFamily:"var(--ffd)", fontSize:40, fontWeight:700, color:"var(--blue)" }}>₱{amount}.00</div>
          </div>

          <div className="form-group">
            <label className="form-label">Payment Method *</label>
            <div style={{ display:"flex", gap:10 }}>
              {[
                { id:"GCash", emoji:"💙", label:"GCash" },
                { id:"Maya",  emoji:"💚", label:"Maya"  },
                { id:"Cash",  emoji:"💵", label:"Cash"  },
              ].map(m => (
                <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                  style={{
                    flex:1, padding:"12px 8px", borderRadius:10, cursor:"pointer",
                    border: method === m.id ? "2px solid var(--blue)" : "1px solid #dde3f0",
                    background: method === m.id ? "rgba(58,123,213,0.06)" : "#fff",
                    fontFamily:"var(--ff)", fontSize:12.5, fontWeight:600,
                    color: method === m.id ? "var(--blue)" : "var(--muted)",
                    display:"flex", flexDirection:"column", alignItems:"center", gap:5,
                  }}>
                  <span style={{ fontSize:26 }}>{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {(method === "GCash" || method === "Maya") && (
            <div className="form-group">
              <label className="form-label">{method} Number *</label>
              <div style={{ position:"relative" }}>
                <MdPhone style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"var(--muted)", fontSize:16 }} />
                <input className="form-input" style={{ paddingLeft:38 }}
                  value={number} onChange={e => setNumber(e.target.value)}
                  placeholder="09XXXXXXXXX" maxLength={11} required />
              </div>
              <div style={{ marginTop:14, background:"#f8faff", border:"1px solid #eef2fa", borderRadius:10, padding:16, textAlign:"center" }}>
                <div style={{ fontSize:10, color:"var(--muted)", marginBottom:10, textTransform:"uppercase", letterSpacing:"0.5px" }}>
                  Scan QR Code to Pay
                </div>
                <div style={{ width:110, height:110, margin:"0 auto", background:"#fff", border:"2px solid #eef2fa", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:36 }}>{method === "GCash" ? "💙" : "💚"}</div>
                    <div style={{ fontSize:10, fontWeight:700, color: method === "GCash" ? "#0066cc" : "#00a651" }}>{method} QR</div>
                    <div style={{ fontSize:9, color:"var(--muted)" }}>Brgy. Sto. Tomas</div>
                  </div>
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", marginTop:8 }}>
                  Send to: <strong>Barangay Sto. Tomas</strong>
                </div>
              </div>
            </div>
          )}

          {method === "Cash" && (
            <div style={{ background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:10, padding:"12px 16px", fontSize:13, color:"var(--amber)" }}>
              💵 <strong>Pay at the Barangay Hall.</strong><br/>
              Bring your reference number <strong style={{ fontFamily:"var(--ffm)" }}>{request.ref_number}</strong> and pay <strong>₱{amount}.00</strong> at the barangay office cashier.
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
