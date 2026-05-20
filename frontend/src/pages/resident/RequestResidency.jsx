import RequestForm from '../../components/ui/RequestForm';
import { residencyAPI } from '../../utils/api';

export default function RequestResidency() {
  return <RequestForm title="Certificate of Residency" subtitle="Proof of residency in Barangay Sto. Tomas"
    icon="🏠" api={residencyAPI}
    extraFields={[
      { key:'years_of_residency', label:'Years of Residency', type:'number', placeholder:'e.g. 10' },
      { key:'address',            label:'Complete Address',   type:'text',   placeholder:'Zone, Brgy. Sto. Tomas, Magarao' },
    ]} />;
}
