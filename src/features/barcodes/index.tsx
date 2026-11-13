import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Barcode, Boxes, CheckCircle2, Download, Package, Printer, RefreshCw, Search, SlidersHorizontal } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import { Badge, Button, Card, Field, PageHeader, SearchableSelect, StatCard, toast } from '../../components/ui'
import { logoUrl } from '../../assets/brand'
import { formatCurrency, formatDate } from '../../utils/format'
import { useData } from '../../services/data'
import type { Product, ProductBarcode, Unit } from '../../types'
import '../../styles/barcode-print.css'

type BarcodeTemplate = NonNullable<ProductBarcode['template']>
type LabelBatch = {
 product: Product
 value: string
 unit: Unit
 label: string
 quantity: number
 template: BarcodeTemplate
 size: string
 sheetType: string
 includePrice: boolean
 notes: string
}

const templates: BarcodeTemplate[] = ['Standard', 'With Price', 'Compact', 'Shelf Label']
const labelSizes = ['50 × 25 mm', '50 × 30 mm', '40 × 20 mm']
const sheetTypes = ['A4 (2 × 8 = 16 labels)', 'A4 (3 × 10 = 30 labels)']

const barcodeConflicts = (value: string, product: Product, unit: Unit, products: Product[]) => products.some(item => {
 if (item.id !== product.id) return item.barcode === value || item.barcodes?.some(entry => entry.value === value)
 return (unit !== item.salesUnit && item.barcode === value) || item.barcodes?.some(entry => entry.unit !== unit && entry.value === value)
})

const productCode = (product: Product, unit: Unit, products: Product[]) => {
 const existing = [...(product.barcodes ?? [])].reverse().find(item => item.unit === unit)?.value
 if (existing && !barcodeConflicts(existing, product, unit, products)) return existing
 if (unit === product.salesUnit && product.barcode && !barcodeConflicts(product.barcode, product, unit, products)) return product.barcode

 // Some legacy records contain duplicate example barcodes. Issue a stable, SKU-based
 // replacement rather than reprinting a value already assigned to another product.
 const used = new Set(products.flatMap(item => [item.barcode, ...(item.barcodes ?? []).map(entry => entry.value)]).filter(Boolean))
 const unitCode = ({ Meter: 'MTR', Piece: 'PCS', Box: 'BOX', KG: 'KGS', Roll: 'ROL' } as Partial<Record<Unit, string>>)[unit] ?? unit.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 3)
 const productSuffix = product.id.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(-4)
 const prefix = `VT-${productSuffix}-${unitCode}`
 let counter = 1
 let value = `${prefix}-${String(counter).padStart(2, '0')}`
 while (used.has(value)) value = `${prefix}-${String(++counter).padStart(2, '0')}`
 return value
}

function BarcodeSvg({ value, compact = false }: { value: string; compact?: boolean }) {
 const ref = useRef<SVGSVGElement>(null)
 useEffect(() => {
  if (!ref.current || !value) return
  JsBarcode(ref.current, value, { format: 'CODE128', displayValue: true, height: compact ? 30 : 54, margin: compact ? 3 : 8, fontSize: compact ? 8 : 12, lineColor: '#16252d' })
 }, [value, compact])
 return <svg ref={ref} aria-label={`Barcode ${value}`} />
}

function BarcodeLabel({ batch, compact = false }: { batch: LabelBatch; compact?: boolean }) {
 const showPrice = batch.includePrice || batch.template === 'With Price'
 const effectivePrice = batch.product.sellingRate * (1 - (batch.product.defaultDiscount ?? 0) / 100)
 const dimensions = batch.size.match(/\d+/gu)?.map(Number) ?? [50, 25]
 const style = { '--label-width': `${dimensions[0] ?? 50}mm`, '--label-height': `${dimensions[1] ?? 25}mm` } as CSSProperties
 return <article style={style} className={`barcode-label-card barcode-template-${batch.template.toLowerCase().replaceAll(' ', '-')} ${compact ? 'barcode-label-compact' : ''}`}>
  <div className="barcode-label-brand"><img src={logoUrl} alt="Vinay Traders"/><span>VINAY TRADERS</span></div>
  <strong className="barcode-label-name">{batch.product.name}</strong>
  <span className="barcode-label-variant">{batch.product.variant || batch.product.size || 'Standard'} · {batch.unit}</span>
  {showPrice && <b className="barcode-label-price">{formatCurrency(effectivePrice)}</b>}
  <BarcodeSvg value={batch.value} compact={compact}/>
  {batch.label.trim() && <small className="barcode-label-shelf">Shelf: {batch.label.trim()}</small>}
  {batch.notes.trim() && <small className="barcode-label-note">{batch.notes.trim()}</small>}
 </article>
}

function makePages(batch: LabelBatch, perSheet: number) {
 const count = Math.max(1, Math.min(200, batch.quantity))
 return Array.from({ length: Math.ceil(count / perSheet) }, (_, page) =>
  Array.from({ length: Math.min(perSheet, count - page * perSheet) }, () => batch),
 )
}

export function BarcodePage() {
 const { data, mutate } = useData()
 const initialProduct = data.products[0]
 const [productId, setProductId] = useState(initialProduct?.id ?? '')
 const [unit, setUnit] = useState<Unit>(initialProduct?.salesUnit ?? 'Piece')
 const [label, setLabel] = useState('')
 const [quantity, setQuantity] = useState('8')
 const [template, setTemplate] = useState<BarcodeTemplate>('Standard')
 const [size, setSize] = useState(labelSizes[0]!)
 const [sheetType, setSheetType] = useState(sheetTypes[0]!)
 const [includePrice, setIncludePrice] = useState(false)
 const [notes, setNotes] = useState('')
 const [barcode, setBarcode] = useState(() => initialProduct ? productCode(initialProduct, initialProduct.salesUnit, data.products) : '')
 const [saved, setSaved] = useState(false)
 const [printTarget, setPrintTarget] = useState<LabelBatch | null>(null)
 const [historyQuery, setHistoryQuery] = useState('')
 const previewSvg = useRef<SVGSVGElement>(null)
 const product = data.products.find(item => item.id === productId)

 useLayoutEffect(() => {
  if (!printTarget) return
  const pageStyle = document.createElement('style')
  pageStyle.dataset.barcodePrintPage = 'true'
  pageStyle.textContent = '@page { size: A4 portrait; margin: 0; }'
  document.head.append(pageStyle)
  return () => pageStyle.remove()
 }, [printTarget])

 useEffect(() => {
  if (!previewSvg.current || !barcode) return
  JsBarcode(previewSvg.current, barcode, { format: 'CODE128', displayValue: true, height: 62, margin: 8, fontSize: 12, lineColor: '#16252d' })
 }, [barcode])

 const jobs = useMemo(() => data.products.flatMap(item => {
  const entries = [...(item.barcodes ?? [])]
  if (item.barcode && !entries.some(entry => entry.value === item.barcode)) {
   entries.push({ value: item.barcode, unit: item.salesUnit })
  }
  return entries.map((entry, index) => ({
   id: `${item.id}-${entry.value}-${entry.createdAt ?? index}`,
   product: item,
   entry,
   duplicate: barcodeConflicts(entry.value, item, entry.unit, data.products),
  }))
 }).filter(job => `${job.product.name} ${job.product.variant} ${job.product.sku} ${job.entry.value} ${job.entry.label ?? ''}`.toLowerCase().includes(historyQuery.trim().toLowerCase()))
  .sort((a, b) => (b.entry.createdAt ?? '').localeCompare(a.entry.createdAt ?? '')),
 [data.products, historyQuery])

 const setProduct = (id: string) => {
  const selected = data.products.find(item => item.id === id)
  if (!selected) return
  setProductId(id)
  setUnit(selected.salesUnit)
  setBarcode(productCode(selected, selected.salesUnit, data.products))
  setSaved(false)
  setPrintTarget(null)
 }
 const setUnitValue = (value: Unit) => {
  if (!product) return
  setUnit(value)
  setBarcode(productCode(product, value, data.products))
  setSaved(false)
  setPrintTarget(null)
 }
 const invalidateSavedPreview = () => { setSaved(false); setPrintTarget(null) }

 const currentBatch = (): LabelBatch | null => product && barcode ? {
  product, value: barcode, unit, label, quantity: Math.max(1, Math.min(200, Number(quantity) || 1)),
  template, size, sheetType, includePrice, notes,
 } : null

 const generate = async () => {
  if (!product) return
  const code = barcode || productCode(product, unit, data.products)
  if (barcodeConflicts(code, product, unit, data.products)) { toast.error('That barcode is already assigned to another product or unit.'); return }
  const batch: LabelBatch = { product, value: code, unit, label: label.trim(), quantity: Math.max(1, Math.min(200, Number(quantity) || 1)), template, size, sheetType, includePrice: includePrice || template === 'With Price', notes: notes.trim() }
  const entry: ProductBarcode = {
   value: code, unit, label: batch.label || undefined, createdAt: new Date().toISOString(), quantity: batch.quantity,
   template, size, sheetType, includePrice: batch.includePrice, notes: batch.notes || undefined,
  }
  try {
   await mutate(current => ({ ...current, products: current.products.map(item => item.id === product.id ? {
    ...item,
    barcode: unit === item.salesUnit ? code : item.barcode,
    barcodes: [...(item.barcodes ?? []), entry],
   } : item) }))
   setBarcode(code)
   setSaved(true)
   setPrintTarget(batch)
   toast.success(`Barcode saved for ${product.name}`)
  } catch (error) {
   toast.error(error instanceof Error ? error.message : 'Unable to save barcode')
  }
 }

 const reset = () => {
  setLabel(''); setQuantity('8'); setTemplate('Standard'); setSize(labelSizes[0]!); setSheetType(sheetTypes[0]!)
  setIncludePrice(false); setNotes(''); setSaved(false); setPrintTarget(null)
  if (product) setBarcode(productCode(product, unit, data.products))
 }
 const downloadSvg = () => {
  const svg = previewSvg.current
  if (!svg || !product) return
  const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${product.sku}-${unit.toLowerCase()}-barcode.svg`; anchor.click()
  URL.revokeObjectURL(url)
 }
 const openJob = (job: typeof jobs[number]) => {
  const entry = job.entry
  setProduct(job.product.id)
  setUnit(entry.unit)
  setLabel(entry.label ?? '')
  setQuantity(String(entry.quantity ?? 1))
  setTemplate(entry.template ?? 'Standard')
  setSize(entry.size ?? labelSizes[0]!)
  setSheetType(entry.sheetType ?? sheetTypes[0]!)
  setIncludePrice(entry.includePrice ?? entry.template === 'With Price')
  setNotes(entry.notes ?? '')
  setBarcode(entry.value)
  setSaved(true)
  setPrintTarget({ product: job.product, value: entry.value, unit: entry.unit, label: entry.label ?? '', quantity: entry.quantity ?? 1, template: entry.template ?? 'Standard', size: entry.size ?? labelSizes[0]!, sheetType: entry.sheetType ?? sheetTypes[0]!, includePrice: entry.includePrice ?? entry.template === 'With Price', notes: entry.notes ?? '' })
 }

 const selectedBatch = currentBatch()
 const labelHeight = Number(size.match(/\d+/gu)?.[1] ?? 25)
 const sheetColumns = sheetType.startsWith('A4 (3') ? 3 : 2
 const requestedPerSheet = sheetType.startsWith('A4 (3') ? 30 : 16
 const perSheet = Math.min(requestedPerSheet, sheetColumns * Math.floor(275 / (labelHeight + 2)))
 const previewPages = printTarget ? makePages(printTarget, perSheet) : []
 const printPages = printTarget ? makePages(printTarget, perSheet) : []
 const labelsGenerated = jobs.reduce((sum, job) => sum + (job.entry.quantity ?? 1), 0)

 return <div className="page-stack barcode-page">
  <PageHeader title="Barcode labels" description="Build, preview and print unit-specific labels for inventory products." actions={<>
   <Button disabled={!saved || !printTarget} onClick={() => window.print()}><Printer size={15}/>Print labels</Button>
   <Button variant="primary" onClick={reset}><RefreshCw size={15}/>New label</Button>
  </>}/>
  <div className="grid-3 barcode-stats">
   <StatCard label="Products with barcodes" value={data.products.filter(item => item.barcode || item.barcodes?.length).length} detail="Saved in inventory" icon={<Boxes size={17}/>}/>
   <StatCard label="Barcode variants" value={jobs.length} detail="Product and unit codes" icon={<Barcode size={17}/>}/>
   <StatCard label="Labels in history" value={labelsGenerated} detail="Saved print quantities" icon={<CheckCircle2 size={17}/>}/>
  </div>

  <div className="barcode-workspace">
   <Card className="barcode-builder-card">
    <div className="barcode-card-heading"><div className="barcode-heading-icon"><Barcode size={19}/></div><div><h2>Label builder</h2><p>Select a product, size and print quantity.</p></div><Badge tone={saved ? 'green' : 'blue'}>{saved ? 'Saved to inventory' : 'Ready to configure'}</Badge></div>
    <div className="barcode-form-grid">
     <Field label="Inventory product"><SearchableSelect value={productId} onChange={setProduct} options={data.products.map(item => ({ value: item.id, label: `${item.name} · ${item.variant || item.size}` }))} ariaLabel="Inventory product" placeholder="Select a product"/></Field>
     <Field label="Unit"><select aria-label="Barcode unit" value={unit} onChange={event => setUnitValue(event.target.value as Unit)}>{[...new Set([product?.salesUnit, product?.purchaseUnit, 'Piece', 'Box', 'Meter', 'KG', 'Roll'])].filter(Boolean).map(option => <option key={option}>{option}</option>)}</select></Field>
     <Field label="Label text (shelf / pack)"><input aria-label="Label text" value={label} maxLength={80} onChange={event => { setLabel(event.target.value); invalidateSavedPreview() }} placeholder="e.g. Rack A-04"/></Field>
     <Field label="Quantity"><input aria-label="Label quantity" type="number" min="1" max="200" step="1" value={quantity} onChange={event => { setQuantity(event.target.value); invalidateSavedPreview() }}/></Field>
     <Field label="Label template"><select aria-label="Label template" value={template} onChange={event => { setTemplate(event.target.value as BarcodeTemplate); invalidateSavedPreview() }}>{templates.map(option => <option key={option}>{option}</option>)}</select></Field>
     <Field label="Label size"><select aria-label="Label size" value={size} onChange={event => { setSize(event.target.value); invalidateSavedPreview() }}>{labelSizes.map(option => <option key={option}>{option}</option>)}</select></Field>
     <Field label="Sheet type"><select aria-label="Sheet type" value={sheetType} onChange={event => { setSheetType(event.target.value); if (event.target.value.startsWith('A4 (3')) setSize('40 × 20 mm'); else setSize('50 × 25 mm'); invalidateSavedPreview() }}>{sheetTypes.map(option => <option key={option}>{option}</option>)}</select></Field>
     <label className="barcode-toggle"><input type="checkbox" checked={includePrice || template === 'With Price'} disabled={template === 'With Price'} onChange={event => { setIncludePrice(event.target.checked); invalidateSavedPreview() }}/><span>Include discounted selling price</span></label>
     <Field label="Notes (optional)"><input aria-label="Barcode notes" value={notes} maxLength={120} onChange={event => { setNotes(event.target.value); invalidateSavedPreview() }} placeholder="Batch or shelf note"/></Field>
    </div>
    <div className="barcode-builder-footer"><span><SlidersHorizontal size={15}/>Code 128 · {perSheet} labels per A4 sheet</span><Button variant="primary" onClick={() => void generate()} disabled={!product}><Barcode size={15}/>Generate & save label</Button></div>
    <p className="muted barcode-help">The barcode is saved with this product and unit so billing scanners can find it.</p>
   </Card>

   <Card className="barcode-live-card">
    <div className="barcode-card-heading"><div className="barcode-heading-icon"><Search size={19}/></div><div><h2>Live preview</h2><p>Review the label before printing.</p></div><Badge tone={saved ? 'green' : 'amber'}>{saved ? 'Saved' : 'Preview'}</Badge></div>
    {product && selectedBatch ? <div className="barcode-live-wrap">
     <div className="barcode-live-label"><div className="barcode-label-brand"><img src={logoUrl} alt="Vinay Traders"/><span>VINAY TRADERS</span></div><strong>{product.name}</strong><span>{product.variant || product.size || 'Standard'} · {unit}</span>{(includePrice || template === 'With Price')&&<b className="barcode-label-price">{formatCurrency(product.sellingRate*(1-(product.defaultDiscount??0)/100))}</b>}<svg ref={previewSvg} aria-label={`Barcode ${barcode}`}/><small>{label || product.sku || barcode}</small></div>
     <div className="barcode-live-meta"><span><strong>Code</strong><code>{barcode}</code></span><span><strong>Quantity</strong><b>{Math.max(1,Math.min(200,Number(quantity)||1))} labels</b></span><span><strong>Template</strong><b>{template}</b></span></div>
     <Button onClick={downloadSvg} disabled={!saved}><Download size={15}/>Download SVG</Button>
    </div> : <div className="empty-state"><Barcode size={34}/><h3>Select a product</h3><p>Choose an inventory product to build a label.</p></div>}
   </Card>
  </div>

  {printTarget && <Card className="barcode-sheet-preview-card">
   <div className="section-title"><div><h2>Printable sheet preview</h2><p>{printTarget.quantity} copies · {printTarget.size} · {printTarget.sheetType}</p></div><Button onClick={() => window.print()}><Printer size={15}/>Print labels</Button></div>
   <div className="barcode-screen-sheet">
    {(previewPages[0] ?? []).map((batch, index) => <BarcodeLabel batch={batch} compact key={`${batch.value}-${index}`}/>)}
    {printTarget.quantity > 16 && <p className="barcode-more-labels">Showing the first 16 labels; print includes all {printTarget.quantity} copies.</p>}
   </div>
   </Card>}

  <Card className="barcode-history-card">
   <div className="barcode-history-heading"><div><h2>Recent generated labels</h2><p>Saved barcode values remain linked to their inventory product.</p></div><label className="barcode-history-search"><Search size={15}/><input aria-label="Search generated labels" value={historyQuery} onChange={event => setHistoryQuery(event.target.value)} placeholder="Search labels…"/></label></div>
   {jobs.length ? <div className="table-wrap"><table className="data-table barcode-history-table"><thead><tr><th>Product</th><th>Unit</th><th>Label text</th><th>Template</th><th>Qty</th><th>Generated on</th><th>Status</th><th>Actions</th></tr></thead><tbody>
   {jobs.map(job => <tr key={job.id}><td><strong>{job.product.name}</strong><small>{job.product.variant || job.product.size}</small></td><td>{job.entry.unit}</td><td><code>{job.entry.label || job.entry.value}</code></td><td>{job.entry.template ?? 'Standard'}</td><td>{job.entry.quantity ?? 1}</td><td>{job.entry.createdAt ? formatDate(job.entry.createdAt) : '—'}</td><td><Badge tone={job.duplicate?'red':'green'}>{job.duplicate?'Duplicate code':'Generated'}</Badge></td><td><Button variant="ghost" disabled={job.duplicate} title={job.duplicate?'This code is assigned to another product or unit. Generate a replacement from the label builder.':undefined} onClick={() => openJob(job)}>Preview / print</Button></td></tr>)}
   </tbody></table></div> : <div className="empty-state"><Package size={30}/><h3>No generated labels</h3><p>Generate a label to save it to your inventory and history.</p></div>}
  </Card>

  {printTarget && createPortal(<div className="barcode-print-document" aria-label="Printable barcode label sheet">
    {printPages.map((page, pageIndex) => <div className="barcode-print-page" key={`${printTarget.value}-${pageIndex}`} style={{ gridTemplateColumns: `repeat(${sheetColumns}, ${printTarget.size.match(/\d+/gu)?.[0] ?? 50}mm)`, gridAutoRows: `${printTarget.size.match(/\d+/gu)?.[1] ?? 25}mm` }}>
    {page.map((batch, index) => <BarcodeLabel batch={batch} key={`${batch.value}-${pageIndex}-${index}`}/>)}
   </div>)}
  </div>, document.body)}
 </div>
}
