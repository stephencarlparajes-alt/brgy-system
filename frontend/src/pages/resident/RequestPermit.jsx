import RequestForm from '../../components/ui/RequestForm';
import { permitAPI } from '../../utils/api';

const BUSINESS_TYPES = ['Sari-Sari Store','Food Stall','Repair Shop','Beauty Salon','Barbershop','Laundry Shop','Bakery','Internet Cafe','Boarding House','Other'];

export default function RequestPermit() {
  return <RequestForm title="Business Permit" subtitle="Apply or renew your barangay business permit"
    icon="🏢" api={permitAPI}
    extraFields={[
      { key:'business_name',    label:'Business Name *',    type:'text',   placeholder:'e.g. Juan\'s Sari-Sari Store', required:true },
      { key:'business_type',    label:'Business Type *',    type:'select', options:BUSINESS_TYPES, required:true },
      { key:'business_address', label:'Business Address *', type:'text',   placeholder:'Exact location of business', required:true },
    ]} />;
}
