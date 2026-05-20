import DocumentPage from '../../components/ui/DocumentPage';
import { permitAPI } from '../../utils/api';
import { MdBusiness, MdHourglassEmpty, MdCheckCircle, MdCancel } from 'react-icons/md';

export default function Permit() {
  return <DocumentPage title="Business Permit" subtitle="Manage barangay business permit applications" api={permitAPI} docKey="permits" refPrefix="BPR"
    statCards={[
      { label:'Total',    key:'total',    icon:<MdBusiness />,       color:'blue' },
      { label:'Pending',  key:'pending',  icon:<MdHourglassEmpty />, color:'amber' },
      { label:'Released', key:'released', icon:<MdCheckCircle />,    color:'green' },
      { label:'Rejected', key:'rejected', icon:<MdCancel />,         color:'red' },
    ]} />;
}
