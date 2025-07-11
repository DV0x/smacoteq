# Bill of Lading Generator - Implementation Plan

## Project Overview

An automated system that processes shipping documents (Packing Lists and Commercial Invoices) using Mistral OCR, extracts all text content, and leverages LLM intelligence to generate compliant Bills of Lading for ocean freight shipping.

### Core Architecture
```
Upload Documents → Mistral OCR (extract all text) → LLM (organize into BOL) → Generate PDF
```

### Technology Stack
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **OCR**: Mistral OCR API
- **LLM**: OpenAI GPT-4 or Claude
- **PDF Generation**: pdf-lib
- **Deployment**: Vercel

## Project Setup

### Step 1: Initialize Next.js Project
```bash
npx create-next-app@latest bol-generator --typescript --tailwind --app
cd bol-generator
```

### Step 2: Install Dependencies
```bash
npm install mistralai openai pdf-lib
npm install @types/formidable --save-dev
```

### Step 3: Environment Configuration
Create `.env.local`:
```env
MISTRAL_API_KEY=your_mistral_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
```

### Step 4: Project Structure
```
bol-generator/
├── app/
│   ├── page.tsx              # Main upload interface
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   └── api/
│       └── generate-bol/
│           └── route.ts      # BOL generation endpoint
├── lib/
│   ├── services/
│   │   ├── ocr.ts           # Mistral OCR integration
│   │   ├── llm.ts           # LLM integration
│   │   └── pdf.ts           # PDF generation
│   └── utils/
│       └── file-helpers.ts   # File conversion utilities
├── components/
│   ├── FileUpload.tsx        # File upload component
│   └── ProcessingStatus.tsx  # Status display
├── types/
│   └── index.ts             # TypeScript definitions
└── public/
    └── bol-template.png     # Optional: BOL template image
```

## Implementation Guide

### Phase 1: File Handling Utilities

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

### Phase 2: Mistral OCR Integration

#### lib/services/ocr.ts
```typescript
import { Mistral } from 'mistralai';
import { fileToBase64 } from '../utils/file-helpers';

const client = new Mistral({ 
  apiKey: process.env.MISTRAL_API_KEY! 
});

export async function extractTextFromDocument(file: File): Promise<string> {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    // Call Mistral OCR API
    const response = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: {
        type: "document_url",
        document_url: `data:${file.type};base64,${base64Data}`
      }
    });
    
    // Combine text from all pages
    const fullText = response.pages
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

### Phase 3: LLM Integration

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
      model: "gpt-4-turbo-preview",
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

### Phase 4: PDF Generation

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

### Phase 5: API Route Implementation

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

### Phase 6: Frontend Implementation

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

### Phase 7: Type Definitions

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

## Timeline & Milestones

### Week 1: Foundation
- Day 1-2: Project setup and configuration
- Day 3-4: OCR integration
- Day 5: LLM integration

### Week 2: Core Features
- Day 6-7: PDF generation
- Day 8-9: Frontend implementation
- Day 10: Testing and refinement

### Week 3: Polish & Deploy
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