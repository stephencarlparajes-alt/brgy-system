import { useEffect, useState, useCallback } from "react";
import { historyAPI, paymentAPI } from "../../utils/api";
import { printPaymentReceipt } from "../../utils/printReceipt";
import { printDocument } from "../../utils/printDocument";
import toast from "react-hot-toast";
import Badge from "../../components/ui/Badge";
import { MdSearch, MdPrint, MdReceiptLong } from "react-icons/md";

const DOC_TYPES = ["Barangay Clearance","Cert. of Indigency","Cert. of Residency","Business Permit"];
const TYPE_COLORS = {
  "Barangay Clearance": { bg:"rgba(58,123,213,0.08)",  color:"#1f56b0" },
  "Cert. of Indigency": { bg:"rgba(99,102,241,0.08)",  color:"#6366f1" },
  "Cert. of Residency": { bg:"rgba(31,170,107,0.08)",  color:"#1faa6b" },
  "Business Permit":    { bg:"rgba(8,145,178,0.08)",   color:"#0891b2" },
};

export default function History() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("");
  const [type,    setType]    = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await historyAPI.getAll({
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(type   ? { type   } : {}),
      });
      setRows(res.data.data || []);
    } catch (err) {
      console.error("History load error:", err);
      toast.error("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }, [search, status, type]);

  useEffect(() => { load(); }, [load]);

  // Print the document certificate
  const handlePrintDoc = (row) => {
    printDocument(row, row.doc_type);
  };

  // Print payment receipt for a history row
  const handlePrintReceipt = async (row) => {
    try {
      const res = await paymentAPI.getAll({ status:"" });
      const payment = res.data.data.find(p => p.doc_ref_number === row.ref_number);
      if (!payment) {
        toast.error("No payment record found for this document.");
        return;
      }
      const request = { ref_number: row.ref_number, full_name: row.full_name, purpose: row.purpose };
      printPaymentReceipt(payment, request, row.doc_type);
    } catch {
      toast.error("Failed to fetch payment receipt.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div><h1>Document History</h1><p>All released and rejected document records</p></div>
      </div>

      {/* Summary stats */}
      <div className="stat-grid col-4" style={{ marginBottom:16 }}>
        {DOC_TYPES.map(t => {
          const tc    = TYPE_COLORS[t];
          const count = rows.filter(r => r.doc_type === t).length;
          return (
            <div className="stat-card" key={t}>
              <div className="stat-icon" style={{ background:tc.bg, color:tc.color, width:42, height:42, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, flexShrink:0 }}>
                📄
              </div>
              <div>
                <div className="stat-label">{t}</div>
                <div className="stat-value">{count}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="search-bar">
        <div className="search-wrap">
          <MdSearch />
          <input className="search-input" placeholder="Search name or ref#…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="filter-select" value={type} onChange={e => setType(e.target.value)}>
          <option value="">All Types</option>
          {DOC_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Statuses</option>
          <option>Released</option>
          <option>Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ref #</th>
              <th>Document Type</th>
              <th>Resident Name</th>
              <th>Purpose</th>
              <th>OR Number</th>
              <th>Date Issued</th>
              <th>Issued By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ textAlign:"center", padding:40 }}>
                <div className="spinner" style={{ margin:"0 auto" }} />
              </td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty-state">
                  <p>No history records found.</p>
                  <p style={{ fontSize:12, marginTop:6 }}>Records appear here once documents are released or rejected.</p>
                </div>
              </td></tr>
            ) : rows.map((r, i) => {
              const tc = TYPE_COLORS[r.doc_type] || { bg:"rgba(58,123,213,0.08)", color:"#1f56b0" };
              return (
                <tr key={i}>
                  <td><span className="ref-num">{r.ref_number}</span></td>
                  <td>
                    <span style={{ background:tc.bg, color:tc.color, padding:"3px 10px", borderRadius:6, fontSize:11.5, fontWeight:600 }}>
                      {r.doc_type}
                    </span>
                  </td>
                  <td>{r.full_name}</td>
                  <td style={{ fontSize:12.5, color:"var(--muted)", maxWidth:160 }}>{r.purpose}</td>
                  <td>
                    {r.or_number
                      ? <span className="ref-num">{r.or_number}</span>
                      : <span style={{ color:"var(--muted)", fontSize:12 }}>—</span>}
                  </td>
                  <td style={{ fontSize:12, color:"var(--muted)" }}>
                    {r.date_issued
                      ? new Date(r.date_issued).toLocaleDateString("en-PH", { year:"numeric", month:"short", day:"numeric" })
                      : "—"}
                  </td>
                  <td style={{ fontSize:12.5 }}>{r.issued_by || "—"}</td>
                  <td><Badge status={r.status} /></td>
                  <td>
                    <div className="td-actions">
                      {r.status === "Released" && (
                        <>
                          {/* Reprint document */}
                          <button className="icon-btn print" onClick={() => handlePrintDoc(r)} title="Print Document">
                            <MdPrint />
                          </button>
                          {/* Print payment receipt */}
                          <button className="icon-btn view" onClick={() => handlePrintReceipt(r)} title="Print Receipt">
                            <MdReceiptLong />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="table-footer">{rows.length} record(s) total</div>
      </div>
    </div>
  );
}
