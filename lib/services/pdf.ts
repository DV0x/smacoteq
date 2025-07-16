import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

interface BOLData {
  // Party Information
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
    is_negotiable?: boolean; // For "To Order" marking
  };
  notify_party?: {
    name: string;
    address: string;
  };
  
  // Reference Numbers
  booking_ref?: string;
  shipper_ref?: string;
  imo_number?: string;
  rider_pages?: number;
  bl_sequence?: string; // Number & sequence of original B/Ls
  
  // Transport Details
  vessel_details?: {
    vessel_name: string;
    voyage_number: string;
  };
  ports: {
    loading: string;
    discharge: string;
    delivery?: string;
  };
  place_of_receipt?: string;
  place_of_delivery?: string;
  shipped_on_board_date?: string;
  place_and_date_of_issue?: string;
  
  // Discharge Agent
  discharge_agent?: string;
  transport_type?: 'Port-To-Port' | 'Combined Transport';
  
  // Cargo Information
  cargo: Array<{
    container_numbers?: string;
    seal_numbers?: string;
    marks?: string;
    description: string;
    gross_weight: string;
    measurement?: string;
  }>;
  
  // Totals
  totals: {
    packages: number;
    gross_weight: string;
    measurement?: string;
  };
  
  // Commercial Information
  freight_charges?: string;
  declared_value?: string;
  carrier_receipt?: string;
  
  // Legacy fields for backward compatibility
  invoice_details?: {
    number: string;
    date: string;
    value: string;
    currency: string;
  };
  freight_terms?: string;
  payment_terms?: string;
  special_instructions?: string;
  date_of_shipment?: string;
  
  // Authentication
  carrier_endorsements?: string;
  signed_by?: string;
}

export async function generateBOLPDF(bolData: BOLData, customBolNumber?: string | null, customBookingNumber?: string | null): Promise<Uint8Array> {
  // Create a new PDF document with A4 size
  const pdfDoc = await PDFDocument.create();
  let currentPage = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = currentPage.getSize();
  
  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Traditional BOL color scheme - simplified black and white
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  const borderGray = rgb(0.5, 0.5, 0.5);        // Medium gray for borders
  const lightGray = rgb(0.95, 0.95, 0.95);      // Very light gray for alternating rows
  
  // Helper function to draw text with intelligent word wrapping and overflow protection
  const drawText = (
    page: typeof currentPage,
    text: string, 
    x: number, 
    y: number, 
    options: {
      size?: number;
      font?: typeof helvetica;
      color?: ReturnType<typeof rgb>;
      maxWidth?: number;
      lineHeight?: number;
      maxLines?: number;
      align?: 'left' | 'center' | 'right';
    } = {}
  ) => {
    const {
      size = 10,
      font = helvetica,
      color = black,
      maxWidth = width - x - 20,
      lineHeight = size + 3,
      maxLines = 3,
      align = 'left'
    } = options;
    
    if (!text || typeof text !== 'string') return y;
    
    // Sanitize and truncate very long text
    const sanitizedText = text.replace(/[\r\n\t]+/g, ' ').trim();
    if (sanitizedText.length === 0) return y;
    
    const words = sanitizedText.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = font.widthOfTextAtSize(testLine, size);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        
        if (lines.length >= maxLines) {
          // Truncate with ellipsis if exceeding max lines
          const lastLine = lines[lines.length - 1];
          let truncated = lastLine;
          
          while (font.widthOfTextAtSize(truncated + '...', size) > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1).trim();
          }
          
          lines[lines.length - 1] = truncated + '...';
          break;
        }
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }
    
    // Draw lines with alignment
    let currentY = y;
    for (const line of lines) {
      let drawX = x;
      
      if (align === 'center') {
        const lineWidth = font.widthOfTextAtSize(line, size);
        drawX = x + (maxWidth - lineWidth) / 2;
      } else if (align === 'right') {
        const lineWidth = font.widthOfTextAtSize(line, size);
        drawX = x + maxWidth - lineWidth;
      }
      
      page.drawText(line, { x: drawX, y: currentY, size, font, color });
      currentY -= lineHeight;
    }
    
    return currentY - 2;
  };
  
  // Helper function to draw styled boxes with enhanced visuals
  const drawBox = (
    page: typeof currentPage,
    x: number, 
    y: number, 
    boxWidth: number, 
    boxHeight: number,
    options: {
      borderColor?: ReturnType<typeof rgb>;
      fillColor?: ReturnType<typeof rgb>;
      borderWidth?: number;
      shadow?: boolean;
    } = {}
  ) => {
    const {
      borderColor = borderGray,
      fillColor = null,
      borderWidth = 0.5,
      shadow = false
    } = options;
    
    // Add subtle shadow effect
    if (shadow) {
      page.drawRectangle({
        x: x + 1,
        y: y - 1,
        width: boxWidth,
        height: boxHeight,
        color: rgb(0.8, 0.8, 0.8),
        opacity: 0.3
      });
    }
    
    // Fill background
    if (fillColor) {
      page.drawRectangle({
        x,
        y,
        width: boxWidth,
        height: boxHeight,
        color: fillColor
      });
    }
    
    // Draw border
    page.drawRectangle({
      x,
      y,
      width: boxWidth,
      height: boxHeight,
      borderColor,
      borderWidth
    });
  };

  // Helper function to draw table header
  const drawTableHeader = (page: typeof currentPage, startY: number, colWidths: number[]) => {
    const tableWidth = width - 60;
    const headers = ['Container Numbers, Seal Numbers and Marks', 'Description of Packages and Goods', 'Gross Cargo Weight', 'Measurement'];
    
    // Add disclaimer header
    page.drawText('PARTICULARS FURNISHED BY THE SHIPPER - NOT CHECKED BY CARRIER - CARRIER NOT RESPONSIBLE', {
      x: 30,
      y: startY + 5,
      size: 8,
      font: helveticaBold,
      color: black
    });
    
    // Table header with simple black border
    drawBox(page, 30, startY - 22, tableWidth, 22, { 
      borderColor: black,
      borderWidth: 1
    });
    
    let colX = 30;
    headers.forEach((header, index) => {
      // Draw column dividers
      if (index > 0) {
        page.drawLine({
          start: { x: colX, y: startY },
          end: { x: colX, y: startY - 22 },
          color: black,
          thickness: 1
        });
      }
      
      drawText(page, header, colX + 3, startY - 16, {
        size: 8,
        font: helveticaBold,
        color: black,
        maxWidth: colWidths[index] - 6,
        align: 'center',
        maxLines: 2,
        lineHeight: 10
      });
      colX += colWidths[index];
    });
    
    return startY - 32; // Return Y position for first content row
  };

  // Helper function to draw table borders
  const drawTableBorders = (page: typeof currentPage, startY: number, endY: number, colWidths: number[]) => {
    const actualRowHeight = 20;
    
    // Vertical lines
    let colX = 30;
    for (let i = 0; i <= colWidths.length; i++) {
      page.drawLine({
        start: { x: colX, y: startY },
        end: { x: colX, y: endY },
        color: borderGray,
        thickness: 0.5
      });
      if (i < colWidths.length) colX += colWidths[i];
    }
    
    // Horizontal lines
    for (let y = startY; y >= endY; y -= actualRowHeight) {
      page.drawLine({
        start: { x: 30, y },
        end: { x: width - 30, y },
        color: borderGray,
        thickness: 0.5
      });
    }
  };
  
  // Use custom BOL number or generate a professional one
  const bolNumber = customBolNumber && customBolNumber.trim() 
    ? customBolNumber.trim() 
    : `BOL-${Date.now().toString().slice(-8)}`;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Function to create the first page header
  const createFirstPageHeader = (page: typeof currentPage) => {
    let yPos = height - 20;
    
    // === TRADITIONAL BOL HEADER SECTION ===
    // Draw main header border box
    drawBox(page, 20, height - 80, width - 40, 60, { 
      borderColor: black,
      borderWidth: 1
    });
    
    // Left side - Company Logo area
    drawBox(page, 25, height - 75, 200, 50, { 
      borderColor: black,
      borderWidth: 1
    });
    
    // Logo placeholder text
    page.drawText('Shipping Company Logo', {
      x: 30,
      y: height - 55,
      size: 10,
      font: helvetica,
      color: black
    });
    
    // Right side - BOL Number section
    const bolBoxX = 250;
    const bolBoxWidth = width - bolBoxX - 25;
    
    drawBox(page, bolBoxX, height - 75, bolBoxWidth, 50, { 
      borderColor: black,
      borderWidth: 1
    });
    
    // BOL Number title and value
    page.drawText('BILL OF LADING No.', {
      x: bolBoxX + 10,
      y: height - 35,
      size: 12,
      font: helveticaBold,
      color: black
    });
    
    // Add DRAFT watermark if needed
    page.drawText('DRAFT', {
      x: bolBoxX + 10,
      y: height - 50,
      size: 10,
      font: helvetica,
      color: borderGray
    });
    
    // BOL Number value
    page.drawText(bolNumber, {
      x: bolBoxX + 10,
      y: height - 65,
      size: 14,
      font: helveticaBold,
      color: black
    });
    
    return height - 90; // Return Y position for next section
  };

  // Function to create continuation page header
  const createContinuationHeader = (page: typeof currentPage, pageNum: number) => {
    let yPos = height - 20;
    
    // === RIDER PAGE HEADER SECTION ===
    // Draw main header border box
    drawBox(page, 20, height - 80, width - 40, 60, { 
      borderColor: black,
      borderWidth: 1
    });
    
    // Left side - Company Logo area
    drawBox(page, 25, height - 75, 200, 50, { 
      borderColor: black,
      borderWidth: 1
    });
    
    // Logo placeholder text
    page.drawText('Shipping Company Logo', {
      x: 30,
      y: height - 55,
      size: 10,
      font: helvetica,
      color: black
    });
    
    // Right side - BOL Number and Rider Page info
    const bolBoxX = 250;
    const bolBoxWidth = width - bolBoxX - 25;
    
    drawBox(page, bolBoxX, height - 75, bolBoxWidth, 50, { 
      borderColor: black,
      borderWidth: 1
    });
    
    // BOL Number title and value
    page.drawText('BILL OF LADING No.', {
      x: bolBoxX + 10,
      y: height - 35,
      size: 12,
      font: helveticaBold,
      color: black
    });
    
    // Add RIDER PAGE designation
    page.drawText('RIDER PAGE', {
      x: bolBoxX + 10,
      y: height - 50,
      size: 10,
      font: helveticaBold,
      color: black
    });
    
    // Page number
    page.drawText(`Page ${pageNum}`, {
      x: bolBoxX + 120,
      y: height - 50,
      size: 10,
      font: helvetica,
      color: black
    });
    
    // BOL Number value
    page.drawText(bolNumber, {
      x: bolBoxX + 10,
      y: height - 65,
      size: 14,
      font: helveticaBold,
      color: black
    });
    
    return height - 90; // Return Y position for next section
  };

  let yPosition = createFirstPageHeader(currentPage);
  let pageNumber = 1;
  
  // === TRADITIONAL BOL TWO-COLUMN LAYOUT ===
  const leftColumnWidth = (width - 60) / 2;
  const rightColumnWidth = (width - 60) / 2;
  const columnSpacing = 10;
  const leftX = 30;
  const rightX = leftX + leftColumnWidth + columnSpacing;
  
  // Draw main information block border
  drawBox(currentPage, 20, yPosition - 200, width - 40, 200, { 
    borderColor: black,
    borderWidth: 1
  });
  
  // === LEFT COLUMN ===
  
  // Shipper section
  let currentY = yPosition - 10;
  drawBox(currentPage, leftX, currentY - 70, leftColumnWidth, 70, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('SHIPPER:', {
    x: leftX + 5,
    y: currentY - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  
  let shipperY = currentY - 25;
  shipperY = drawText(currentPage, bolData.shipper?.name || '', leftX + 5, shipperY, { 
    size: 9, 
    font: helvetica,
    color: black,
    maxWidth: leftColumnWidth - 10,
    maxLines: 2
  });
  shipperY = drawText(currentPage, bolData.shipper?.address || '', leftX + 5, shipperY, { 
    size: 9,
    color: black,
    maxWidth: leftColumnWidth - 10,
    maxLines: 2
  });
  drawText(currentPage, `${bolData.shipper?.city || ''}, ${bolData.shipper?.country || ''}`, leftX + 5, shipperY, { 
    size: 9,
    color: black,
    maxWidth: leftColumnWidth - 10,
    maxLines: 1
  });
  
  currentY -= 80;
  
  // Consignee section
  drawBox(currentPage, leftX, currentY - 90, leftColumnWidth, 90, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('CONSIGNEE: This B/L is not negotiable unless marked "To Order"', {
    x: leftX + 5,
    y: currentY - 15,
    size: 8,
    font: helveticaBold,
    color: black
  });
  currentPage.drawText('or "To Order of ..." here.', {
    x: leftX + 5,
    y: currentY - 25,
    size: 8,
    font: helveticaBold,
    color: black
  });
  
  let consigneeY = currentY - 35;
  consigneeY = drawText(currentPage, bolData.consignee?.name || '', leftX + 5, consigneeY, { 
    size: 9, 
    font: helvetica,
    color: black,
    maxWidth: leftColumnWidth - 10,
    maxLines: 2
  });
  consigneeY = drawText(currentPage, bolData.consignee?.address || '', leftX + 5, consigneeY, { 
    size: 9,
    color: black,
    maxWidth: leftColumnWidth - 10,
    maxLines: 2
  });
  drawText(currentPage, `${bolData.consignee?.city || ''}, ${bolData.consignee?.country || ''}`, leftX + 5, consigneeY, { 
    size: 9,
    color: black,
    maxWidth: leftColumnWidth - 10,
    maxLines: 1
  });
  
  currentY -= 100;
  
  // Notify Party section
  drawBox(currentPage, leftX, currentY - 80, leftColumnWidth, 80, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('NOTIFY PARTIES: (No responsibility shall attach to Carrier', {
    x: leftX + 5,
    y: currentY - 15,
    size: 8,
    font: helveticaBold,
    color: black
  });
  currentPage.drawText('or to his Agent for failure to notify)', {
    x: leftX + 5,
    y: currentY - 25,
    size: 8,
    font: helveticaBold,
    color: black
  });
  
  if (bolData.notify_party) {
    let notifyY = currentY - 35;
    notifyY = drawText(currentPage, bolData.notify_party.name || '', leftX + 5, notifyY, { 
      size: 9, 
      font: helvetica,
      color: black,
      maxWidth: leftColumnWidth - 10,
      maxLines: 2
    });
    drawText(currentPage, bolData.notify_party.address || '', leftX + 5, notifyY, { 
      size: 9,
      color: black,
      maxWidth: leftColumnWidth - 10,
      maxLines: 2
    });
  }
  
  // === RIGHT COLUMN ===
  
  // Booking and Shipper references
  let rightY = yPosition - 10;
  drawBox(currentPage, rightX, rightY - 35, rightColumnWidth, 35, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('BOOKING REF.', {
    x: rightX + 5,
    y: rightY - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.booking_ref || customBookingNumber || '', rightX + 5, rightY - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 10
  });
  
  rightY -= 45;
  
  drawBox(currentPage, rightX, rightY - 25, rightColumnWidth, 25, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('SHIPPER\'S REF.', {
    x: rightX + 5,
    y: rightY - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.shipper_ref || '', rightX + 5, rightY - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 10
  });
  
  rightY -= 35;
  
  // Vessel and Voyage
  drawBox(currentPage, rightX, rightY - 25, rightColumnWidth, 25, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('VESSEL AND VOYAGE NO', {
    x: rightX + 5,
    y: rightY - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, `${bolData.vessel_details?.vessel_name || 'TBN'} / ${bolData.vessel_details?.voyage_number || 'TBN'}`, rightX + 5, rightY - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 10
  });
  
  rightY -= 35;
  
  // Port of Loading
  drawBox(currentPage, rightX, rightY - 25, rightColumnWidth, 25, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('PORT OF LOADING', {
    x: rightX + 5,
    y: rightY - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.ports?.loading || '', rightX + 5, rightY - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 10
  });
  
  rightY -= 35;
  
  // Shipped on Board Date
  drawBox(currentPage, rightX, rightY - 25, rightColumnWidth, 25, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('SHIPPED ON BOARD DATE', {
    x: rightX + 5,
    y: rightY - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.shipped_on_board_date || currentDate, rightX + 5, rightY - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 10
  });
  
  rightY -= 35;
  
  // Port of Discharge
  drawBox(currentPage, rightX, rightY - 25, rightColumnWidth, 25, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('PORT OF DISCHARGE', {
    x: rightX + 5,
    y: rightY - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.ports?.discharge || '', rightX + 5, rightY - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 10
  });
  
  yPosition -= 210;
  
  // === LOCATION INFORMATION BLOCK ===
  drawBox(currentPage, 20, yPosition - 60, width - 40, 60, { 
    borderColor: black,
    borderWidth: 1
  });
  
  // Left side - Place information
  drawBox(currentPage, leftX, yPosition - 60, leftColumnWidth, 60, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('PLACE OF RECEIPT:', {
    x: leftX + 5,
    y: yPosition - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.place_of_receipt || '', leftX + 5, yPosition - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: leftColumnWidth - 10
  });
  
  currentPage.drawText('PLACE OF DELIVERY:', {
    x: leftX + 5,
    y: yPosition - 40,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.place_of_delivery || bolData.ports?.delivery || '', leftX + 5, yPosition - 50, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: leftColumnWidth - 10
  });
  
  // Add "NO. OF RIDER PAGES" field
  currentPage.drawText('NO. OF RIDER PAGES', {
    x: leftX + 5,
    y: yPosition - 55,
    size: 8,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, (bolData.rider_pages || 0).toString(), leftX + 120, yPosition - 55, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: 50
  });
  
  // Right side - Commercial information
  drawBox(currentPage, rightX, yPosition - 60, rightColumnWidth, 60, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('FREIGHT & CHARGES', {
    x: rightX + 5,
    y: yPosition - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.freight_charges || bolData.freight_terms || '', rightX + 5, yPosition - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 10
  });
  
  currentPage.drawText('DECLARED VALUE', {
    x: rightX + 5,
    y: yPosition - 40,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.declared_value || '', rightX + 5, yPosition - 50, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 10
  });
  
  yPosition -= 70;
  
  // === AGENT AND REFERENCE INFORMATION ===
  currentPage.drawText('PORT OF DISCHARGE AGENT:', {
    x: 30,
    y: yPosition - 10,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.discharge_agent || '', 30, yPosition - 20, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: width - 60
  });
  
  yPosition -= 35;
  
  currentPage.drawText('"Port-To-Port" or "Combined Transport"', {
    x: 30,
    y: yPosition - 10,
    size: 10,
    font: helvetica,
    color: black
  });
  drawText(currentPage, bolData.transport_type || 'Port-To-Port', 30, yPosition - 20, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: width - 60
  });
  
  yPosition -= 35;
  
  // Place and date of issue with IMO number
  drawBox(currentPage, 20, yPosition - 30, leftColumnWidth + 50, 30, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('PLACE AND DATE OF ISSUE', {
    x: 25,
    y: yPosition - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.place_and_date_of_issue || currentDate, 25, yPosition - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: leftColumnWidth + 40
  });
  
  // IMO Number on the right
  drawBox(currentPage, leftColumnWidth + 80, yPosition - 30, rightColumnWidth - 30, 30, { 
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('IMO Number:', {
    x: leftColumnWidth + 85,
    y: yPosition - 15,
    size: 10,
    font: helveticaBold,
    color: black
  });
  drawText(currentPage, bolData.imo_number || '', leftColumnWidth + 85, yPosition - 25, { 
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: rightColumnWidth - 40
  });
  
  yPosition -= 50;
  
  // === TRADITIONAL BOL CARGO DETAILS TABLE ===
  const colWidths = [140, 240, 90, 90]; // 4 columns for traditional BOL format
  const tableWidth = width - 60;
  const actualRowHeight = 20;
  const tableHeaderHeight = 32; // Height of table header
  const minBottomMargin = 180; // Reserve more space for footer on last page
  const regularBottomMargin = 60; // Margin for continuation pages
  
  // Process all cargo items with pagination
  const allCargo = bolData.cargo || [];
  let cargoIndex = 0;
  
  while (cargoIndex < allCargo.length) {
    // Determine if this is likely the last page (conservative estimate)
    const remainingItems = allCargo.length - cargoIndex;
    const isLikelyLastPage = remainingItems <= 10; // Conservative estimate
    
    // Calculate available space for this page
    const currentBottomMargin = isLikelyLastPage ? minBottomMargin : regularBottomMargin;
    const availableHeight = yPosition - currentBottomMargin - tableHeaderHeight;
    const maxRowsThisPage = Math.floor(availableHeight / actualRowHeight);
    
    // Be more conservative - ensure we have adequate space
    const safeMaxRows = Math.max(1, maxRowsThisPage - 1); // Always leave buffer space
    
    // If we can't fit at least 5 rows or we're running low on space, create a new page
    if (safeMaxRows < 5 && cargoIndex < allCargo.length) {
      currentPage = pdfDoc.addPage(PageSizes.A4);
      pageNumber++;
      yPosition = createContinuationHeader(currentPage, pageNumber);
      continue;
    }
    
    // Draw table header
    const tableStartY = yPosition;
    let currentRowY = drawTableHeader(currentPage, tableStartY, colWidths);
    
    // Determine how many items to show on this page (be conservative)
    const itemsToShow = Math.min(safeMaxRows, allCargo.length - cargoIndex);
    const itemsThisPage = allCargo.slice(cargoIndex, cargoIndex + itemsToShow);
    
    // Draw cargo items with overflow protection
    for (let i = 0; i < itemsThisPage.length; i++) {
      const item = itemsThisPage[i];
      const index = i;
      
      // Check if we have enough space for this row plus some buffer
      if (currentRowY - actualRowHeight < currentBottomMargin + 40) {
        // Not enough space, reduce items and break to next page
        cargoIndex += i; // Only count items we actually rendered
        yPosition = currentRowY - 20;
        break;
      }
      
      // Alternating row colors for better readability
      if (index % 2 === 0) {
        drawBox(currentPage, 30, currentRowY - actualRowHeight + 3, tableWidth, actualRowHeight, { 
          fillColor: lightGray,
          borderWidth: 0
        });
      }
      
      let colX = 30;
      
      // Container Numbers, Seal Numbers and Marks
      const containerInfo = [
        item.container_numbers || '',
        item.seal_numbers || '',
        item.marks || `CTNS ${cargoIndex + index + 1}-${bolData.totals?.packages || ''}`
      ].filter(info => info).join('\n');
      
      drawText(currentPage, containerInfo, colX + 3, currentRowY - 8, {
        size: 7,
        font: helvetica,
        color: black,
        maxWidth: colWidths[0] - 6,
        lineHeight: 9,
        maxLines: 3
      });
      colX += colWidths[0];
      
      // Description of Packages and Goods
      drawText(currentPage, item.description || '', colX + 3, currentRowY - 8, { 
        size: 7,
        font: helvetica,
        color: black,
        maxWidth: colWidths[1] - 6,
        lineHeight: 9,
        maxLines: 2
      });
      colX += colWidths[1];
      
      // Gross Cargo Weight
      drawText(currentPage, item.gross_weight || '', colX + 3, currentRowY - 8, {
        size: 7,
        font: helvetica,
        color: black,
        maxWidth: colWidths[2] - 6,
        align: 'center'
      });
      colX += colWidths[2];
      
      // Measurement
      drawText(currentPage, item.measurement || '', colX + 3, currentRowY - 8, {
        size: 7,
        font: helvetica,
        color: black,
        maxWidth: colWidths[3] - 6,
        align: 'center'
      });
      
      currentRowY -= actualRowHeight;
      
      // If this is the last item in this batch, update cargoIndex
      if (i === itemsThisPage.length - 1) {
        cargoIndex += itemsThisPage.length;
        yPosition = currentRowY - 20;
      }
    };
    
    // Draw table borders
    drawTableBorders(currentPage, tableStartY, currentRowY + actualRowHeight, colWidths);
    
    // If there are more items, prepare for next page
    if (cargoIndex < allCargo.length) {
      currentPage = pdfDoc.addPage(PageSizes.A4);
      pageNumber++;
      yPosition = createContinuationHeader(currentPage, pageNumber);
    }
  }
  
  // === PROFESSIONAL TOTALS SECTION (only on last page) ===
  // Check if we have enough space for the footer, if not create a new page
  if (yPosition < minBottomMargin) {
    currentPage = pdfDoc.addPage(PageSizes.A4);
    pageNumber++;
    yPosition = createContinuationHeader(currentPage, pageNumber);
  }
  
  // Always show totals and footer on the final page
  drawBox(currentPage, 30, yPosition - 28, tableWidth, 28, { 
    fillColor: lightGray,
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('TOTALS:', {
    x: 35,
    y: yPosition - 18,
    size: 10,
    font: helveticaBold,
    color: black
  });
  
  const totalPackages = bolData.totals?.packages || 0;
  const totalWeight = bolData.totals?.gross_weight || 'N/A';
  const totalMeasurement = bolData.totals?.measurement || '';
  
  currentPage.drawText(`${totalPackages} PACKAGES`, {
    x: 140,
    y: yPosition - 18,
    size: 9,
    font: helveticaBold,
    color: black
  });
  
  currentPage.drawText(`GROSS: ${totalWeight}`, {
    x: 280,
    y: yPosition - 18,
    size: 9,
    font: helveticaBold,
    color: black
  });
  
  if (totalMeasurement) {
    currentPage.drawText(`CBM: ${totalMeasurement}`, {
      x: 420,
      y: yPosition - 18,
      size: 9,
      font: helveticaBold,
      color: black
    });
  }
  
  yPosition -= 40;
  
  // === ENHANCED FOOTER INFORMATION ===
  const footerSectionWidth = (width - 50) / 2;
  
  // Freight Terms with modern styling
  drawBox(currentPage, 30, yPosition - 50, footerSectionWidth, 50, {
    fillColor: white,
    borderColor: black,
    borderWidth: 1
  });
  drawBox(currentPage, 30, yPosition - 15, footerSectionWidth, 15, { 
    fillColor: black,
    borderWidth: 0
  });
  
  currentPage.drawText('FREIGHT & CHARGES', {
    x: 35,
    y: yPosition - 11,
    size: 8,
    font: helveticaBold,
    color: white
  });
  
  drawText(currentPage, bolData.freight_terms || 'FREIGHT COLLECT', 35, yPosition - 25, {
    size: 9,
    font: helveticaBold,
    color: black,
    maxWidth: footerSectionWidth - 10
  });
  
  if (bolData.payment_terms) {
    drawText(currentPage, `Payment: ${bolData.payment_terms}`, 35, yPosition - 40, {
      size: 8,
      font: helvetica,
      color: black,
      maxWidth: footerSectionWidth - 10
    });
  }
  
  // Invoice Details with matching styling
  const invoiceX = 35 + footerSectionWidth + 5;
  drawBox(currentPage, invoiceX, yPosition - 50, footerSectionWidth, 50, {
    fillColor: white,
    borderColor: black,
    borderWidth: 1
  });
  drawBox(currentPage, invoiceX, yPosition - 15, footerSectionWidth, 15, { 
    fillColor: black,
    borderWidth: 0
  });
  
  currentPage.drawText('INVOICE DETAILS', {
    x: invoiceX + 5,
    y: yPosition - 11,
    size: 8,
    font: helveticaBold,
    color: white
  });
  
  drawText(currentPage, `Invoice #: ${bolData.invoice_details?.number || 'N/A'}`, invoiceX + 5, yPosition - 25, {
    size: 8,
    font: helvetica,
    color: black,
    maxWidth: footerSectionWidth - 10
  });
  drawText(currentPage, `Date: ${bolData.invoice_details?.date || 'N/A'}`, invoiceX + 5, yPosition - 35, {
    size: 8,
    font: helvetica,
    color: black,
    maxWidth: footerSectionWidth - 10
  });
  drawText(currentPage, `Value: ${bolData.invoice_details?.currency || ''} ${bolData.invoice_details?.value || 'N/A'}`, invoiceX + 5, yPosition - 45, {
    size: 8,
    font: helvetica,
    color: black,
    maxWidth: footerSectionWidth - 10
  });
  
  yPosition -= 70;
  
  // === CARRIER'S RECEIPT SECTION ===
  currentPage.drawText('CARRIER\'S RECEIPT', {
    x: 30,
    y: yPosition - 10,
    size: 10,
    font: helveticaBold,
    color: black
  });
  
  drawBox(currentPage, 30, yPosition - 40, width - 60, 25, {
    borderColor: black,
    borderWidth: 1
  });
  
  drawText(currentPage, bolData.carrier_receipt || '', 30, yPosition - 30, {
    size: 8,
    font: helvetica,
    color: black,
    maxWidth: width - 70,
    maxLines: 2
  });
  
  yPosition -= 50;
  
  // === COMPREHENSIVE LEGAL TERMS AND CONDITIONS ===
  const legalTexts = [
    'RECEIVED by the Carrier in apparent good order and condition (unless otherwise stated herein) the total number or quantity of Containers or other packages or units indicated in the box entitled Carrier\'s Receipt for carriage subject to all the terms and conditions hereof from the Place of Receipt or Port of Loading to the Port of Discharge or Place of Delivery, whichever is applicable. IN ACCEPTING THIS BILL OF LADING THE MERCHANT EXPRESSLY ACCEPTS AND AGREES TO ALL THE TERMS AND CONDITIONS, WHETHER PRINTED, STAMPED OR OTHERWISE INCORPORATED ON THIS SIDE AND ON THE REVERSE SIDE OF THIS BILL OF LADING AND THE TERMS AND CONDITIONS OF THE CARRIER\'S APPLICABLE TARIFF AS IF THEY WERE ALL SIGNED BY THE MERCHANT.',
    
    'If this is a negotiable (To Order / of) Bill of Lading, one original Bill of Lading, duly endorsed must be surrendered by the Merchant to the Carrier (together with outstanding Freight and charges) in exchange for the Goods or a Delivery Order. If this is a non-negotiable (straight) Bill of Lading, the Carrier shall deliver the Goods or issue a Delivery Order (after payment of outstanding Freight and charges) against the surrender of one original Bill of Lading or in accordance with the national law at the Port of Discharge or Place of Delivery whichever is applicable.',
    
    'IN WITNESS WHEREOF the Carrier or their Agent has signed the number of Bills of Lading stated at the top, all of this tenor and date, and wherever one original Bill of Lading has been surrendered all other Bills of Lading shall be void.'
  ];
  
  for (const legalText of legalTexts) {
    if (yPosition < 100) {
      // Create new page if running out of space
      currentPage = pdfDoc.addPage(PageSizes.A4);
      pageNumber++;
      yPosition = createContinuationHeader(currentPage, pageNumber);
      yPosition -= 20;
    }
    
    const textHeight = drawText(currentPage, legalText, 30, yPosition - 10, {
      size: 7,
      font: helvetica,
      color: black,
      maxWidth: width - 60,
      lineHeight: 9,
      maxLines: 10
    });
    
    yPosition = textHeight - 15;
  }
  
  // === IMPORTANT NOTICES ===
  yPosition -= 10;
  
  const importantNotices = [
    '"Carrier\'s liability ceases after discharge of goods into Customs custody and Carrier shall not be responsible for delivery of cargo without the presentation of the Original Bill of Lading, as per Customs Regulations".',
    
    'CARRIER WILL NOT BE LIABLE FOR ANY MISDECLARATION OF H.S.CODE/NCM AND ALL COSTS AND CONSEQUENCES ARISING OUT OF THE MISDECLARATION WILL BE ON ACCOUNT OF SHIPPERS.',
    
    'Cargo shall not be delivered unless Freight & Charges are paid',
    
    'AS PER AGREEMENT'
  ];
  
  for (const notice of importantNotices) {
    if (yPosition < 50) {
      currentPage = pdfDoc.addPage(PageSizes.A4);
      pageNumber++;
      yPosition = createContinuationHeader(currentPage, pageNumber);
      yPosition -= 20;
    }
    
    const textHeight = drawText(currentPage, notice, 30, yPosition - 10, {
      size: 7,
      font: helveticaBold,
      color: black,
      maxWidth: width - 60,
      lineHeight: 9,
      maxLines: 3
    });
    
    yPosition = textHeight - 10;
  }
  
  // === SIGNATURE AND ENDORSEMENT SECTIONS ===
  yPosition -= 20;
  
  if (yPosition < 120) {
    currentPage = pdfDoc.addPage(PageSizes.A4);
    pageNumber++;
    yPosition = createContinuationHeader(currentPage, pageNumber);
    yPosition -= 20;
  }
  
  // Carrier's Agent Endorsements
  currentPage.drawText('CARRIER\'S AGENTS ENDORSEMENTS:', {
    x: 30,
    y: yPosition - 10,
    size: 10,
    font: helveticaBold,
    color: black
  });
  
  drawBox(currentPage, 30, yPosition - 40, width - 60, 25, {
    borderColor: black,
    borderWidth: 1
  });
  
  drawText(currentPage, bolData.carrier_endorsements || '', 35, yPosition - 30, {
    size: 8,
    font: helvetica,
    color: black,
    maxWidth: width - 70,
    maxLines: 2
  });
  
  yPosition -= 50;
  
  // Number & Sequence of Original B/Ls
  currentPage.drawText('NO.& SEQUENCE OF ORIGINAL B/L\'s', {
    x: 30,
    y: yPosition - 10,
    size: 10,
    font: helveticaBold,
    color: black
  });
  
  drawBox(currentPage, 30, yPosition - 35, width - 60, 20, {
    borderColor: black,
    borderWidth: 1
  });
  
  drawText(currentPage, bolData.bl_sequence || '3 (Three) Original Bills of Lading', 35, yPosition - 25, {
    size: 8,
    font: helvetica,
    color: black,
    maxWidth: width - 70
  });
  
  yPosition -= 45;
  
  // Terms continued on reverse notice
  currentPage.drawText('TERMS CONTINUED ON REVERSE', {
    x: 30,
    y: yPosition - 10,
    size: 8,
    font: helveticaBold,
    color: black
  });
  
  yPosition -= 25;
  
  // Final signature section
  drawBox(currentPage, 30, yPosition - 40, (width - 60) / 2, 40, {
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('PLACE AND DATE OF ISSUE', {
    x: 35,
    y: yPosition - 15,
    size: 8,
    font: helveticaBold,
    color: black
  });
  
  drawText(currentPage, bolData.place_and_date_of_issue || currentDate, 35, yPosition - 30, {
    size: 8,
    font: helvetica,
    color: black,
    maxWidth: (width - 70) / 2
  });
  
  drawBox(currentPage, 40 + (width - 60) / 2, yPosition - 40, (width - 60) / 2 - 20, 40, {
    borderColor: black,
    borderWidth: 1
  });
  
  currentPage.drawText('SHIPPED ON BOARD DATE', {
    x: 45 + (width - 60) / 2,
    y: yPosition - 15,
    size: 8,
    font: helveticaBold,
    color: black
  });
  
  drawText(currentPage, bolData.shipped_on_board_date || currentDate, 45 + (width - 60) / 2, yPosition - 30, {
    size: 8,
    font: helvetica,
    color: black,
    maxWidth: (width - 80) / 2
  });
  
  yPosition -= 50;
  
  // Final signature line
  currentPage.drawText(`SIGNED ${bolData.signed_by || '_________________________'} on behalf of the Carrier`, {
    x: 30,
    y: yPosition - 10,
    size: 9,
    font: helvetica,
    color: black
  });
  
  // Calculate total rider pages (all pages except the first one)
  const totalPages = pdfDoc.getPageCount();
  const riderPagesCount = Math.max(0, totalPages - 1);
  
  // Update the rider pages field on the first page if there are rider pages
  if (riderPagesCount > 0) {
    const firstPage = pdfDoc.getPage(0);
    // Add or update the rider pages count on the first page
    // Note: This would ideally be calculated before PDF generation starts
    // but we're calculating it here for now
  }
  
  // Save and return the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}