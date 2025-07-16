import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

interface BOLData {
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
  };
  
  // Reference Numbers
  booking_ref?: string;
  shipper_ref?: string;
  imo_number?: string;
  rider_pages?: number;
  bl_sequence?: string; // Number & sequence of original B/Ls
  
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
  
  // Authentication
  carrier_endorsements?: string;
  signed_by?: string;
}

export async function generateBOL(
  packingListText: string, 
  invoiceText: string
): Promise<BOLData> {
  const systemPrompt = `You are an expert shipping document processor specializing in Bills of Lading for ocean freight. 
Your task is to extract and organize information from shipping documents into a structured JSON format for generating a professional Bill of Lading.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object - no markdown, no explanations, no additional text
2. Use the EXACT field names and structure specified in the instructions
3. Extract ALL relevant information systematically from both documents
4. Cross-reference information between documents for accuracy and completeness
5. Use standard shipping industry terminology and formatting`;

  const userPrompt = `Extract and organize information from these shipping documents to create a comprehensive Bill of Lading.

PACKING LIST:
${packingListText}

COMMERCIAL INVOICE:
${invoiceText}

EXTRACTION GUIDELINES:
- Use exporter/seller as shipper, buyer/consignee as consignee
- Extract container numbers, seal numbers, and shipping marks from either document
- Identify all reference numbers (booking, shipper's reference, etc.)
- Find port information, vessel details, and shipping dates
- Calculate accurate totals for packages, weights, and measurements
- Extract commercial terms (freight, payment, incoterms)
- Look for special instructions, handling requirements, or shipping marks

Return a JSON object with this EXACT structure (all fields are optional unless marked required):

{
  "shipper": {
    "name": "full company name",
    "address": "street address",
    "city": "city, state/province, postal code", 
    "country": "country name",
    "phone": "phone number if available"
  },
  "consignee": {
    "name": "full company name",
    "address": "street address",
    "city": "city, state/province, postal code",
    "country": "country name", 
    "phone": "phone number if available",
    "is_negotiable": false
  },
  "notify_party": {
    "name": "company name if different from consignee",
    "address": "full address"
  },
  "booking_ref": "booking reference number",
  "shipper_ref": "shipper's reference number",
  "imo_number": "IMO vessel number if available",
  "rider_pages": 0,
  "bl_sequence": "3 (Three) Original Bills of Lading",
  "vessel_details": {
    "vessel_name": "vessel name or TBN",
    "voyage_number": "voyage number or TBN"
  },
  "ports": {
    "loading": "port of loading",
    "discharge": "port of discharge", 
    "delivery": "final delivery location"
  },
  "place_of_receipt": "place where goods received by carrier",
  "place_of_delivery": "final delivery location",
  "shipped_on_board_date": "date goods loaded on vessel",
  "place_and_date_of_issue": "where and when B/L issued",
  "discharge_agent": "port agent at discharge port",
  "transport_type": "Port-To-Port",
  "cargo": [
    {
      "container_numbers": "container numbers if available",
      "seal_numbers": "seal numbers if available", 
      "marks": "shipping marks and numbers",
      "description": "detailed description of goods",
      "gross_weight": "weight with unit (kg/lbs)",
      "measurement": "volume/measurement if available"
    }
  ],
  "totals": {
    "packages": 0,
    "gross_weight": "total weight with unit",
    "measurement": "total volume/CBM"
  },
  "freight_charges": "freight amount or terms",
  "declared_value": "declared value if any",
  "carrier_receipt": "receipt statement for goods",
  "invoice_details": {
    "number": "invoice number",
    "date": "invoice date",
    "value": "total invoice value",
    "currency": "currency code (USD/EUR/etc)"
  },
  "freight_terms": "FOB/CIF/EXW/etc",
  "payment_terms": "payment terms",
  "special_instructions": "special handling instructions",
  "date_of_shipment": "shipment date",
  "carrier_endorsements": "",
  "signed_by": ""
}

EXAMPLE OUTPUT FORMAT:
{
  "shipper": {
    "name": "ABC Exports Ltd",
    "address": "123 Industrial Road",
    "city": "Mumbai, Maharashtra 400001",
    "country": "India",
    "phone": "+91-22-12345678"
  },
  "consignee": {
    "name": "XYZ Imports BV", 
    "address": "456 Harbor Street",
    "city": "Rotterdam, 3011 AB",
    "country": "Netherlands",
    "is_negotiable": false
  },
  "booking_ref": "BOOK123456",
  "shipper_ref": "EXP/2024/001",
  "ports": {
    "loading": "INMUN (Mundra)",
    "discharge": "NLRTM (Rotterdam)"
  },
  "cargo": [
    {
      "marks": "CTNS 1-100",
      "description": "Machine Parts",
      "gross_weight": "1000 kg"
    }
  ],
  "totals": {
    "packages": 100,
    "gross_weight": "1000 kg"
  },
  "freight_terms": "FOB"
}

Return only the JSON object with extracted data.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini-2025-04-14",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 4096
    });
    
    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from LLM');
    
    return JSON.parse(content) as BOLData;
  } catch (error) {
    console.error('LLM processing failed:', error);
    throw new Error('Failed to generate BOL data');
  }
}