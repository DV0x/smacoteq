export interface BOLData {
  // Party Information
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
    is_negotiable?: boolean; // For "To Order" marking
  };
  notify_party?: {
    name: string;
    address: string;
    phone?: string;
  };
  
  // Reference Numbers
  booking_ref?: string;
  shipper_ref?: string;
  imo_number?: string;
  rider_pages?: number;
  bl_sequence?: string; // Number & sequence of original B/Ls
  
  // Additional fields from pdf.md specification
  original_bl_count?: string; // Number of original B/Ls issued
  hs_code?: string; // H.S. Code for customs declaration
  
  // Transport Details
  vessel_details?: {
    vessel_name: string;
    voyage_number: string;
  };
  ports: {
    loading: string;
    discharge: string;
    delivery?: string;
  };
  place_of_receipt?: string;
  place_of_delivery?: string;
  shipped_on_board_date?: string;
  place_and_date_of_issue?: string;
  
  // Discharge Agent
  discharge_agent?: string;
  transport_type?: 'Port-To-Port' | 'Combined Transport';
  
  // Cargo Information
  cargo: Array<{
    container_numbers?: string;
    seal_numbers?: string;
    marks?: string;
    description: string;
    gross_weight: string;
    measurement?: string;
  }>;
  
  // Totals
  totals: {
    packages: number;
    gross_weight: string;
    measurement?: string;
  };
  
  // Commercial Information
  freight_charges?: string;
  declared_value?: string;
  carrier_receipt?: string;
  
  // Legacy fields for backward compatibility
  invoice_details?: {
    number: string;
    date: string;
    value: string;
    currency: string;
  };
  freight_terms?: string;
  payment_terms?: string;
  special_instructions?: string;
  date_of_shipment?: string;
  
  // Dangerous Goods Information - Support multiple entries
  dangerous_goods?: Array<{
    un_number: string;
    proper_shipping_name: string;
    hazard_class: string;
    packing_group?: 'I' | 'II' | 'III';
    marine_pollutant: boolean;
    subsidiary_risk?: string;
    flash_point?: string;
    emergency_contact?: string;
    special_provisions?: string;
    limited_quantity?: boolean;
    ems_number?: string; // Emergency Schedule Number
    segregation_group?: string;
  }>;
  
  // Flag to indicate if shipment contains dangerous goods
  has_dangerous_goods?: boolean;

  // Authentication
  carrier_endorsements?: string;
  signed_by?: string;
}

export type ProcessingStatus = 
  | 'idle' 
  | 'uploading' 
  | 'ocr' 
  | 'llm' 
  | 'pdf' 
  | 'complete' 
  | 'error';