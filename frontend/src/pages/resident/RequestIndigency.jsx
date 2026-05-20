import RequestForm from '../../components/ui/RequestForm';
import { indigencyAPI } from '../../utils/api';

export default function RequestIndigency() {
  return <RequestForm title="Cert. of Indigency" subtitle="For government assistance, scholarships, or social services"
    icon="📄" api={indigencyAPI} />;
}
