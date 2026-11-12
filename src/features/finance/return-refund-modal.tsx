import { useState } from 'react'
import { Button, Field, Modal } from '../../components/ui'
import type { InvoiceReturn } from '../../types'
import { formatCurrency, today } from '../../utils/format'

type RefundMethod = 'Cash' | 'UPI' | 'Bank' | 'Card'
type RefundInput = { amount: number; method: RefundMethod; reference: string; date: string }

export function ReturnRefundModal({
  record, onClose, onSave,
}: {
  record: InvoiceReturn
  onClose: () => void
  onSave: (input: RefundInput) => Promise<void>
}) {
  const remaining = Math.max(0, (record.refundDue ?? 0) - (record.refundPaid ?? 0))
  const [amount, setAmount] = useState(remaining.toFixed(2))
  const [method, setMethod] = useState<RefundMethod>('Cash')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(today())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function submit() {
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0 || value > remaining + .001) {
      setError('Enter a refund amount greater than zero, up to the remaining refund due.')
      return
    }
    setSaving(true)
    setError('')
    try {
      await onSave({ amount: value, method, reference, date })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save refund')
    } finally {
      setSaving(false)
    }
  }

  return <Modal open onClose={onClose} title={'Record customer refund · ' + record.number}>
    <div className="page-stack">
      <p className="muted">This is a payment back to the customer, not a second product return. The return and original bill remain unchanged.</p>
      <div className="summary-total"><span>Remaining refund due</span><strong>{formatCurrency(remaining)}</strong></div>
      <div className="form-grid">
        <Field label="Amount refunded"><input type="number" min=".01" max={remaining} step=".01" value={amount} onChange={event => setAmount(event.target.value)} /></Field>
        <Field label="Method"><select value={method} onChange={event => setMethod(event.target.value as RefundMethod)}><option>Cash</option><option>UPI</option><option>Bank</option><option>Card</option></select></Field>
        <Field label="Refund date"><input type="date" value={date} onChange={event => setDate(event.target.value)} /></Field>
        <Field label="Reference (optional)"><input value={reference} onChange={event => setReference(event.target.value)} placeholder="Transaction ID or cash voucher" /></Field>
      </div>
      {error && <p role="alert" className="field-error">{error}</p>}
      <div className="form-actions">
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="primary" onClick={() => void submit()} disabled={saving || remaining <= 0}>{saving ? 'Recording…' : 'Record refund payment'}</Button>
      </div>
    </div>
  </Modal>
}
