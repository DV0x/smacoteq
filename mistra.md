# Basic OCR

## Document AI OCR processor

Mistral Document AI API comes with a Document OCR (Optical Character Recognition) processor, powered by our latest OCR model **mistral-ocr-latest**, which enables you to extract text and structured content from PDF documents.

![Basic OCR Graph](basic-ocr-graph)

### Key features:

- Extracts text content while maintaining document structure and hierarchy
- Preserves formatting like headers, paragraphs, lists and tables
- Returns results in markdown format for easy parsing and rendering
- Handles complex layouts including multi-column text and mixed content
- Processes documents at scale with high accuracy
- Supports multiple document formats including:
  - **image_url**: png, jpeg/jpg, avif and more...
  - **document_url**: pdf, pptx, docx and more...

The OCR processor returns the extracted text content, images bboxes and metadata about the document structure, making it easy to work with the recognized content programmatically.

## OCR with PDF

```typescript
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({apiKey: apiKey});

const ocrResponse = await client.ocr.process({
    model: "mistral-ocr-latest",
    document: {
        type: "document_url",
        documentUrl: "https://arxiv.org/pdf/2201.04234"
    },
    includeImageBase64: true
});
```

Or passing a Base64 encoded pdf:

```typescript
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

async function encodePdf(pdfPath) {
    try {
        // Read the PDF file as a buffer
        const pdfBuffer = fs.readFileSync(pdfPath);

        // Convert the buffer to a Base64-encoded string
        const base64Pdf = pdfBuffer.toString('base64');
        return base64Pdf;
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

const pdfPath = "path_to_your_pdf.pdf";

const base64Pdf = await encodePdf(pdfPath);

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

try {
    const ocrResponse = await client.ocr.process({
        model: "mistral-ocr-latest",
        document: {
            type: "document_url",
            documentUrl: "data:application/pdf;base64," + base64Pdf
        },
        includeImageBase64: true
    });
    console.log(ocrResponse);
} catch (error) {
    console.error("Error processing OCR:", error);
}
```

### Example output:

```json
{
    "pages": [
        {
            "index": 1,
            "markdown": "# LEVERAGING UNLABELED DATA TO PREDICT OUT-OF-DISTRIBUTION PERFORMANCE \n\nSaurabh Garg*<br>Carnegie Mellon University<br>sgarg2@andrew.cmu.edu<br>Sivaraman Balakrishnan<br>Carnegie Mellon University<br>sbalakri@andrew.cmu.edu<br>Zachary C. Lipton<br>Carnegie Mellon University<br>zlipton@andrew.cmu.edu\n\n## Behnam Neyshabur\n\nGoogle Research, Blueshift team\nneyshabur@google.com\n\nHanie Sedghi<br>Google Research, Brain team<br>hsedghi@google.com\n\n\n#### Abstract\n\nReal-world machine learning deployments are characterized by mismatches between the source (training) and target (test) distributions that may cause performance drops. In this work, we investigate methods for predicting the target domain accuracy using only labeled source data and unlabeled target data. We propose Average Thresholded Confidence (ATC), a practical method that learns a threshold on the model's confidence, predicting accuracy as the fraction of unlabeled examples for which model confidence exceeds that threshold. ATC outperforms previous methods across several model architectures, types of distribution shifts (e.g., due to synthetic corruptions, dataset reproduction, or novel subpopulations), and datasets (WILDS, ImageNet, BREEDS, CIFAR, and MNIST). In our experiments, ATC estimates target performance $2-4 \\times$ more accurately than prior methods. We also explore the theoretical foundations of the problem, proving that, in general, identifying the accuracy is just as hard as identifying the optimal predictor and thus, the efficacy of any method rests upon (perhaps unstated) assumptions on the nature of the shift. Finally, analyzing our method on some toy distributions, we provide insights concerning when it works ${ }^{1}$.\n\n\n## 1 INTRODUCTION\n\nMachine learning models deployed in the real world typically encounter examples from previously unseen distributions. While the IID assumption enables us to evaluate models using held-out data from the source distribution (from which training data is sampled), this estimate is no longer valid in presence of a distribution shift. Moreover, under such shifts, model accuracy tends to degrade (Szegedy et al., 2014; Recht et al., 2019; Koh et al., 2021). Commonly, the only data available to the practitioner are a labeled training set (source) and unlabeled deployment-time data which makes the problem more difficult. In this setting, detecting shifts in the distribution of covariates is known to be possible (but difficult) in theory (Ramdas et al., 2015), and in practice (Rabanser et al., 2018). However, producing an optimal predictor using only labeled source and unlabeled target data is well-known to be impossible absent further assumptions (Ben-David et al., 2010; Lipton et al., 2018).\n\nTwo vital questions that remain are: (i) the precise conditions under which we can estimate a classifier's target-domain accuracy; and (ii) which methods are most practically useful. To begin, the straightforward way to assess the performance of a model under distribution shift would be to collect labeled (target domain) examples and then to evaluate the model on that data. However, collecting fresh labeled data from the target distribution is prohibitively expensive and time-consuming, especially if the target distribution is non-stationary. Hence, instead of using labeled data, we aim to use unlabeled data from the target distribution, that is comparatively abundant, to predict model performance. Note that in this work, our focus is not to improve performance on the target but, rather, to estimate the accuracy on the target for a given classifier.\n\n* Work done in part while Saurabh Garg was interning at Google\n${ }^{1}$ Code is available at https://github.com/saurabhgarg1996/ATC_code.",
            "images": [],
            "dimensions": {
                "dpi": 200,
                "height": 2200,
                "width": 1700
            }
        },
        {
            "index": 2,
            "markdown": "![img-0.jpeg](img-0.jpeg)\n\nFigure 1: Illustration of our proposed method ATC. Left: using source domain validation data, we identify a threshold on a score (e.g. negative entropy) computed on model confidence such that fraction of examples above the threshold matches the validation set accuracy. ATC estimates accuracy on unlabeled target data as the fraction of examples with the score above the threshold. Interestingly, this threshold yields accurate estimates on a wide set of target distributions resulting from natural and synthetic shifts. Right: Efficacy of ATC over previously proposed approaches on our testbed with a post-hoc calibrated model. To obtain errors on the same scale, we rescale all errors with Average Confidence (AC) error. Lower estimation error is better. See Table 1 for exact numbers and comparison on various types of distribution shift. See Sec. 5 for details on our testbed.",
            "images": [
                {
                    "id": "img-0.jpeg",
                    "top_left_x": 292,
                    "top_left_y": 217,
                    "bottom_right_x": 1405,
                    "bottom_right_y": 649,
                    "image_base64": "..."
                }
            ],
            "dimensions": {
                "dpi": 200,
                "height": 2200,
                "width": 1700
            }
        }
    ],
    "model": "mistral-ocr-2503-completion",
    "usage_info": {
        "pages_processed": 29,
        "doc_size_bytes": null
    }
}
```

## OCR with uploaded PDF

You can also upload a PDF file and get the OCR results from the uploaded PDF.

### Upload a file

```typescript
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({apiKey: apiKey});

const uploadedFile = fs.readFileSync('uploaded_file.pdf');
const uploadedPdf = await client.files.upload({
    file: {
        fileName: "uploaded_file.pdf",
        content: uploadedFile,
    },
    purpose: "ocr"
});
```

### Retrieve File

```typescript
const retrievedFile = await client.files.retrieve({
    fileId: uploadedPdf.id
});
```

```json
{
    "id": "00edaf84-95b0-45db-8f83-f71138491f23",
    "object": "file",
    "size_bytes": 3749788,
    "created_at": 1741023462,
    "filename": "uploaded_file.pdf",
    "purpose": "ocr",
    "sample_type": "ocr_input",
    "source": "upload",
    "deleted": false,
    "num_lines": null
}
```

### Get signed URL

```typescript
const signedUrl = await client.files.getSignedUrl({
    fileId: uploadedPdf.id,
});
```

### Get OCR results

```typescript
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({apiKey: apiKey});

const ocrResponse = await client.ocr.process({
    model: "mistral-ocr-latest",
    document: {
        type: "document_url",
        documentUrl: signedUrl.url,
    },
    includeImageBase64: true
});
```

## OCR with image

```typescript
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({apiKey: apiKey});

const ocrResponse = await client.ocr.process({
    model: "mistral-ocr-latest",
    document: {
        type: "image_url",
        imageUrl: "https://raw.githubusercontent.com/mistralai/cookbook/refs/heads/main/mistral/ocr/receipt.png",
    },
    includeImageBase64: true
});
```

Or passing a Base64 encoded image:

```typescript
import { Mistral } from '@mistralai/mistralai';
import fs from 'fs';

async function encodeImage(imagePath) {
    try {
        // Read the image file as a buffer
        const imageBuffer = fs.readFileSync(imagePath);

        // Convert the buffer to a Base64-encoded string
        const base64Image = imageBuffer.toString('base64');
        return base64Image;
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

const imagePath = "path_to_your_image.jpg";

const base64Image = await encodeImage(imagePath);

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({ apiKey: apiKey });

try {
    const ocrResponse = await client.ocr.process({
        model: "mistral-ocr-latest",
        document: {
            type: "image_url",
            imageUrl: "data:image/jpeg;base64," + base64Image
        },
        includeImageBase64: true
    });
    console.log(ocrResponse);
} catch (error) {
    console.error("Error processing OCR:", error);
}
```

## Cookbooks

For more information and guides on how to make use of OCR, we have the following cookbooks:

- Tool Use
- Batch OCR

## FAQ

**Q: Are there any limits regarding the OCR API?**

A: Yes, there are certain limitations for the OCR API. Uploaded document files must not exceed 50 MB in size and should be no longer than 1,000 pages.