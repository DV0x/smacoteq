import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { BOLData } from '@/types';

// Import pdfmake statically but initialize vfs properly
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize fonts properly for pdfmake
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(pdfMake as any).vfs = pdfFonts;

export async function generateBOLPDF(
  bolData: BOLData, 
  customBolNumber?: string | null, 
  customBookingNumber?: string | null
): Promise<Uint8Array> {
  
  // Generate BOL number
  const bolNumber = customBolNumber && customBolNumber.trim() 
    ? customBolNumber.trim() 
    : `BOL-${Date.now().toString().slice(-8)}`;
  
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Function to create document definition with given rider pages count
  const createDocDefinition = (riderPages: number): TDocumentDefinitions => ({
    pageSize: 'A4',
    pageMargins: [20, 75, 20, 40],
    
    // Header function for different pages
    header: function(currentPage: number) {
      if (currentPage === 1) {
        // Main header for first page
        return {
          margin: [20, 20, 20, 0],
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  border: [true, true, true, true],
                  margin: [6, 8, 6, 8],
                  alignment: 'center',
                  stack: [
                    { text: 'SHIPPING COMPANY', bold: true, fontSize: 14, margin: [0, 0, 0, 5] },
                    { text: 'LOGO', fontSize: 12, color: '#666666' }
                  ]
                },
                {
                  border: [true, true, true, true],
                  margin: [6, 8, 6, 8],
                  alignment: 'center',
                  stack: [
                    { text: 'BILL OF LADING No.', bold: true, fontSize: 14, margin: [0, 0, 0, 3] },
                    { text: bolNumber, bold: true, fontSize: 16, margin: [0, 0, 0, 8] },
                    { text: 'DRAFT', fontSize: 12, color: '#666666', margin: [0, 0, 0, 3] },
                    { text: '"Port-To-Port" or', fontSize: 10, margin: [0, 0, 0, 1] },
                    { text: '"Combined Transport"', fontSize: 10, margin: [0, 0, 0, 0] }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1.5,
            vLineWidth: () => 1.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        };
      } else {
        // Continuation page header (Rider page)
        return {
          margin: [20, 20, 20, 0],
          table: {
            widths: ['*', '*'],
            body: [
              [
                {
                  border: [true, true, true, true],
                  margin: [6, 8, 6, 8],
                  alignment: 'center',
                  stack: [
                    { text: 'SHIPPING COMPANY', bold: true, fontSize: 14, margin: [0, 0, 0, 5] },
                    { text: 'LOGO', fontSize: 12, color: '#666666' }
                  ]
                },
                {
                  border: [true, true, true, true],
                  margin: [6, 8, 6, 8],
                  alignment: 'center',
                  stack: [
                    { text: 'BILL OF LADING No.', bold: true, fontSize: 14, margin: [0, 0, 0, 3] },
                    { text: bolNumber, bold: true, fontSize: 16, margin: [0, 0, 0, 5] },
                    { text: 'RIDER PAGE', bold: true, fontSize: 12, margin: [0, 0, 0, 3] },
                    { text: `Page ${currentPage}`, fontSize: 11, margin: [0, 0, 0, 0] }
                  ]
                }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 1.5,
            vLineWidth: () => 1.5,
            hLineColor: () => '#000000',
            vLineColor: () => '#000000'
          }
        };
      }
    },

    content: [
      // Document tracking section
      {
        table: {
          widths: ['*', 120],
          body: [
            [
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'NO.& SEQUENCE OF ORIGINAL B/L\'s', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.bl_sequence || '3 (Three) Original Bills of Lading', fontSize: 9 }
                ]
              },
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'NO. OF RIDER PAGES', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: `${riderPages}`, fontSize: 9 }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 8]
      },
      
      // Main party information section (two columns)
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              // Left column - Party information
              {
                border: [true, true, true, true],
                margin: [0, 0, 0, 0],
                stack: [
                  // Shipper section
                  {
                    margin: [10, 10, 10, 8],
                    stack: [
                      { text: 'SHIPPER:', bold: true, fontSize: 11, margin: [0, 0, 0, 8] },
                      { text: bolData.shipper?.name || '', fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: bolData.shipper?.address || '', fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: `${bolData.shipper?.city || ''}, ${bolData.shipper?.country || ''}`, fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: bolData.shipper?.phone || '', fontSize: 10, margin: [0, 0, 0, 0] }
                    ]
                  },
                  
                  // Horizontal separator
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 240, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 0] },
                  
                  // Consignee section
                  {
                    margin: [10, 8, 10, 8],
                    stack: [
                      { text: 'CONSIGNEE:', bold: true, fontSize: 11, margin: [0, 0, 0, 5] },
                      { text: 'This B/L is not negotiable unless marked "To Order" or "To Order of ..." here.', fontSize: 9, italics: true, margin: [0, 0, 0, 8] },
                      { text: bolData.consignee?.name || '', fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: bolData.consignee?.address || '', fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: `${bolData.consignee?.city || ''}, ${bolData.consignee?.country || ''}`, fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: bolData.consignee?.phone || '', fontSize: 10, margin: [0, 0, 0, 0] }
                    ]
                  },
                  
                  // Horizontal separator
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 240, y2: 0, lineWidth: 1 }], margin: [0, 0, 0, 0] },
                  
                  // Notify Party section
                  {
                    margin: [10, 8, 10, 10],
                    stack: [
                      { text: 'NOTIFY PARTIES:', bold: true, fontSize: 11, margin: [0, 0, 0, 5] },
                      { text: '(No responsibility shall attach to Carrier or to his Agent for failure to notify)', fontSize: 9, italics: true, margin: [0, 0, 0, 8] },
                      { text: bolData.notify_party?.name || '', fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: bolData.notify_party?.address || '', fontSize: 10, margin: [0, 0, 0, 0] }
                    ]
                  }
                ]
              },
              
              // Right column - Carrier's agents endorsements and important notices
              {
                border: [true, true, true, true],
                margin: [0, 0, 0, 0],
                stack: [
                  {
                    margin: [8, 8, 8, 8],
                    stack: [
                      { text: 'CARRIER\'S AGENTS ENDORSEMENTS:', bold: true, fontSize: 11, margin: [0, 0, 0, 8] },
                      { text: 'IMO Number:', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: bolData.imo_number || '', fontSize: 10, margin: [0, 0, 0, 15] },
                      
                      { text: '"Carrier\'s liability ceases after discharge of goods into Customs custody and Carrier shall not be responsible for delivery of cargo without the presentation of the Original Bill of Lading, as per Customs Regulations".', fontSize: 9, margin: [0, 0, 0, 12] },
                      
                      { text: 'CARRIER WILL NOT BE LIABLE FOR ANY MISDECLARATION OF H.S.CODE/NCM AND ALL COSTS AND CONSEQUENCES ARISING OUT OF THE MISDECLARATION WILL BE ON ACCOUNT OF SHIPPERS.', bold: true, fontSize: 9, margin: [0, 0, 0, 12] },
                      
                      { text: 'PORT OF DISCHARGE AGENT:', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                      { text: bolData.discharge_agent || '', fontSize: 10, margin: [0, 0, 0, 0] }
                    ]
                  }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 8]
      },
      
      // Transportation details section
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'VESSEL AND VOYAGE NO', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: `${bolData.vessel_details?.vessel_name || 'TBN'} / ${bolData.vessel_details?.voyage_number || 'TBN'}`, fontSize: 9, margin: [0, 0, 0, 10] },
                  { text: 'BOOKING REF.', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.booking_ref || customBookingNumber || '', fontSize: 9 }
                ]
              },
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'PORT OF LOADING', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.ports?.loading || '', fontSize: 9, margin: [0, 0, 0, 10] },
                  { text: 'SHIPPER\'S REF.', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.shipper_ref || '', fontSize: 9 }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 10]
      },
      
      // Second row of transportation details
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'PLACE OF RECEIPT:', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.place_of_receipt || '', fontSize: 9, margin: [0, 0, 0, 10] },
                  { text: 'PORT OF DISCHARGE', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.ports?.discharge || '', fontSize: 9 }
                ]
              },
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'PLACE OF DELIVERY:', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.place_of_delivery || bolData.ports?.delivery || '', fontSize: 9 }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 8]
      },
      
      // Professional separator for cargo section
      {
        table: {
          widths: ['*'],
          body: [
            [{
              border: [true, true, true, true],
              fillColor: '#f0f0f0',
              margin: [5, 8, 5, 8],
              alignment: 'center',
              text: 'PARTICULARS FURNISHED BY THE SHIPPER - NOT CHECKED BY CARRIER - CARRIER NOT RESPONSIBLE',
              bold: true,
              fontSize: 10
            }]
          ]
        },
        layout: {
          hLineWidth: () => 2,
          vLineWidth: () => 2,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 5]
      },
      
      // Cargo Table with automatic page breaks
      {
        table: {
          headerRows: 1, // This ensures the header repeats on new pages
          widths: [120, 200, 90, 90],
          body: [
            // Header row
            [
              { text: 'Container Numbers, Seal Numbers and Marks', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [3, 5, 3, 5] },
              { text: 'Description of Packages and Goods', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [3, 5, 3, 5] },
              { text: 'Gross Cargo', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [3, 5, 3, 5] },
              { text: 'Measurement', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [3, 5, 3, 5] }
            ],
            // Continuation note row
            [
              { text: '', fontSize: 8, margin: [3, 3, 3, 3] },
              { text: '(Continued on attached Bill of Lading Rider pages(s), if applicable)', fontSize: 8, italics: true, margin: [3, 3, 3, 3] },
              { text: '', fontSize: 8, margin: [3, 3, 3, 3] },
              { text: '', fontSize: 8, margin: [3, 3, 3, 3] }
            ],
            // Data rows
            ...(bolData.cargo || []).map((item, index) => [
              {
                text: [
                  item.container_numbers || '',
                  item.seal_numbers ? '\nSeal: ' + item.seal_numbers : '',
                  item.marks ? '\nMarks: ' + item.marks : ''
                ].filter(Boolean).join(''),
                fontSize: 8,
                margin: [3, 4, 3, 4],
                fillColor: index % 2 === 1 ? '#f8f8f8' : undefined
              },
              {
                text: item.description || '',
                fontSize: 8,
                margin: [3, 4, 3, 4],
                fillColor: index % 2 === 1 ? '#f8f8f8' : undefined
              },
              {
                text: item.gross_weight || '',
                fontSize: 9,
                alignment: 'center',
                margin: [5, 5, 5, 5],
                fillColor: index % 2 === 1 ? '#f8f8f8' : undefined
              },
              {
                text: item.measurement || '',
                fontSize: 9,
                alignment: 'center',
                margin: [5, 5, 5, 5],
                fillColor: index % 2 === 1 ? '#f8f8f8' : undefined
              }
            ])
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 10]
      },
      
      // Totals section
      {
        table: {
          widths: [120, 200, 90, 90],
          body: [
            [
              { text: '', fontSize: 9, margin: [5, 5, 5, 5] },
              { text: '', fontSize: 9, margin: [5, 5, 5, 5] },
              { text: 'Total:', bold: true, fontSize: 10, alignment: 'center', fillColor: '#f0f0f0', margin: [5, 5, 5, 5] },
              { text: 'Total:', bold: true, fontSize: 10, alignment: 'center', fillColor: '#f0f0f0', margin: [5, 5, 5, 5] }
            ],
            [
              { text: '', fontSize: 9, margin: [5, 5, 5, 5] },
              { text: `${bolData.totals?.packages || 0} PACKAGES`, bold: true, fontSize: 10, margin: [5, 5, 5, 5] },
              { text: `${bolData.totals?.gross_weight || 'N/A'}`, bold: true, fontSize: 10, alignment: 'center', margin: [5, 5, 5, 5] },
              { text: bolData.totals?.measurement || '', bold: true, fontSize: 10, alignment: 'center', margin: [5, 5, 5, 5] }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 8]
      },
      
      // Freight & Charges and Receipt Section
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              // Left column - Freight & Charges
              {
                border: [true, true, true, true],
                margin: [0, 0, 0, 0],
                stack: [
                  {
                    margin: [8, 8, 8, 8],
                    stack: [
                      { text: 'FREIGHT & CHARGES', bold: true, fontSize: 11, margin: [0, 0, 0, 8] },
                      { text: 'AS PER AGREEMENT', bold: true, fontSize: 10, margin: [0, 0, 0, 8] },
                      { text: 'Cargo shall not be delivered unless Freight & Charges are paid', fontSize: 9, margin: [0, 0, 0, 15] },
                      { text: bolData.freight_charges || bolData.freight_terms || '', fontSize: 9, margin: [0, 0, 0, 0] }
                    ]
                  }
                ]
              },
              
              // Right column - Legal text
              {
                border: [true, true, true, true],
                margin: [0, 0, 0, 0],
                stack: [
                  {
                    margin: [8, 8, 8, 8],
                    stack: [
                      { text: 'RECEIVED', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                      { text: 'by the Carrier in apparent good order and condition (unless otherwise stated herein) the total number or quantity of Containers or other packages or units indicated in the box entitled Carrier\'s Receipt for carriage subject to all the terms and conditions hereof from the Place of Receipt or Port of Loading to the Port of Discharge or Place of Delivery, whichever is applicable.', fontSize: 8, margin: [0, 0, 0, 8] },
                      
                      { text: 'IN ACCEPTING THIS BILL OF LADING THE MERCHANT EXPRESSLY ACCEPTS AND AGREES TO ALL THE TERMS AND CONDITIONS, WHETHER PRINTED, STAMPED OR OTHERWISE INCORPORATED ON THIS SIDE AND ON THE REVERSE SIDE OF THIS BILL OF LADING AND THE TERMS AND CONDITIONS OF THE CARRIER\'S APPLICABLE TARIFF AS IF THEY WERE ALL SIGNED BY THE MERCHANT.', bold: true, fontSize: 8, margin: [0, 0, 0, 8] }
                    ]
                  }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 8]
      },
      
      // Continuation of legal text
      {
        stack: [
          {
            text: 'If this is a negotiable (To Order / of) Bill of Lading, one original Bill of Lading, duly endorsed must be surrendered by the Merchant to the Carrier (together with outstanding Freight and charges) in exchange for the Goods or a Delivery Order. If this is a non-negotiable (straight) Bill of Lading, the Carrier shall deliver the Goods or issue a Delivery Order (after payment of outstanding Freight and charges) against the surrender of one original Bill of Lading or in accordance with the national law at the Port of Discharge or Place of Delivery whichever is applicable.',
            fontSize: 8,
            margin: [0, 0, 0, 10]
          },
          {
            text: 'IN WITNESS WHEREOF the Carrier or their Agent has signed the number of Bills of Lading stated at the top, all of this tenor and date, and wherever one original Bill of Lading has been surrendered all other Bills of Lading shall be void.',
            fontSize: 8,
            margin: [0, 0, 0, 8]
          }
        ]
      },
      
      // Final signature section with three columns
      {
        table: {
          widths: ['*', '*', '*'],
          body: [
            [
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'DECLARED VALUE', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.declared_value || '', fontSize: 9 }
                ]
              },
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'CARRIER\'S RECEIPT', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.carrier_receipt || '', fontSize: 9 }
                ]
              },
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'SIGNED', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: 'on behalf of the Carrier', fontSize: 9, margin: [0, 0, 0, 5] },
                  { text: bolData.signed_by || '', fontSize: 9 }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 10]
      },
      
      // Date and Place Section
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'PLACE AND DATE OF ISSUE', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.place_and_date_of_issue || currentDate, fontSize: 9 }
                ]
              },
              {
                border: [true, true, true, true],
                margin: [8, 8, 8, 8],
                stack: [
                  { text: 'SHIPPED ON BOARD DATE', bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
                  { text: bolData.shipped_on_board_date || currentDate, fontSize: 9 }
                ]
              }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 8]
      },
      
      // Final separator and terms notice
      {
        table: {
          widths: ['*'],
          body: [
            [{
              border: [true, true, true, true],
              fillColor: '#f0f0f0',
              margin: [5, 8, 5, 8],
              alignment: 'center',
              text: 'TERMS CONTINUED ON REVERSE',
              bold: true,
              fontSize: 10
            }]
          ]
        },
        layout: {
          hLineWidth: () => 2,
          vLineWidth: () => 2,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 0]
      }
    ],

    styles: {
      tableHeader: {
        bold: true,
        fontSize: 10,
        fillColor: '#f0f0f0',
        alignment: 'center'
      }
    }
  });

  // First, generate PDF with 0 rider pages to get actual page count
  const initialDocDefinition = createDocDefinition(0);
  
  return new Promise<Uint8Array>((resolve, reject) => {
    try {
      const initialPdfDocGenerator = pdfMake.createPdf(initialDocDefinition);
      
      // Get page count from the initial PDF
      initialPdfDocGenerator.getBuffer((buffer: Buffer) => {
        // Create a temporary PDF to count pages
        const tempPdf = new Uint8Array(buffer);
        
        // Count pages by looking for PDF page markers
        const pdfString = Buffer.from(tempPdf).toString('binary');
        const pageCount = (pdfString.match(/\/Type\s*\/Page[^s]/gi) || []).length;
        
        console.log('PDF generated with', pageCount, 'pages');
        
        // Calculate actual rider pages (total pages - 1 main page)
        const actualRiderPages = Math.max(0, pageCount - 1);
        
        // Generate final PDF with correct rider page count
        const finalDocDefinition = createDocDefinition(actualRiderPages);
        const finalPdfDocGenerator = pdfMake.createPdf(finalDocDefinition);
        
        finalPdfDocGenerator.getBuffer((finalBuffer: Buffer) => {
          resolve(new Uint8Array(finalBuffer));
        });
      });
    } catch (error) {
      reject(new Error(`Failed to generate PDF: ${error}`));
    }
  });
}