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
    
    // Use Mistral's OCR API with mistral-ocr-latest model
    const documentPayload = isImage 
      ? {
          type: 'image_url' as const,
          imageUrl: `data:${file.type};base64,${base64Data}`
        }
      : {
          type: 'document_url' as const,
          documentUrl: `data:${file.type};base64,${base64Data}`
        };
    
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: documentPayload,
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

export async function extractFromCombinedDocument(
  file: File
): Promise<{ packingListText: string; invoiceText: string }> {
  try {
    // Convert file to base64
    const base64Data = await fileToBase64(file);
    
    // Determine document type based on file type
    const isImage = file.type.startsWith('image/');
    
    // Use Mistral's OCR API with mistral-ocr-latest model
    const documentPayload = isImage 
      ? {
          type: 'image_url' as const,
          imageUrl: `data:${file.type};base64,${base64Data}`
        }
      : {
          type: 'document_url' as const,
          documentUrl: `data:${file.type};base64,${base64Data}`
        };
    
    const ocrResponse = await client.ocr.process({
      model: "mistral-ocr-latest",
      document: documentPayload,
      includeImageBase64: false
    });
    
    // Process each page separately
    const pages = ocrResponse.pages.map((page, index) => ({
      pageNumber: index + 1,
      content: page.markdown,
      header: `--- PAGE ${index + 1} ---`
    }));
    
    console.log(`Extracted ${pages.length} pages from combined document`);
    
    // Analyze page content to determine document types
    const analyzedPages = pages.map(page => {
      const content = page.content.toLowerCase();
      
      // Keywords to identify packing list
      const packingListKeywords = [
        'packing list'
      ];
      
      // Keywords to identify commercial invoice  
      const invoiceKeywords = [
        'commercial invoice'
      ];
      
      const packingScore = packingListKeywords.reduce((score, keyword) => 
        content.includes(keyword) ? score + 1 : score, 0);
        
      const invoiceScore = invoiceKeywords.reduce((score, keyword) => 
        content.includes(keyword) ? score + 1 : score, 0);
      
      let documentType: 'packing' | 'invoice' | 'unknown';
      if (packingScore > invoiceScore) {
        documentType = 'packing';
      } else if (invoiceScore > packingScore) {
        documentType = 'invoice';
      } else {
        // If unclear, use page position as fallback
        // Typically packing list comes first, then invoice
        documentType = page.pageNumber === 1 ? 'packing' : 'invoice';
      }
      
      return {
        ...page,
        documentType,
        packingScore,
        invoiceScore
      };
    });
    
    console.log('Page analysis:', analyzedPages.map(p => ({
      page: p.pageNumber,
      type: p.documentType,
      packingScore: p.packingScore,
      invoiceScore: p.invoiceScore
    })));
    
    // Separate pages by document type
    const packingPages = analyzedPages.filter(p => p.documentType === 'packing');
    const invoicePages = analyzedPages.filter(p => p.documentType === 'invoice');
    
    // If we couldn't identify any pages, fall back to page position
    if (packingPages.length === 0 && invoicePages.length === 0) {
      const midPoint = Math.ceil(pages.length / 2);
      packingPages.push(...analyzedPages.slice(0, midPoint));
      invoicePages.push(...analyzedPages.slice(midPoint));
      console.log('Used fallback page separation based on position');
    }
    
    // If only one type identified, assume the other pages are the other type
    if (packingPages.length === 0) {
      const firstInvoicePage = Math.min(...invoicePages.map(p => p.pageNumber));
      packingPages.push(...analyzedPages.filter(p => p.pageNumber < firstInvoicePage));
    }
    if (invoicePages.length === 0) {
      const lastPackingPage = Math.max(...packingPages.map(p => p.pageNumber));
      invoicePages.push(...analyzedPages.filter(p => p.pageNumber > lastPackingPage));
    }
    
    // Combine text for each document type
    const packingListText = packingPages
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map(page => `\n\n${page.header}\n\n${page.content}`)
      .join('');
      
    const invoiceText = invoicePages
      .sort((a, b) => a.pageNumber - b.pageNumber)
      .map(page => `\n\n${page.header}\n\n${page.content}`)
      .join('');
    
    // Validate that we have content for both documents
    if (!packingListText || packingListText.trim().length < 10) {
      throw new Error('Could not identify packing list content in the combined document');
    }
    
    if (!invoiceText || invoiceText.trim().length < 10) {
      throw new Error('Could not identify commercial invoice content in the combined document');
    }
    
    console.log('Successfully separated combined document:', {
      packingListPages: packingPages.length,
      invoicePages: invoicePages.length,
      packingListLength: packingListText.length,
      invoiceLength: invoiceText.length
    });
    
    return {
      packingListText,
      invoiceText
    };
    
  } catch (error) {
    console.error('Combined document OCR extraction failed:', error);
    throw new Error('Failed to extract and separate documents from combined file');
  }
}