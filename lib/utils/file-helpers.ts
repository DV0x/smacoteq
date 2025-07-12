export async function fileToBase64(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert ArrayBuffer to Buffer
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert Buffer to base64 string
    const base64Data = buffer.toString('base64');
    
    return base64Data;
  } catch (error) {
    console.error('Error converting file to base64:', error);
    throw new Error('Failed to convert file to base64');
  }
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf', 
    'image/jpeg', 
    'image/jpg',
    'image/png', 
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Please upload PDF, JPG, PNG, WebP, or DOCX.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size is 50MB.' };
  }
  
  return { valid: true };
}