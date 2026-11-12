/**
 * Local supplier invoice handling for the purchase editor.
 *
 * The app's current workspace persistence includes purchase attachments inside
 * the saved AppData JSON. Cap uploads explicitly instead of accepting files that
 * exceed browser storage limits. A dedicated authenticated object store should
 * replace embedded files before lifting this limit.
 */
export const MAX_SUPPLIER_INVOICE_BYTES = 2 * 1024 * 1024

const pdfHeader = [0x25, 0x50, 0x44, 0x46, 0x2d]
const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]
const jpegHeader = [0xff, 0xd8, 0xff]
const beginsWith = (bytes: Uint8Array, signature: number[]) =>
  signature.every((byte, index) => bytes[index] === byte)

export type SupplierInvoiceAttachment = { attachmentName: string; attachmentData: string }

export async function readSupplierInvoice(file: File): Promise<SupplierInvoiceAttachment> {
  if (file.size === 0) throw new Error('The selected supplier invoice is empty.')
  if (file.size > MAX_SUPPLIER_INVOICE_BYTES) {
    throw new Error('Supplier invoices must be 2 MB or smaller until secure file storage is enabled.')
  }
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const lowerName = file.name.toLowerCase()
  const pdf = lowerName.endsWith('.pdf') && beginsWith(bytes, pdfHeader)
  const png = lowerName.endsWith('.png') && beginsWith(bytes, pngHeader)
  const jpeg = /\.jpe?g$/.test(lowerName) && beginsWith(bytes, jpegHeader)
  const webp = lowerName.endsWith('.webp') &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  const mime = pdf ? 'application/pdf' : png ? 'image/png' : jpeg ? 'image/jpeg' : webp ? 'image/webp' : ''
  if (!mime) throw new Error('Upload a valid PDF, PNG, JPG, or WebP invoice. Other file types are not supported.')

  const result = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string'
      ? resolve(reader.result)
      : reject(new Error('Could not read the supplier invoice.'))
    reader.onerror = () => reject(new Error('Could not read the supplier invoice.'))
    reader.readAsDataURL(file)
  })
  const payload = result.substring(result.indexOf(',') + 1)
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(payload)) throw new Error('The supplier invoice could not be read safely.')
  return {
    attachmentName: file.name.replace(/[\\/\x00-\x1f]/g, '_').slice(0, 150),
    attachmentData: `data:${mime};base64,${payload}`,
  }
}

export function openSupplierInvoice(dataUrl: string): void {
  const match = /^data:(application\/pdf|image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl)
  if (!match) throw new Error('This attachment format cannot be previewed safely.')
  const [, mime, encoded] = match
  const decoded = atob(encoded)
  const bytes = new Uint8Array(decoded.length)
  for (let index = 0; index < decoded.length; index++) bytes[index] = decoded.charCodeAt(index)
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
  // Popup blockers may prevent the preview; allow a manual download fallback.
  const preview = window.open(url, '_blank')
  if (!preview) {
    URL.revokeObjectURL(url)
    throw new Error('The browser blocked the attachment preview. Allow popups for this application.')
  }
  preview.opener = null
  window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000)
}
