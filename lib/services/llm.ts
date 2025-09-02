import OpenAI from 'openai';
import type { BOLData } from '@/types';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY! 
});

export async function generateBOL(
  packingListText: string, 
  invoiceText: string
): Promise<BOLData> {
  // Debug logging for input text analysis
  console.log('OCR Input - Packing list length:', packingListText.length);
  console.log('OCR Input - Invoice length:', invoiceText.length);
  console.log('OCR Input - Packing list preview:', packingListText.substring(0, 200));
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

CRITICAL CARGO EXTRACTION RULES:
- MAINTAIN EACH PRODUCT/ITEM AS A SEPARATE CARGO ENTRY
- DO NOT consolidate different products into a single cargo item
- Each distinct product with different marks/descriptions should be a separate array item
- Preserve individual weights, descriptions, and marks for each product line
- The cargo array should contain multiple objects, one for each distinct product/batch

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
      "marks": "specific marks for this item (e.g., 01-200 Boxes)",
      "description": "detailed description of this specific product",
      "gross_weight": "weight with unit for this item only",
      "measurement": "volume/measurement for this item if available"
    },
    {
      "container_numbers": "same or different container",
      "seal_numbers": "seal numbers if different", 
      "marks": "marks for second item (e.g., 201-400 Boxes)",
      "description": "description of second product",
      "gross_weight": "weight for second item",
      "measurement": "measurement for second item"
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
      "marks": "01-200 Boxes",
      "description": "Alpha Cypermethrin 10% EC HS Code: 38089199 200 Boxes 100 x 100 ml. Normal Al Bottle",
      "gross_weight": "2000 kg"
    },
    {
      "marks": "201-400 Boxes", 
      "description": "Alpha Cypermethrin 10% EC HS Code: 38089199 200 Boxes 40 x 250 ml. Normal Al Bottle",
      "gross_weight": "2000 kg"
    },
    {
      "marks": "401-450 Boxes",
      "description": "Azoxystrobin 18.2% + Difenoconazole 11.4% SC HS Code: 38089290 50 Boxes 40 x 250 ml. Co-Ex Bottle", 
      "gross_weight": "500 kg"
    }
  ],
  "totals": {
    "packages": 450,
    "gross_weight": "4500 kg"
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
    
    const bolData = JSON.parse(content) as BOLData;
    
    // Debug logging for both environments to diagnose production issues
    console.log('LLM Response - Cargo items count:', bolData.cargo?.length || 0);
    console.log('LLM Response - Total packages:', bolData.totals?.packages || 0);
    console.log('LLM Response - First cargo item marks:', bolData.cargo?.[0]?.marks || 'NONE');
    
    // Log the full LLM response in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Full LLM Response:', JSON.stringify(bolData, null, 2));
    }
    
    return bolData;
  } catch (error) {
    console.error('LLM processing failed:', error);
    throw new Error('Failed to generate BOL data');
  }
}