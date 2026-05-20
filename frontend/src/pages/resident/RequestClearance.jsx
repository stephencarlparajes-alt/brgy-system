// RequestClearance.jsx
import RequestForm from '../../components/ui/RequestForm';
import { clearanceAPI } from '../../utils/api';

export default function RequestClearance() {
  return <RequestForm title="Barangay Clearance" subtitle="For employment, travel, or legal purposes"
    icon="🪪" api={clearanceAPI} />;
}
