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

  // Create the document definition
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageMargins: [20, 80, 20, 40],
    
    // Header function for different pages
    header: function(currentPage: number) {
      if (currentPage === 1) {
        // Main header for first page
        return {
          margin: [20, 20, 20, 0],
          table: {
            widths: [200, '*'],
            body: [
              [
                {
                  border: [true, true, true, true],
                  margin: [5, 5, 5, 5],
                  alignment: 'center',
                  text: 'Shipping Company Logo',
                  fontSize: 10,
                  color: '#666666'
                },
                {
                  border: [true, true, true, true],
                  margin: [5, 5, 5, 5],
                  alignment: 'right',
                  stack: [
                    { text: 'BILL OF LADING No.', bold: true, fontSize: 12 },
                    { text: 'DRAFT', fontSize: 10, color: '#666666', margin: [0, 2, 0, 0] },
                    { text: bolNumber, bold: true, fontSize: 14, margin: [0, 5, 0, 0] }
                  ]
                }
              ]
            ]
          },
          layout: 'noPadding'
        };
      } else {
        // Continuation page header
        return {
          margin: [20, 20, 20, 0],
          table: {
            widths: [200, '*'],
            body: [
              [
                {
                  border: [true, true, true, true],
                  margin: [5, 5, 5, 5],
                  alignment: 'center',
                  text: 'Shipping Company Logo',
                  fontSize: 10,
                  color: '#666666'
                },
                {
                  border: [true, true, true, true],
                  margin: [5, 5, 5, 5],
                  alignment: 'right',
                  stack: [
                    { text: 'BILL OF LADING No.', bold: true, fontSize: 12 },
                    { text: 'RIDER PAGE', bold: true, fontSize: 10, margin: [0, 2, 0, 0] },
                    { text: `Page ${currentPage}`, fontSize: 9, margin: [0, 2, 0, 0] },
                    { text: bolNumber, bold: true, fontSize: 14, margin: [0, 5, 0, 0] }
                  ]
                }
              ]
            ]
          },
          layout: 'noPadding'
        };
      }
    },

    content: [
      // Main party information section (two columns)
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              // Left column - Party information
              {
                border: [true, true, true, true],
                margin: [0, 0, 5, 0],
                stack: [
                  // Shipper section
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: 'SHIPPER:', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                            { text: bolData.shipper?.name || '', fontSize: 9 },
                            { text: bolData.shipper?.address || '', fontSize: 9 },
                            { text: `${bolData.shipper?.city || ''}, ${bolData.shipper?.country || ''}`, fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding',
                    margin: [0, 0, 0, 5]
                  },
                  
                  // Consignee section
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: 'CONSIGNEE: This B/L is not negotiable unless marked "To Order"', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
                            { text: 'or "To Order of ..." here.', bold: true, fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: bolData.consignee?.name || '', fontSize: 9 },
                            { text: bolData.consignee?.address || '', fontSize: 9 },
                            { text: `${bolData.consignee?.city || ''}, ${bolData.consignee?.country || ''}`, fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding',
                    margin: [0, 0, 0, 5]
                  },
                  
                  // Notify Party section
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: 'NOTIFY PARTIES: (No responsibility shall attach to Carrier', bold: true, fontSize: 8, margin: [0, 0, 0, 2] },
                            { text: 'or to his Agent for failure to notify)', bold: true, fontSize: 8, margin: [0, 0, 0, 5] },
                            { text: bolData.notify_party?.name || '', fontSize: 9 },
                            { text: bolData.notify_party?.address || '', fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding'
                  }
                ]
              },
              
              // Right column - Reference information
              {
                border: [true, true, true, true],
                margin: [5, 0, 0, 0],
                stack: [
                  // Booking Reference
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: 'BOOKING REF.', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                            { text: bolData.booking_ref || customBookingNumber || '', fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding',
                    margin: [0, 0, 0, 5]
                  },
                  
                  // Shipper's Reference
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: "SHIPPER'S REF.", bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                            { text: bolData.shipper_ref || '', fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding',
                    margin: [0, 0, 0, 5]
                  },
                  
                  // Vessel and Voyage
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: 'VESSEL AND VOYAGE NO', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                            { text: `${bolData.vessel_details?.vessel_name || 'TBN'} / ${bolData.vessel_details?.voyage_number || 'TBN'}`, fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding',
                    margin: [0, 0, 0, 5]
                  },
                  
                  // Port of Loading
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: 'PORT OF LOADING', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                            { text: bolData.ports?.loading || '', fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding',
                    margin: [0, 0, 0, 5]
                  },
                  
                  // Shipped on Board Date
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: 'SHIPPED ON BOARD DATE', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                            { text: bolData.shipped_on_board_date || currentDate, fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding',
                    margin: [0, 0, 0, 5]
                  },
                  
                  // Port of Discharge
                  {
                    table: {
                      widths: ['*'],
                      body: [
                        [{
                          border: [true, true, true, true],
                          margin: [5, 5, 5, 5],
                          stack: [
                            { text: 'PORT OF DISCHARGE', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                            { text: bolData.ports?.discharge || '', fontSize: 9 }
                          ]
                        }]
                      ]
                    },
                    layout: 'noPadding'
                  }
                ]
              }
            ]
          ]
        },
        layout: 'noPadding',
        margin: [0, 10, 0, 10]
      },
      
      // Location and Commercial Information Block
      {
        table: {
          widths: ['*', '*'],
          body: [
            [
              // Left - Location information
              {
                border: [true, true, true, true],
                margin: [0, 0, 5, 0],
                stack: [
                  { text: 'PLACE OF RECEIPT:', bold: true, fontSize: 10, margin: [5, 5, 5, 2] },
                  { text: bolData.place_of_receipt || '', fontSize: 9, margin: [5, 0, 5, 5] },
                  { text: 'PLACE OF DELIVERY:', bold: true, fontSize: 10, margin: [5, 5, 5, 2] },
                  { text: bolData.place_of_delivery || bolData.ports?.delivery || '', fontSize: 9, margin: [5, 0, 5, 5] },
                  { text: `NO. OF RIDER PAGES: ${bolData.rider_pages || 0}`, bold: true, fontSize: 8, margin: [5, 0, 5, 5] }
                ]
              },
              
              // Right - Commercial information
              {
                border: [true, true, true, true],
                margin: [5, 0, 0, 0],
                stack: [
                  { text: 'FREIGHT & CHARGES', bold: true, fontSize: 10, margin: [5, 5, 5, 2] },
                  { text: bolData.freight_charges || bolData.freight_terms || '', fontSize: 9, margin: [5, 0, 5, 5] },
                  { text: 'DECLARED VALUE', bold: true, fontSize: 10, margin: [5, 5, 5, 2] },
                  { text: bolData.declared_value || '', fontSize: 9, margin: [5, 0, 5, 5] }
                ]
              }
            ]
          ]
        },
        layout: 'noPadding',
        margin: [0, 0, 0, 10]
      },
      
      // Agent and Reference Information
      {
        stack: [
          { text: 'PORT OF DISCHARGE AGENT:', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
          { text: bolData.discharge_agent || '', fontSize: 9, margin: [0, 0, 0, 8] },
          { text: '"Port-To-Port" or "Combined Transport"', fontSize: 10, margin: [0, 0, 0, 3] },
          { text: bolData.transport_type || 'Port-To-Port', fontSize: 9, margin: [0, 0, 0, 10] }
        ]
      },
      
      // Place and Date of Issue with IMO Number
      {
        table: {
          widths: ['*', 150],
          body: [
            [
              {
                border: [true, true, true, true],
                margin: [5, 5, 5, 5],
                stack: [
                  { text: 'PLACE AND DATE OF ISSUE', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                  { text: bolData.place_and_date_of_issue || currentDate, fontSize: 9 }
                ]
              },
              {
                border: [true, true, true, true],
                margin: [5, 5, 5, 5],
                stack: [
                  { text: 'IMO Number:', bold: true, fontSize: 10, margin: [0, 0, 0, 3] },
                  { text: bolData.imo_number || '', fontSize: 9 }
                ]
              }
            ]
          ]
        },
        layout: 'noPadding',
        margin: [0, 0, 0, 15]
      },
      
      // Cargo Table with automatic page breaks
      {
        text: 'PARTICULARS FURNISHED BY THE SHIPPER - NOT CHECKED BY CARRIER - CARRIER NOT RESPONSIBLE',
        bold: true,
        fontSize: 8,
        margin: [0, 0, 0, 5]
      },
      
      {
        table: {
          headerRows: 1, // This ensures the header repeats on new pages
          widths: [140, 240, 90, 90],
          body: [
            // Header row
            [
              { text: 'Container Numbers, Seal Numbers and Marks', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [3, 5, 3, 5] },
              { text: 'Description of Packages and Goods', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [3, 5, 3, 5] },
              { text: 'Gross Cargo Weight', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [3, 5, 3, 5] },
              { text: 'Measurement', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [3, 5, 3, 5] }
            ],
            // Data rows
            ...(bolData.cargo || []).map((item, index) => [
              {
                text: [
                  item.container_numbers || '',
                  item.seal_numbers ? '\n' + item.seal_numbers : '',
                  item.marks ? '\n' + item.marks : ''
                ].filter(Boolean).join(''),
                fontSize: 8,
                margin: [3, 3, 3, 3],
                fillColor: index % 2 === 1 ? '#f8f8f8' : undefined
              },
              {
                text: item.description || '',
                fontSize: 8,
                margin: [3, 3, 3, 3],
                fillColor: index % 2 === 1 ? '#f8f8f8' : undefined
              },
              {
                text: item.gross_weight || '',
                fontSize: 8,
                alignment: 'center',
                margin: [3, 3, 3, 3],
                fillColor: index % 2 === 1 ? '#f8f8f8' : undefined
              },
              {
                text: item.measurement || '',
                fontSize: 8,
                alignment: 'center',
                margin: [3, 3, 3, 3],
                fillColor: index % 2 === 1 ? '#f8f8f8' : undefined
              }
            ])
          ]
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 10]
      },
      
      // Totals section
      {
        table: {
          widths: [140, 240, 90, 90],
          body: [
            [
              { text: 'TOTALS:', bold: true, fontSize: 10, fillColor: '#f0f0f0', margin: [5, 5, 5, 5] },
              { text: `${bolData.totals?.packages || 0} PACKAGES`, bold: true, fontSize: 9, fillColor: '#f0f0f0', margin: [5, 5, 5, 5] },
              { text: `GROSS: ${bolData.totals?.gross_weight || 'N/A'}`, bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [5, 5, 5, 5] },
              { text: bolData.totals?.measurement ? `CBM: ${bolData.totals.measurement}` : '', bold: true, fontSize: 9, alignment: 'center', fillColor: '#f0f0f0', margin: [5, 5, 5, 5] }
            ]
          ]
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => '#000000',
          vLineColor: () => '#000000'
        },
        margin: [0, 0, 0, 15]
      },
      
      // Carrier's Receipt Section
      {
        stack: [
          { text: "CARRIER'S RECEIPT", bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
          {
            table: {
              widths: ['*'],
              body: [
                [{
                  border: [true, true, true, true],
                  text: bolData.carrier_receipt || '',
                  fontSize: 8,
                  margin: [5, 5, 5, 5]
                }]
              ]
            },
            layout: 'noPadding',
            margin: [0, 0, 0, 15]
          }
        ]
      },
      
      // Legal Terms and Conditions
      {
        stack: [
          {
            text: 'RECEIVED by the Carrier in apparent good order and condition (unless otherwise stated herein) the total number or quantity of Containers or other packages or units indicated in the box entitled Carrier\'s Receipt for carriage subject to all the terms and conditions hereof from the Place of Receipt or Port of Loading to the Port of Discharge or Place of Delivery, whichever is applicable. IN ACCEPTING THIS BILL OF LADING THE MERCHANT EXPRESSLY ACCEPTS AND AGREES TO ALL THE TERMS AND CONDITIONS, WHETHER PRINTED, STAMPED OR OTHERWISE INCORPORATED ON THIS SIDE AND ON THE REVERSE SIDE OF THIS BILL OF LADING AND THE TERMS AND CONDITIONS OF THE CARRIER\'S APPLICABLE TARIFF AS IF THEY WERE ALL SIGNED BY THE MERCHANT.',
            fontSize: 7,
            margin: [0, 0, 0, 8]
          },
          {
            text: 'If this is a negotiable (To Order / of) Bill of Lading, one original Bill of Lading, duly endorsed must be surrendered by the Merchant to the Carrier (together with outstanding Freight and charges) in exchange for the Goods or a Delivery Order. If this is a non-negotiable (straight) Bill of Lading, the Carrier shall deliver the Goods or issue a Delivery Order (after payment of outstanding Freight and charges) against the surrender of one original Bill of Lading or in accordance with the national law at the Port of Discharge or Place of Delivery whichever is applicable.',
            fontSize: 7,
            margin: [0, 0, 0, 8]
          },
          {
            text: 'IN WITNESS WHEREOF the Carrier or their Agent has signed the number of Bills of Lading stated at the top, all of this tenor and date, and wherever one original Bill of Lading has been surrendered all other Bills of Lading shall be void.',
            fontSize: 7,
            margin: [0, 0, 0, 15]
          }
        ]
      },
      
      // Important Notices
      {
        stack: [
          {
            text: '"Carrier\'s liability ceases after discharge of goods into Customs custody and Carrier shall not be responsible for delivery of cargo without the presentation of the Original Bill of Lading, as per Customs Regulations".',
            bold: true,
            fontSize: 7,
            margin: [0, 0, 0, 5]
          },
          {
            text: 'CARRIER WILL NOT BE LIABLE FOR ANY MISDECLARATION OF H.S.CODE/NCM AND ALL COSTS AND CONSEQUENCES ARISING OUT OF THE MISDECLARATION WILL BE ON ACCOUNT OF SHIPPERS.',
            bold: true,
            fontSize: 7,
            margin: [0, 0, 0, 5]
          },
          {
            text: 'Cargo shall not be delivered unless Freight & Charges are paid',
            bold: true,
            fontSize: 7,
            margin: [0, 0, 0, 5]
          },
          {
            text: 'AS PER AGREEMENT',
            bold: true,
            fontSize: 7,
            margin: [0, 0, 0, 15]
          }
        ]
      },
      
      // Signature and Endorsement Sections
      {
        stack: [
          { text: "CARRIER'S AGENTS ENDORSEMENTS:", bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
          {
            table: {
              widths: ['*'],
              body: [
                [{
                  border: [true, true, true, true],
                  text: bolData.carrier_endorsements || '',
                  fontSize: 8,
                  margin: [5, 5, 5, 5]
                }]
              ]
            },
            layout: 'noPadding',
            margin: [0, 0, 0, 10]
          },
          
          { text: "NO.& SEQUENCE OF ORIGINAL B/L's", bold: true, fontSize: 10, margin: [0, 0, 0, 5] },
          {
            table: {
              widths: ['*'],
              body: [
                [{
                  border: [true, true, true, true],
                  text: bolData.bl_sequence || '3 (Three) Original Bills of Lading',
                  fontSize: 8,
                  margin: [5, 5, 5, 5]
                }]
              ]
            },
            layout: 'noPadding',
            margin: [0, 0, 0, 10]
          },
          
          { text: 'TERMS CONTINUED ON REVERSE', bold: true, fontSize: 8, margin: [0, 0, 0, 15] },
          
          // Final signature section
          {
            table: {
              widths: ['*', '*'],
              body: [
                [
                  {
                    border: [true, true, true, true],
                    margin: [5, 5, 5, 5],
                    stack: [
                      { text: 'PLACE AND DATE OF ISSUE', bold: true, fontSize: 8, margin: [0, 0, 0, 3] },
                      { text: bolData.place_and_date_of_issue || currentDate, fontSize: 8 }
                    ]
                  },
                  {
                    border: [true, true, true, true],
                    margin: [5, 5, 5, 5],
                    stack: [
                      { text: 'SHIPPED ON BOARD DATE', bold: true, fontSize: 8, margin: [0, 0, 0, 3] },
                      { text: bolData.shipped_on_board_date || currentDate, fontSize: 8 }
                    ]
                  }
                ]
              ]
            },
            layout: 'noPadding',
            margin: [0, 0, 0, 10]
          },
          
          { text: `SIGNED ${bolData.signed_by || '_________________________'} on behalf of the Carrier`, fontSize: 9 }
        ]
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
  };

  return new Promise<Uint8Array>((resolve, reject) => {
    try {
      const pdfDocGenerator = pdfMake.createPdf(docDefinition);
      pdfDocGenerator.getBuffer((buffer: Buffer) => {
        resolve(new Uint8Array(buffer));
      });
    } catch (error) {
      reject(new Error(`Failed to generate PDF: ${error}`));
    }
  });
}