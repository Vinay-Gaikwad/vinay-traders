import { useState } from 'react'
import { ArrowLeft, ArrowUpRight, Building2, CreditCard, FileText, IndianRupee, Pencil, Plus, Receipt } from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Badge, Button, Card, EmptyState, Modal, PageHeader, StatCard, toast } from '../../components/ui'
import { DataTable } from '../../components/DataTable'
import { useData } from '../../services/data'
import { recordPayment } from '../../services/operations'
import type { Supplier } from '../../types'
import { currency, dateLabel, EntityForm, ExportButton, MoneyEntryForm, newId, PersonName, type FormField } from '../customers/shared'

const supplierFields: FormField[] = [
  { name: 'name', label: 'Supplier name', required: true },
  { name: 'mobile', label: 'Mobile number', type: 'tel', inputMode: 'numeric', maxLength: 13, required: true },

  { name: 'address', label: 'Address', type: 'textarea' },
  { name: 'notes', label: 'Notes', type: 'textarea' },
]

function SupplierEditor({ supplier, onClose }: { supplier?: Supplier; onClose: () => void }) {
  const { mutate } = useData()
  const initial = { name: '', mobile: '', address: '', notes: '', ...Object.fromEntries(Object.entries(supplier ?? {}).map(([key, value]) => [key, String(value ?? '')])) }
  return <EntityForm initialValues={initial} fields={supplierFields} onCancel={onClose} submitLabel={supplier ? 'Save supplier' : 'Create supplier'} onSave={async values => {
    const saved: Supplier = { id: supplier?.id ?? newId('supplier'), name: values.name, mobile: values.mobile, gstin: supplier?.gstin ?? '', address: values.address, balance: supplier?.balance ?? 0, notes: values.notes }
    await mutate(current => ({ ...current, suppliers: supplier ? current.suppliers.map(row => row.id === supplier.id ? saved : row) : [...current.suppliers, saved] }))
    toast(supplier ? 'Supplier updated' : 'Supplier created')
    onClose()
  }} />
}

export function SuppliersPage() {
  const { data } = useData(), navigate = useNavigate(), location = useLocation()
  const [open, setOpen] = useState(location.pathname.endsWith('/new') || new URLSearchParams(location.search).has('new'))
  const [nameSearch, setNameSearch] = useState(''), [mobileSearch, setMobileSearch] = useState('')
  const rows = data.suppliers.map(supplier => {
    const purchases = data.purchases.filter(purchase => purchase.supplierId === supplier.id)
    return { ...supplier, purchaseCount: purchases.length, totalPurchase: purchases.reduce((sum, purchase) => sum + purchase.totals.grandTotal, 0) }
  }).filter(supplier => supplier.name.toLowerCase().includes(nameSearch.toLowerCase()) && supplier.mobile.replace(/\D/g, '').includes(mobileSearch.replace(/\D/g, '')))
  const totalOutstanding = data.suppliers.reduce((sum, supplier) => sum + supplier.balance, 0)
  const close = () => { setOpen(false); if (location.pathname.endsWith('/new')) navigate('/suppliers', { replace: true }) }
  return <div className="page-stack"><PageHeader title="Suppliers" description="Manage supplier accounts, purchases and outstanding balances." actions={<><ExportButton rows={rows.map(row => ({ Name: row.name, Mobile: row.mobile, Purchases: row.totalPurchase, Outstanding: row.balance }))} filename="vinay-traders-suppliers.pdf" title="Supplier directory" details={data.settings} /><Button variant="primary" onClick={() => setOpen(true)}><Plus size={16} />Add supplier</Button></>} /><div className="grid-4"><StatCard label="Total suppliers" value={data.suppliers.length} detail="Supplier accounts" icon={<Building2 size={17} />} /><StatCard label="Total purchases" value={currency(rows.reduce((sum, row) => sum + row.totalPurchase, 0))} detail="Across all supplier invoices" icon={<Receipt size={17} />} /><StatCard label="Outstanding supplier credit" value={currency(totalOutstanding)} detail={`${data.suppliers.filter(supplier => supplier.balance > 0).length} suppliers with a balance`} icon={<CreditCard size={17} />} /><StatCard label="Average purchase" value={currency(rows.reduce((sum, row) => sum + row.totalPurchase, 0) / Math.max(1, data.purchases.length))} detail="Per supplier invoice" icon={<IndianRupee size={17} />} /></div><Card><div className="people-section-title"><h3>Supplier directory <span className="muted">({rows.length})</span></h3></div><div className="table-toolbar"><label className="search-input"><input aria-label="Search suppliers by name" placeholder="Search by supplier name…" value={nameSearch} onChange={event => setNameSearch(event.target.value)}/></label><label className="search-input"><input aria-label="Search suppliers by mobile number" placeholder="Search by mobile number…" inputMode="numeric" value={mobileSearch} onChange={event => setMobileSearch(event.target.value)}/></label></div><DataTable rows={rows} hideSearch onRowClick={row => navigate(`/suppliers/${row.id}`)} columns={[{ key: 'name', label: 'Supplier', render: row => <PersonName name={row.name} subtitle={row.mobile} /> }, { key: 'purchaseCount', label: 'Purchases' }, { key: 'totalPurchase', label: 'Total purchase', render: row => currency(row.totalPurchase) }, { key: 'balance', label: 'Outstanding', render: row => <strong className={row.balance > 0 ? 'people-amount-red' : 'people-amount-green'}>{currency(row.balance)}</strong> }]} actions={row => <Button variant="ghost" aria-label={`View ${row.name}`} onClick={() => navigate(`/suppliers/${row.id}`)}><ArrowUpRight size={17} /></Button>} /></Card><Modal open={open} onClose={close} title="Add supplier" wide><SupplierEditor onClose={close} /></Modal></div>
}

export function SupplierPage() {
  const { id } = useParams(), { data, mutate } = useData(), navigate = useNavigate()
  const [edit, setEdit] = useState(false), [payment, setPayment] = useState(false)
  const supplier = data.suppliers.find(row => row.id === id)
  if (!supplier) return <EmptyState title="Supplier not found" description="This supplier account may no longer exist." action={<Button onClick={() => navigate('/suppliers')}>Back to suppliers</Button>} />
  const purchases = data.purchases.filter(row => row.supplierId === supplier.id), totalPurchase = purchases.reduce((sum, row) => sum + row.totals.grandTotal, 0)
  return <div className="page-stack"><PageHeader title="Supplier account" description={<button className="people-link" onClick={() => navigate('/suppliers')}><ArrowLeft size={13} /> All suppliers</button>} actions={<><Button onClick={() => setEdit(true)}><Pencil size={15} />Edit supplier</Button><Button variant="primary" onClick={() => setPayment(true)} disabled={supplier.balance <= 0}><Plus size={16} />Record payment</Button></>} /><Card><div className="people-profile-heading"><div className="person-avatar person-avatar-lg"><Building2 size={30} /></div><div className="people-profile-content"><h2>{supplier.name}</h2><div className="people-profile-meta"><Badge tone="green">Active</Badge><span>Supplier account</span></div><div className="contact-line"><a href={`tel:${supplier.mobile}`}>{supplier.mobile || 'No phone added'}</a><span>{supplier.address || 'No address added'}</span></div></div><Button className="people-profile-action" onClick={() => navigate('/purchase/new')}><FileText size={16} />Create purchase</Button></div></Card><div className="grid-4"><StatCard label="Total purchases" value={currency(totalPurchase)} detail={`${purchases.length} supplier invoices`} /><StatCard label="Outstanding" value={currency(supplier.balance)} detail="Supplier balance" /><StatCard label="Average invoice" value={currency(totalPurchase / Math.max(1, purchases.length))} detail="Lifetime average" /></div><Card><div className="people-section-title"><h3>Purchase history</h3></div><DataTable rows={purchases} searchKeys={['number', 'supplierInvoice', 'date']} onRowClick={purchase => navigate(`/purchase/${purchase.id}`)} columns={[{ key: 'number', label: 'Purchase no.' }, { key: 'date', label: 'Date', render: row => dateLabel(row.date) }, { key: 'supplierInvoice', label: 'Supplier invoice' }, { key: 'grandTotal', label: 'Amount', render: row => currency(row.totals.grandTotal) }, { key: 'due', label: 'Due', render: row => currency(row.totals.due) }, { key: 'paymentStatus', label: 'Status', render: row => <Badge tone={row.paymentStatus === 'Paid' ? 'green' : 'amber'}>{row.paymentStatus}</Badge> }]} emptyTitle="No purchases for this supplier yet" /></Card><Modal open={edit} onClose={() => setEdit(false)} title="Edit supplier" wide><SupplierEditor supplier={supplier} onClose={() => setEdit(false)} /></Modal><Modal open={payment} onClose={() => setPayment(false)} title={`Record payment · ${supplier.name}`}><div className="people-notice">Outstanding balance: <strong>{currency(supplier.balance)}</strong></div><MoneyEntryForm maximum={supplier.balance} label="Save payment" onCancel={() => setPayment(false)} onSave={async entry => { await mutate(current => recordPayment(current, { ...entry, entityType: 'supplier', entityId: supplier.id })); setPayment(false); toast('Supplier payment recorded') }} /></Modal></div>
}
