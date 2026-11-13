import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { logoUrl } from '../assets/brand'
import type { Invoice, InvoiceReturn, Payment, Product, Purchase, Quotation, Supplier, Worker } from '../types'
import type { calculatePayroll } from './payroll'
import { formatCurrency, formatDate } from './format'

export type PdfRow = Record<string, string | number | null | undefined>
type ReportDetails = { businessName?: string; address?: string; mobile?: string; email?: string; gstin?: string }
const safeFilename = (value: string) => value.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'report'
const pdfSafeText = (value: string) => value.replace(/[·•\u2010-\u2015\u2212]/gu, '-').replace(/\u00a0/gu, ' ')
const displayValue = (value: unknown) => value === null || value === undefined || value === '' ? '-' : pdfSafeText(String(value).replace(/₹\s?/gu, 'Rs. '))
// jsPDF's built-in Helvetica does not contain the Indian rupee glyph. Use an
// explicit currency label in exported PDFs so print and preview always agree.
const pdfCurrency = (value: number) => formatCurrency(value).replace(/^₹\s*/u, 'Rs. ')
const blue: [number, number, number] = [11, 43, 83]
const orange: [number, number, number] = [242, 139, 18]

async function logoData(): Promise<string | undefined> {
 try {
  const response = await fetch(logoUrl)
  if (!response.ok) return undefined
  const blob = await response.blob()
  return await new Promise(resolve => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => resolve(undefined); reader.readAsDataURL(blob) })
 } catch { return undefined }
}

function brandHeader(doc: jsPDF, title: string, details: ReportDetails, landscape: boolean, logo?: string, meta = '') {
 const width = doc.internal.pageSize.getWidth(), margin = 13
 doc.setFillColor(...blue); doc.rect(0, 0, width, 48, 'F')
 doc.setFillColor(...orange); doc.rect(0, 48, width, 1.4, 'F')
 if (logo) { try { doc.addImage(logo, 'PNG', margin, 4.5, 23, 23, undefined, 'FAST') } catch { /* allow exports if the logo is not a PNG */ } }
 const x = logo ? 41 : margin
 const detailsWidth = Math.max(35, width - x - margin - width * .33 - 5)
 const businessLines = [details.address, details.mobile, details.email].filter((line): line is string => Boolean(line)).flatMap(line => doc.splitTextToSize(pdfSafeText(line), detailsWidth))
 doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(17); doc.text(pdfSafeText(details.businessName || 'VINAY TRADERS'), x, 12)
 doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.text('Hardware & Plumbing Supplies', x, 18)
 doc.setFontSize(6.7); doc.text(businessLines.slice(0, 6), x, 24)
 doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.text(pdfSafeText(title.toUpperCase()), width - margin, 12, { align: 'right', maxWidth: width * .33 })
 doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.text(pdfSafeText(meta || `Generated ${new Date().toLocaleString('en-IN')}`), width - margin, 22, { align: 'right' })
 return { width, margin, startY: landscape ? 56 : 54 }
}

function footer(doc: jsPDF, details: ReportDetails) {
 const total = doc.getNumberOfPages()
 for (let page = 1; page <= total; page++) {
  doc.setPage(page); const width = doc.internal.pageSize.getWidth(), height = doc.internal.pageSize.getHeight()
  doc.setDrawColor(205, 215, 227); doc.setLineWidth(.25); doc.line(13, height - 10, width - 13, height - 10)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(92, 105, 122)
  doc.text(`${pdfSafeText(details.businessName || 'Vinay Traders')}  |  Computer generated document`, 13, height - 6)
  doc.text(`Page ${page} of ${total}`, width - 13, height - 6, { align: 'right' })
 }
}

function currentPageNumber(doc: jsPDF) {
 return (doc.internal as unknown as { getCurrentPageInfo: () => { pageNumber: number } }).getCurrentPageInfo().pageNumber
}

function download(doc: jsPDF, title: string) { doc.save(`${safeFilename(title)}-${new Date().toISOString().slice(0, 10)}.pdf`) }

/** Download a branded A4 landscape register with repeated table headings and readable values. */
export async function printPdfReport(title: string, rows: PdfRow[], details?: ReportDetails, options: { orientation?: 'portrait' | 'landscape'; summary?: PdfRow; outputName?: string; columnWidths?: number[]; reserveSummarySpace?: boolean } = {}) {
 const shop = { businessName: 'VINAY TRADERS', address: 'Shirala, Maharashtra', ...details }
 const orientation = options.orientation ?? 'landscape'
 const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' }), logo = await logoData()
 const { width, margin, startY } = brandHeader(doc, title, shop, orientation === 'landscape', logo)
 const columns = Object.keys(rows[0] ?? {})
 if (columns.length) autoTable(doc, { startY, head: [columns], body: rows.map(row => columns.map(column => displayValue(row[column]))), styles: { fontSize: orientation === 'landscape' ? 8 : 8.5, cellPadding: orientation === 'landscape' ? 1.2 : 2.2, overflow: 'linebreak', textColor: [31, 41, 55], lineColor: [205, 215, 227], lineWidth: .2 }, columnStyles: Object.fromEntries((options.columnWidths??[]).map((cellWidth,index)=>[index,{cellWidth}])), headStyles: { fillColor: blue, textColor: [255, 255, 255], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [245, 248, 252] }, margin: { left: margin, right: margin, top: startY, bottom: options.reserveSummarySpace ? 39 : 16 }, didParseCell: cell => { if (cell.section !== 'body' || columns[cell.column.index] !== 'Status') return; const status = String(cell.cell.raw ?? '').toLowerCase(); if (['paid', 'settled', 'success'].includes(status)) { cell.cell.styles.fillColor = [226, 248, 234]; cell.cell.styles.textColor = [22, 112, 67] } else if (['partial', 'pending'].includes(status)) { cell.cell.styles.fillColor = [255, 244, 218]; cell.cell.styles.textColor = [153, 93, 0] } else if (['due', 'unpaid', 'credit'].includes(status)) { cell.cell.styles.fillColor = [255, 232, 232]; cell.cell.styles.textColor = [165, 36, 36] } }, theme: 'grid', showHead: 'everyPage', willDrawPage: () => { if (currentPageNumber(doc) > 1) brandHeader(doc, title, shop, orientation === 'landscape', logo) } })
 else { doc.setTextColor(91, 100, 114); doc.setFontSize(11); doc.text('No records found for this report.', margin, startY + 5) }
 if (options.summary && Object.keys(options.summary).length) {
  const y = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? startY
  const pageHeight = doc.internal.pageSize.getHeight()
  let summaryY = y + 4
  if (summaryY + Object.keys(options.summary).length * 7 > pageHeight - 18) {
   doc.addPage()
   brandHeader(doc, title, shop, orientation === 'landscape', logo)
   summaryY = startY
  }
  autoTable(doc, { startY: summaryY, body: Object.entries(options.summary).map(([key, value]) => [key, displayValue(value)]), theme: 'plain', styles: { fontSize: options.reserveSummarySpace ? 8 : 9, cellPadding: options.reserveSummarySpace ? 1.3 : 2.5, fontStyle: 'bold' }, columnStyles: { 0: { cellWidth: width * .27, textColor: blue }, 1: { halign: 'right' } }, margin: { left: margin, right: margin } })
 }
 // Reapply the branded header after pagination, including any summary-only
 // continuation page added after the table reaches the bottom of A4.
 const reportPages = doc.getNumberOfPages()
 for (let page = 1; page <= reportPages; page++) {
  doc.setPage(page)
  brandHeader(doc, title, shop, orientation === 'landscape', logo)
 }
 footer(doc, shop); download(doc, options.outputName ?? title)
}

/** A4 portrait supplier purchase invoice, with clear supplier, products, payment and totals sections. */
export async function purchaseInvoicePdf(purchase: Purchase, supplier: Supplier | undefined, details: ReportDetails) {
 const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }), logo = await logoData()
 const shop = { businessName: 'VINAY TRADERS', address: 'Shirala, Maharashtra', ...details }, { width, margin } = brandHeader(doc, 'Purchase Invoice', shop, false, logo, `Purchase ${purchase.number}  |  ${formatDate(purchase.invoiceDate || purchase.date)}`)
 const cardTop = 55, half = (width - 2 * margin - 5) / 2
 const supplierLines = [supplier?.name || 'Supplier not available', supplier?.mobile ? `Mobile: ${supplier.mobile}` : '', supplier?.address || ''].filter(Boolean)
 const purchaseLines = [
  `Purchase No.: ${purchase.number}`, `Supplier invoice: ${purchase.supplierInvoice || '-'}`,
  `Invoice date: ${formatDate(purchase.invoiceDate || purchase.date)}`,
  `Due date: ${formatDate(purchase.dueDate)}`, `Payment type: ${purchase.paymentMethod}`,
  `Status: ${Number(purchase.totals?.due) <= 0 ? 'Paid' : Number(purchase.totals?.paid) > 0 ? 'Partial' : 'Due'}`,
 ]
 doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5)
 const wrap = (values:string[]) => values.flatMap(value => doc.splitTextToSize(pdfSafeText(value), half - 7) as string[])
 const leftLines=wrap(supplierLines), rightLines=wrap(purchaseLines)
 const cardHeight=Math.max(44, 13+Math.max(leftLines.length,rightLines.length)*4.7)
 doc.setDrawColor(198, 211, 227); doc.setFillColor(246, 249, 253)
 doc.roundedRect(margin, cardTop, half, cardHeight, 2, 2, 'FD')
 doc.roundedRect(margin+half+5, cardTop, half, cardHeight, 2, 2, 'FD')
 doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...blue)
 doc.text('SUPPLIER DETAILS', margin + 3, cardTop + 6)
 doc.text('PURCHASE DETAILS', margin + half + 8, cardTop + 6)
 doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(35, 48, 62)
 leftLines.forEach((line, index) => doc.text(line, margin+3, cardTop+12+index*4.7))
 rightLines.forEach((line, index) => doc.text(line, margin+half+8, cardTop+12+index*4.7))
 const items = Array.isArray(purchase.items) ? purchase.items : []
 autoTable(doc, { startY: cardTop + cardHeight + 6, head: [['Sr.', 'Product', 'Variant / Size', 'Qty', 'Unit', 'Rate', 'Discount', 'Amount']], body: items.map((item, i) => [i + 1, pdfSafeText(item.name), pdfSafeText(item.variant || '-'), item.quantity, item.unit, pdfCurrency(item.rate), `${item.discount || 0}%`, pdfCurrency(item.quantity * item.rate * (1 - (item.discount || 0) / 100))]), styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', lineColor: [205, 215, 227], lineWidth: .2 }, headStyles: { fillColor: blue, textColor: [255, 255, 255], fontStyle: 'bold' }, alternateRowStyles: { fillColor: [246, 249, 253] }, columnStyles: { 0: { cellWidth: 9 }, 1: { cellWidth: 39 }, 2: { cellWidth: 30 }, 3: { cellWidth: 13, halign: 'right' }, 4: { cellWidth: 14 }, 5: { cellWidth: 23, halign: 'right' }, 6: { cellWidth: 18, halign: 'right' }, 7: { halign: 'right' } }, margin: { left: margin, right: margin, top: 54, bottom: 16 }, showHead: 'everyPage', willDrawPage: () => { if (currentPageNumber(doc) > 1) brandHeader(doc, 'Purchase Invoice', shop, false, logo, `Purchase ${purchase.number}  |  ${formatDate(purchase.invoiceDate || purchase.date)}`) } })
 let y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100) + 7
 const totals = purchase.totals ?? { subtotal: 0, discount: 0, grandTotal: 0, paid: 0, due: 0 }
 // Keep the summary, remarks and signature block together instead of leaving
 // only remarks/signatures stranded at the bottom of a mostly empty page.
 if (y + 55 > 250) { doc.addPage(); brandHeader(doc, 'Purchase Invoice', shop, false, logo, `Purchase ${purchase.number}  |  ${formatDate(purchase.invoiceDate || purchase.date)}`); y = 60 }
 const x = width - margin - 77
 doc.setDrawColor(198, 211, 227); doc.roundedRect(x, y, 77, 40, 2, 2)
 const summary = [['Subtotal', totals.subtotal], ['Discount', totals.discount], ['Grand total', totals.grandTotal], ['Paid', totals.paid], ['Due', totals.due]] as const
 summary.forEach(([label, amount], i) => { const yy = y + 7 + i * 6.4; if (label === 'Grand total') { doc.setFillColor(...orange); doc.roundedRect(x + .4, yy - 4.4, 76.2, 6.6, 1, 1, 'F') }; doc.setFont('helvetica', label === 'Grand total' ? 'bold' : 'normal'); doc.setFontSize(8.5); doc.setTextColor(...(label === 'Grand total' ? blue : [35, 48, 62] as [number, number, number])); doc.text(label, x + 4, yy); doc.text(pdfCurrency(amount), x + 73, yy, { align: 'right' }) })
 doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(70, 80, 93)
 const remarksLines = doc.splitTextToSize(pdfSafeText(`Remarks: ${purchase.notes || '-'}`), width - 2 * margin)
 let remarksY = y + 48
 if (remarksY + remarksLines.length * 4 > 250) { doc.addPage(); brandHeader(doc, 'Purchase Invoice', shop, false, logo, `Purchase ${purchase.number}  |  ${formatDate(purchase.invoiceDate || purchase.date)}`); remarksY = 60 }
 doc.text(remarksLines, margin, remarksY)
 const signatureY = 264, lineWidth = (width - 2 * margin - 24) / 2
 doc.setDrawColor(128, 141, 159); doc.line(margin, signatureY, margin + lineWidth, signatureY); doc.line(width - margin - lineWidth, signatureY, width - margin, signatureY)
 doc.setFontSize(7.5); doc.setTextColor(70, 80, 93); doc.text('Prepared by: Vinay Traders', margin + lineWidth / 2, signatureY + 5, { align: 'center' }); doc.text('Authorized signature', width - margin - lineWidth / 2, signatureY + 5, { align: 'center' })
 // Draw headers after autoTable has finished pagination. This keeps manually
 // added continuation pages branded consistently with table continuation pages.
 const pageCount = doc.getNumberOfPages()
 for (let page = 1; page <= pageCount; page++) {
  doc.setPage(page)
  brandHeader(doc, 'Purchase Invoice', shop, false, logo, `Purchase ${purchase.number}  |  ${formatDate(purchase.invoiceDate || purchase.date)}`)
 }
 footer(doc, shop); download(doc, `purchase-invoice-${purchase.number}`)
}

export async function purchaseRegisterPdf(rows: PdfRow[], details: ReportDetails) {
 const sum = (key: string) => rows.reduce((total, row) => total + (Number(row[key]) || 0), 0)
 const printableRows = rows.map((row, index) => {
  const paid = Number(row.Paid) || 0, due = Number(row.Due) || 0
  return {
   'Sr. No.': row['Sr. No.'] ?? index + 1,
   'Purchase No.': row['Purchase No.'] ?? '-',
   Date: row.Date ?? '-',
   Supplier: row.Supplier ?? '-',
   'Supplier Invoice No.': row['Supplier Invoice No.'] ?? '-',
   'Items Count': row['Items Count'] ?? 0,
   'Grand total': pdfCurrency(Number(row['Grand total']) || 0),
   Paid: pdfCurrency(paid),
   Due: pdfCurrency(due),
   Status: due <= 0 ? 'Paid' : paid > 0 ? 'Partial' : 'Due',
  }
 })
 return printPdfReport('Purchase Register', printableRows, details, { orientation: 'landscape', columnWidths: [10,28,22,36,39,17,29,26,26,18], reserveSummarySpace: true, summary: { 'Total records': rows.length, 'Total amount': pdfCurrency(sum('Grand total')), 'Total paid': pdfCurrency(sum('Paid')), 'Total due': pdfCurrency(sum('Due')) } })
}

export async function productPurchaseReportPdf(products: Product[], details: ReportDetails) {
 const rows = products.map((product, index) => ({ 'Sr. No.': index + 1, Product: product.name, 'Variant / Size': product.variant || product.size || '-', Qty: product.stock, Unit: product.salesUnit, Rate: pdfCurrency(product.purchaseRate), Amount: pdfCurrency(product.stock * product.purchaseRate) }))
 const totalQuantity = products.reduce((sum, product) => sum + product.stock, 0), totalAmount = products.reduce((sum, product) => sum + product.stock * product.purchaseRate, 0)
 return printPdfReport('Product / Purchase Report', rows, details, { orientation: 'landscape', columnWidths: [11,63,61,25,26,43,35], summary: { 'Total products': products.length, 'Total quantity': totalQuantity, 'Grand total amount': pdfCurrency(totalAmount) } })
}
/**
 * Professional A4 worker salary slip.
 * The full earned salary remains visible after payment; only unpaid balance
 * goes to zero. This is a historical accounting document, not an edit form.
 */
export async function workerPayslipPdf(
 worker: Worker,
 period: string,
 payroll: ReturnType<typeof calculatePayroll>,
 payments: Payment[],
 details: ReportDetails
) {
 const shop = { businessName: 'VINAY TRADERS', address: 'Shirala, Maharashtra', ...details }
 const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
 const logo = await logoData()
 const { width, margin } = brandHeader(doc, 'SALARY SLIP', shop, false, logo, period)
 const safePeriod = /^\d{4}-\d{2}$/.test(period) ? period : '-'
 const paymentRows = payments
  .filter(row => row.entityType === 'worker' && row.entityId === worker.id && (row.kind ?? 'Payment') === 'Payment' && (row.period ?? row.date.slice(0, 7)) === period)
  .sort((a, b) => a.date.localeCompare(b.date))
 const payType = worker.salaryType === 'Monthly Fixed' ? 'Monthly fixed' : 'Daily wage'
 const detailRows = [
  ['Worker', worker.name], ['Role', worker.role || '-'],
  ['Pay period', safePeriod], ['Salary type', payType],
  ['Attendance', String(payroll.present) + ' present; ' + String(payroll.paidDays) + ' paid days'],
  ['Payment status', payroll.balance <= .001 ? 'Paid / Settled' : payroll.paid > 0 ? 'Part-paid' : 'Pending']
 ]
 autoTable(doc, {
  startY: 56, body: detailRows.map(row => row.map(pdfSafeText)),
  theme: 'grid', styles: { fontSize: 9, cellPadding: 3, lineColor: [214, 226, 240], lineWidth: .2 },
  columnStyles: { 0: { cellWidth: 43, fillColor: [244, 248, 253], textColor: blue, fontStyle: 'bold' }, 1: { cellWidth: width - 2 * margin - 43 } },
  margin: { left: margin, right: margin }
 })
 let y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 98) + 8
 doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...blue)
 doc.text('EARNINGS AND ADJUSTMENTS', margin, y)
 y += 3
 const payRows: [string, string][] = [
  ['Basic pay earned', pdfCurrency(payroll.basicPay)],
  ['Overtime pay', pdfCurrency(payroll.overtimePay)],
  ['Bonus (including scheduled periods)', pdfCurrency(payroll.bonus)],
  ['Advance deducted', '- ' + pdfCurrency(payroll.advance)],
  ['Other deductions', '- ' + pdfCurrency(payroll.deduction)]
 ]
 autoTable(doc, {
  startY: y, body: payRows.map(row => row.map(pdfSafeText)), theme: 'grid',
  styles: { fontSize: 9, cellPadding: 3, lineColor: [214, 226, 240], lineWidth: .2 },
  columnStyles: { 0: { cellWidth: 112 }, 1: { halign: 'right', fontStyle: 'bold' } },
  alternateRowStyles: { fillColor: [246, 249, 253] },
  margin: { left: margin, right: margin }
 })
 y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 7
 doc.setFillColor(...blue); doc.roundedRect(margin, y, width - 2 * margin, 14, 2, 2, 'F')
 doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10)
 doc.text('NET SALARY EARNED', margin + 5, y + 9)
 doc.text(pdfCurrency(payroll.netPay), width - margin - 5, y + 9, { align: 'right' })
 y += 22
 doc.setTextColor(...blue); doc.setFontSize(11); doc.text('PAYMENTS RECORDED', margin, y)
 y += 3
 const paymentTable = paymentRows.length
  ? paymentRows.map(row => [formatDate(row.date), row.method, row.reference || '-', pdfCurrency(row.amount)])
  : [['-', '-', 'No payments for this period', pdfCurrency(0)]]
 autoTable(doc, {
  startY: y, head: [['Date', 'Method', 'Reference', 'Amount paid']],
  body: paymentTable.map(row => row.map(pdfSafeText)), theme: 'grid',
  styles: { fontSize: 8.5, cellPadding: 2.7, overflow: 'linebreak', lineColor: [214, 226, 240], lineWidth: .2 },
  headStyles: { fillColor: blue, textColor: [255, 255, 255] },
  alternateRowStyles: { fillColor: [246, 249, 253] },
  columnStyles: { 0: { cellWidth: 31 }, 1: { cellWidth: 28 }, 2: { cellWidth: 74 }, 3: { halign: 'right' } },
  margin: { left: margin, right: margin, top: 56, bottom: 22 },
  showHead: 'everyPage',
  willDrawPage: () => {
   if (currentPageNumber(doc) > 1) brandHeader(doc, 'SALARY SLIP', shop, false, logo, period)
  }
 })
 y = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? y) + 8
 if (y > 245) {
  doc.addPage()
  brandHeader(doc, 'SALARY SLIP', shop, false, logo, period)
  y = 58
 }
 autoTable(doc, {
  startY: y,
  body: [
   ['Total salary earned', pdfCurrency(payroll.netPay)],
   ['Total paid this period', pdfCurrency(payroll.paid)],
   ['Remaining salary payable', pdfCurrency(payroll.balance)]
  ],
  theme: 'grid',
  styles: { fontSize: 10, fontStyle: 'bold', cellPadding: 3, lineColor: [214, 226, 240], lineWidth: .2 },
  columnStyles: { 0: { cellWidth: 112 }, 1: { halign: 'right' } },
  didParseCell: cell => {
   if (cell.row.index === 2) {
    cell.cell.styles.fillColor = payroll.balance <= .001 ? [224, 247, 235] : [255, 243, 219]
    cell.cell.styles.textColor = payroll.balance <= .001 ? [24, 110, 74] : [159, 92, 0]
   }
  },
  margin: { left: margin, right: margin }
 })
 footer(doc, shop)
 download(doc, 'salary-slip-' + worker.name + '-' + safePeriod)
}
/** Original sale and revised sale stacked in order, with a return audit and refund summary. */
export async function returnComparisonPdf(original: Invoice, revised: Invoice, record: InvoiceReturn, details: ReportDetails) {
 const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }), logo = await logoData()
 const shop = { businessName: 'VINAY TRADERS', address: 'Shirala, Maharashtra', ...details }
 const { width, margin } = brandHeader(doc, 'BILL RETURN & REVISION', shop, false, logo, record.number)
 let y = 57
 const section = (title: string, bill: Invoice, start: number) => {
  if (start > 235) {
   doc.addPage()
   brandHeader(doc, 'BILL RETURN & REVISION', shop, false, logo, record.number)
   start = 58
  }
  doc.setFillColor(...blue)
  doc.roundedRect(margin, start, width - 2 * margin, 9, 1.5, 1.5, 'F')
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(255,255,255)
  doc.text(title, margin+4, start+6)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(35,48,62)
  const info = 'Bill ' + bill.number + '  |  ' + formatDate(bill.date) + '  |  Customer: ' + bill.customerName
  doc.text(doc.splitTextToSize(pdfSafeText(info), width - 2 * margin), margin, start + 15)
  autoTable(doc, {
   startY: start+21,
   head: [['#','Product','Variant','Qty','Unit','Rate','Amount']],
   body: bill.items.map((item,index)=>[index+1,pdfSafeText(item.name),pdfSafeText(item.variant||'-'),item.quantity,item.unit,pdfCurrency(item.rate),pdfCurrency(item.quantity*item.rate*(1-(item.discount||0)/100))]),
   theme:'grid',
   styles:{fontSize:8,cellPadding:2.3,overflow:'linebreak',lineColor:[209,220,234],lineWidth:.2},
   headStyles:{fillColor:blue,textColor:[255,255,255]},
   alternateRowStyles:{fillColor:[245,248,252]},
   columnStyles:{0:{cellWidth:8},1:{cellWidth:47},2:{cellWidth:31},3:{cellWidth:14,halign:'right'},4:{cellWidth:16},5:{cellWidth:24,halign:'right'},6:{halign:'right'}},
   margin:{left:margin,right:margin,top:56,bottom:21},
   showHead:'everyPage',
   willDrawPage:()=>{if(currentPageNumber(doc)>1) brandHeader(doc,'BILL RETURN & REVISION',shop,false,logo,record.number)}
  })
  let totalY = ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? start+30)+5
  if(totalY>245){doc.addPage();brandHeader(doc,'BILL RETURN & REVISION',shop,false,logo,record.number);totalY=58}
  autoTable(doc, {
   startY:totalY,
   body:[['Bill total',pdfCurrency(bill.totals.grandTotal)],['Amount paid',pdfCurrency(bill.totals.paid)],['Amount due',pdfCurrency(bill.totals.due)]],
   theme:'grid',
   styles:{fontSize:8.7,cellPadding:2.1,lineColor:[207,219,234],lineWidth:.2},
   columnStyles:{0:{cellWidth:width-2*margin-50,textColor:blue,fontStyle:'bold'},1:{halign:'right',fontStyle:'bold'}},
   margin:{left:margin,right:margin}
  })
  return ((doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? totalY+18)+10
 }
 y = section('ORIGINAL BILL - BEFORE RETURN', original, y)
 y = section('REVISED BILL - AFTER RETURN', revised, y)
 if(y>222){doc.addPage();brandHeader(doc,'BILL RETURN & REVISION',shop,false,logo,record.number);y=59}
 doc.setFillColor(247,249,252);doc.setDrawColor(204,216,230)
 doc.roundedRect(margin,y,width-2*margin,38,2,2,'FD')
 doc.setTextColor(...blue);doc.setFont('helvetica','bold');doc.setFontSize(9)
 doc.text('RETURN & REFUND ACCOUNT',margin+4,y+7)
 doc.setFont('helvetica','normal');doc.setTextColor(39,52,69)
 doc.text('Items returned: '+record.items.reduce((sum,item)=>sum+item.quantity,0),margin+4,y+15)
 doc.text('Return amount: '+pdfCurrency(record.amount),width-margin-4,y+15,{align:'right'})
 doc.text('Commission reversed: '+pdfCurrency(record.commissionReversed),margin+4,y+23)
 doc.text('Refund recorded: '+pdfCurrency(record.refundPaid??0),width-margin-4,y+23,{align:'right'})
 doc.text('Refund still due: '+pdfCurrency(Math.max(0,(record.refundDue??0)-(record.refundPaid??0))),margin+4,y+31)
 footer(doc,shop)
 download(doc,'return-comparison-'+original.number)
}
/** A4 vector quotation export with repeated headers; no screenshot slices or GST. */
export async function quotationPdf(quote: Quotation, details: ReportDetails) {
 const shop = { businessName: 'VINAY TRADERS', address: 'Shirala, Maharashtra', ...details }
 const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
 const logo = await logoData()
 const { width, margin } = brandHeader(doc, 'QUOTATION', shop, false, logo, quote.number)
 const w = width - 2 * margin
 doc.setFillColor(247, 250, 254); doc.setDrawColor(204, 215, 231)
 doc.roundedRect(margin, 55, w, 40, 2, 2, 'FD')
 doc.setFont('helvetica', 'bold'); doc.setTextColor(...blue); doc.setFontSize(9)
 doc.text('CUSTOMER', margin + 4, 62)
 doc.text('QUOTATION DETAILS', margin + w * .52, 62)
 doc.setFont('helvetica', 'normal'); doc.setFontSize(8.3); doc.setTextColor(39, 52, 69)
 const customerLines = [quote.customerName || 'Walk-in customer', quote.customerMobile ? 'Mobile: ' + quote.customerMobile : '', quote.customerAddress || ''].filter(Boolean).flatMap(line => doc.splitTextToSize(pdfSafeText(line), w * .45))
 doc.text(customerLines.slice(0, 5), margin + 4, 69)
 ;['Number: ' + quote.number, 'Date: ' + formatDate(quote.date), 'Valid until: ' + formatDate(quote.validUntil), 'Status: ' + quote.status]
  .forEach((line,i) => doc.text(pdfSafeText(line), margin + w * .52, 69 + i * 5, { maxWidth: w * .44 }))
 autoTable(doc, {
  startY: 101,
  head: [['Sr.', 'Product', 'Variant / Size', 'Qty', 'Unit', 'Rate', 'Discount', 'Amount']],
  body: quote.items.map((item,i) => [i+1,pdfSafeText(item.name),pdfSafeText(item.variant||'-'),item.quantity,item.unit,pdfCurrency(item.rate),String(item.discount||0)+'%',pdfCurrency(item.quantity*item.rate*(1-(item.discount||0)/100))]),
  theme: 'grid',
  styles: { fontSize:8,cellPadding:2.1,overflow:'linebreak',lineColor:[208,219,233],lineWidth:.2 },
  headStyles: { fillColor:blue,textColor:[255,255,255],fontStyle:'bold' },
  alternateRowStyles: { fillColor:[246,249,253] },
  columnStyles: {0:{cellWidth:9},1:{cellWidth:40},2:{cellWidth:30},3:{cellWidth:12,halign:'right'},4:{cellWidth:16},5:{cellWidth:22,halign:'right'},6:{cellWidth:16,halign:'right'},7:{halign:'right'}},
  margin: { left:margin,right:margin,top:56,bottom:19 },
  showHead: 'everyPage',
  willDrawPage: () => { if (currentPageNumber(doc)>1) brandHeader(doc,'QUOTATION',shop,false,logo,quote.number) }
 })
 let y = ((doc as jsPDF & { lastAutoTable?: { finalY?:number } }).lastAutoTable?.finalY ?? 111)+8
 const notes=doc.splitTextToSize(pdfSafeText('Notes: '+(quote.notes||'-')),w*.54)
 if(y+Math.max(notes.length*4,36)>265){doc.addPage();brandHeader(doc,'QUOTATION',shop,false,logo,quote.number);y=60}
 doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(55,66,82)
 doc.text(notes,margin,y+3)
 const x=width-margin-75
 autoTable(doc,{
  startY:y,body:[['Subtotal',pdfCurrency(quote.totals.subtotal)],['Discount',pdfCurrency(quote.totals.discount)],['GRAND TOTAL',pdfCurrency(quote.totals.grandTotal)]],
  theme:'grid',
  styles:{fontSize:9,cellPadding:2.7,lineColor:[208,219,233],lineWidth:.2},
  columnStyles:{0:{cellWidth:36,fontStyle:'bold',textColor:blue},1:{halign:'right',fontStyle:'bold'}},
  didParseCell:cell=>{if(cell.row.index===2){cell.cell.styles.fillColor=[245,208,130];cell.cell.styles.textColor=blue}},
  margin:{left:x,right:margin}
 })
 const end=Math.max(y+notes.length*4,(doc as jsPDF & {lastAutoTable?:{finalY?:number}}).lastAutoTable?.finalY??y)
 if(end+18<277){doc.setDrawColor(167,180,198);doc.line(width-margin-62,end+12,width-margin,end+12);doc.setFontSize(7.5);doc.text('Authorized signature',width-margin-31,end+17,{align:'center'})}
 footer(doc,shop)
 download(doc,'quotation-'+quote.number)
}
