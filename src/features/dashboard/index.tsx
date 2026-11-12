import { useState, type ReactNode } from 'react'
import { AlertTriangle, Boxes, BriefcaseBusiness, CalendarDays, CircleDollarSign, FileText, Package, Plus, ReceiptText, ShoppingCart, Users, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card } from '../../components/ui'
import { useData } from '../../services/data'
import { formatCurrency, formatDate, localDateKey, today } from '../../utils/format'
import { printPdfReport, type PdfRow } from '../../utils/pdf'

type Tone = 'blue' | 'green' | 'yellow' | 'red' | 'purple'

function Metric({ label, value, detail, tone, icon, onClick }: { label: string; value: string | number; detail: string; tone: Tone; icon: ReactNode; onClick?: () => void }) {
  const content = <><div className="dashboard-metric-top"><span>{label}</span><span className="dashboard-metric-icon">{icon}</span></div><strong>{value}</strong><small>{detail}</small></>
  return onClick ? <button type="button" className={`dashboard-metric dashboard-metric-${tone}`} onClick={onClick}>{content}</button> : <div className={`dashboard-metric dashboard-metric-${tone}`}>{content}</div>
}

const actionItems = [
  ['New bill', '/billing', ReceiptText, 'green'],
  ['New purchase', '/purchase/new', ShoppingCart, 'blue'],
  ['New quotation', '/quotations/new', FileText, 'purple'],
  ['Add product', '/inventory/new', Package, 'yellow'],
  ['Add customer', '/customers/new', Users, 'cyan'],
  ['Add supplier', '/suppliers/new', BriefcaseBusiness, 'red'],
] as const

export function DashboardPage() {
  const { data } = useData()
  const navigate = useNavigate()
  const [period, setPeriod] = useState<'7 days' | '30 days' | 'This year'>('7 days')
  const [exportPeriod, setExportPeriod] = useState<'Daily'|'Weekly'|'Monthly'|'Yearly'>('Daily')
  const todayValue = today()
  const completed = data.invoices.filter(invoice => invoice.status === 'Completed')
  const todaySales = completed.filter(invoice => invoice.date.slice(0, 10) === todayValue)
  const salesTotal = todaySales.reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0)
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayValue = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth()+1).padStart(2,'0')}-${String(yesterdayDate.getDate()).padStart(2,'0')}`
  const yesterdayTotal = completed.filter(invoice => invoice.date.slice(0,10) === yesterdayValue).reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0)
  const salesTrend = yesterdayTotal > 0 ? `${salesTotal >= yesterdayTotal ? '↑' : '↓'} ${Math.abs((salesTotal-yesterdayTotal)/yesterdayTotal*100).toFixed(1)}% vs yesterday` : salesTotal > 0 ? 'Sales recorded today' : 'No sales yesterday'
  const purchaseTotal = data.purchases.filter(purchase => purchase.status === 'Completed' && purchase.date.slice(0, 10) === todayValue).reduce((sum, purchase) => sum + purchase.totals.grandTotal, 0)
  const inventoryValue = data.products.reduce((sum, product) => sum + product.stock * product.purchaseRate, 0)
  const outstanding = data.customers.reduce((sum, customer) => sum + Math.max(0, customer.balance), 0)
  const lowStock = data.products.filter(product => product.stock <= product.reorderLevel)
  const unread = data.notifications.filter(notification => !notification.read)
  const chart = (() => {
    const days = period === 'This year' ? 12 : period === '30 days' ? 6 : 7
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return Array.from({ length: days }, (_, index) => {
      const from = new Date(now)
      if (period === 'This year') from.setMonth(now.getMonth() - (days - 1 - index), 1)
      else from.setDate(now.getDate() - (days - 1 - index) * (period === '30 days' ? 5 : 1))
      const to = new Date(from)
      if (period === 'This year') to.setMonth(from.getMonth() + 1, 1)
      else to.setDate(from.getDate() + (period === '30 days' ? 5 : 1))
      const sales = completed.filter(invoice => { const date = new Date(invoice.date); return date >= from && date < to }).reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0)
      const purchases = data.purchases.filter(purchase => { const date = new Date(purchase.date); return date >= from && date < to }).reduce((sum, purchase) => sum + purchase.totals.grandTotal, 0)
      return { label: period === 'This year' ? from.toLocaleDateString(undefined, { month: 'short' }) : from.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), sales, purchases }
    })
  })()
  const max = Math.max(1, ...chart.flatMap(point => [point.sales, point.purchases]))
  const exportBusinessReport = () => {
    const end = new Date(); end.setHours(23,59,59,999)
    const start = new Date(end)
    if (exportPeriod === 'Daily') start.setHours(0,0,0,0)
    if (exportPeriod === 'Weekly') { start.setDate(end.getDate()-((end.getDay()+6)%7)); start.setHours(0,0,0,0) }
    if (exportPeriod === 'Monthly') { start.setDate(1); start.setHours(0,0,0,0) }
    if (exportPeriod === 'Yearly') { start.setMonth(0,1); start.setHours(0,0,0,0) }
    const from = localDateKey(start), to = localDateKey(end)
    const inRange = (value: string) => value.slice(0,10) >= from && value.slice(0,10) <= to
    const rows: PdfRow[] = []
    completed.filter(row=>inRange(row.date)).forEach(row=>rows.push({Section:'Bills',Reference:row.number,Date:formatDate(row.date),Details:row.customerName,Quantity:row.items.length,Amount:formatCurrency(row.totals.grandTotal),Status:row.paymentStatus}))
    data.purchases.filter(row=>row.status==='Completed'&&inRange(row.date)).forEach(row=>rows.push({Section:'Purchases',Reference:row.number,Date:formatDate(row.date),Details:data.suppliers.find(s=>s.id===row.supplierId)?.name??'Supplier',Quantity:row.items.length,Amount:formatCurrency(row.totals.grandTotal),Status:row.paymentStatus}))
    data.payments.filter(row=>inRange(row.date)).forEach(row=>rows.push({Section:'Payments',Reference:row.reference||'—',Date:formatDate(row.date),Details:`${row.entityType} · ${row.entityId}`,Quantity:'—',Amount:formatCurrency(row.amount),Status:row.method}))
    data.deposits.filter(row=>inRange(row.date)).forEach(row=>rows.push({Section:'Pat Sanstha',Reference:row.planName??'Shop Deposit',Date:formatDate(row.date),Details:row.notes||'—',Quantity:'—',Amount:formatCurrency(row.paid),Status:row.status}))
    ;(data.expenses??[]).filter(row=>inRange(row.date)).forEach(row=>rows.push({Section:`${row.kind} expense`,Reference:row.title,Date:formatDate(row.date),Details:row.notes||'—',Quantity:'—',Amount:formatCurrency(row.amount),Status:row.method}))
    ;(data.invoiceReturns??[]).filter(row=>inRange(row.date)).forEach(row=>rows.push({Section:'Product return',Reference:row.number,Date:formatDate(row.date),Details:`Revised bill ${row.updatedInvoiceId}`,Quantity:row.items.reduce((sum,item)=>sum+item.quantity,0),Amount:formatCurrency(row.amount),Status:row.restocked?'Restocked':'Not restocked'}))
    ;(data.invoiceReturns??[]).forEach(ret=>{ (ret.refunds??[]).filter(refund=>inRange(refund.date)).forEach(refund=>rows.push({Section:'Customer refund',Reference:ret.number,Date:formatDate(refund.date),Details:refund.reference||'Return refund',Quantity:'—',Amount:'− '+formatCurrency(refund.amount),Status:refund.method})) })
    data.products.forEach(product=>rows.push({Section:'Current stock',Reference:product.sku,Date:to,Details:`${product.name} · ${product.variant}`,Quantity:`${product.stock} ${product.salesUnit}`,Amount:formatCurrency(product.stock*product.purchaseRate),Status:product.stock<=product.reorderLevel?'Low stock':'In stock'}))
    const rangeSales=completed.filter(row=>inRange(row.date)).reduce((sum,row)=>sum+row.totals.grandTotal,0)
    const rangePurchase=data.purchases.filter(row=>row.status==='Completed'&&inRange(row.date)).reduce((sum,row)=>sum+row.totals.grandTotal,0)
    const refundsPaid=(data.invoiceReturns??[]).flatMap(ret=>ret.refunds??[]).filter(refund=>inRange(refund.date)).reduce((sum,refund)=>sum+refund.amount,0)
    const refundsPending=(data.invoiceReturns??[]).reduce((sum,ret)=>sum+Math.max(0,(ret.refundDue??0)-(ret.refundPaid??0)),0)
    void printPdfReport(`${exportPeriod} Shop Overview`,rows,data.settings,{orientation:'landscape',summary:{Period:`${from} to ${to}`,Bills:formatCurrency(rangeSales),Purchases:formatCurrency(rangePurchase),'Refunds paid':formatCurrency(refundsPaid),'Refunds pending':formatCurrency(refundsPending),'Customer balance':formatCurrency(outstanding),'Supplier balance':formatCurrency(data.suppliers.reduce((sum,row)=>sum+row.balance,0)),'Current stock value':formatCurrency(inventoryValue),'Total products':data.products.length,'Low stock items':lowStock.length}})
  }

  return <div className="page-stack dashboard-modern">
    <div className="dashboard-modern-heading">
      <div><h1>Dashboard</h1><p>Business overview at a glance.</p></div>
      <label className="dashboard-period"><CalendarDays size={16}/><span>Period</span><select value={period} onChange={event => setPeriod(event.target.value as typeof period)}><option>7 days</option><option>30 days</option><option>This year</option></select></label>
    </div>

    <div className="dashboard-metrics">
      <Metric label="Today's sales" value={formatCurrency(salesTotal)} detail={salesTrend} tone="green" icon={<CircleDollarSign size={19}/>} />
      <Metric label="Today's purchases" value={formatCurrency(purchaseTotal)} detail={`${data.purchases.filter(purchase => purchase.status === 'Completed' && purchase.date.slice(0, 10) === todayValue).length} supplier invoices`} tone="blue" icon={<ShoppingCart size={19}/>} />
      <Metric label="Inventory value" value={formatCurrency(inventoryValue)} detail={`${data.products.length} active variants`} tone="yellow" icon={<Boxes size={19}/>} onClick={() => navigate('/inventory')} />
      <Metric label="Outstanding" value={formatCurrency(outstanding)} detail={`${data.customers.filter(customer => customer.balance > 0).length} customers with balance`} tone="red" icon={<Wallet size={19}/>} onClick={() => navigate('/customers')} />
      <Metric label="Alerts" value={unread.length + lowStock.length} detail={`${lowStock.length} low-stock items`} tone="purple" icon={<AlertTriangle size={19}/>} onClick={() => navigate('/notifications')} />
    </div>

    <div className="dashboard-main-grid">
      <Card className="dashboard-chart-card"><div className="dashboard-panel-heading"><div><h2>Sales vs purchases</h2><p>Financial performance over time</p></div><div className="dashboard-legend"><span><i className="legend-swatch sales"/>Sales</span><span><i className="legend-swatch purchases"/>Purchases</span></div></div><div className="dashboard-chart"><div className="dashboard-chart-grid"><span>3.0L</span><span>2.0L</span><span>1.0L</span><span>0</span></div><div className="dashboard-chart-bars">{chart.map(point => <div className="dashboard-chart-column" key={point.label}><div className="dashboard-bar-pair"><span className="dashboard-bar sales" style={{ height: `${Math.max(4, point.sales / max * 100)}%` }} title={formatCurrency(point.sales)}/><span className="dashboard-bar purchases" style={{ height: `${Math.max(4, point.purchases / max * 100)}%` }} title={formatCurrency(point.purchases)}/></div><small>{point.label}</small></div>)}</div></div></Card>
      <Card className="dashboard-actions-card"><div className="dashboard-panel-heading"><div><h2>Quick actions</h2><p>Common tasks for the shop</p></div><Plus size={18} className="muted"/></div><div className="dashboard-action-grid">{actionItems.map(([label, to, Icon, tone]) => <button type="button" key={label} className={`dashboard-action dashboard-action-${tone}`} onClick={() => navigate(to)}><Icon size={18}/><span>{label}</span></button>)}</div></Card>
    </div>

    <div className="dashboard-lower-grid">
      <Card><div className="dashboard-section-header"><h2>Recent bills</h2><button className="text-link" onClick={() => navigate('/billing/bills')}>View all</button></div><div className="dashboard-table-scroll"><table className="data-table compact-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>{completed.slice(0, 5).map(invoice => <tr key={invoice.id}><td><strong>{invoice.number}</strong></td><td>{invoice.customerName}</td><td>{formatDate(invoice.date)}</td><td className="amount-highlight">{formatCurrency(invoice.totals.grandTotal)}</td><td><Badge tone={invoice.paymentStatus === 'Paid' ? 'green' : 'amber'}>{invoice.paymentStatus}</Badge></td></tr>)}</tbody></table>{!completed.length && <p className="dashboard-empty">No completed bills yet.</p>}</div></Card>
      <Card><div className="dashboard-section-header"><h2>Inventory alerts</h2><button className="text-link" onClick={() => navigate('/inventory')}>View inventory</button></div>{lowStock.slice(0, 5).map(product => <div className="dashboard-alert-row" key={product.id}><span className="dashboard-alert-icon"><Package size={17}/></span><div><strong>{product.name}</strong><small>{product.variant} · {product.stock} {product.salesUnit} left</small></div><Badge tone="amber">Low stock</Badge></div>)}{!lowStock.length && <p className="dashboard-empty">All products are above reorder level.</p>}</Card>
    </div>

    <Card className="dashboard-footer-banner"><div><strong>Shop overview PDF</strong><p>Export the selected period with bills, purchases, payments, expenses, returns and current stock.</p></div><label className="dashboard-period"><span>Period</span><select aria-label="Shop report period" value={exportPeriod} onChange={event=>setExportPeriod(event.target.value as typeof exportPeriod)}><option>Daily</option><option>Weekly</option><option>Monthly</option><option>Yearly</option></select></label><Button variant="primary" onClick={exportBusinessReport}><FileText size={16}/>Export PDF</Button></Card>
  </div>
}
