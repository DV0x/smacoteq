API Route - customBolNumber from formData: bol234455533
API Route - customBookingNumber from formData: book-3445
Starting BOL generation process {
  uploadMode: 'combined',
  packingListSize: undefined,
  packingListType: undefined,
  invoiceSize: undefined,
  invoiceType: undefined,
  combinedDocumentSize: 852030,
  combinedDocumentType: 'application/pdf',
  timestamp: '2025-07-16T09:03:34.061Z',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.'
}
Step 1: Extracting text from documents...
Processing combined document...
Original MIME type: application/pdf, Mistral MIME type: application/pdf
Extracted 2 pages from combined document
Page analysis: [
  { page: 1, type: 'invoice', packingScore: 0, invoiceScore: 1 },
  { page: 2, type: 'invoice', packingScore: 0, invoiceScore: 1 }
]
Single document detected: commercial invoice
OCR extraction successful { packingListLength: 7012, invoiceLength: 7012 }
Packing List Preview: 

--- PAGE 1 ---

# INVOICE

**INVOICE**

**Page... 1/2**

**Exporter**

**FORECH MINING & CONSTRUCTION** **INTERNATIONAL LLP** **G.T. ROAD, RAI, SONEPAT 131029 HR** **H.O.: S-23, GREEN PARK EXTENSION** **NEW DELHI 110016** **Ph.91-11-26960868/26960511** **GST No. 08AAEFF4476D1ZL : CIN NO. AAF-2919** **Consignee** **M/S. EUROPEAN & EASTERN TRADE** **Z.A. 6-9 ROUTE DE COMPIEGNE** **60 410 VERBERIE** **FRANCE**

**Place of Receipt by pre- carrier** **ICD NEW DELHI/NCR** **Vessel/Flight** **BY SEA*...
Invoice Preview: 

--- PAGE 1 ---

# INVOICE

**INVOICE**

**Page... 1/2**

**Exporter**

**FORECH MINING & CONSTRUCTION** **INTERNATIONAL LLP** **G.T. ROAD, RAI, SONEPAT 131029 HR** **H.O.: S-23, GREEN PARK EXTENSION** **NEW DELHI 110016** **Ph.91-11-26960868/26960511** **GST No. 08AAEFF4476D1ZL : CIN NO. AAF-2919** **Consignee** **M/S. EUROPEAN & EASTERN TRADE** **Z.A. 6-9 ROUTE DE COMPIEGNE** **60 410 VERBERIE** **FRANCE**

**Place of Receipt by pre- carrier** **ICD NEW DELHI/NCR** **Vessel/Flight** **BY SEA*...
Step 2: Processing with LLM...
LLM Response: {
  "shipper": {
    "name": "FORECH MINING & CONSTRUCTION INTERNATIONAL LLP",
    "address": "G.T. ROAD, RAI, SONEPAT 131029 HR",
    "city": "NEW DELHI 110016",
    "country": "INDIA",
    "phone": "91-11-26960868/26960511"
  },
  "consignee": {
    "name": "M/S. EUROPEAN & EASTERN TRADE",
    "address": "Z.A. 6-9 ROUTE DE COMPIEGNE",
    "city": "60 410 VERBERIE",
    "country": "FRANCE",
    "is_negotiable": false
  },
  "notify_party": {},
  "booking_ref": "",
  "shipper_ref": "PL0391",
  "imo_number": "",
  "rider_pages": 0,
  "bl_sequence": "3 (Three) Original Bills of Lading",
  "vessel_details": {
    "vessel_name": "TBN",
    "voyage_number": "TBN"
  },
  "ports": {
    "loading": "Any Indian Port",
    "discharge": "LE HAVRE",
    "delivery": "LE HAVRE"
  },
  "place_of_receipt": "ICD NEW DELHI/NCR",
  "place_of_delivery": "LE HAVRE",
  "shipped_on_board_date": "",
  "place_and_date_of_issue": "",
  "discharge_agent": "",
  "transport_type": "Port-To-Port",
  "cargo": [
    {
      "container_numbers": "FFAU-3133376/40'",
      "seal_numbers": "",
      "marks": "24 Pallets",
      "description": "RUBBER COMPOUNDED SHEETS including High Abrasion Rubber, Black Skirt 45 Sh., Para Beige Rubber, Red Abrasion Rubber, Small Diamond SD2 Pulley Lagging, Black Rubber - 60 Sh., Square Diamond Pulley Lagging, Mini Diamond Pulley Lagging, Abrasion Rubber - 1 ply EP160 in the middle, Abrasion Rubber 60 Sh., Square Diamond Pulley Lagging",
      "gross_weight": "25,024.000 Kgs",
      "measurement": ""
    }
  ],
  "totals": {
    "packages": 24,
    "gross_weight": "25,024.000 Kgs",
    "measurement": ""
  },
  "freight_charges": "CIF LE HAVRE",
  "declared_value": "64,227.68 EUR",
  "carrier_receipt": "",
  "invoice_details": {
    "number": "FMR/SE/2526/0014",
    "date": "14.04.2025",
    "value": "64,227.68",
    "currency": "EUR"
  },
  "freight_terms": "CIF",
  "payment_terms": "AT 120 DAYS FROM B/L DATE",
  "special_instructions": "",
  "date_of_shipment": "",
  "carrier_endorsements": "",
  "signed_by": "Authorized Signatory"
}
LLM processing successful { hasShipper: true, hasConsignee: true, cargoItemsCount: 1 }
Step 3: Generating PDF...
PDF Generation - customBolNumber received: bol234455533
PDF Generation - final bolNumber: bol234455533
PDF generation successful { sizeBytes: 42852, sizeMB: '0.04' }
 POST /api/generate-bol 200 in