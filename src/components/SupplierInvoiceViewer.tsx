import { useState } from 'react'
import { Download, Eye } from 'lucide-react'
import { Button, Modal } from './ui'
import '../styles/supplier-invoice-viewer.css'

/**
 * In-app attachment viewing works in Electron (which intentionally blocks
 * window.open), mobile and browsers. The download link remains as fallback.
 */
export function SupplierInvoiceViewer({dataUrl,name}:{dataUrl:string;name:string}){
  const [open,setOpen]=useState(false)
  const supported=/^data:(application\/pdf|image\/(png|jpeg|webp));base64,[A-Za-z0-9+/]+={0,2}$/.test(dataUrl)
  const safeName=(name||'supplier-invoice.pdf').replace(/[\\/\x00-\x1f]/g,'_').slice(0,150)
  if(!supported)return <span role="alert" className="muted">Attachment is unavailable or has an unsupported format.</span>
  return <div className="supplier-invoice-viewer">
    <Button type="button" onClick={()=>setOpen(true)}><Eye size={15}/>View supplier invoice</Button>
    <Modal open={open} onClose={()=>setOpen(false)} title={`Supplier invoice — ${safeName}`} wide className="supplier-invoice-modal">
      <iframe className="supplier-invoice-preview" src={dataUrl} title={`Preview ${safeName}`}/>
      <p className="supplier-invoice-fallback">If the PDF cannot display on your device, download the original attachment.</p>
      <a className="supplier-invoice-download" href={dataUrl} download={safeName}><Download size={15}/>Download original invoice</a>
    </Modal>
  </div>
}