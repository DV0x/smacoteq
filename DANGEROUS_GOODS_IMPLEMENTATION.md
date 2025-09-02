# Dangerous Goods Documentation Implementation Guide

## Overview
This guide provides step-by-step instructions for implementing dangerous goods documentation support in SmacBOL. The enhancement will allow users to upload three documents (packing list, commercial invoice, and dangerous goods declaration) to generate Bills of Lading with complete hazardous material information.

## Architecture Overview

```
User Upload (3 files) → OCR Processing → AI Extraction → BOL Generation with DG Info
```

## Required Dangerous Goods Fields

The following fields will be extracted from dangerous goods documentation:
- **UN Number**: United Nations identification number for the hazardous material
- **Hazard Class**: Classification of the dangerous good (1-9)
- **Packing Group**: I, II, or III indicating degree of danger
- **Marine Pollutant**: Yes/No indication
- **Proper Shipping Name**: Official transport name of the dangerous good

## Implementation Steps

> **Status**: Frontend implementation completed (Steps 1-2) ✅  
> **Commit**: cf79ae4 - "feat: Add dangerous goods upload mode with mobile-optimized UI"  
> **Next**: Backend services integration (Steps 3-6)

### Step 1: Update Type Definitions ✅ COMPLETED

**File**: `types/index.ts`

Add dangerous goods fields to the BOLData interface:

```typescript
export interface BOLData {
  // ... existing fields ...
  
  // Dangerous Goods Information
  dangerous_goods?: {
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
  };
  
  // Flag to indicate if shipment contains dangerous goods
  has_dangerous_goods?: boolean;
}
```

### Step 2: Update Frontend UI ✅ COMPLETED

**File**: `app/page.tsx`

**Implementation Notes:**
- ✅ Added dangerous goods upload mode with proper state management
- ✅ Implemented 3-column responsive grid layout (mobile: 1 col, tablet: 2 cols, desktop: 3 cols)
- ✅ Added warning UI with red styling and hazard icons
- ✅ Enhanced form validation for all three required documents
- ✅ Optimized for mobile devices with proper card alignment and responsive design
- ✅ Updated FormData handling for dangerous goods document
- ✅ Improved file type indicators with compact mobile layout

#### 2.1 Add State Variables
```typescript
const [uploadMode, setUploadMode] = useState<'separate' | 'combined' | 'dangerous'>('separate');
const [dangerousGoods, setDangerousGoods] = useState<File | null>(null);
```

#### 2.2 Update Upload Mode Selection UI
Add a third option for dangerous goods mode:

```typescript
// Add to the upload mode grid (around line 202)
<div 
  className={`relative border-2 rounded-xl p-6 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
    uploadMode === 'dangerous' 
      ? 'border-red-500 bg-gradient-to-br from-red-50 to-orange-50 shadow-lg' 
      : 'border-gray-200 hover:border-red-300 hover:shadow-md bg-white'
  }`}
  onClick={() => setUploadMode('dangerous')}
>
  {uploadMode === 'dangerous' && (
    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    </div>
  )}
  <div className="flex items-start space-x-4">
    <input
      type="radio"
      id="dangerous"
      name="uploadMode"
      value="dangerous"
      checked={uploadMode === 'dangerous'}
      onChange={() => setUploadMode('dangerous')}
      className="w-5 h-5 text-red-600 mt-1"
    />
    <div className="flex-1">
      <div className="flex items-center mb-2">
        <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <label htmlFor="dangerous" className="text-base font-semibold text-gray-900 cursor-pointer">
          Dangerous Goods Shipment
        </label>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">
        Upload Packing List, Invoice, and Dangerous Goods Declaration for hazardous materials
      </p>
    </div>
  </div>
</div>
```

#### 2.3 Update File Upload Section
```typescript
// Replace the existing file upload section (around line 391)
{uploadMode === 'separate' ? (
  <div className="grid md:grid-cols-2 gap-6 mb-8">
    <FileUpload
      label="Packing List"
      name="packingList"
      onFileSelect={setPackingList}
    />
    <FileUpload
      label="Commercial Invoice"
      name="invoice"
      onFileSelect={setInvoice}
    />
  </div>
) : uploadMode === 'dangerous' ? (
  <div className="space-y-6 mb-8">
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-red-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <div>
          <h4 className="text-sm font-semibold text-red-900 mb-1">Dangerous Goods Documentation Required</h4>
          <p className="text-sm text-red-700">Please upload all three required documents for dangerous goods shipments</p>
        </div>
      </div>
    </div>
    <div className="grid md:grid-cols-3 gap-4">
      <FileUpload
        label="Packing List"
        name="packingList"
        onFileSelect={setPackingList}
      />
      <FileUpload
        label="Commercial Invoice"
        name="invoice"
        onFileSelect={setInvoice}
      />
      <FileUpload
        label="Dangerous Goods Declaration"
        name="dangerousGoods"
        onFileSelect={setDangerousGoods}
      />
    </div>
  </div>
) : (
  <div className="mb-8">
    <FileUpload
      label="Combined Document (Packing List + Commercial Invoice)"
      name="combinedDocument"
      onFileSelect={setCombinedDocument}
    />
  </div>
)}
```

#### 2.4 Update Form Validation
```typescript
// Update validation logic in handleSubmit
if (uploadMode === 'separate') {
  if (!packingList || !invoice) {
    setError('Please upload both documents');
    return;
  }
} else if (uploadMode === 'dangerous') {
  if (!packingList || !invoice || !dangerousGoods) {
    setError('Please upload all three required documents for dangerous goods');
    return;
  }
} else {
  if (!combinedDocument) {
    setError('Please upload the combined document');
    return;
  }
}

// Update FormData creation
if (uploadMode === 'separate') {
  if (packingList) formData.append('packingList', packingList);
  if (invoice) formData.append('invoice', invoice);
} else if (uploadMode === 'dangerous') {
  if (packingList) formData.append('packingList', packingList);
  if (invoice) formData.append('invoice', invoice);
  if (dangerousGoods) formData.append('dangerousGoods', dangerousGoods);
} else {
  if (combinedDocument) formData.append('combinedDocument', combinedDocument);
}

// Update isFormValid helper
const isFormValid = uploadMode === 'separate' 
  ? (packingList && invoice)
  : uploadMode === 'dangerous'
  ? (packingList && invoice && dangerousGoods)
  : combinedDocument;
```

### Step 3: Update API Route Handler

**File**: `app/api/generate-bol/route.ts`

#### 3.1 Import New Functions
```typescript
import { 
  extractTextFromDocument, 
  extractFromCombinedDocument,
  extractFromDangerousGoodsDocuments 
} from '@/lib/services/ocr';
import { 
  generateBOL,
  generateBOLWithDangerousGoods 
} from '@/lib/services/llm';
```

#### 3.2 Update Request Processing
```typescript
// After line 124, update the document extraction logic
let packingList: File | null = null;
let invoice: File | null = null;
let combinedDocument: File | null = null;
let dangerousGoodsDoc: File | null = null;

if (uploadMode === 'combined') {
  combinedDocument = formData.get('combinedDocument') as File;
  await validateUploadedFile(combinedDocument, 'Combined Document');
} else if (uploadMode === 'dangerous') {
  // Extract and validate all three files for dangerous goods
  packingList = formData.get('packingList') as File;
  invoice = formData.get('invoice') as File;
  dangerousGoodsDoc = formData.get('dangerousGoods') as File;
  
  await validateUploadedFile(packingList, 'Packing List');
  await validateUploadedFile(invoice, 'Commercial Invoice');
  await validateUploadedFile(dangerousGoodsDoc, 'Dangerous Goods Declaration');
} else {
  // Default separate mode
  packingList = formData.get('packingList') as File;
  invoice = formData.get('invoice') as File;
  
  await validateUploadedFile(packingList, 'Packing List');
  await validateUploadedFile(invoice, 'Commercial Invoice');
}
```

#### 3.3 Update OCR Processing
```typescript
// Replace the OCR processing section (around line 152)
let packingListText: string;
let invoiceText: string;
let dangerousGoodsText: string = '';

if (uploadMode === 'combined') {
  console.log('Processing combined document with OCR...');
  const extractedTexts = await extractFromCombinedDocument(combinedDocument);
  packingListText = extractedTexts.packingList;
  invoiceText = extractedTexts.invoice;
} else if (uploadMode === 'dangerous') {
  console.log('Processing dangerous goods documents with OCR...');
  const extractedTexts = await extractFromDangerousGoodsDocuments(
    packingList!,
    invoice!,
    dangerousGoodsDoc!
  );
  packingListText = extractedTexts.packingList;
  invoiceText = extractedTexts.invoice;
  dangerousGoodsText = extractedTexts.dangerousGoods;
} else {
  console.log('Processing separate documents with OCR...');
  packingListText = await extractTextFromDocument(packingList!);
  invoiceText = await extractTextFromDocument(invoice!);
}
```

#### 3.4 Update LLM Processing
```typescript
// Update the LLM processing section
console.log('Generating BOL data with LLM...');
const bolData = uploadMode === 'dangerous' 
  ? await generateBOLWithDangerousGoods(packingListText, invoiceText, dangerousGoodsText)
  : await generateBOL(packingListText, invoiceText);
```

### Step 4: Update OCR Service

**File**: `lib/services/ocr.ts`

Add new function for processing dangerous goods documents:

```typescript
export async function extractFromDangerousGoodsDocuments(
  packingList: File,
  invoice: File,
  dangerousGoods: File
): Promise<{
  packingList: string;
  invoice: string;
  dangerousGoods: string;
}> {
  try {
    // Process all three documents in parallel for efficiency
    const [packingListText, invoiceText, dangerousGoodsText] = await Promise.all([
      extractTextFromDocument(packingList),
      extractTextFromDocument(invoice),
      extractTextFromDocument(dangerousGoods)
    ]);
    
    console.log('Successfully extracted text from all dangerous goods documents');
    
    return {
      packingList: packingListText,
      invoice: invoiceText,
      dangerousGoods: dangerousGoodsText
    };
  } catch (error) {
    console.error('Failed to extract text from dangerous goods documents:', error);
    throw new Error('OCR processing failed for dangerous goods documents');
  }
}
```

### Step 5: Update LLM Service

**File**: `lib/services/llm.ts`

Add new function for processing dangerous goods:

```typescript
export async function generateBOLWithDangerousGoods(
  packingListText: string,
  invoiceText: string,
  dangerousGoodsText: string
): Promise<BOLData> {
  const systemPrompt = `You are an expert shipping document processor specializing in Bills of Lading for ocean freight, with expertise in dangerous goods regulations. 
Your task is to extract and organize information from shipping documents including dangerous goods declarations into a structured JSON format for generating a professional Bill of Lading.

CRITICAL REQUIREMENTS:
1. Return ONLY a valid JSON object - no markdown, no explanations, no additional text
2. Use the EXACT field names and structure specified in the instructions
3. Extract ALL relevant information systematically from all three documents
4. Pay special attention to dangerous goods information - this is critical for safety and compliance
5. Cross-reference information between documents for accuracy and completeness
6. Use standard shipping industry terminology and formatting`;

  const userPrompt = `Extract and organize information from these shipping documents to create a comprehensive Bill of Lading with dangerous goods information.

PACKING LIST:
${packingListText}

COMMERCIAL INVOICE:
${invoiceText}

DANGEROUS GOODS DECLARATION:
${dangerousGoodsText}

EXTRACTION GUIDELINES:
- Use exporter/seller as shipper, buyer/consignee as consignee
- Extract container numbers, seal numbers, and shipping marks from any document
- Identify all reference numbers (booking, shipper's reference, etc.)
- Find port information, vessel details, and shipping dates
- Calculate accurate totals for packages, weights, and measurements
- Extract commercial terms (freight, payment, incoterms)
- Look for special instructions, handling requirements, or shipping marks

DANGEROUS GOODS EXTRACTION (CRITICAL):
- UN Number (e.g., UN 1234)
- Proper Shipping Name (exact name from declaration)
- Hazard Class (1-9, may include sub-class like 2.1)
- Packing Group (I, II, or III)
- Marine Pollutant (Yes/No or P for pollutant)
- Subsidiary Risk (if applicable)
- Flash Point (for Class 3 flammable liquids)
- Emergency Contact (24/7 contact number)
- Special Provisions or handling instructions
- Limited Quantity indication
- EMS Number (Emergency Schedule)
- Segregation requirements

Return a JSON object with this EXACT structure:

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
    "address": "full address",
    "phone": "phone number"
  },
  "booking_ref": "booking reference number",
  "shipper_ref": "shipper's reference number",
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
      "container_numbers": "container numbers",
      "seal_numbers": "seal numbers",
      "marks": "shipping marks and numbers",
      "description": "detailed description of goods INCLUDING dangerous goods classification",
      "gross_weight": "weight with unit",
      "measurement": "volume/measurement"
    }
  ],
  "totals": {
    "packages": 0,
    "gross_weight": "total weight with unit",
    "measurement": "total volume/CBM"
  },
  "dangerous_goods": {
    "un_number": "UN followed by 4 digits",
    "proper_shipping_name": "exact shipping name from declaration",
    "hazard_class": "primary hazard class",
    "packing_group": "I, II, or III",
    "marine_pollutant": true/false,
    "subsidiary_risk": "secondary hazard if applicable",
    "flash_point": "temperature if applicable",
    "emergency_contact": "24/7 emergency phone",
    "special_provisions": "any special handling requirements",
    "limited_quantity": true/false,
    "ems_number": "F-X, S-X format",
    "segregation_group": "segregation requirements"
  },
  "has_dangerous_goods": true,
  "freight_charges": "freight amount or terms",
  "invoice_details": {
    "number": "invoice number",
    "date": "invoice date",
    "value": "total value",
    "currency": "currency code"
  },
  "freight_terms": "FOB/CIF/etc",
  "special_instructions": "Include DANGEROUS GOODS warning and handling instructions"
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
      temperature: 0.1,
      max_tokens: 4096
    });
    
    const content = response.choices[0].message.content;
    if (!content) throw new Error('No response from LLM');
    
    const bolData = JSON.parse(content) as BOLData;
    
    // Ensure dangerous goods flag is set
    if (bolData.dangerous_goods) {
      bolData.has_dangerous_goods = true;
    }
    
    return bolData;
  } catch (error) {
    console.error('LLM processing failed for dangerous goods:', error);
    throw new Error('Failed to generate BOL data with dangerous goods information');
  }
}
```

### Step 6: Update PDF Template

**File**: `lib/templates/bol-generator.ts`

#### 6.1 Add Dangerous Goods Section Generator
```typescript
function generateDangerousGoodsSection(bolData: BOLData): string {
  if (!bolData.has_dangerous_goods || !bolData.dangerous_goods) {
    return '';
  }

  const dg = bolData.dangerous_goods;
  
  return `
    <div class="dangerous-goods-section">
      <div class="dg-warning">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span class="warning-text">DANGEROUS GOODS DECLARATION</span>
      </div>
      
      <div class="dg-grid">
        <div class="dg-item">
          <span class="dg-label">UN Number:</span>
          <span class="dg-value">${dg.un_number || 'N/A'}</span>
        </div>
        <div class="dg-item">
          <span class="dg-label">Class:</span>
          <span class="dg-value">${dg.hazard_class || 'N/A'}</span>
        </div>
        <div class="dg-item">
          <span class="dg-label">Packing Group:</span>
          <span class="dg-value">${dg.packing_group || 'N/A'}</span>
        </div>
        <div class="dg-item">
          <span class="dg-label">Marine Pollutant:</span>
          <span class="dg-value">${dg.marine_pollutant ? 'YES - P' : 'NO'}</span>
        </div>
      </div>
      
      <div class="dg-shipping-name">
        <span class="dg-label">Proper Shipping Name:</span>
        <span class="dg-value-large">${dg.proper_shipping_name || 'N/A'}</span>
      </div>
      
      ${dg.subsidiary_risk ? `
        <div class="dg-item">
          <span class="dg-label">Subsidiary Risk:</span>
          <span class="dg-value">${dg.subsidiary_risk}</span>
        </div>
      ` : ''}
      
      ${dg.flash_point ? `
        <div class="dg-item">
          <span class="dg-label">Flash Point:</span>
          <span class="dg-value">${dg.flash_point}</span>
        </div>
      ` : ''}
      
      ${dg.emergency_contact ? `
        <div class="dg-emergency">
          <span class="dg-label">24/7 Emergency Contact:</span>
          <span class="dg-value-bold">${dg.emergency_contact}</span>
        </div>
      ` : ''}
      
      ${dg.special_provisions ? `
        <div class="dg-provisions">
          <span class="dg-label">Special Provisions:</span>
          <span class="dg-value">${dg.special_provisions}</span>
        </div>
      ` : ''}
    </div>
  `;
}
```

#### 6.2 Add CSS Styles for Dangerous Goods
Add to the style section in `getHTMLTemplate()`:

```css
.dangerous-goods-section {
  margin: 15px 0;
  padding: 12px;
  border: 2px solid #ff0000;
  background-color: #fff5f5;
}

.dg-warning {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  padding: 8px;
  background-color: #ff0000;
  color: white;
}

.warning-icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.warning-text {
  font-size: 14px;
  font-weight: bold;
  text-transform: uppercase;
}

.dg-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.dg-item {
  display: flex;
  justify-content: space-between;
  padding: 4px;
  background-color: #ffffff;
  border: 1px solid #ff9999;
}

.dg-label {
  font-weight: bold;
  font-size: 10px;
  color: #cc0000;
}

.dg-value {
  font-size: 10px;
  font-weight: 600;
}

.dg-value-large {
  font-size: 11px;
  font-weight: bold;
  color: #000;
}

.dg-value-bold {
  font-size: 11px;
  font-weight: bold;
  color: #cc0000;
}

.dg-shipping-name {
  margin: 10px 0;
  padding: 8px;
  background-color: #ffffff;
  border: 1px solid #ff9999;
}

.dg-emergency {
  margin-top: 10px;
  padding: 8px;
  background-color: #ffcc00;
  border: 1px solid #ff9900;
  text-align: center;
}

.dg-provisions {
  margin-top: 8px;
  padding: 6px;
  font-size: 9px;
  border-top: 1px solid #ff9999;
}
```

#### 6.3 Update Main Generation Function
Update the `generateBOLHTML` function to include dangerous goods:

```typescript
export function generateBOLHTML(
  bolData: BOLData,
  customBolNumber?: string | null,
  customBookingNumber?: string | null
): string {
  const bolNumber = customBolNumber && customBolNumber.trim() 
    ? customBolNumber.trim() 
    : `BOL-${Date.now().toString().slice(-8)}`;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    ${generateHeader(bolNumber, bolData)}
    ${generateDocumentTracking(bolData)}
    ${generatePartiesSection(bolData)}
    ${generateTransportDetails(bolData, customBookingNumber)}
    ${bolData.has_dangerous_goods ? generateDangerousGoodsSection(bolData) : ''}
    ${generateCargoDisclaimer()}
    ${generateCargoTable(bolData)}
    ${generateTotalsSection(bolData)}
    ${generateCommercialSection(bolData)}
    ${generateFooterLegal()}
    ${generateSignatureSection(bolData)}
    ${generateDateSection(bolData, currentDate)}
    ${generateFinalNotice()}
  `;

  return getHTMLTemplate().replace('{{CONTENT}}', content);
}
```

### Step 7: Testing Guidelines

#### 7.1 Test Files Preparation
Prepare test documents:
1. **Packing List**: Standard packing list with item details
2. **Commercial Invoice**: Standard commercial invoice
3. **Dangerous Goods Declaration**: Should include:
   - UN Number (e.g., UN 1263)
   - Proper Shipping Name (e.g., PAINT)
   - Class (e.g., 3)
   - Packing Group (e.g., II)
   - Marine Pollutant status

#### 7.2 Test Scenarios
1. **Valid Dangerous Goods Upload**
   - Upload all three required documents
   - Verify all dangerous goods fields are extracted
   - Check PDF contains dangerous goods section

2. **Missing Document**
   - Try uploading only 2 of 3 documents
   - Should show validation error

3. **Mixed Mode Testing**
   - Test switching between modes
   - Ensure file requirements update correctly

4. **PDF Generation**
   - Verify dangerous goods section appears with red border
   - Check warning header is prominent
   - Ensure all fields are populated correctly

## Implementation Progress

### ✅ Completed Steps
- **Step 1**: Type definitions updated with comprehensive dangerous goods fields
- **Step 2**: Frontend UI implemented with mobile-optimized responsive design

### 🔄 Remaining Steps
- **Step 3**: Update API Route Handler (`app/api/generate-bol/route.ts`)
- **Step 4**: Update OCR Service (`lib/services/ocr.ts`)
- **Step 5**: Update LLM Service (`lib/services/llm.ts`)
- **Step 6**: Update PDF Template (`lib/templates/bol-generator.ts`)
- **Step 7**: Testing & Validation
- **Step 8**: Deployment

### Step 8: Deployment Checklist

- [x] Update environment variables (ensure API keys are set)
- [ ] Test OCR processing with sample dangerous goods documents
- [ ] Verify LLM prompt correctly extracts DG information
- [ ] Check PDF generation includes DG section
- [x] Test all three upload modes (UI completed)
- [ ] Verify file size limits work correctly
- [ ] Test rate limiting with DG mode
- [x] Update documentation (this document)
- [ ] Add error handling for DG-specific failures
- [ ] Consider adding DG validation rules

### Step 9: Future Enhancements

1. **Validation Rules**
   - Validate UN numbers against database
   - Check packing group compatibility with class
   - Verify proper shipping names

2. **Additional Fields**
   - Technical names for N.O.S. entries
   - Net quantity of dangerous goods
   - Gross weight of dangerous goods
   - Number of packages containing DG

3. **Compliance Features**
   - IMDG Code compliance check
   - Segregation requirements validation
   - Documentation completeness check

4. **UI Improvements**
   - Visual hazard class indicators
   - Placard preview
   - Interactive DG information tooltips

## Conclusion

This implementation guide provides a complete roadmap for adding dangerous goods documentation support to SmacBOL. The enhancement maintains backward compatibility while adding critical functionality for hazardous material shipments. Follow the steps sequentially and test thoroughly at each stage to ensure a successful implementation.