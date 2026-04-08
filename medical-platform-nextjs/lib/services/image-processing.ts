// Image Processing - translated from Python utils_simple.py
import sharp from 'sharp'
import { FileType } from '@/types'

export interface ProcessedFile {
  type: FileType
  buffer: Buffer
  width: number
  height: number
  format: string
}

// Translate from Python process_file()
export async function processFile(file: File): Promise<ProcessedFile> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
    const image = sharp(buffer)
    const metadata = await image.metadata()
    
    return {
      type: 'IMAGE',
      buffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
    }
  }

  if (ext === 'dcm') {
    // DICOM processing - simplified for now
    // In production, use dicom-parser or similar
    return {
      type: 'DICOM',
      buffer,
      width: 512,
      height: 512,
      format: 'dicom',
    }
  }

  if (ext === 'nii' || ext === 'gz') {
    // NIfTI processing - simplified for now
    // In production, use nifti-reader-js or similar
    return {
      type: 'NIFTI',
      buffer,
      width: 256,
      height: 256,
      format: 'nifti',
    }
  }

  throw new Error(`Unsupported file format: ${ext}`)
}

// Translate from Python generate_heatmap()
export async function generateHeatmap(imageBuffer: Buffer): Promise<{
  overlay: Buffer
  heatmap: Buffer
}> {
  try {
    // Convert to grayscale
    const grayscale = await sharp(imageBuffer)
      .grayscale()
      .toBuffer()

    // Apply color map (simplified - in production use proper heatmap algorithm)
    const heatmap = await sharp(grayscale)
      .tint({ r: 255, g: 0, b: 0 }) // Red tint for heatmap
      .toBuffer()

    // Create overlay by compositing
    const overlay = await sharp(imageBuffer)
      .composite([{
        input: heatmap,
        blend: 'multiply',
        opacity: 0.5,
      }])
      .toBuffer()

    return { overlay, heatmap }
  } catch (error) {
    console.error('Error generating heatmap:', error)
    throw new Error('Failed to generate heatmap')
  }
}

// Validate file
export function validateFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const allowedTypes = ['image/jpeg', 'image/png', 'application/dicom', 'application/octet-stream']
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'dcm', 'nii', 'gz']

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 50MB' }
  }

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!ext || !allowedExtensions.includes(ext)) {
    return { valid: false, error: 'Invalid file format. Supported: JPEG, PNG, DICOM, NIfTI' }
  }

  return { valid: true }
}
