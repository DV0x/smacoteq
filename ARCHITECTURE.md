# SmacBOL Architecture Documentation

## System Overview

SmacBOL is an AI-powered Bill of Lading (BOL) generator that automates the extraction and processing of shipping documents. The system uses OCR technology to extract text from packing lists and commercial invoices, then leverages AI to generate structured BOL data and produces professional PDF documents.

## Architecture Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                   USER INTERFACE                                     │
│                              Next.js 15 + React 19 + TypeScript                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                              Frontend Components                              │  │
│  │                                                                              │  │
│  │  ┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐   │  │
│  │  │   FileUpload    │     │ ProcessingStatus │     │   Home Page       │   │  │
│  │  │                 │     │                  │     │                   │   │  │
│  │  │ • Drag & Drop   │     │ • Status Tracker │     │ • Form Handling   │   │  │
│  │  │ • File Validate │     │ • Progress UI    │     │ • State Mgmt      │   │  │
│  │  │ • Doc Convert   │     │ • Error Display  │     │ • Mode Selection  │   │  │
│  │  └─────────────────┘     └──────────────────┘     └───────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                         │
│                                        ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                         UPLOAD & VALIDATION LAYER                         │  │
│  │                                                                          │  │
│  │  • File Type Check: PDF, JPG, PNG, WebP, DOCX                          │  │
│  │  • Size Limit: 50MB max per file                                       │  │
│  │  • Rate Limiting: 10 requests/hour per IP                              │  │
│  │  • Security Headers & CORS Protection                                  │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTE HANDLER                                      │
│                        /api/generate-bol/route.ts                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                          REQUEST PROCESSING PIPELINE                          │  │
│  │                                                                              │  │
│  │  1. Environment Validation (API Keys Check)                                 │  │
│  │  2. Rate Limit Check (In-memory counter)                                   │  │
│  │  3. FormData Parsing & File Extraction                                     │  │
│  │  4. Upload Mode Detection (Separate/Combined)                              │  │
│  │  5. Custom BOL/Booking Number Extraction                                   │  │
│  │  6. Request Timeout Setup (5 minutes max)                                  │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                         │
│                    ┌───────────────────┼───────────────────┐                   │
│                    ▼                   ▼                   ▼                   │
└─────────────────────────────────────────────────────────────────────────────────────┘
                     │                   │                   │
                     ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE LAYER MODULES                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐     │
│  │     OCR SERVICE      │  │     LLM SERVICE      │  │     PDF SERVICE      │     │
│  │   lib/services/ocr   │  │   lib/services/llm   │  │   lib/services/pdf   │     │
│  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤     │
│  │                      │  │                      │  │                      │     │
│  │  Mistral AI OCR API  │  │  OpenAI GPT-4.1-mini │  │  Puppeteer + Chrome  │     │
│  │                      │  │                      │  │                      │     │
│  │  • Document Upload   │  │  • Text Analysis     │  │  • Professional BOL  │     │
│  │  • Base64 Encoding   │  │  • Data Extraction   │  │  • HTML/CSS Templates│     │
│  │  • Multi-page Extract│  │  • Field Mapping     │  │  • Vercel Compatible │     │
│  │  • Format Detection  │  │  • JSON Structure    │  │  • Modern Styling    │     │
│  │  • Combined Doc Split│  │  • Cross-Reference   │  │  • Print Optimized   │     │
│  │                      │  │  • Validation        │  │  • Chrome Rendering  │     │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┤     │
│         │                          │                          │               │     │
│         ▼                          ▼                          ▼               │     │
│  ┌──────────────────────────────────────────────────────────────────────────┐     │
│  │                         DATA FLOW & PROCESSING                           │     │
│  │                                                                          │     │
│  │  1. OCR Extraction → Raw Text (Markdown format with page breaks)        │     │
│  │  2. LLM Processing → Structured JSON (BOLData type)                     │     │
│  │  3. PDF Generation → Binary PDF (Uint8Array)                           │     │
│  └──────────────────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL DEPENDENCIES                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐     │
│  │    MISTRAL AI API    │  │    OPENAI API        │  │    NPM PACKAGES      │     │
│  ├──────────────────────┤  ├──────────────────────┤  ├──────────────────────┤     │
│  │                      │  │                      │  │                      │     │
│  │  Model:              │  │  Model:              │  │  • puppeteer-core    │     │
│  │  mistral-ocr-latest  │  │  gpt-4.1-mini        │  │  • @sparticuz/chromium│     │
│  │                      │  │                      │  │  • Tailwind CSS 4    │     │
│  │  Features:           │  │  Features:           │  │  • Lucide React      │     │
│  │  • PDF OCR           │  │  • Context Analysis  │  │  • clsx & CVA        │     │
│  │  • Image OCR         │  │  • JSON Generation   │  │  • Next.js 15.3.5    │     │
│  │  • DOCX Support      │  │  • Data Structuring  │  │  • React 19          │     │
│  │  • Multi-language    │  │  • Field Validation  │  │  • TypeScript 5      │     │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────┤     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3.5 with App Router
- **UI Library**: React 19 with TypeScript
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Utilities**: clsx, class-variance-authority (CVA)
- **Build Tool**: Turbopack (development)

### Backend Services
- **Runtime**: Node.js (Next.js API Routes)
- **OCR Service**: Mistral AI (mistral-ocr-latest model)
- **LLM Service**: OpenAI GPT-4.1-mini
- **PDF Generation**: Puppeteer with Chrome rendering engine

### File Support
- **Document Formats**: PDF, JPG, PNG, WebP, DOCX
- **Processing Modes**: 
  - Separate files (packing list + invoice)
  - Combined multi-page documents
- **Max File Size**: 50MB per file

## Core Components

### 1. Frontend Components

#### FileUpload Component (`components/FileUpload.tsx`)
- Drag-and-drop file upload interface
- File type validation
- Automatic .doc to PDF conversion
- Visual feedback for file selection

#### ProcessingStatus Component (`components/ProcessingStatus.tsx`)
- Real-time processing status display
- Stage indicators (Upload → OCR → AI → PDF)
- Error state handling
- Success state with download trigger

#### Home Page (`app/page.tsx`)
- Main application interface
- Upload mode selection (separate/combined)
- Custom BOL/Booking number inputs
- Form validation and submission
- State management for processing flow

### 2. API Route Handler (`app/api/generate-bol/route.ts`)

#### Security Features
- Rate limiting (10 requests/hour per IP)
- File size validation (50MB max)
- MIME type validation
- Request timeout (5 minutes)
- Security headers (XSS, CSRF protection)

#### Processing Pipeline
1. Environment validation (API keys)
2. Rate limit checking
3. FormData parsing and validation
4. File extraction based on upload mode
5. Sequential service orchestration

### 3. Service Modules

#### OCR Service (`lib/services/ocr.ts`)
- **Provider**: Mistral AI
- **Model**: mistral-ocr-latest
- **Functions**:
  - `extractTextFromDocument()`: Single document OCR
  - `extractFromCombinedDocument()`: Multi-document splitting and OCR
  - `extractFromMultipleDocuments()`: Batch processing
- **Features**:
  - Base64 encoding for API transmission
  - Page-by-page markdown extraction
  - Automatic document type detection
  - Combined document intelligent splitting

#### LLM Service (`lib/services/llm.ts`)
- **Provider**: OpenAI
- **Model**: GPT-4.1-mini
- **Function**: `generateBOL()`
- **Processing**:
  - Structured prompt engineering
  - Cross-document information extraction
  - JSON schema validation
  - Field mapping and normalization
- **Output**: Structured BOLData object

#### PDF Service (`lib/services/pdf.ts`)
- **Library**: Puppeteer with Chrome rendering
- **Function**: `generateBOLPDF()`
- **Templates**: HTML/CSS-based generation (`lib/templates/`)
- **Features**:
  - Professional BOL layout with modern design
  - Environment auto-detection (local vs Vercel)
  - HTML/CSS templates for easy customization
  - Chrome rendering engine for high quality
  - Vercel serverless compatibility
  - Print-optimized styling

## Data Flow

### 1. Upload Phase
```
User Input → File Selection → Client Validation → FormData Creation
```

### 2. Processing Phase
```
API Endpoint → File Validation → OCR Processing → Text Extraction
     ↓
LLM Analysis ← Extracted Text
     ↓
Structured BOL Data → PDF Generation → Binary Output
```

### 3. Response Phase
```
PDF Binary → HTTP Response → Browser Download → User Receipt
```

## Error Handling

### Client-Side
- File type validation before upload
- Size limit checking
- BOL/Booking number format validation
- Network error recovery
- User-friendly error messages

### Server-Side
- Environment variable validation
- Rate limiting with retry headers
- OCR failure handling
- LLM processing error recovery
- PDF generation fallbacks
- Comprehensive error logging

## Security Measures

### Input Validation
- MIME type whitelist
- File size limits
- Path traversal prevention
- SQL injection prevention (parameterized inputs)

### Rate Limiting
- IP-based tracking
- In-memory counter (production: use Redis)
- Configurable limits and windows
- Retry-After headers

### Response Security
- Content-Type enforcement
- No-cache headers for sensitive data
- XSS protection headers
- Frame options (DENY)
- Content type options (nosniff)

## Performance Optimizations

### Frontend
- Turbopack for faster development builds
- Client-side file validation
- Optimistic UI updates
- Lazy loading for components

### Backend
- Parallel OCR processing for multiple files
- Request timeout protection
- Efficient base64 encoding
- Stream-based file handling

### Caching Strategy
- No persistent file storage (security)
- In-memory rate limit tracking
- Stateless request processing

## Deployment Considerations

### Environment Variables
Required:
- `MISTRAL_API_KEY`: Mistral AI API key
- `OPENAI_API_KEY`: OpenAI API key

### Infrastructure Requirements
- Node.js 18+ runtime
- 512MB+ RAM recommended
- Network access to AI APIs
- HTTPS termination

### Scaling Considerations
- Stateless design enables horizontal scaling
- External rate limiting (Redis) for production
- CDN for static assets
- API gateway for additional security

## Monitoring & Logging

### Application Logs
- Request processing stages
- Error details with timestamps
- Performance metrics (processing time)
- User agent tracking

### Metrics to Track
- API response times
- OCR processing duration
- LLM inference time
- PDF generation speed
- Error rates by type
- Rate limit hits

## Future Enhancements

### Planned Features
- Batch processing support
- Template customization
- Multi-language support
- Webhook notifications
- API key management UI

### Technical Improvements
- Redis-based rate limiting
- WebSocket progress updates
- Background job processing
- S3 integration for large files
- Docker containerization

## Development Workflow

### Local Development
```bash
npm run dev     # Start development server with Turbopack
npm run build   # Production build
npm start       # Start production server
npm run lint    # Code linting
```

### Testing Strategy
- Unit tests for service modules
- Integration tests for API endpoints
- E2E tests for critical paths
- Load testing for performance

### Code Organization
```
smacoteq/
├── app/                 # Next.js app router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
├── lib/               # Core libraries
│   ├── services/      # Service modules (OCR, LLM, PDF)
│   ├── templates/     # HTML templates for PDF generation
│   └── utils/         # Utility functions
├── types/             # TypeScript definitions
└── public/            # Static assets
```

## Conclusion

SmacBOL provides a robust, secure, and scalable solution for automated BOL generation. The architecture leverages modern AI capabilities while maintaining security and performance standards suitable for production deployment.