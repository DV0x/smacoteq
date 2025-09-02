import { BOLData } from '@/types';

export function generateBOLHTML(
  bolData: BOLData,
  customBolNumber?: string | null,
  customBookingNumber?: string | null
): string {
  const bolNumber = customBolNumber && customBolNumber.trim() 
    ? customBolNumber.trim() 
    : `BOL-${Date.now().toString().slice(-8)}`;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const content = `
    ${generateHeader(bolNumber)}
    ${generateDocumentTracking(bolData)}
    ${generatePartiesSection(bolData)}
    ${generateTransportDetails(bolData, customBookingNumber)}
    ${generateCargoDisclaimer()}
    ${generateCargoTable(bolData)}
    ${generateTotalsSection(bolData)}
    ${generateCommercialSection(bolData)}
    ${generateFooterLegal()}
    ${generateSignatureSection(bolData)}
    ${generateDateSection(bolData, currentDate)}
    ${generateFinalNotice()}
  `;

  const finalHtml = getHTMLTemplate().replace('{{CONTENT}}', content);
  
  // Debug: Log if content is empty (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('Content length:', content.length);
    console.log('BOL Data shipper name:', bolData.shipper?.name || 'MISSING');
  }

  return finalHtml;
}

function getHTMLTemplate(): string {
  // This would normally read from the HTML file, but for now we'll inline it
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bill of Lading</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif;
      color: #2c3e50;
      line-height: 1.4;
      font-size: 10px;
      margin: 0;
      padding: 0;
    }
    
    .bol-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 10mm;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border: 2px solid #000;
      margin-bottom: 8px;
    }
    
    .company-section {
      flex: 1;
      text-align: center;
      padding: 15px;
      border-right: 1px solid #000;
    }
    
    .company-name {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    
    .company-logo {
      font-size: 12px;
      color: #666;
    }
    
    .bol-info-section {
      flex: 1;
      text-align: center;
      padding: 15px;
    }
    
    .bol-title {
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 3px;
    }
    
    .bol-number {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 8px;
    }
    
    .bol-status {
      font-size: 12px;
      color: #666;
      margin-bottom: 3px;
    }
    
    .transport-type {
      font-size: 10px;
      margin-bottom: 1px;
    }
    
    .tracking-section {
      display: flex;
      margin-bottom: 8px;
    }
    
    .tracking-box {
      flex: 1;
      border: 1px solid #000;
      padding: 8px;
    }
    
    .tracking-box:first-child {
      margin-right: 0;
      border-right: none;
    }
    
    .tracking-box:last-child {
      width: 120px;
      border-left: 1px solid #000;
    }
    
    .tracking-label {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 5px;
    }
    
    .tracking-value {
      font-size: 9px;
    }
    
    .parties-section {
      display: flex;
      margin-bottom: 8px;
    }
    
    .parties-column {
      flex: 1;
      border: 1px solid #000;
    }
    
    .party-box {
      padding: 10px;
      border-bottom: 1px solid #000;
    }
    
    .party-box:last-child {
      border-bottom: none;
    }
    
    .party-label {
      font-weight: bold;
      font-size: 11px;
      margin-bottom: 8px;
    }
    
    .party-sublabel {
      font-size: 9px;
      font-style: italic;
      margin-bottom: 8px;
    }
    
    .party-info {
      font-size: 10px;
      line-height: 1.3;
    }
    
    .party-info p {
      margin-bottom: 3px;
    }
    
    .transport-section {
      display: flex;
      margin-bottom: 8px;
    }
    
    .transport-row {
      display: flex;
      width: 100%;
      margin-bottom: 10px;
    }
    
    .transport-box {
      flex: 1;
      border: 1px solid #000;
      padding: 8px;
    }
    
    .transport-box:first-child {
      border-right: none;
    }
    
    .transport-label {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 5px;
    }
    
    .transport-value {
      font-size: 9px;
      margin-bottom: 10px;
    }
    
    .cargo-disclaimer {
      background: #f0f0f0;
      border: 2px solid #000;
      padding: 8px;
      text-align: center;
      margin-bottom: 5px;
    }
    
    .cargo-disclaimer-text {
      font-weight: bold;
      font-size: 10px;
    }
    
    .cargo-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10px;
    }
    
    .cargo-table th {
      background: #f0f0f0;
      border: 1px solid #000;
      padding: 5px 3px;
      text-align: center;
      font-weight: bold;
      font-size: 9px;
    }
    
    .cargo-table td {
      border: 1px solid #000;
      padding: 4px 3px;
      font-size: 8px;
      vertical-align: top;
    }
    
    .cargo-table .continuation-row {
      font-style: italic;
      font-size: 8px;
    }
    
    .cargo-table tr:nth-child(even) .cargo-cell {
      background: #f8f8f8;
    }
    
    .weight-cell, .measurement-cell {
      text-align: center;
      font-size: 9px;
    }
    
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 8px;
    }
    
    .totals-table th {
      background: #f0f0f0;
      border: 1px solid #000;
      padding: 5px;
      text-align: center;
      font-weight: bold;
      font-size: 10px;
    }
    
    .totals-table td {
      border: 1px solid #000;
      padding: 5px;
      font-weight: bold;
      font-size: 10px;
    }
    
    .totals-packages {
      text-align: left;
    }
    
    .totals-weight, .totals-measurement {
      text-align: center;
    }
    
    .commercial-section {
      display: flex;
      margin-bottom: 8px;
    }
    
    .commercial-box {
      flex: 1;
      border: 1px solid #000;
      padding: 8px;
    }
    
    .commercial-box:first-child {
      border-right: none;
    }
    
    .commercial-label {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 5px;
    }
    
    .commercial-value {
      font-size: 9px;
      margin-bottom: 8px;
    }
    
    .commercial-sublabel {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 5px;
    }
    
    .commercial-note {
      font-size: 8px;
      margin-bottom: 15px;
    }
    
    .legal-text {
      font-size: 8px;
      margin-bottom: 8px;
    }
    
    .legal-text.bold {
      font-weight: bold;
    }
    
    .footer-legal {
      font-size: 8px;
      margin-bottom: 10px;
      line-height: 1.4;
    }
    
    .signature-section {
      display: flex;
      margin-bottom: 8px;
    }
    
    .signature-box {
      flex: 1;
      border: 1px solid #000;
      padding: 8px;
    }
    
    .signature-box:not(:last-child) {
      border-right: none;
    }
    
    .signature-label {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 5px;
    }
    
    .signature-value {
      font-size: 9px;
    }
    
    .date-section {
      display: flex;
      margin-bottom: 8px;
    }
    
    .date-box {
      flex: 1;
      border: 1px solid #000;
      padding: 8px;
    }
    
    .date-box:first-child {
      border-right: none;
    }
    
    .date-label {
      font-weight: bold;
      font-size: 10px;
      margin-bottom: 5px;
    }
    
    .date-value {
      font-size: 9px;
    }
    
    .final-notice {
      background: #f0f0f0;
      border: 2px solid #000;
      padding: 8px;
      text-align: center;
    }
    
    .final-notice-text {
      font-weight: bold;
      font-size: 10px;
    }
    
    @media print {
      .bol-container {
        padding: 0;
        margin: 0;
        max-width: none;
      }
      
      .page-break {
        page-break-after: always;
      }
      
      .no-break {
        page-break-inside: avoid;
      }
      
      .cargo-table {
        page-break-inside: auto;
      }
      
      .cargo-table thead {
        display: table-header-group;
      }
      
      .cargo-table tbody {
        display: table-row-group;
      }
      
      .cargo-table th {
        page-break-after: auto;
        page-break-inside: avoid;
      }
      
      .cargo-table tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
    
    @page {
      size: A4;
      margin: 15mm 10mm;
    }
    
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-bold { font-weight: bold; }
    .text-italic { font-style: italic; }
    .mb-1 { margin-bottom: 3px; }
    .mb-2 { margin-bottom: 5px; }
    .mb-3 { margin-bottom: 8px; }
  </style>
</head>
<body>
  <div class="bol-container">
    {{CONTENT}}
  </div>
</body>
</html>`;
}

function generateHeader(bolNumber: string): string {
  return `
    <header class="header">
      <div class="company-section">
        <div class="company-name">SHIPPING COMPANY</div>
        <div class="company-logo">LOGO</div>
      </div>
      <div class="bol-info-section">
        <div class="bol-title">BILL OF LADING No.</div>
        <div class="bol-number">${bolNumber}</div>
        <div class="bol-status">DRAFT</div>
        <div class="transport-type">"Port-To-Port" or</div>
        <div class="transport-type">"Combined Transport"</div>
      </div>
    </header>
  `;
}

function generateDocumentTracking(bolData: BOLData): string {
  return `
    <div class="tracking-section">
      <div class="tracking-box">
        <div class="tracking-label">NO.& SEQUENCE OF ORIGINAL B/L's</div>
        <div class="tracking-value">${bolData.bl_sequence || '3 (Three) Original Bills of Lading'}</div>
      </div>
      <div class="tracking-box">
        <div class="tracking-label">NO. OF RIDER PAGES</div>
        <div class="tracking-value">${bolData.rider_pages || '0'}</div>
      </div>
    </div>
  `;
}

function generatePartiesSection(bolData: BOLData): string {
  return `
    <div class="parties-section">
      <div class="parties-column">
        <div class="party-box">
          <div class="party-label">SHIPPER:</div>
          <div class="party-info">
            <p>${bolData.shipper?.name || ''}</p>
            <p>${bolData.shipper?.address || ''}</p>
            <p>${bolData.shipper?.city || ''}, ${bolData.shipper?.country || ''}</p>
            ${bolData.shipper?.phone ? `<p>${bolData.shipper.phone}</p>` : ''}
          </div>
        </div>
        
        <div class="party-box">
          <div class="party-label">CONSIGNEE:</div>
          <div class="party-sublabel">This B/L is not negotiable unless marked "To Order" or "To Order of ..." here.</div>
          <div class="party-info">
            <p>${bolData.consignee?.name || ''}</p>
            <p>${bolData.consignee?.address || ''}</p>
            <p>${bolData.consignee?.city || ''}, ${bolData.consignee?.country || ''}</p>
            ${bolData.consignee?.phone ? `<p>${bolData.consignee.phone}</p>` : ''}
          </div>
        </div>
        
        <div class="party-box">
          <div class="party-label">NOTIFY PARTIES:</div>
          <div class="party-sublabel">(No responsibility shall attach to Carrier or to his Agent for failure to notify)</div>
          <div class="party-info">
            <p>${bolData.notify_party?.name || ''}</p>
            <p>${bolData.notify_party?.address || ''}</p>
          </div>
        </div>
      </div>
      
      <div class="parties-column">
        <div class="party-box" style="height: 100%;">
          <div class="party-label">CARRIER'S AGENTS ENDORSEMENTS:</div>
          <div class="party-info">
            <p class="font-bold mb-2">IMO Number:</p>
            <p class="mb-3">${bolData.imo_number || ''}</p>
            
            <p class="mb-3">"Carrier's liability ceases after discharge of goods into Customs custody and Carrier shall not be responsible for delivery of cargo without the presentation of the Original Bill of Lading, as per Customs Regulations".</p>
            
            <p class="font-bold mb-3">CARRIER WILL NOT BE LIABLE FOR ANY MISDECLARATION OF H.S.CODE/NCM AND ALL COSTS AND CONSEQUENCES ARISING OUT OF THE MISDECLARATION WILL BE ON ACCOUNT OF SHIPPERS.</p>
            
            <p class="font-bold mb-1">PORT OF DISCHARGE AGENT:</p>
            <p>${bolData.discharge_agent || ''}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generateTransportDetails(bolData: BOLData, customBookingNumber?: string | null): string {
  return `
    <div class="transport-section">
      <div class="transport-row">
        <div class="transport-box">
          <div class="transport-label">VESSEL AND VOYAGE NO</div>
          <div class="transport-value">${bolData.vessel_details?.vessel_name || 'TBN'} / ${bolData.vessel_details?.voyage_number || 'TBN'}</div>
          <div class="transport-label">BOOKING REF.</div>
          <div class="transport-value">${bolData.booking_ref || customBookingNumber || ''}</div>
        </div>
        <div class="transport-box">
          <div class="transport-label">PORT OF LOADING</div>
          <div class="transport-value">${bolData.ports?.loading || ''}</div>
          <div class="transport-label">SHIPPER'S REF.</div>
          <div class="transport-value">${bolData.shipper_ref || ''}</div>
        </div>
      </div>
      
      <div class="transport-row">
        <div class="transport-box">
          <div class="transport-label">PLACE OF RECEIPT:</div>
          <div class="transport-value">${bolData.place_of_receipt || ''}</div>
          <div class="transport-label">PORT OF DISCHARGE</div>
          <div class="transport-value">${bolData.ports?.discharge || ''}</div>
        </div>
        <div class="transport-box">
          <div class="transport-label">PLACE OF DELIVERY:</div>
          <div class="transport-value">${bolData.place_of_delivery || bolData.ports?.delivery || ''}</div>
        </div>
      </div>
    </div>
  `;
}

function generateCargoDisclaimer(): string {
  return `
    <div class="cargo-disclaimer">
      <div class="cargo-disclaimer-text">
        PARTICULARS FURNISHED BY THE SHIPPER - NOT CHECKED BY CARRIER - CARRIER NOT RESPONSIBLE
      </div>
    </div>
  `;
}

function generateCargoTable(bolData: BOLData): string {
  const cargoRows = (bolData.cargo || []).map((item, index) => {
    const containerInfo = [
      item.container_numbers || '',
      item.seal_numbers ? `Seal: ${item.seal_numbers}` : '',
      item.marks ? `Marks: ${item.marks}` : ''
    ].filter(Boolean).join('<br>');

    const evenRowClass = index % 2 === 1 ? 'cargo-cell' : '';
    
    return `
      <tr>
        <td class="${evenRowClass}">${containerInfo}</td>
        <td class="${evenRowClass}">${item.description || ''}</td>
        <td class="weight-cell ${evenRowClass}">${item.gross_weight || ''}</td>
        <td class="measurement-cell ${evenRowClass}">${item.measurement || ''}</td>
      </tr>
    `;
  }).join('');

  return `
    <table class="cargo-table">
      <thead>
        <tr>
          <th style="width: 120px;">Container Numbers, Seal Numbers and Marks</th>
          <th style="width: 200px;">Description of Packages and Goods</th>
          <th style="width: 90px;">Gross Cargo</th>
          <th style="width: 90px;">Measurement</th>
        </tr>
      </thead>
      <tbody>
        <tr class="continuation-row">
          <td></td>
          <td class="text-italic">(Continued on attached Bill of Lading Rider pages(s), if applicable)</td>
          <td></td>
          <td></td>
        </tr>
        ${cargoRows}
      </tbody>
    </table>
  `;
}

function generateTotalsSection(bolData: BOLData): string {
  return `
    <table class="totals-table">
      <thead>
        <tr>
          <th style="width: 120px;"></th>
          <th style="width: 200px;"></th>
          <th style="width: 90px;">Total:</th>
          <th style="width: 90px;">Total:</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td></td>
          <td class="totals-packages">${bolData.totals?.packages || 0} PACKAGES</td>
          <td class="totals-weight">${bolData.totals?.gross_weight || 'N/A'}</td>
          <td class="totals-measurement">${bolData.totals?.measurement || ''}</td>
        </tr>
      </tbody>
    </table>
  `;
}

function generateCommercialSection(bolData: BOLData): string {
  return `
    <div class="commercial-section">
      <div class="commercial-box">
        <div class="commercial-label">FREIGHT & CHARGES</div>
        <div class="commercial-value font-bold">AS PER AGREEMENT</div>
        <div class="commercial-note">Cargo shall not be delivered unless Freight & Charges are paid</div>
        <div class="commercial-value">${bolData.freight_charges || bolData.freight_terms || ''}</div>
      </div>
      
      <div class="commercial-box">
        <div class="commercial-label">RECEIVED</div>
        <div class="legal-text">
          by the Carrier in apparent good order and condition (unless otherwise stated herein) the total number or quantity of Containers or other packages or units indicated in the box entitled Carrier's Receipt for carriage subject to all the terms and conditions hereof from the Place of Receipt or Port of Loading to the Port of Discharge or Place of Delivery, whichever is applicable.
        </div>
        <div class="legal-text bold">
          IN ACCEPTING THIS BILL OF LADING THE MERCHANT EXPRESSLY ACCEPTS AND AGREES TO ALL THE TERMS AND CONDITIONS, WHETHER PRINTED, STAMPED OR OTHERWISE INCORPORATED ON THIS SIDE AND ON THE REVERSE SIDE OF THIS BILL OF LADING AND THE TERMS AND CONDITIONS OF THE CARRIER'S APPLICABLE TARIFF AS IF THEY WERE ALL SIGNED BY THE MERCHANT.
        </div>
      </div>
    </div>
  `;
}

function generateFooterLegal(): string {
  return `
    <div class="footer-legal">
      <p class="mb-2">
        If this is a negotiable (To Order / of) Bill of Lading, one original Bill of Lading, duly endorsed must be surrendered by the Merchant to the Carrier (together with outstanding Freight and charges) in exchange for the Goods or a Delivery Order. If this is a non-negotiable (straight) Bill of Lading, the Carrier shall deliver the Goods or issue a Delivery Order (after payment of outstanding Freight and charges) against the surrender of one original Bill of Lading or in accordance with the national law at the Port of Discharge or Place of Delivery whichever is applicable.
      </p>
      <p class="mb-2">
        IN WITNESS WHEREOF the Carrier or their Agent has signed the number of Bills of Lading stated at the top, all of this tenor and date, and wherever one original Bill of Lading has been surrendered all other Bills of Lading shall be void.
      </p>
    </div>
  `;
}

function generateSignatureSection(bolData: BOLData): string {
  return `
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-label">DECLARED VALUE</div>
        <div class="signature-value">${bolData.declared_value || ''}</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">CARRIER'S RECEIPT</div>
        <div class="signature-value">${bolData.carrier_receipt || ''}</div>
      </div>
      <div class="signature-box">
        <div class="signature-label">SIGNED</div>
        <div class="signature-value mb-2">on behalf of the Carrier</div>
        <div class="signature-value">${bolData.signed_by || ''}</div>
      </div>
    </div>
  `;
}

function generateDateSection(bolData: BOLData, currentDate: string): string {
  return `
    <div class="date-section">
      <div class="date-box">
        <div class="date-label">PLACE AND DATE OF ISSUE</div>
        <div class="date-value">${bolData.place_and_date_of_issue || currentDate}</div>
      </div>
      <div class="date-box">
        <div class="date-label">SHIPPED ON BOARD DATE</div>
        <div class="date-value">${bolData.shipped_on_board_date || currentDate}</div>
      </div>
    </div>
  `;
}

function generateFinalNotice(): string {
  return `
    <div class="final-notice">
      <div class="final-notice-text">
        TERMS CONTINUED ON REVERSE
      </div>
    </div>
  `;
}