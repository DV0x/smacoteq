# Bill of Lading Generator - Implementation Plan

## Project Overview

An automated system that processes shipping documents (Packing Lists and Commercial Invoices) using Mistral OCR, extracts all text content, and leverages LLM intelligence to generate compliant Bills of Lading for ocean freight shipping.

### Core Architecture
```
Upload Documents → Mistral OCR (extract all text) → LLM (organize into BOL) → Generate PDF
```

### Detailed Data Flow

#### 1. **Document Upload** (Frontend)
- User uploads two files: Packing List and Commercial Invoice
- Supported formats: PDF, JPG, PNG (up to 50MB)
- Files are validated and sent to API endpoint

#### 2. **OCR Processing** (Mistral OCR API)
```typescript
// Input: Raw document files
packingListText = await extractTextFromDocument(packingList);
invoiceText = await extractTextFromDocument(invoice);

// Output: Markdown-formatted text with preserved structure
```

**Example OCR Output:**
```markdown
--- PAGE 1 ---
# PACKING LIST
**Date:** 2024-01-15
**Invoice No:** PL-2024-001

**Shipper:**
ABC Electronics Ltd.
123 Tech Park, Silicon Valley
San Francisco, CA 94105, USA
Tel: +1-415-555-0123

**Consignee:**
XYZ Import Co.
456 Harbor Road
Shanghai, 200120, China

**Cargo Details:**
| Item | Description | Quantity | Weight | Volume |
|------|------------|----------|---------|---------|
| 1 | Electronic Components | 500 units | 250 kg | 2.5 CBM |
| 2 | Circuit Boards | 200 units | 100 kg | 1.0 CBM |

**Total:** 700 units, 350 kg, 3.5 CBM
```

#### 3. **LLM Processing** (OpenAI GPT-4)
The LLM receives both OCR texts and intelligently:
- Extracts structured information
- Cross-references data between documents
- Resolves conflicts and fills gaps
- Standardizes shipping terminology

**LLM System Prompt:**
```
You are an expert shipping document processor specializing in Bills of Lading for ocean freight.
Extract and organize information from shipping documents into a structured format for generating a Bill of Lading.
```

**LLM Output - Structured JSON:**
```json
{
  "shipper": {
    "name": "ABC Electronics Ltd.",
    "address": "123 Tech Park, Silicon Valley",
    "city": "San Francisco, CA 94105",
    "country": "USA",
    "phone": "+1-415-555-0123"
  },
  "consignee": {
    "name": "XYZ Import Co.",
    "address": "456 Harbor Road",
    "city": "Shanghai, 200120",
    "country": "China"
  },
  "cargo": [
    {
      "description": "Electronic Components",
      "quantity": 500,
      "unit": "units",
      "weight": "250 kg",
      "volume": "2.5 CBM"
    },
    {
      "description": "Circuit Boards",
      "quantity": 200,
      "unit": "units",
      "weight": "100 kg",
      "volume": "1.0 CBM"
    }
  ],
  "totals": {
    "packages": 700,
    "gross_weight": "350 kg",
    "measurement": "3.5 CBM"
  },
  "invoice_details": {
    "number": "INV-2024-001",
    "date": "2024-01-15",
    "value": "50000",
    "currency": "USD"
  },
  "freight_terms": "FOB San Francisco",
  "ports": {
    "loading": "San Francisco, USA",
    "discharge": "Shanghai, China"
  }
}
```

#### 4. **PDF Generation** (pdf-lib)
The PDF generator takes the structured data and creates a professional Bill of Lading with:
- Professional layout with company branding area
- Structured sections for all parties
- Detailed cargo table with alternating row colors
- Calculated totals and summaries
- Signature blocks and legal notices

**PDF Features:**
- A4 page size
- Professional blue/gray color scheme
- Multiple fonts for hierarchy
- Auto-text wrapping for long content
- Dynamic table generation for cargo items

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS ✅ **IMPLEMENTED**
- **OCR**: Mistral OCR API ✅ **IMPLEMENTED**
- **LLM**: OpenAI GPT-4.1-mini-2025-04-14 ✅ **IMPLEMENTED**
- **PDF Generation**: pdf-lib ✅ **IMPLEMENTED**
- **Deployment**: Vercel ⏳ **PENDING**

## Project Setup

### Step 1: Initialize Next.js Project ✅ **COMPLETED**
```bash
npx create-next-app@latest bol-generator --typescript --tailwind --app
cd bol-generator
```

### Step 2: Install Dependencies ✅ **COMPLETED**
```bash
npm install @mistralai/mistralai openai pdf-lib
npm install @types/formidable --save-dev
```
**Note:** The Mistral package is `@mistralai/mistralai` not `mistralai`

### Step 3: Environment Configuration ✅ **COMPLETED**
Create `.env.local`:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 4: Project Structure ✅ **COMPLETED**
```
bol-generator/
├── app/
│   ├── page.tsx              # Main upload interface ✅
│   ├── layout.tsx            # Root layout ✅
│   ├── globals.css           # Global styles ✅
│   └── api/
│       └── generate-bol/
│           └── route.ts      # BOL generation endpoint ✅
├── lib/
│   ├── services/
│   │   ├── ocr.ts           # Mistral OCR integration ✅
│   │   ├── llm.ts           # LLM integration ✅
│   │   └── pdf.ts           # PDF generation ✅
│   └── utils/
│       └── file-helpers.ts   # File conversion utilities ✅
├── components/
│   ├── FileUpload.tsx        # File upload component ✅
│   └── ProcessingStatus.tsx  # Status display ✅
├── types/
│   └── index.ts             # TypeScript definitions ✅
└── public/
    └── bol-template.png     # Optional: BOL template image ⏳
```

## Implementation Guide

### Phase 1: File Handling Utilities ✅ **COMPLETED**

#### lib/utils/file-helpers.ts
```typescript
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove data URL prefix to get pure base64
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
  });
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload PDF, JPG, or PNG.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 50MB.' };
  }
  
  return { valid: true };
}
```

### Phase 2: Mistral OCR Integration ✅ **COMPLETED**

#### lib/services/ocr.ts
```typescript
import { Mistral } from '@mistralai/mistralai';
import { fileToBase64 } from '../utils/file-helpers';

const client = new Mistral({ 
  apiKey: process.env.MISTRAL_API_KEY! 
});

export async function extractTextFromDocument(file: File): Promise<string> {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    // Determine document type based on file type
    const isImage = file.type.startsWith('image/');
    const documentType = isImage ? 'image_url' : 'document_url';
    const urlKey = isImage ? 'imageUrl' : 'documentUrl';
    
    // Use Mistral's OCR API with mistral-ocr-latest model
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: documentType,
        [urlKey]: `data:${file.type};base64,${base64Data}`
      },
      includeImageBase64: false // We don't need base64 images in response
    });
    
    // Combine text from all pages
    const fullText = ocrResponse.pages
      .map((page, index) => {
        const pageHeader = `\n\n--- PAGE ${index + 1} ---\n\n`;
        return pageHeader + page.markdown;
      })
      .join('');
    
    return fullText;
  } catch (error) {
    console.error('OCR extraction failed:', error);
    throw new Error('Failed to extract text from document');
  }
}

export async function extractFromMultipleDocuments(
  files: File[]
): Promise<string[]> {
  return Promise.all(files.map(file => extractTextFromDocument(file)));
}
```

### Phase 3: LLM Integration ✅ **COMPLETED**

#### lib/services/llm.ts
```typescript
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
Your task is to extract and organize information from shipping documents into a structured format for generating a Bill of Lading.
Be thorough and accurate, extracting all relevant information while maintaining standard shipping industry formatting.`;

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

Return a JSON object with all extracted information organized according to standard Bill of Lading structure.`;

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
```

### Phase 4: PDF Generation ⏳ **PENDING**

#### lib/services/pdf.ts
```typescript
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function generateBOLPDF(bolData: any): Promise<Uint8Array> {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Helper function to draw text
  const drawText = (
    text: string, 
    x: number, 
    y: number, 
    size: number = 10, 
    font = helvetica
  ) => {
    page.drawText(text || '', { x, y, size, font, color: rgb(0, 0, 0) });
  };
  
  // Helper function to draw a box
  const drawBox = (x: number, y: number, width: number, height: number) => {
    page.drawRectangle({
      x, y, width, height,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1
    });
  };
  
  // Header
  drawText('BILL OF LADING', 220, 750, 18, helveticaBold);
  drawText('For Ocean Transport or Multimodal Transport', 180, 730, 10);
  
  // Document number and date
  drawBox(400, 700, 180, 40);
  drawText('B/L Number:', 410, 720, 10, helveticaBold);
  drawText(`BOL-${Date.now()}`, 410, 705, 10);
  
  // Shipper Box
  drawBox(30, 600, 270, 80);
  drawText('SHIPPER', 35, 665, 10, helveticaBold);
  drawText(bolData.shipper?.name || '', 35, 650, 10);
  drawText(bolData.shipper?.address || '', 35, 635, 10);
  drawText(`${bolData.shipper?.city || ''}, ${bolData.shipper?.country || ''}`, 35, 620, 10);
  
  // Consignee Box
  drawBox(30, 500, 270, 80);
  drawText('CONSIGNEE', 35, 565, 10, helveticaBold);
  drawText(bolData.consignee?.name || '', 35, 550, 10);
  drawText(bolData.consignee?.address || '', 35, 535, 10);
  drawText(`${bolData.consignee?.city || ''}, ${bolData.consignee?.country || ''}`, 35, 520, 10);
  
  // Notify Party Box
  drawBox(310, 500, 270, 80);
  drawText('NOTIFY PARTY', 315, 565, 10, helveticaBold);
  if (bolData.notify_party) {
    drawText(bolData.notify_party.name || '', 315, 550, 10);
    drawText(bolData.notify_party.address || '', 315, 535, 10);
  }
  
  // Vessel and Voyage
  drawBox(30, 450, 180, 40);
  drawText('VESSEL', 35, 475, 10, helveticaBold);
  drawText(bolData.vessel_details?.vessel_name || 'TBN', 35, 460, 10);
  
  drawBox(220, 450, 180, 40);
  drawText('VOYAGE NO.', 225, 475, 10, helveticaBold);
  drawText(bolData.vessel_details?.voyage_number || 'TBN', 225, 460, 10);
  
  // Ports
  drawBox(30, 400, 180, 40);
  drawText('PORT OF LOADING', 35, 425, 10, helveticaBold);
  drawText(bolData.ports?.loading || '', 35, 410, 10);
  
  drawBox(220, 400, 180, 40);
  drawText('PORT OF DISCHARGE', 225, 425, 10, helveticaBold);
  drawText(bolData.ports?.discharge || '', 225, 410, 10);
  
  // Cargo Details Header
  drawBox(30, 350, 550, 30);
  drawText('MARKS & NUMBERS', 35, 360, 9, helveticaBold);
  drawText('NO. OF PKGS', 180, 360, 9, helveticaBold);
  drawText('DESCRIPTION OF GOODS', 250, 360, 9, helveticaBold);
  drawText('GROSS WEIGHT', 420, 360, 9, helveticaBold);
  drawText('MEASUREMENT', 500, 360, 9, helveticaBold);
  
  // Cargo Details
  let yPosition = 320;
  bolData.cargo?.forEach((item: any, index: number) => {
    if (yPosition < 150) return; // Prevent overflow
    
    drawText(`PKG ${index + 1}`, 35, yPosition, 9);
    drawText(item.quantity?.toString() || '', 180, yPosition, 9);
    drawText(item.description || '', 250, yPosition, 9);
    drawText(item.weight || '', 420, yPosition, 9);
    drawText(item.volume || '', 500, yPosition, 9);
    yPosition -= 20;
  });
  
  // Totals
  drawBox(30, 100, 550, 30);
  drawText('TOTAL:', 35, 110, 10, helveticaBold);
  drawText(bolData.totals?.packages?.toString() || '', 180, 110, 10);
  drawText(bolData.totals?.gross_weight || '', 420, 110, 10);
  drawText(bolData.totals?.measurement || '', 500, 110, 10);
  
  // Freight Terms
  drawBox(30, 50, 270, 40);
  drawText('FREIGHT TERMS', 35, 75, 10, helveticaBold);
  drawText(bolData.freight_terms || '', 35, 60, 10);
  
  // Place and Date of Issue
  drawBox(310, 50, 270, 40);
  drawText('PLACE AND DATE OF ISSUE', 315, 75, 10, helveticaBold);
  drawText(new Date().toLocaleDateString(), 315, 60, 10);
  
  // Save and return the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}
```

### Phase 5: API Route Implementation ⏳ **PENDING**

#### app/api/generate-bol/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromDocument } from '@/lib/services/ocr';
import { generateBOL } from '@/lib/services/llm';
import { generateBOLPDF } from '@/lib/services/pdf';
import { validateFile } from '@/lib/utils/file-helpers';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const packingList = formData.get('packingList') as File;
    const invoice = formData.get('invoice') as File;
    
    // Validate files
    if (!packingList || !invoice) {
      return NextResponse.json(
        { error: 'Both packing list and invoice are required' },
        { status: 400 }
      );
    }
    
    const packingListValidation = validateFile(packingList);
    const invoiceValidation = validateFile(invoice);
    
    if (!packingListValidation.valid) {
      return NextResponse.json(
        { error: `Packing list: ${packingListValidation.error}` },
        { status: 400 }
      );
    }
    
    if (!invoiceValidation.valid) {
      return NextResponse.json(
        { error: `Invoice: ${invoiceValidation.error}` },
        { status: 400 }
      );
    }
    
    // Step 1: Extract text from documents using Mistral OCR
    console.log('Extracting text from documents...');
    const [packingListText, invoiceText] = await Promise.all([
      extractTextFromDocument(packingList),
      extractTextFromDocument(invoice)
    ]);
    
    // Step 2: Generate BOL data using LLM
    console.log('Processing with LLM...');
    const bolData = await generateBOL(packingListText, invoiceText);
    
    // Step 3: Generate PDF
    console.log('Generating PDF...');
    const pdfBytes = await generateBOLPDF(bolData);
    
    // Return PDF as response
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="bill-of-lading.pdf"',
        'Content-Length': pdfBytes.length.toString()
      }
    });
    
  } catch (error) {
    console.error('BOL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate Bill of Lading' },
      { status: 500 }
    );
  }
}

// Configure route to handle larger payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};
```

### Phase 6: Frontend Implementation ✅ **COMPLETED**

#### components/FileUpload.tsx
```typescript
'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
  label: string;
  name: string;
  onFileSelect: (file: File | null) => void;
}

export default function FileUpload({ label, name, onFileSelect }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };
  
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          onChange={handleFileChange}
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
        />
        
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        
        <p className="mt-2 text-sm text-gray-600">
          {fileName || 'Drop file here or click to upload'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          PDF, JPG, PNG up to 50MB
        </p>
      </div>
    </div>
  );
}
```

#### components/ProcessingStatus.tsx
```typescript
'use client';

interface ProcessingStatusProps {
  status: 'idle' | 'uploading' | 'ocr' | 'llm' | 'pdf' | 'complete' | 'error';
  error?: string;
}

export default function ProcessingStatus({ status, error }: ProcessingStatusProps) {
  const steps = [
    { key: 'uploading', label: 'Uploading documents' },
    { key: 'ocr', label: 'Extracting text with OCR' },
    { key: 'llm', label: 'Processing with AI' },
    { key: 'pdf', label: 'Generating PDF' },
    { key: 'complete', label: 'Complete' }
  ];
  
  const getStepStatus = (stepKey: string) => {
    const statusOrder = ['idle', 'uploading', 'ocr', 'llm', 'pdf', 'complete'];
    const currentIndex = statusOrder.indexOf(status);
    const stepIndex = statusOrder.indexOf(stepKey);
    
    if (currentIndex > stepIndex) return 'complete';
    if (currentIndex === stepIndex) return 'active';
    return 'pending';
  };
  
  if (status === 'idle') return null;
  
  return (
    <div className="mt-8 bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Processing Status</h3>
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {steps.map((step) => {
          const stepStatus = getStepStatus(step.key);
          
          return (
            <div key={step.key} className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                stepStatus === 'complete' ? 'bg-green-500' :
                stepStatus === 'active' ? 'bg-blue-500' :
                'bg-gray-300'
              }`}>
                {stepStatus === 'complete' && (
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {stepStatus === 'active' && (
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                )}
              </div>
              
              <span className={`text-sm ${
                stepStatus === 'active' ? 'font-semibold text-gray-900' : 'text-gray-600'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

#### app/page.tsx
```typescript
'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import ProcessingStatus from '@/components/ProcessingStatus';

type ProcessingStatus = 'idle' | 'uploading' | 'ocr' | 'llm' | 'pdf' | 'complete' | 'error';

export default function Home() {
  const [packingList, setPackingList] = useState<File | null>(null);
  const [invoice, setInvoice] = useState<File | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [error, setError] = useState<string>('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!packingList || !invoice) {
      setError('Please upload both documents');
      return;
    }
    
    setError('');
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('packingList', packingList);
    formData.append('invoice', invoice);
    
    try {
      // Simulate status updates
      setTimeout(() => setStatus('ocr'), 1000);
      setTimeout(() => setStatus('llm'), 5000);
      setTimeout(() => setStatus('pdf'), 10000);
      
      const response = await fetch('/api/generate-bol', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate BOL');
      }
      
      setStatus('complete');
      
      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'bill-of-lading.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      // Reset form after successful download
      setTimeout(() => {
        setStatus('idle');
        setPackingList(null);
        setInvoice(null);
      }, 3000);
      
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };
  
  const isProcessing = status !== 'idle' && status !== 'complete' && status !== 'error';
  
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bill of Lading Generator
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your Packing List and Commercial Invoice to automatically generate
            a compliant Bill of Lading for ocean freight shipping.
          </p>
        </div>
        
        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
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
          
          <button
            type="submit"
            disabled={isProcessing || !packingList || !invoice}
            className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
              isProcessing || !packingList || !invoice
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? 'Processing...' : 'Generate Bill of Lading'}
          </button>
        </form>
        
        {/* Processing Status */}
        <ProcessingStatus status={status} error={error} />
        
        {/* Instructions */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            How it works:
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Upload your Packing List and Commercial Invoice (PDF, JPG, or PNG)</li>
            <li>Our AI extracts all text using advanced OCR technology</li>
            <li>Smart processing identifies and organizes BOL information</li>
            <li>Download your professionally formatted Bill of Lading PDF</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
```

### Phase 7: Type Definitions ✅ **COMPLETED**

#### types/index.ts
```typescript
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
```

## Testing Guide

### Local Testing
1. Set up environment variables
2. Run development server: `npm run dev`
3. Test with sample shipping documents
4. Verify PDF generation and download

### Test Cases
- Valid PDF documents
- Image files (JPG, PNG)
- Large files (up to 50MB)
- Documents with multiple pages
- Various document layouts
- Missing information scenarios

### Error Scenarios
- Invalid file types
- Oversized files
- OCR failures
- LLM timeouts
- Network errors

## Deployment Guide

### Vercel Deployment

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin your-repo-url
git push -u origin main
```

2. **Deploy to Vercel**
```bash
npm install -g vercel
vercel
```

3. **Configure Environment Variables**
- Go to Vercel Dashboard
- Add MISTRAL_API_KEY
- Add OPENAI_API_KEY

## Implementation Notes

### 1. Server-Side File Processing
The application uses Node.js Buffer for base64 conversion instead of browser FileReader API:

```typescript
// file-helpers.ts
export async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Data = buffer.toString('base64');
  return base64Data;
}
```

### 2. LLM Response Handling
The API route includes fallback mapping to handle nested LLM responses:

```typescript
// Handle case where LLM returns nested structure
if (bolData && typeof bolData === 'object' && 'BillOfLading' in bolData) {
  const nestedData = (bolData as any).BillOfLading;
  // Map nested structure to expected format
  bolData = {
    shipper: {
      name: nestedData.Exporter?.Name || '',
      // ... map other fields
    }
    // ... map remaining structure
  };
}
```

### 3. React Hydration
The layout includes `suppressHydrationWarning` to prevent browser extension conflicts:

```typescript
// app/layout.tsx
<html lang="en" suppressHydrationWarning>
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Module Import Error: "Can't resolve 'mistralai'"
**Solution:** Use the correct package name:
```typescript
import Mistral from '@mistralai/mistralai'; // ✓ Correct
// NOT: import Mistral from 'mistralai'; // ✗ Wrong
```

#### 2. FileReader is not defined
**Cause:** Attempting to use browser-only FileReader API in server-side code.
**Solution:** Use Node.js Buffer methods for file conversion (see Implementation Notes).

#### 3. LLM Returns Nested Structure
**Cause:** GPT model wrapping response in a "BillOfLading" object.
**Solution:** 
- Update LLM prompt to specify exact JSON structure
- Implement fallback mapping in API route (see Implementation Notes)

#### 4. React Hydration Mismatch
**Cause:** Browser extensions modifying DOM attributes.
**Solution:** Add `suppressHydrationWarning` to the html element in layout.

#### 5. Missing Required BOL Information
**Debugging Steps:**
1. Check OCR output quality in console logs
2. Verify LLM response structure matches expected format
3. Ensure fallback mapping handles all field variations
4. Add detailed error logging to identify missing fields
- Project Settings → Environment Variables
- Add MISTRAL_API_KEY and OPENAI_API_KEY

4. **Configure Function Timeout**
- Vercel Dashboard → Functions tab
- Set timeout to 60 seconds for BOL generation

### Production Considerations

1. **Rate Limiting**
   - Implement rate limiting for API endpoints
   - Cache OCR results for duplicate documents

2. **Error Monitoring**
   - Set up error tracking (Sentry, LogRocket)
   - Monitor API usage and costs

3. **Security**
   - Validate all file uploads
   - Sanitize extracted data
   - Use HTTPS only
   - Implement authentication if needed

4. **Performance**
   - Optimize PDF generation
   - Implement progress streaming
   - Consider background job processing for large files

## BOL Field Customization Guide

### Overview

The BOL (Bill of Lading) fields are defined in multiple interconnected locations throughout the application. To add or remove fields, you must update **3 key locations** consistently to avoid TypeScript errors and ensure proper functionality.

### Field Structure Locations

#### **1. TypeScript Interfaces** (2 files)
- `types/index.ts` (lines 1-57) - Main type definitions
- `lib/services/llm.ts` (lines 7-63) - LLM service interface

#### **2. LLM Prompt Instructions**
- `lib/services/llm.ts` (lines 92-151) - JSON structure example for GPT-4

#### **3. PDF Generation**
- `lib/services/pdf.ts` (lines 400-520) - Visual layout and field rendering

### Step-by-Step Process

#### **Adding a New Field**

**Step 1: Update TypeScript Interfaces**
```typescript
// In both types/index.ts AND lib/services/llm.ts
export interface BOLData {
  // ... existing fields ...
  
  // Add new fields:
  scac_code?: string;           // Optional field
  carrier_name: string;         // Required field
  booking_reference?: string;   // Optional field
}
```

**Step 2: Update LLM Prompt**
```typescript
// In lib/services/llm.ts (userPrompt section)
const userPrompt = `...
Return a JSON object with the following exact structure:
{
  // ... existing fields ...
  
  // Add new fields to the JSON example:
  "scac_code": "carrier's SCAC code",
  "carrier_name": "shipping line name", 
  "booking_reference": "booking reference number"
}`;
```

**Step 3: Update PDF Generation**
```typescript
// In lib/services/pdf.ts
// Add drawText calls for new fields:

// SCAC Code
drawBox(30, 350, 180, 30);
drawText('SCAC CODE', 35, 365, 10, helveticaBold);
drawText(bolData.scac_code || '', 35, 350, 10);

// Carrier Name  
drawBox(220, 350, 200, 30);
drawText('CARRIER', 225, 365, 10, helveticaBold);
drawText(bolData.carrier_name || '', 225, 350, 10);
```

#### **Removing a Field**

**Step 1: Remove from TypeScript Interfaces**
```typescript
// Delete or comment out in both files:
// vessel_details?: {
//   vessel_name: string;
//   voyage_number: string;
// };
```

**Step 2: Remove from LLM Prompt**
```typescript
// Delete from JSON structure:
// "vessel_details": {
//   "vessel_name": "vessel name or TBN",
//   "voyage_number": "voyage number or TBN"
// },
```

**Step 3: Remove from PDF Generation**
```typescript
// Delete or comment out drawText calls:
// drawText('VESSEL', 35, 475, 10, helveticaBold);
// drawText(bolData.vessel_details?.vessel_name || 'TBN', 35, 460, 10);
```

### Field Categories

#### **Required Fields** (must have data)
- `shipper` - Legal exporter entity
- `consignee` - Legal importer entity  
- `cargo` - Description of goods being shipped
- `ports` - Loading and discharge locations
- `totals` - Package counts and weights
- `invoice_details` - Commercial invoice information
- `freight_terms` - Shipping terms (FOB, CIF, etc.)

#### **Optional Fields** (can be empty)
- `notify_party?` - Third party to notify on arrival
- `vessel_details?` - Ship name and voyage info
- `container_info?` - Container numbers and seals
- `payment_terms?` - Commercial payment terms
- `special_instructions?` - Handling requirements
- `date_of_shipment?` - Expected departure date

### Field Types and Examples

#### **Company Information**
```typescript
shipper: {
  name: string;        // "ABC Electronics Ltd."
  address: string;     // "123 Tech Park"
  city: string;        // "San Francisco, CA 94105"
  country: string;     // "USA"
  phone?: string;      // "+1-415-555-0123"
}
```

#### **Cargo Information**
```typescript
cargo: Array<{
  description: string;  // "Electronic Components"
  hs_code?: string;     // "8541.10.00"
  quantity: number;     // 500
  unit: string;         // "cartons"
  weight: string;       // "250 kg"
  volume?: string;      // "2.5 CBM"
}>
```

#### **Shipping Details**
```typescript
ports: {
  loading: string;      // "Los Angeles, USA"
  discharge: string;    // "Shanghai, China"
  delivery?: string;    // "Beijing, China"
}
```

### Common Field Additions

#### **Adding Carrier Information**
```typescript
// Step 1: Add to interfaces
carrier_details?: {
  name: string;
  scac_code: string;
  contact: string;
};

// Step 2: Add to LLM prompt
"carrier_details": {
  "name": "shipping line name",
  "scac_code": "4-letter carrier code", 
  "contact": "carrier contact info"
}

// Step 3: Add to PDF
drawText('CARRIER', 35, 400, 10, helveticaBold);
drawText(bolData.carrier_details?.name || '', 35, 385, 10);
```

#### **Adding Booking Information**
```typescript
// Step 1: Add to interfaces
booking_info?: {
  number: string;
  date: string;
  agent: string;
};

// Step 2: Add to LLM prompt  
"booking_info": {
  "number": "booking reference",
  "date": "booking date",
  "agent": "booking agent"
}

// Step 3: Add to PDF
drawText('BOOKING NO.', 35, 450, 10, helveticaBold);
drawText(bolData.booking_info?.number || '', 35, 435, 10);
```

### Important Notes

#### **Field Syntax Rules**
- **Required fields**: Use `:` syntax (e.g., `name: string`)
- **Optional fields**: Use `?:` syntax (e.g., `phone?: string`)
- **Arrays**: Use `Array<{}>` or `[]` syntax
- **Nested objects**: Define full structure

#### **LLM Prompt Best Practices**
- Use clear, descriptive field names in JSON examples
- Provide realistic example values
- Match the exact structure from TypeScript interfaces
- Include all fields, even optional ones

#### **PDF Layout Considerations**
- **Coordinate system**: (0,0) is bottom-left corner
- **Y-coordinates**: Higher values = higher on page
- **Text placement**: Account for font size and spacing
- **Box sizing**: Ensure text fits within drawn boxes
- **Page overflow**: Check if content exceeds page boundaries

### Testing Checklist

After modifying BOL fields:

1. **✅ TypeScript Compilation**
   ```bash
   npm run build
   # Should compile without errors
   ```

2. **✅ LLM Response Validation**
   - Test with sample documents
   - Verify JSON structure matches interface
   - Check for missing or extra fields

3. **✅ PDF Generation**
   - Ensure all fields render correctly
   - Check text alignment and spacing
   - Verify no content is cut off

4. **✅ End-to-End Testing**
   - Upload test documents
   - Generate BOL PDF
   - Verify all new fields appear with correct data

### Common Issues and Solutions

#### **TypeScript Errors**
```
Property 'new_field' does not exist on type 'BOLData'
```
**Solution**: Add the field to both `types/index.ts` AND `lib/services/llm.ts`

#### **LLM Missing Fields**
```
Generated JSON doesn't include new field
```
**Solution**: Add field with example value to LLM prompt JSON structure

#### **PDF Layout Issues**
```
Text overlapping or cut off
```
**Solution**: Adjust coordinates and check for page boundaries

### Field Validation

#### **Data Type Validation**
```typescript
// String fields
name: string;           // Any text value
phone?: string;         // Optional text

// Number fields  
quantity: number;       // Numeric values only
packages: number;       // Integer counts

// Array fields
cargo: Array<{}>;       // List of cargo items
container_numbers: string[]; // List of strings
```

#### **Required Field Checking**
```typescript
// In API route validation:
if (!bolData.new_required_field) {
  throw new Error('Missing required field: new_required_field');
}
```

This guide provides a complete reference for customizing BOL fields. Always test thoroughly after making changes to ensure the entire pipeline works correctly.

## Implementation Progress

### ✅ **COMPLETED PHASES**
- **Phase 1**: File Handling Utilities (`lib/utils/file-helpers.ts`)
- **Phase 2**: Mistral OCR Integration (`lib/services/ocr.ts`)
- **Phase 3**: LLM Integration (`lib/services/llm.ts`) - Updated to use GPT-4.1-mini-2025-04-14
- **Phase 4**: PDF Generation (`lib/services/pdf.ts`) ✅ **COMPLETED**
- **Phase 5**: API Route Implementation (`app/api/generate-bol/route.ts`) ✅ **COMPLETED**
- **Phase 6**: Frontend Implementation (Components and UI)
- **Phase 7**: Type Definitions (`types/index.ts`)

### ⏳ **PENDING PHASES**
- **Environment Setup**: Configure API keys in `.env.local` ⏳

### 📊 **CURRENT STATUS**
**Progress**: 7/7 phases completed (100%)

**Next Steps**:
1. ✅ Phase 4: PDF Generation - COMPLETED
2. ✅ Phase 5: API Route Implementation - COMPLETED  
3. ⏳ Set up environment variables (API keys)
4. ⏳ Testing and deployment

## Timeline & Milestones

### Week 1: Foundation ✅ **COMPLETED**
- Day 1-2: Project setup and configuration ✅
- Day 3-4: OCR integration ✅
- Day 5: LLM integration ✅

### Week 2: Core Features ⏳ **IN PROGRESS**
- Day 6-7: PDF generation ⏳
- Day 8-9: Frontend implementation ✅
- Day 10: Testing and refinement ⏳

### Week 3: Polish & Deploy ⏳ **PENDING**
- Day 11-12: Error handling and edge cases
- Day 13-14: UI improvements and UX testing
- Day 15: Deployment and production testing

## Future Enhancements

1. **Batch Processing**
   - Handle multiple BOL generations
   - Bulk upload interface

2. **Template Management**
   - Multiple BOL templates
   - Custom branding options

3. **API Access**
   - RESTful API for external integrations
   - Webhook notifications

4. **Advanced Features**
   - Digital signatures
   - Blockchain verification
   - Multi-language support
   - Integration with shipping APIs

5. **Analytics**
   - Processing statistics
   - Error rate monitoring
   - Usage analytics

## Conclusion

This implementation plan provides a complete roadmap for building an MVP Bill of Lading generator using modern web technologies. The system leverages Mistral OCR for text extraction and LLM intelligence for data organization, resulting in a simple yet powerful solution for automating shipping documentation.