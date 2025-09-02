# Plan to Implement Professional BOL PDF with Exact Layout

## Understanding the Current Flow

- OCR extracts raw text from documents
- LLM uses the BOLData interface as a schema to structure the extracted data into JSON
- PDF renders the JSON data into a professional BOL document

## Step 1: Clean Up and Consolidate BOLData Interface

1. Remove the unused simple interface from `types/index.ts`
2. Move the comprehensive BOLData interface from `lib/services/llm.ts` to `types/index.ts` as the single source of truth
3. Update imports in both `llm.ts` and `pdf.ts` to import from `@/types`
4. Remove duplicate interface definitions from both service files

## Step 2: Install pdfmake

```bash
npm install pdfmake
npm install --save-dev @types/pdfmake
```

## Step 3: Create New PDF Generation Module

Create `lib/services/pdf-pdfmake.ts` that takes the BOLData JSON from the LLM and renders it with the exact layout:

### Implementation Structure:

**1. Page Header Function:**
```javascript
header: function(currentPage, pageCount) {
  // First page: Logo box + BOL number box with DRAFT watermark
  // Continuation pages: Logo box + "RIDER PAGE" with page number
}
```

**2. Main Content Layout:**
- Extract values from bolData JSON
- Position them in the correct boxes/sections
- Handle optional fields gracefully (show empty boxes if no data)

## Step 4: Create PDF Layout for All BOLData Fields

Map each field from the BOLData JSON to its visual position:

### Header Section:
- Logo placeholder (fixed)
- `bolNumber` parameter → BOL Number box with DRAFT watermark

### Party Information (Left Column):
- `bolData.shipper` → Shipper box
- `bolData.consignee` → Consignee box with "To Order" notice
- `bolData.notify_party` → Notify Party box

### Reference Information (Right Column):
- `bolData.booking_ref` or `bookingNumber` parameter → Booking Ref box
- `bolData.shipper_ref` → Shipper's Ref box
- `bolData.vessel_details` → Vessel and Voyage No box
- `bolData.ports.loading` → Port of Loading box
- `bolData.shipped_on_board_date` → Shipped on Board Date box
- `bolData.ports.discharge` → Port of Discharge box

### Location & Commercial Section:
- `bolData.place_of_receipt` → Place of Receipt box
- `bolData.place_of_delivery` → Place of Delivery box
- `bolData.rider_pages` → No. of Rider Pages field
- `bolData.freight_charges` → Freight & Charges box
- `bolData.declared_value` → Declared Value box

### Additional Information:
- `bolData.discharge_agent` → Port of Discharge Agent field
- `bolData.transport_type` → Transport type selection
- `bolData.place_and_date_of_issue` → Place and Date of Issue box
- `bolData.imo_number` → IMO Number box

### Cargo Table:
- Loop through `bolData.cargo` array
- For each item, display:
  - `container_numbers`, `seal_numbers`, `marks` → Column 1
  - `description` → Column 2
  - `gross_weight` → Column 3
  - `measurement` → Column 4

### Footer Sections:
- `bolData.totals` → Totals row
- `bolData.carrier_receipt` → Carrier's Receipt box
- Fixed legal text → Terms and conditions
- `bolData.carrier_endorsements` → Carrier's Agent Endorsements box
- `bolData.bl_sequence` → No. & Sequence of Original B/Ls box
- `bolData.signed_by` → Signature line

## Step 5: Handle Multi-Page Logic

- Implement automatic page breaks for cargo table
- Ensure table headers repeat on continuation pages
- Calculate and update `rider_pages` count dynamically

## Step 6: Testing Strategy

1. Test with minimal BOLData (only required fields)
2. Test with complete BOLData (all optional fields filled)
3. Test with varying cargo items (1, 10, 50+) for pagination
4. Verify empty optional fields display as empty boxes
5. Ensure layout matches reference images exactly

## Step 7: Migration

1. Update `app/api/generate-bol/route.ts` to use new PDF generator
2. Keep old implementation for rollback
3. Remove old `pdf.ts` after verification

## Key Benefits

- The BOLData interface remains unchanged (LLM output stays the same)
- PDF generator simply renders whatever data the LLM provides
- Professional layout matches the reference images exactly
- Automatic handling of pagination and multi-page documents