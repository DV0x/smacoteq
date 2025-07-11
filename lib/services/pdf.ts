import { PDFDocument, StandardFonts, rgb, PageSizes } from 'pdf-lib';

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

export async function generateBOLPDF(bolData: BOLData, customBolNumber?: string | null): Promise<Uint8Array> {
  // Create a new PDF document with A4 size
  const pdfDoc = await PDFDocument.create();
  let currentPage = pdfDoc.addPage(PageSizes.A4);
  const { width, height } = currentPage.getSize();
  
  // Embed fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // Professional color scheme
  const primaryBlue = rgb(0.0, 0.23, 0.47);     // Professional navy blue
  const accentBlue = rgb(0.2, 0.4, 0.7);        // Lighter blue for accents
  const borderGray = rgb(0.6, 0.6, 0.6);        // Medium gray borders
  const lightGray = rgb(0.97, 0.97, 0.97);      // Very light gray background
  const mediumGray = rgb(0.9, 0.9, 0.9);        // Medium gray for alternating rows
  const darkGray = rgb(0.3, 0.3, 0.3);          // Dark gray for text
  const black = rgb(0, 0, 0);
  const white = rgb(1, 1, 1);
  
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
    const headers = ['MARKS & NUMBERS', 'PKGS', 'DESCRIPTION OF GOODS', 'GROSS WEIGHT', 'MEASUREMENT', 'HS CODE'];
    
    // Table header with gradient effect
    drawBox(page, 30, startY - 22, tableWidth, 22, { 
      fillColor: primaryBlue,
      borderWidth: 0
    });
    
    let colX = 30;
    headers.forEach((header, index) => {
      drawText(page, header, colX + 3, startY - 11, {
        size: 8,
        font: helveticaBold,
        color: white,
        maxWidth: colWidths[index] - 6,
        align: 'center'
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
    let yPos = height - 30;
    
    // === PROFESSIONAL HEADER SECTION ===
    // Header background with gradient effect
    drawBox(page, 0, height - 85, width, 85, { 
      fillColor: lightGray, 
      borderWidth: 0 
    });
    
    // Main title with enhanced styling
    const titleText = 'BILL OF LADING';
    const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 26);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: yPos,
      size: 26,
      font: helveticaBold,
      color: primaryBlue
    });
    
    yPos -= 30;
    
    // Subtitle with better positioning
    const subtitleText = 'For Ocean Transport or Multimodal Transport';
    const subtitleWidth = helvetica.widthOfTextAtSize(subtitleText, 11);
    page.drawText(subtitleText, {
      x: (width - subtitleWidth) / 2,
      y: yPos,
      size: 11,
      font: helvetica,
      color: darkGray
    });
    
    yPos -= 35;
    
    // Enhanced document info section
    const docInfoY = yPos;
    const infoBoxWidth = 160;
    const infoBoxHeight = 32;
    
    // BOL Number box with professional styling
    drawBox(page, width - infoBoxWidth - 20, docInfoY - infoBoxHeight, infoBoxWidth, infoBoxHeight, { 
      fillColor: white, 
      borderColor: primaryBlue,
      borderWidth: 1,
      shadow: true
    });
    
    page.drawText('B/L NUMBER', {
      x: width - infoBoxWidth - 15,
      y: docInfoY - 12,
      size: 8,
      font: helveticaBold,
      color: primaryBlue
    });
    page.drawText(bolNumber, {
      x: width - infoBoxWidth - 15,
      y: docInfoY - 25,
      size: 11,
      font: helveticaBold,
      color: black
    });
    
    // Date box with enhanced styling
    drawBox(page, width - infoBoxWidth - 20, docInfoY - (infoBoxHeight * 2) - 5, infoBoxWidth, infoBoxHeight, { 
      fillColor: white, 
      borderColor: primaryBlue,
      borderWidth: 1,
      shadow: true
    });
    
    page.drawText('DATE OF ISSUE', {
      x: width - infoBoxWidth - 15,
      y: docInfoY - infoBoxHeight - 12,
      size: 8,
      font: helveticaBold,
      color: primaryBlue
    });
    
    drawText(page, currentDate, width - infoBoxWidth - 15, docInfoY - infoBoxHeight - 25, {
      size: 9,
      font: helvetica,
      color: black,
      maxWidth: infoBoxWidth - 10
    });
    
    return yPos - 80;
  };

  // Function to create continuation page header
  const createContinuationHeader = (page: typeof currentPage, pageNum: number) => {
    let yPos = height - 30;
    
    // Simple header for continuation pages
    drawBox(page, 0, height - 60, width, 60, { 
      fillColor: lightGray, 
      borderWidth: 0 
    });
    
    const titleText = `BILL OF LADING - CONTINUATION (Page ${pageNum})`;
    const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 18);
    page.drawText(titleText, {
      x: (width - titleWidth) / 2,
      y: yPos,
      size: 18,
      font: helveticaBold,
      color: primaryBlue
    });
    
    yPos -= 25;
    
    // BOL Number reference
    page.drawText(`B/L Number: ${bolNumber}`, {
      x: (width - helvetica.widthOfTextAtSize(`B/L Number: ${bolNumber}`, 12)) / 2,
      y: yPos,
      size: 12,
      font: helvetica,
      color: darkGray
    });
    
    return yPos - 40;
  };

  let yPosition = createFirstPageHeader(currentPage);
  let pageNumber = 1;
  
  // === ENHANCED PARTY INFORMATION SECTION ===
  const sectionHeight = 75;
  const sectionWidth = (width - 70) / 3;
  const sectionSpacing = 5;
  
  // Shipper section with enhanced styling
  drawBox(currentPage, 30, yPosition - sectionHeight, sectionWidth, sectionHeight, { 
    fillColor: white,
    borderColor: primaryBlue,
    borderWidth: 1,
    shadow: true
  });
  
  // Header with colored background
  drawBox(currentPage, 30, yPosition - 18, sectionWidth, 18, { 
    fillColor: primaryBlue,
    borderWidth: 0
  });
  
  currentPage.drawText('SHIPPER (EXPORTER)', {
    x: 35,
    y: yPosition - 13,
    size: 9,
    font: helveticaBold,
    color: white
  });
  
  let shipperY = yPosition - 28;
  shipperY = drawText(currentPage, bolData.shipper?.name || '', 35, shipperY, { 
    size: 8, 
    font: helveticaBold,
    color: black,
    maxWidth: sectionWidth - 10,
    maxLines: 2
  });
  shipperY = drawText(currentPage, bolData.shipper?.address || '', 35, shipperY, { 
    size: 7,
    color: darkGray,
    maxWidth: sectionWidth - 10,
    maxLines: 2
  });
  shipperY = drawText(currentPage, `${bolData.shipper?.city || ''}, ${bolData.shipper?.country || ''}`, 35, shipperY, { 
    size: 7,
    color: darkGray,
    maxWidth: sectionWidth - 10,
    maxLines: 1
  });
  if (bolData.shipper?.phone) {
    drawText(currentPage, `Tel: ${bolData.shipper.phone}`, 35, shipperY, { 
      size: 7,
      color: accentBlue,
      maxWidth: sectionWidth - 10,
      maxLines: 1
    });
  }
  
  // Consignee section with matching styling
  const consigneeX = 35 + sectionWidth + sectionSpacing;
  drawBox(currentPage, consigneeX, yPosition - sectionHeight, sectionWidth, sectionHeight, { 
    fillColor: white,
    borderColor: primaryBlue,
    borderWidth: 1,
    shadow: true
  });
  
  drawBox(currentPage, consigneeX, yPosition - 18, sectionWidth, 18, { 
    fillColor: primaryBlue,
    borderWidth: 0
  });
  
  currentPage.drawText('CONSIGNEE (IMPORTER)', {
    x: consigneeX + 5,
    y: yPosition - 13,
    size: 9,
    font: helveticaBold,
    color: white
  });
  
  let consigneeY = yPosition - 28;
  consigneeY = drawText(currentPage, bolData.consignee?.name || '', consigneeX + 5, consigneeY, { 
    size: 8, 
    font: helveticaBold,
    color: black,
    maxWidth: sectionWidth - 10,
    maxLines: 2
  });
  consigneeY = drawText(currentPage, bolData.consignee?.address || '', consigneeX + 5, consigneeY, { 
    size: 7,
    color: darkGray,
    maxWidth: sectionWidth - 10,
    maxLines: 2
  });
  consigneeY = drawText(currentPage, `${bolData.consignee?.city || ''}, ${bolData.consignee?.country || ''}`, consigneeX + 5, consigneeY, { 
    size: 7,
    color: darkGray,
    maxWidth: sectionWidth - 10,
    maxLines: 1
  });
  if (bolData.consignee?.phone) {
    drawText(currentPage, `Tel: ${bolData.consignee.phone}`, consigneeX + 5, consigneeY, { 
      size: 7,
      color: accentBlue,
      maxWidth: sectionWidth - 10,
      maxLines: 1
    });
  }
  
  // Notify Party section with consistent styling
  const notifyX = 40 + (sectionWidth * 2) + (sectionSpacing * 2);
  drawBox(currentPage, notifyX, yPosition - sectionHeight, sectionWidth, sectionHeight, { 
    fillColor: white,
    borderColor: primaryBlue,
    borderWidth: 1,
    shadow: true
  });
  
  drawBox(currentPage, notifyX, yPosition - 18, sectionWidth, 18, { 
    fillColor: primaryBlue,
    borderWidth: 0
  });
  
  currentPage.drawText('NOTIFY PARTY', {
    x: notifyX + 5,
    y: yPosition - 13,
    size: 9,
    font: helveticaBold,
    color: white
  });
  
  if (bolData.notify_party) {
    let notifyY = yPosition - 28;
    notifyY = drawText(currentPage, bolData.notify_party.name || '', notifyX + 5, notifyY, { 
      size: 8, 
      font: helveticaBold,
      color: black,
      maxWidth: sectionWidth - 10,
      maxLines: 2
    });
    drawText(currentPage, bolData.notify_party.address || '', notifyX + 5, notifyY, { 
      size: 7,
      color: darkGray,
      maxWidth: sectionWidth - 10,
      maxLines: 2
    });
  } else {
    drawText(currentPage, 'SAME AS CONSIGNEE', notifyX + 5, yPosition - 40, { 
      size: 8, 
      font: helvetica,
      color: borderGray,
      maxWidth: sectionWidth - 10,
      align: 'center'
    });
  }
  
  yPosition -= 85;
  
  // === ENHANCED VESSEL AND VOYAGE SECTION ===
  const vesselSectionWidth = (width - 50) / 2;
  
  // Vessel with modern styling
  drawBox(currentPage, 30, yPosition - 35, vesselSectionWidth, 35, {
    fillColor: white,
    borderColor: accentBlue,
    borderWidth: 1
  });
  drawBox(currentPage, 30, yPosition - 15, vesselSectionWidth, 15, { 
    fillColor: accentBlue,
    borderWidth: 0
  });
  
  currentPage.drawText('VESSEL NAME', {
    x: 35,
    y: yPosition - 11,
    size: 8,
    font: helveticaBold,
    color: white
  });
  drawText(currentPage, bolData.vessel_details?.vessel_name || 'TBN (To Be Named)', 35, yPosition - 25, {
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: vesselSectionWidth - 10
  });
  
  // Voyage with matching styling
  const voyageX = 35 + vesselSectionWidth + 5;
  drawBox(currentPage, voyageX, yPosition - 35, vesselSectionWidth, 35, {
    fillColor: white,
    borderColor: accentBlue,
    borderWidth: 1
  });
  drawBox(currentPage, voyageX, yPosition - 15, vesselSectionWidth, 15, { 
    fillColor: accentBlue,
    borderWidth: 0
  });
  
  currentPage.drawText('VOYAGE NUMBER', {
    x: voyageX + 5,
    y: yPosition - 11,
    size: 8,
    font: helveticaBold,
    color: white
  });
  drawText(currentPage, bolData.vessel_details?.voyage_number || 'TBN', voyageX + 5, yPosition - 25, {
    size: 9,
    font: helvetica,
    color: black,
    maxWidth: vesselSectionWidth - 10
  });
  
  yPosition -= 45;
  
  // === ENHANCED PORTS SECTION ===
  const portSectionWidth = (width - 70) / 3;
  
  // Port of Loading
  drawBox(currentPage, 30, yPosition - 35, portSectionWidth, 35, {
    fillColor: white,
    borderColor: accentBlue,
    borderWidth: 1
  });
  drawBox(currentPage, 30, yPosition - 15, portSectionWidth, 15, { 
    fillColor: accentBlue,
    borderWidth: 0
  });
  
  currentPage.drawText('PORT OF LOADING', {
    x: 35,
    y: yPosition - 11,
    size: 8,
    font: helveticaBold,
    color: white
  });
  drawText(currentPage, bolData.ports?.loading || '', 35, yPosition - 25, { 
    size: 8,
    color: black,
    maxWidth: portSectionWidth - 10
  });
  
  // Port of Discharge
  const dischargeX = 35 + portSectionWidth + 5;
  drawBox(currentPage, dischargeX, yPosition - 35, portSectionWidth, 35, {
    fillColor: white,
    borderColor: accentBlue,
    borderWidth: 1
  });
  drawBox(currentPage, dischargeX, yPosition - 15, portSectionWidth, 15, { 
    fillColor: accentBlue,
    borderWidth: 0
  });
  
  currentPage.drawText('PORT OF DISCHARGE', {
    x: dischargeX + 5,
    y: yPosition - 11,
    size: 8,
    font: helveticaBold,
    color: white
  });
  drawText(currentPage, bolData.ports?.discharge || '', dischargeX + 5, yPosition - 25, { 
    size: 8,
    color: black,
    maxWidth: portSectionWidth - 10
  });
  
  // Final Destination
  const destinationX = 40 + (portSectionWidth * 2) + 10;
  drawBox(currentPage, destinationX, yPosition - 35, portSectionWidth, 35, {
    fillColor: white,
    borderColor: accentBlue,
    borderWidth: 1
  });
  drawBox(currentPage, destinationX, yPosition - 15, portSectionWidth, 15, { 
    fillColor: accentBlue,
    borderWidth: 0
  });
  
  currentPage.drawText('FINAL DESTINATION', {
    x: destinationX + 5,
    y: yPosition - 11,
    size: 8,
    font: helveticaBold,
    color: white
  });
  drawText(currentPage, bolData.ports?.delivery || bolData.ports?.discharge || '', destinationX + 5, yPosition - 25, { 
    size: 8,
    color: black,
    maxWidth: portSectionWidth - 10
  });
  
  yPosition -= 50;
  
  // === MULTI-PAGE CARGO DETAILS TABLE ===
  const colWidths = [70, 55, 180, 75, 60, 60];
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
      
      // Marks & Numbers
      drawText(currentPage, `CTNS ${cargoIndex + index + 1}-${item.quantity}`, colX + 3, currentRowY - 8, {
        size: 7,
        font: helvetica,
        color: darkGray,
        maxWidth: colWidths[0] - 6
      });
      colX += colWidths[0];
      
      // Number of packages
      drawText(currentPage, `${item.quantity} ${item.unit}`, colX + 3, currentRowY - 8, {
        size: 7,
        font: helvetica,
        color: black,
        maxWidth: colWidths[1] - 6,
        align: 'center'
      });
      colX += colWidths[1];
      
      // Description with better wrapping
      drawText(currentPage, item.description || '', colX + 3, currentRowY - 8, { 
        size: 7,
        font: helvetica,
        color: black,
        maxWidth: colWidths[2] - 6,
        lineHeight: 9,
        maxLines: 2
      });
      colX += colWidths[2];
      
      // Weight
      drawText(currentPage, item.weight || '', colX + 3, currentRowY - 8, {
        size: 7,
        font: helvetica,
        color: black,
        maxWidth: colWidths[3] - 6,
        align: 'center'
      });
      colX += colWidths[3];
      
      // Measurement
      drawText(currentPage, item.volume || '', colX + 3, currentRowY - 8, {
        size: 7,
        font: helvetica,
        color: black,
        maxWidth: colWidths[4] - 6,
        align: 'center'
      });
      colX += colWidths[4];
      
      // HS Code
      drawText(currentPage, item.hs_code || '', colX + 3, currentRowY - 8, {
        size: 7,
        font: helvetica,
        color: accentBlue,
        maxWidth: colWidths[5] - 6,
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
    fillColor: mediumGray,
    borderColor: primaryBlue,
    borderWidth: 1
  });
  
  currentPage.drawText('TOTALS:', {
    x: 35,
    y: yPosition - 18,
    size: 10,
    font: helveticaBold,
    color: primaryBlue
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
    borderColor: primaryBlue,
    borderWidth: 1
  });
  drawBox(currentPage, 30, yPosition - 15, footerSectionWidth, 15, { 
    fillColor: primaryBlue,
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
      color: darkGray,
      maxWidth: footerSectionWidth - 10
    });
  }
  
  // Invoice Details with matching styling
  const invoiceX = 35 + footerSectionWidth + 5;
  drawBox(currentPage, invoiceX, yPosition - 50, footerSectionWidth, 50, {
    fillColor: white,
    borderColor: primaryBlue,
    borderWidth: 1
  });
  drawBox(currentPage, invoiceX, yPosition - 15, footerSectionWidth, 15, { 
    fillColor: primaryBlue,
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
    color: darkGray,
    maxWidth: footerSectionWidth - 10
  });
  drawText(currentPage, `Value: ${bolData.invoice_details?.currency || ''} ${bolData.invoice_details?.value || 'N/A'}`, invoiceX + 5, yPosition - 45, {
    size: 8,
    font: helvetica,
    color: darkGray,
    maxWidth: footerSectionWidth - 10
  });
  
  yPosition -= 60;
  
  // === LEGAL NOTICE ===
  if (yPosition > 40) {
    drawText(currentPage, 'This Bill of Lading is evidence of a contract of carriage and receipt of goods in apparent good order and condition unless otherwise noted.', 30, yPosition - 10, {
      size: 7,
      font: helvetica,
      color: borderGray,
      maxWidth: width - 60,
      align: 'center'
    });
  }
  
  // Save and return the PDF
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}