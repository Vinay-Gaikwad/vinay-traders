import { BarChart3, Boxes, ClipboardList, FileText, IndianRupee, Printer, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, PageHeader } from '../../components/ui'
import { useData } from '../../services/data'
import { printPdfReport } from '../../utils/pdf'

export function ReportsPage() {
  const { data } = useData()
  const navigate = useNavigate()
  const sales = data.invoices.filter(invoice => invoice.status === 'Completed').reduce((sum, invoice) => sum + invoice.totals.grandTotal, 0)
  const purchases = data.purchases.reduce((sum, purchase) => sum + purchase.totals.grandTotal, 0)
  const outstanding = data.customers.reduce((sum, customer) => sum + Math.max(0, customer.balance), 0)
  const exportReport = (title: string) => printPdfReport(title, [{ Metric: 'Sales', Amount: sales }, { Metric: 'Purchases', Amount: purchases }, { Metric: 'Outstanding', Amount: outstanding }, { Metric: 'Inventory value', Amount: data.products.reduce((sum, product) => sum + product.stock * product.purchaseRate, 0) }], data.settings)
  return <div className="page-stack"><PageHeader title="Reports" description="Clear, printable summaries for sales, purchases, inventory and people." actions={<Button variant="primary" onClick={() => exportReport('Vinay Traders business summary')}><Printer size={15}/>Export summary</Button>}/><div className="report-card-grid"><Card className="report-card report-card-blue"><BarChart3 size={22}/><div><h2>Sales report</h2><p>Review completed invoices and received payments.</p></div><Button onClick={() => navigate('/billing/bills')}>Open report</Button></Card><Card className="report-card report-card-green"><ClipboardList size={22}/><div><h2>Purchase report</h2><p>Track supplier invoices and incoming stock.</p></div><Button onClick={() => navigate('/purchase')}>Open report</Button></Card><Card className="report-card report-card-yellow"><Boxes size={22}/><div><h2>Inventory report</h2><p>View stock, pricing, discounts and low-stock items.</p></div><Button onClick={() => navigate('/inventory')}>Open report</Button></Card><Card className="report-card report-card-red"><IndianRupee size={22}/><div><h2>Outstanding report</h2><p>Follow up customer balances and pending payments.</p></div><Button onClick={() => navigate('/customers')}>Open report</Button></Card><Card className="report-card report-card-purple"><Users size={22}/><div><h2>People report</h2><p>Review workers, attendance and monthly payroll.</p></div><Button onClick={() => navigate('/attendance')}>Open report</Button></Card><Card className="report-card report-card-cyan"><FileText size={22}/><div><h2>Quotation register</h2><p>Open, edit, print and convert customer quotations.</p></div><Button onClick={() => navigate('/quotations')}>Open register</Button></Card></div></div>
}
