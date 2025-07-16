# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- **Start development server**: `npm run dev` (uses Turbopack for faster builds)
- **Build for production**: `npm run build`
- **Start production server**: `npm start` 
- **Lint code**: `npm run lint`

### Development Notes
- The development server runs on `http://localhost:3000`
- Uses Next.js 15.3.5 with React 19 and TypeScript
- Turbopack is enabled for faster development builds

## Architecture Overview

### Application Type
This is a **SmacBOL** - an AI-powered Bill of Lading (BOL) generator that processes shipping documents and creates professional BOL PDFs. The application uses OCR to extract text from packing lists and commercial invoices, then uses AI to generate structured BOL data.

### Tech Stack
- **Framework**: Next.js 15 App Router
- **Frontend**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **AI Services**: 
  - Mistral AI for OCR processing
  - OpenAI GPT-4.1-mini for document analysis and BOL generation
- **PDF Generation**: pdf-lib for creating professional BOL documents

### Key Processing Flow
1. **Document Upload**: Users upload either separate files (packing list + invoice) or combined documents
2. **OCR Processing**: Mistral OCR extracts text from uploaded documents  
3. **AI Analysis**: OpenAI processes extracted text to generate structured BOL data
4. **PDF Generation**: Custom PDF generation creates professional BOL documents

### File Structure
- `app/` - Next.js app router pages and API routes
- `app/api/generate-bol/route.ts` - Main API endpoint for BOL generation
- `lib/services/` - Core service modules:
  - `ocr.ts` - Mistral AI OCR processing
  - `llm.ts` - OpenAI document analysis
  - `pdf.ts` - PDF generation with professional styling
- `components/` - React components for file upload and status tracking

### Environment Variables Required
- `MISTRAL_API_KEY` - For OCR processing
- `OPENAI_API_KEY` - For document analysis

### File Upload Support
- **PDF files** - Primary format for shipping documents
- **Images** - JPG, PNG, WebP for scanned documents  
- **DOCX files** - Microsoft Word documents
- **Max file size**: 50MB per file
- **Processing modes**: Separate documents or combined multi-page files

### Security Features
- Rate limiting (10 requests per hour per IP)
- File type validation and size limits
- Request timeout protection (5 minutes)
- Secure file handling without persistent storage

### Error Handling
The API provides detailed error responses for:
- File validation failures
- OCR processing errors
- AI analysis failures
- PDF generation issues
- Rate limiting and timeouts