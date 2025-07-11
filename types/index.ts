export interface BOLData {
  shipper: {
    name: string;
    address: string;
    city: string;
    country: string;
    phone?: string;
  };
  consignee: {
    name: string;
    address: string;
    city: string;
    country: string;
    phone?: string;
  };
  notify_party?: {
    name: string;
    address: string;
  };
  vessel_details?: {
    vessel_name: string;
    voyage_number: string;
  };
  ports: {
    loading: string;
    discharge: string;
    delivery?: string;
  };
  cargo: Array<{
    description: string;
    hs_code?: string;
    quantity: number;
    unit: string;
    weight: string;
    volume?: string;
  }>;
  container_info?: {
    numbers: string[];
    seal_numbers?: string[];
    type?: string;
  };
  totals: {
    packages: number;
    gross_weight: string;
    measurement?: string;
  };
  invoice_details: {
    number: string;
    date: string;
    value: string;
    currency: string;
  };
  freight_terms: string;
  payment_terms?: string;
  special_instructions?: string;
  date_of_shipment?: string;
}

export type ProcessingStatus = 
  | 'idle' 
  | 'uploading' 
  | 'ocr' 
  | 'llm' 
  | 'pdf' 
  | 'complete' 
  | 'error';