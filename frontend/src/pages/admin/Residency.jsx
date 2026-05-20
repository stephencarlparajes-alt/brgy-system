import DocumentPage from '../../components/ui/DocumentPage';
import { residencyAPI } from '../../utils/api';
import { MdHome, MdHourglassEmpty, MdCheckCircle, MdCancel } from 'react-icons/md';

export default function Residency() {
  return <DocumentPage title="Certificate of Residency" subtitle="Manage residency certificate requests" api={residencyAPI} docKey="residency" refPrefix="RES"
    statCards={[
      { label:'Total',    key:'total',    icon:<MdHome />,           color:'blue' },
      { label:'Pending',  key:'pending',  icon:<MdHourglassEmpty />, color:'amber' },
      { label:'Released', key:'released', icon:<MdCheckCircle />,    color:'green' },
      { label:'Rejected', key:'rejected', icon:<MdCancel />,         color:'red' },
    ]} />;
}
