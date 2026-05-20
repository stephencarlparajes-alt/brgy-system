// Clearance.jsx
import DocumentPage from '../../components/ui/DocumentPage';
import { clearanceAPI } from '../../utils/api';
import { MdBadge, MdHourglassEmpty, MdCheckCircle, MdCancel } from 'react-icons/md';

export default function Clearance() {
  return (
    <DocumentPage
      title="Barangay Clearance"
      subtitle="Manage clearance requests"
      api={clearanceAPI} docKey="clearance"
      refPrefix="CLR"
      statCards={[
        { label:'Total',    key:'total',    icon:<MdBadge />,         color:'blue' },
        { label:'Pending',  key:'pending',  icon:<MdHourglassEmpty />,color:'amber' },
        { label:'Released', key:'released', icon:<MdCheckCircle />,   color:'green' },
        { label:'Rejected', key:'rejected', icon:<MdCancel />,        color:'red' },
      ]}
    />
  );
}
