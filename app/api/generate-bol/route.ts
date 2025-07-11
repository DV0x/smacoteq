import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromDocument, extractFromCombinedDocument } from '@/lib/services/ocr';
import { generateBOL } from '@/lib/services/llm';
import { generateBOLPDF } from '@/lib/services/pdf';
import { validateFile } from '@/lib/utils/file-helpers';

// Security configurations
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp'
];
const PROCESSING_TIMEOUT = 5 * 60 * 1000; // 5 minutes

// Rate limiting (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const userRequests = requestCounts.get(key);
  
  if (!userRequests || now > userRequests.resetTime) {
    // Reset or initialize counter
    requestCounts.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return false;
  }
  
  if (userRequests.count >= RATE_LIMIT) {
    return true;
  }
  
  userRequests.count++;
  return false;
}

async function validateEnvironment(): Promise<void> {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not configured');
  }
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
}

async function validateUploadedFile(file: File, fieldName: string): Promise<void> {
  // Check if file exists
  if (!file || !file.name) {
    throw new Error(`${fieldName} is required`);
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${fieldName} exceeds maximum size of 50MB`);
  }
  
  // Validate file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`${fieldName} must be PDF, JPG, PNG, or WebP format`);
  }
  
  // Additional validation using our helper
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(`${fieldName}: ${validation.error}`);
  }
}

// Removed unused function sanitizeFileName

export async function POST(request: NextRequest) {
  // Set timeout for the entire request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROCESSING_TIMEOUT);
  
  try {
    // Validate environment variables
    await validateEnvironment();
    
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 3600 // 1 hour in seconds
        },
        { 
          status: 429,
          headers: {
            'Retry-After': '3600'
          }
        }
      );
    }
    
    // Parse form data with size limits
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Invalid form data or request too large' },
        { status: 400 }
      );
    }
    
    // Get upload mode and BOL number
    const uploadMode = formData.get('uploadMode') as string;
    const customBolNumber = formData.get('bolNumber') as string | null;
    
    let packingList: File | null = null;
    let invoice: File | null = null;
    let combinedDocument: File | null = null;
    
    if (uploadMode === 'combined') {
      // Extract and validate combined document
      combinedDocument = formData.get('combinedDocument') as File;
      await validateUploadedFile(combinedDocument, 'Combined Document');
    } else {
      // Extract and validate separate files (default behavior)
      packingList = formData.get('packingList') as File;
      invoice = formData.get('invoice') as File;
      
      // Validate both files
      await validateUploadedFile(packingList, 'Packing List');
      await validateUploadedFile(invoice, 'Commercial Invoice');
    }
    
    // Log processing start (without sensitive data)
    console.log('Starting BOL generation process', {
      uploadMode,
      packingListSize: packingList?.size,
      packingListType: packingList?.type,
      invoiceSize: invoice?.size,
      invoiceType: invoice?.type,
      combinedDocumentSize: combinedDocument?.size,
      combinedDocumentType: combinedDocument?.type,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    });
    
    // Step 1: Extract text from documents using Mistral OCR
    console.log('Step 1: Extracting text from documents...');
    let packingListText: string;
    let invoiceText: string;
    
    try {
      if (uploadMode === 'combined' && combinedDocument) {
        console.log('Processing combined document...');
        const combinedResult = await extractFromCombinedDocument(combinedDocument);
        packingListText = combinedResult.packingListText;
        invoiceText = combinedResult.invoiceText;
      } else if (packingList && invoice) {
        console.log('Processing separate documents...');
        const [packingListResult, invoiceResult] = await Promise.all([
          extractTextFromDocument(packingList),
          extractTextFromDocument(invoice)
        ]);
        
        packingListText = packingListResult;
        invoiceText = invoiceResult;
      } else {
        throw new Error('Invalid upload configuration');
      }
      
      // Validate that we got meaningful text
      if (!packingListText || packingListText.trim().length < 10) {
        throw new Error('Could not extract meaningful text from packing list');
      }
      
      if (!invoiceText || invoiceText.trim().length < 10) {
        throw new Error('Could not extract meaningful text from commercial invoice');
      }
      
      console.log('OCR extraction successful', {
        packingListLength: packingListText.length,
        invoiceLength: invoiceText.length
      });
      
      // Debug: Log first 500 chars of each document
      console.log('Packing List Preview:', packingListText.substring(0, 500) + '...');
      console.log('Invoice Preview:', invoiceText.substring(0, 500) + '...');
      
    } catch (error) {
      console.error('OCR extraction failed:', error);
      return NextResponse.json(
        { 
          error: 'Failed to extract text from documents. Please ensure your files are clear and readable.',
          details: 'OCR processing error'
        },
        { status: 422 }
      );
    }
    
    // Step 2: Generate BOL data using LLM
    console.log('Step 2: Processing with LLM...');
    let bolData;
    
    try {
      bolData = await generateBOL(packingListText, invoiceText);
      
      // Debug: Log what we got from LLM
      console.log('LLM Response:', JSON.stringify(bolData, null, 2));
      
      // Handle case where LLM returns nested structure
      if (bolData && typeof bolData === 'object' && 'BillOfLading' in bolData) {
        console.log('Detected nested BillOfLading structure, extracting and mapping...');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const nestedData = (bolData as { BillOfLading: Record<string, any> }).BillOfLading;
        
        // Map the nested structure to our expected format
        bolData = {
          shipper: {
            name: nestedData.Exporter?.Name || '',
            address: nestedData.Exporter?.Address?.split(',')[0] || '',
            city: nestedData.Exporter?.Address?.split(',').slice(1).join(',').trim() || '',
            country: 'India',
            phone: nestedData.Exporter?.Phone || undefined
          },
          consignee: {
            name: nestedData.Consignee?.Name || '',
            address: nestedData.Consignee?.Address?.split(',')[0] || '',
            city: nestedData.Consignee?.Address?.split(',').slice(1).join(',').trim() || '',
            country: nestedData.Consignee?.Country || 'Netherlands',
            phone: nestedData.Consignee?.Phone || undefined
          },
          notify_party: nestedData.NotifyParty ? {
            name: nestedData.NotifyParty.Name || '',
            address: nestedData.NotifyParty.Address || ''
          } : undefined,
          vessel_details: {
            vessel_name: nestedData.VesselAndShippingLine?.VesselName || 'TBN',
            voyage_number: nestedData.VesselAndShippingLine?.VoyageNumber || 'TBN'
          },
          ports: {
            loading: nestedData.ShipmentDetails?.PortOfLoading || '',
            discharge: nestedData.ShipmentDetails?.PortOfDischarge || '',
            delivery: nestedData.ShipmentDetails?.CountryOfDestination || ''
          },
          cargo: nestedData.CargoDescription?.map((item: { ItemDescription?: string; HSNCode?: string; NumberOfBags?: number; NetWeightKgs?: number; Volume?: string }) => ({
            description: item.ItemDescription || '',
            hs_code: item.HSNCode || '',
            quantity: item.NumberOfBags || 0,
            unit: 'bags',
            weight: `${item.NetWeightKgs || 0} kg`,
            volume: item.Volume || ''
          })) || [],
          totals: {
            packages: nestedData.TotalBags || 0,
            gross_weight: `${nestedData.TotalGrossWeightKgs || 0} kg`,
            measurement: nestedData.TotalMeasurement || ''
          },
          invoice_details: {
            number: nestedData.Exporter?.InvoiceNoAndDate?.split(' ')[0] || '',
            date: nestedData.Exporter?.InvoiceNoAndDate?.split(' dt ')[1] || '',
            value: nestedData.InvoiceValue || '',
            currency: nestedData.Currency || 'USD'
          },
          freight_terms: nestedData.FreightAndPaymentTerms?.TermsOfDelivery || '',
          payment_terms: nestedData.FreightAndPaymentTerms?.TermsOfPayment || '',
          special_instructions: Array.isArray(nestedData.SpecialInstructions) 
            ? nestedData.SpecialInstructions.join(', ') 
            : nestedData.SpecialInstructions || '',
          date_of_shipment: nestedData.DateOfShipment || ''
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
      }
      
      // Validate that we got valid BOL data
      if (!bolData || typeof bolData !== 'object') {
        throw new Error('Invalid BOL data structure returned');
      }
      
      // Basic validation of required fields
      if (!bolData.shipper || !bolData.consignee || !bolData.cargo) {
        console.error('Missing fields in BOL data:', {
          hasShipper: !!bolData.shipper,
          hasConsignee: !!bolData.consignee,
          hasCargo: !!bolData.cargo,
          actualData: bolData
        });
        throw new Error('Missing required BOL information');
      }
      
      console.log('LLM processing successful', {
        hasShipper: !!bolData.shipper,
        hasConsignee: !!bolData.consignee,
        cargoItemsCount: Array.isArray(bolData.cargo) ? bolData.cargo.length : 0
      });
      
    } catch (error) {
      console.error('LLM processing failed:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process shipping information. Please check that your documents contain complete shipping details.',
          details: 'LLM processing error'
        },
        { status: 422 }
      );
    }
    
    // Step 3: Generate PDF
    console.log('Step 3: Generating PDF...');
    let pdfBytes: Uint8Array;
    
    try {
      pdfBytes = await generateBOLPDF(bolData, customBolNumber);
      
      // Validate PDF was generated
      if (!pdfBytes || pdfBytes.length === 0) {
        throw new Error('PDF generation returned empty result');
      }
      
      console.log('PDF generation successful', {
        sizeBytes: pdfBytes.length,
        sizeMB: (pdfBytes.length / (1024 * 1024)).toFixed(2)
      });
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      return NextResponse.json(
        { 
          error: 'Failed to generate PDF document. Please try again.',
          details: 'PDF generation error'
        },
        { status: 500 }
      );
    }
    
    // Clear timeout since we're done processing
    clearTimeout(timeoutId);
    
    // Generate secure filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bill-of-lading-${timestamp}.pdf`;
    
    // Return PDF as response with proper headers
    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBytes.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });
    
  } catch (error) {
    // Clear timeout
    clearTimeout(timeoutId);
    
    // Log error (without sensitive data)
    console.error('BOL generation error:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent')?.substring(0, 100)
    });
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('MISTRAL_API_KEY') || error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'Service configuration error. Please contact support.' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('Rate limit') || error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'Service temporarily unavailable due to high demand. Please try again later.' },
          { status: 503 }
        );
      }
      
      if (error.message.includes('timeout') || error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Processing timeout. Please try again with smaller files or simpler documents.' },
          { status: 408 }
        );
      }
      
      // If it's a validation error we already handled
      if (error.message.includes('exceeds maximum size') || 
          error.message.includes('must be PDF') ||
          error.message.includes('is required')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }
    
    // Generic error response (don't expose internal details)
    return NextResponse.json(
      { 
        error: 'An unexpected error occurred while generating the Bill of Lading. Please try again.',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Configure route settings for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel Pro