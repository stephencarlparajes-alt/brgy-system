// FIX #5: was named export `export function Indigency`, must be default export
import DocumentPage from '../../components/ui/DocumentPage';
import { indigencyAPI } from '../../utils/api';
import { MdDescription, MdHourglassEmpty, MdCheckCircle, MdCancel } from 'react-icons/md';

export default function Indigency() {
  return (
    <DocumentPage
      title="Certificate of Indigency"
      subtitle="Manage indigency certificate requests"
      api={indigencyAPI} docKey="indigency"
      refPrefix="IND"
      statCards={[
        { label:'Total',    key:'total',    icon:<MdDescription />,    color:'blue' },
        { label:'Pending',  key:'pending',  icon:<MdHourglassEmpty />, color:'amber' },
        { label:'Released', key:'released', icon:<MdCheckCircle />,    color:'green' },
        { label:'Rejected', key:'rejected', icon:<MdCancel />,         color:'red' },
      ]}
    />
  );
}
