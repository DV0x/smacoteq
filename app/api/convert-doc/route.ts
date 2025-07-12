import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the API key from environment variables
    const apiKey = process.env.CONVERTAPI_SECRET;
    console.log('API Key exists:', !!apiKey);
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ConvertAPI key not configured' },
        { status: 500 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check if it's a .doc file
    if (!file.name.toLowerCase().endsWith('.doc') || file.name.toLowerCase().endsWith('.docx')) {
      return NextResponse.json(
        { error: 'Only .doc files are supported for conversion' },
        { status: 400 }
      );
    }

    // Convert the file to FormData for ConvertAPI
    const convertFormData = new FormData();
    convertFormData.append('File', file);

    // Call ConvertAPI directly via REST API (convert to PDF for better OCR compatibility)
    const response = await fetch('https://v2.convertapi.com/convert/doc/to/pdf', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: convertFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ConvertAPI error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Conversion failed', details: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('ConvertAPI response structure:', Object.keys(result));
    
    // Check if conversion was successful and files exist
    if (!result.Files || result.Files.length === 0) {
      return NextResponse.json(
        { error: 'No converted file returned from ConvertAPI' },
        { status: 500 }
      );
    }
    
    const convertedFile = result.Files[0];
    console.log('File properties:', Object.keys(convertedFile));
    
    // ConvertAPI returns FileData (base64) instead of Url for some conversions
    let convertedBuffer: ArrayBuffer;
    
    if (convertedFile.FileData) {
      // File is returned as base64 data
      console.log('Using FileData (base64)');
      const buffer = Buffer.from(convertedFile.FileData, 'base64');
      convertedBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    } else if (convertedFile.Url) {
      // File is available via URL
      console.log('Using Url download');
      const convertedResponse = await fetch(convertedFile.Url);
      if (!convertedResponse.ok) {
        return NextResponse.json(
          { error: 'Failed to download converted file' },
          { status: 500 }
        );
      }
      convertedBuffer = await convertedResponse.arrayBuffer();
    } else {
      return NextResponse.json(
        { error: 'No FileData or Url found in converted file response' },
        { status: 500 }
      );
    }

    // Return the converted file
    const fileName = file.name.replace(/\.doc$/i, '.pdf');
    
    return new NextResponse(convertedBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}