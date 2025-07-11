Starting BOL generation process {
  packingListSize: 416682,
  packingListType: 'image/jpeg',
  invoiceSize: 2434999,
  invoiceType: 'image/jpeg',
  timestamp: '2025-07-11T13:30:27.544Z',
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.'
}
Step 1: Extracting text from documents...
OCR extraction successful { packingListLength: 2414, invoiceLength: 331 }
Packing List Preview: 

--- PAGE 1 ---

# PACKING LIST

**EXPORTER**

**GREEN MIST ENTERPRISES**

4113, Block-4,Osian Chlorophyll, Off Bypass Service Road, Porur Chennai - 600116

Invoice No. & Date: GME/2024-25/011 dt 06-Nov-2024

Statement Of Origin: INREXASIPS2172LEC013

Buyer's Purchase Order No: PO/ALM/145-1 dated 18-Oct-2024

IEC No: ASIPD2172L

GST No: 33ASIPD2172L12U

APEDA RCMC No: 196447

**CONSIGNEE**

M/s. Al Mustafa Trading B.V. Nikkelwerf 51, 2544 EW Den Haag, Netherlands Email: almustafa20171@gmail.com...
Invoice Preview: 

--- PAGE 1 ---

9:27 9 9:15 at 00

Al Mustafa Documents.pdf

|  |   |   |   |   |   |
| --- | --- | --- | --- | --- | --- |
|  1400000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000...
Step 2: Processing with LLM...
LLM Response: {
  "BillOfLading": {
    "Exporter": {
      "Name": "GREEN MIST ENTERPRISES",
      "Address": "4113, Block-4, Osian Chlorophyll, Off Bypass Service Road, Porur, Chennai - 600116",
      "IECNo": "ASIPD2172L",
      "GSTNo": "33ASIPD2172L12U",
      "APEDARCMCNo": "196447",
      "InvoiceNoAndDate": "GME/2024-25/011 dt 06-Nov-2024",
      "StatementOfOrigin": "INREXASIPS2172LEC013",
      "AuthorizedSignatory": "For GREEN MIST ENTERPRISES"
    },
    "Consignee": {
      "Name": "M/s. Al Mustafa Trading B.V.",
      "Address": "Nikkelwerf 51, 2544 EW Den Haag, Netherlands",
      "Email": "almustafa20171@gmail.com"
    },
    "NotifyParty": {
      "Name": "M/s. Al Mustafa Trading B.V.",
      "Address": "Nikkelwerf 51, 2544 EW Den Haag, Netherlands",
      "Email": "almustafa20171@gmail.com"
    },
    "BuyerPurchaseOrderNo": "PO/ALM/145-1 dated 18-Oct-2024",
    "ShipmentDetails": {
      "PreCarriageBy": "By Truck",
      "PortOfLoading": "Mundra",
      "CountryOfOrigin": "INDIA",
      "PortOfDischarge": "Rotterdam",
      "CountryOfDestination": "Netherlands",
      "ShipmentMark": "Abu Rahmani",
      "ContainerDetails": null,
      "SealNumber": null,
      "BagDetails": null
    },
    "VesselAndShippingLine": {
      "ShippingLine": null,
      "VesselName": null
    },
    "FreightAndPaymentTerms": {
      "TermsOfPayment": "100% payment against the receipt of original documents from seller's bank to buyer's bank",
      "TermsOfDelivery": "CIF"
    },
    "CargoDescription": [
      {
        "MarksAndNumbers": "Abu Rahmani",
        "NumberOfBags": 1400,
        "ItemDescription": "Indian Milled 1121 Sella Basmati Rice HSN Code 1006 3020 (Lot No 3, Grade A, Variety - Parboiled)",
        "HSNCode": "1006 3020",
        "NetWeightKgs": 28000,
        "GrossWeightKgs": null
      },
      {
        "MarksAndNumbers": "Abu Rahmani",
        "NumberOfBags": 11,
        "ItemDescription": "Dried Ginger Lilly Leaves",
        "HSNCode": "12119029",
        "NetWeightKgs": 212,
        "GrossWeightKgs": null
      },
      {
        "MarksAndNumbers": "Abu Rahmani",
        "NumberOfBags": 1,
        "ItemDescription": "Glass Hookah Base",
        "HSNCode": "70139900",
        "NetWeightKgs": 10,
        "GrossWeightKgs": null
      },
      {
        "MarksAndNumbers": "Abu Rahmani",
        "NumberOfBags": 1,
        "ItemDescription": "Tea Cattle & Litter",
        "HSNCode": "44209090",
        "NetWeightKgs": 5,
        "GrossWeightKgs": null
      },
      {
        "MarksAndNumbers": "Abu Rahmani",
        "NumberOfBags": 1,
        "ItemDescription": "Dairy and Other Handicrafts",
        "HSNCode": "44209090",
        "NetWeightKgs": 26,
        "GrossWeightKgs": null
      }
    ],
    "TotalBags": 1414,
    "TotalNetWeightKgs": 28253,
    "TotalGrossWeightKgs": 28470,
    "PackingDetails": "4 X 5 Kgs BoPP Bags Packed in 20 Kgs Master PP Bags",
    "SpecialInstructions": [
      "WE INTEND TO CLAIM REWARDS UNDER RoDTEP SCHEME"
    ],
    "BankDetails": {
      "AccountName": "GREEN MIST ENTERPRISES",
      "AccountNo": "05260200001746",
      "BankName": "Bank Of Baroda",
      "Branch": "Moore Street, Parrys, Chennai",
      "BranchAddress": "No 46, Moore St, Parrys Corner, Chennai - 600-001",
      "AccountType": "CURRENT A/C",
      "SWIFTCode": "BARBINBBOBM",
      "CorrespondentBankAccountNo": "93010200000070",
      "CorrespondentBankName": "Bank Of Baroda, NY",
      "CorrespondentBankSWIFTCode": "BARBUS33"
    }
  }
}
Missing fields in BOL data: {
  hasShipper: false,
  hasConsignee: false,
  hasCargo: false,
  actualData: {
    BillOfLading: {
      Exporter: [Object],
      Consignee: [Object],
      NotifyParty: [Object],
      BuyerPurchaseOrderNo: 'PO/ALM/145-1 dated 18-Oct-2024',
      ShipmentDetails: [Object],
      VesselAndShippingLine: [Object],
      FreightAndPaymentTerms: [Object],
      CargoDescription: [Array],
      TotalBags: 1414,
      TotalNetWeightKgs: 28253,
      TotalGrossWeightKgs: 28470,
      PackingDetails: '4 X 5 Kgs BoPP Bags Packed in 20 Kgs Master PP Bags',
      SpecialInstructions: [Array],
      BankDetails: [Object]
    }
  }
}
LLM processing failed: Error: Missing required BOL information
    at POST (app/api/generate-bol/route.ts:207:14)
  205 |           actualData: bolData
  206 |         });
> 207 |         throw new Error('Missing required BOL information');
      |              ^
  208 |       }
  209 |       
  210 |       console.log('LLM processing successful', {
 POST /api/generate-bol 422 in 32643ms