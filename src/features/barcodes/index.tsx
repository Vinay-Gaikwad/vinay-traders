import { useEffect, useRef, useState } from 'react'
import { Barcode, Download, Printer, RefreshCw } from 'lucide-react'
import JsBarcode from 'jsbarcode'
import { Button, Card, Field, PageHeader, SearchableSelect, SectionTitle, toast } from '../../components/ui'
import { useData } from '../../services/data'
import type { Product, Unit } from '../../types'

const codeFor = (product: Product, unit: Unit, products: Product[]) => {
 const prefix = `${product.sku}-${unit.replace(/[^a-z0-9]/gi, '').toUpperCase()}`
 const used = new Set(products.flatMap(item => [item.barcode, ...(item.barcodes ?? []).map(entry => entry.value)]).filter(Boolean))
 let counter = Date.now() % 100000
 let value = `${prefix}-${String(counter).padStart(5, '0')}`
 while (used.has(value)) value = `${prefix}-${String(++counter % 100000).padStart(5, '0')}`
 return value
}

export function BarcodePage() {
 const { data, mutate } = useData()
 const [productId, setProductId] = useState(data.products[0]?.id ?? '')
 const [unit, setUnit] = useState<Unit>(data.products[0]?.salesUnit ?? 'Piece')
 const [label, setLabel] = useState('')
 const [value, setValue] = useState('')
 const svgRef = useRef<SVGSVGElement>(null)
 const product = data.products.find(item => item.id === productId)
 useEffect(() => { if (value && svgRef.current) JsBarcode(svgRef.current, value, { format: 'CODE128', displayValue: true, height: 72, margin: 12, fontSize: 15, lineColor: '#16252d' }) }, [value])
 const generate = async () => {
  if (!product) return
  const barcode = value || codeFor(product, unit, data.products)
  const duplicate = data.products.some(item => item.id !== product.id && [item.barcode, ...(item.barcodes ?? []).map(entry => entry.value)].includes(barcode))
  if (duplicate) { toast.error('That barcode is already assigned to another product.'); return }
  await mutate(current => ({ ...current, products: current.products.map(item => item.id === product.id ? { ...item, barcode: item.barcode || barcode, barcodes: [...(item.barcodes ?? []).filter(entry => entry.value !== barcode), { value: barcode, unit, label: label.trim() || undefined, createdAt: new Date().toISOString() }] } : item) }))
  setValue(barcode)
  toast.success(`Barcode added to ${product.name}`)
 }
 return <div className="page-stack"><PageHeader title="Barcode labels" description="Create unit-specific Code 128 labels and keep them attached to inventory products." actions={<><Button onClick={() => window.print()}><Printer size={15}/>Print labels</Button><Button variant="primary" onClick={() => { setValue(''); setLabel('') }}><RefreshCw size={15}/>New label</Button></>} /><div className="grid-2 barcode-layout"><Card><SectionTitle>Generate barcode</SectionTitle><div className="form-grid"><Field label="Inventory product"><SearchableSelect value={productId} onChange={id => { setProductId(id); setValue(''); const selected = data.products.find(item => item.id === id); if (selected) setUnit(selected.salesUnit) }} options={data.products.map(item => ({ value: item.id, label: `${item.name} · ${item.variant || item.size}` }))} ariaLabel="Product" placeholder="Select a product"/></Field><Field label="Unit"><select value={unit} onChange={event => { setUnit(event.target.value as Unit); setValue('') }}>{[...new Set([product?.salesUnit, product?.purchaseUnit, 'Piece', 'Box', 'Meter', 'KG', 'Roll'])].filter(Boolean).map(option => <option key={option}>{option}</option>)}</select></Field><Field label="Label text (optional)"><input value={label} onChange={event => setLabel(event.target.value)} placeholder="Shelf or pack label"/></Field><div className="form-actions"><Button variant="primary" onClick={() => void generate()} disabled={!product}><Barcode size={16}/>Generate and add to inventory</Button></div></div><p className="muted barcode-help">Use the generated value with a USB/Bluetooth scanner in Billing. Each product/unit variant can have its own label.</p></Card><Card className="barcode-preview-card"><SectionTitle>Preview</SectionTitle>{value ? <div className="barcode-preview"><svg ref={svgRef}/><strong>{product?.name}</strong><span>{label || `${product?.variant || product?.size || ''} · ${unit}`}</span><small>{value}</small><Button onClick={() => { const svg = svgRef.current; if (!svg) return; const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${product?.sku ?? 'barcode'}.svg`; anchor.click(); URL.revokeObjectURL(url) }}><Download size={15}/>Download SVG</Button></div> : <div className="empty-state"><Barcode size={34}/><h3>Ready to generate</h3><p>Choose a product and unit to create a scannable label.</p></div>}</Card></div></div>
}
