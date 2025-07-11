import OpenAI from 'openai';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

interface BOLData {
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

export async function generateBOL(
  packingListText: string, 
  invoiceText: string
): Promise<BOLData> {
  const systemPrompt = `You are an expert shipping document processor specializing in Bills of Lading for ocean freight. 
Your task is to extract and organize information from shipping documents into a structured JSON format for generating a Bill of Lading.
Be thorough and accurate, extracting all relevant information while maintaining standard shipping industry formatting.

IMPORTANT: Return the JSON object with the exact field names and structure as specified in the instructions.`;

  const userPrompt = `Extract and organize information from these shipping documents to create a Bill of Lading.

PACKING LIST:
${packingListText}

COMMERCIAL INVOICE:
${invoiceText}

Instructions:
1. Extract ALL relevant information for a Bill of Lading
2. Cross-reference information between both documents for accuracy
3. Use standard shipping terminology
4. Include all cargo items with complete details
5. Ensure all addresses are complete
6. Extract any special handling instructions or marks
7. Identify freight and payment terms

Return a JSON object with the following exact structure:
{
  "shipper": {
    "name": "company name",
    "address": "street address",
    "city": "city, state/province, postal code",
    "country": "country",
    "phone": "optional phone number"
  },
  "consignee": {
    "name": "company name",
    "address": "street address", 
    "city": "city, state/province, postal code",
    "country": "country",
    "phone": "optional phone number"
  },
  "notify_party": {
    "name": "company name",
    "address": "full address"
  },
  "vessel_details": {
    "vessel_name": "vessel name or TBN",
    "voyage_number": "voyage number or TBN"
  },
  "ports": {
    "loading": "port of loading",
    "discharge": "port of discharge",
    "delivery": "final delivery location"
  },
  "cargo": [
    {
      "description": "item description",
      "hs_code": "HS code",
      "quantity": numeric quantity,
      "unit": "unit type (bags, cartons, etc)",
      "weight": "weight with unit",
      "volume": "volume/measurement"
    }
  ],
  "container_info": {
    "numbers": ["container numbers"],
    "seal_numbers": ["seal numbers"],
    "type": "container type"
  },
  "totals": {
    "packages": total number of packages,
    "gross_weight": "total weight with unit",
    "measurement": "total volume/CBM"
  },
  "invoice_details": {
    "number": "invoice number",
    "date": "invoice date",
    "value": "total value",
    "currency": "currency code"
  },
  "freight_terms": "FOB/CIF/etc",
  "payment_terms": "payment terms",
  "special_instructions": "any special instructions",
  "date_of_shipment": "shipment date"
}

Map the extracted information to this exact structure. Use the exporter as shipper.`;

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