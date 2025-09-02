import type { BOLData } from '@/types';
import { generateBOLHTML } from '@/lib/templates/bol-generator';

// Environment detection for local vs serverless
const isVercel = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

export async function generateBOLPDF(
  bolData: BOLData,
  customBolNumber?: string | null,
  customBookingNumber?: string | null
): Promise<Uint8Array> {
  let browser;
  
  try {
    if (isVercel) {
      // Use Vercel-optimized Puppeteer for production/serverless
      const puppeteer = await import('puppeteer-core');
      const chromium = await import('@sparticuz/chromium');
      
      // Optional: Load fonts for better rendering
      chromium.default.font('https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf');
      
      browser = await puppeteer.default.launch({
        args: chromium.default.args,
        defaultViewport: chromium.default.defaultViewport,
        executablePath: await chromium.default.executablePath(),
        headless: chromium.default.headless,
      });
    } else {
      // Use regular Puppeteer for local development
      const puppeteer = await import('puppeteer');
      
      browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    
    const page = await browser.newPage();
    const html = generateBOLHTML(bolData, customBolNumber, customBookingNumber);
    
    await page.setContent(html, {
      waitUntil: isVercel ? 'domcontentloaded' : 'networkidle0'
    });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '15mm',
        right: '10mm',
        bottom: '15mm',
        left: '10mm'
      }
    });
    
    return new Uint8Array(pdfBuffer);
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}