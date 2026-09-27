/* eslint-disable react-refresh/only-export-components */
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { ArrowDownToLine, Phone, MapPin } from 'lucide-react'
import { Button, Field, toast } from '../../components/ui'
import './people.css'

export const currency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amount)
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
export const dateLabel = (date: string) => date ? new Date(`${date.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
export const initials = (name: string) => name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()

export function PersonAvatar({ name, large = false }: { name: string; large?: boolean }) { return <span className={`person-avatar ${large ? 'person-avatar-lg' : ''}`} aria-hidden="true">{initials(name)}</span> }
export function PersonName({ name, subtitle }: { name: string; subtitle?: string }) { return <span className="person-name"><PersonAvatar name={name} /><span><strong>{name}</strong>{subtitle && <small>{subtitle}</small>}</span></span> }
export function FeatureTabs({ tabs, active, onChange }: { tabs: string[]; active: string; onChange: (tab: string) => void }) { return <div className="people-tabs" role="tablist" aria-label="Profile sections">{tabs.map(tab => <button key={tab} type="button" role="tab" aria-selected={active === tab} className={active === tab ? 'active' : ''} onClick={() => onChange(tab)}>{tab}</button>)}</div> }
export function DetailList({ items }: { items: { label: string; value: ReactNode }[] }) { return <dl className="people-details">{items.map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value || '—'}</dd></div>)}</dl> }
export function ContactLine({ mobile, area }: { mobile: string; area: string }) { return <div className="contact-line"><a href={`tel:${mobile}`}><Phone size={14} />{mobile || 'No phone added'}</a><span><MapPin size={14} />{area || 'No address added'}</span></div> }

export type FormField = { name: string; label: string; type?: 'text' | 'number' | 'date' | 'tel' | 'textarea' | 'select'; options?: { value: string; label: string }[]; required?: boolean; min?: number; max?: number; help?: string; section?: string }
export function EntityForm({ fields, initialValues, onSave, onCancel, submitLabel = 'Save changes' }: { fields: FormField[]; initialValues: Record<string, string>; onSave: (values: Record<string, string>) => Promise<void>; onCancel: () => void; submitLabel?: string }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<Record<string, string>>({ defaultValues: initialValues })
  const submit = handleSubmit(async values => {
    const schema = z.record(z.string(), z.string()).superRefine((value, context) => {
      for (const field of fields) {
        const input = value[field.name]?.trim() || ''
        if (field.required && !input) context.addIssue({ code: 'custom', path: [field.name], message: `${field.label} is required` })
        if (field.type === 'tel' && input && !/^[+\d\s()-]{10,16}$/.test(input)) context.addIssue({ code: 'custom', path: [field.name], message: 'Enter a valid mobile number' })
        if (field.type === 'number' && input && (!Number.isFinite(Number(input)) || Number(input) < (field.min ?? 0) || Number(input) > (field.max ?? Number.MAX_SAFE_INTEGER))) context.addIssue({ code: 'custom', path: [field.name], message: `Enter a number between ${field.min ?? 0} and ${field.max ?? 'the allowed limit'}` })
        if (field.name === 'gstin' && input && !/^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(input.toUpperCase())) context.addIssue({ code: 'custom', path: [field.name], message: 'Enter a valid 15-character GSTIN' })
      }
    })
    const parsed = schema.safeParse(values)
    if (!parsed.success) { parsed.error.issues.forEach(issue => setError(String(issue.path[0]), { message: issue.message })); return }
    try { await onSave(Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]))) } catch (error) { toast(error instanceof Error ? error.message : 'Could not save. Please try again.') }
  })
  return <form onSubmit={submit} className="people-form"><div className="form-grid">{fields.map((field, index) => <div key={field.name} className={field.type === 'textarea' || field.section ? 'people-form-wide' : ''}>{field.section && (index === 0 || fields[index - 1].section !== field.section) && <h3 className="people-form-section">{field.section}</h3>}<Field label={`${field.label}${field.required ? ' *' : ''}`} error={errors[field.name]?.message}>{field.type === 'textarea' ? <textarea rows={3} {...register(field.name)} /> : field.type === 'select' ? <select {...register(field.name)}>{field.options?.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type || 'text'} min={field.min} max={field.max} step={field.type === 'number' ? 'any' : undefined} {...register(field.name)} />}{field.help && <small className="muted">{field.help}</small>}</Field></div>)}</div><div className="people-form-actions"><Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : submitLabel}</Button></div></form>
}

export function MoneyEntryForm({ maximum, onSave, onCancel, label = 'Record payment' }: { maximum?: number; onSave: (entry: { amount: number; date: string; method: 'Cash' | 'UPI' | 'Bank' | 'Card'; notes: string; reference: string }) => Promise<void>; onCancel: () => void; label?: string }) {
  return <EntityForm initialValues={{ amount: maximum ? String(Math.round(maximum * 100) / 100) : '', date: localDate(), method: 'UPI', reference: '', notes: '' }} fields={[{ name: 'amount', label: 'Amount (₹)', type: 'number', min: 0.01, max: maximum, required: true }, { name: 'date', label: 'Payment date', type: 'date', required: true }, { name: 'method', label: 'Payment method', type: 'select', options: ['Cash', 'UPI', 'Bank', 'Card'].map(value => ({ value, label: value })) }, { name: 'reference', label: 'Receipt / transaction reference' }, { name: 'notes', label: 'Notes', type: 'textarea' }]} onSave={values => onSave({ amount: Number(values.amount), date: values.date, method: values.method as 'Cash' | 'UPI' | 'Bank' | 'Card', notes: values.notes, reference: values.reference })} onCancel={onCancel} submitLabel={label} />
}

export function ExportButton({ rows, filename }: { rows: Record<string, string | number>[]; filename: string }) {
  const [working, setWorking] = useState(false)
  function download() { setWorking(true); const headers = Object.keys(rows[0] || {}); const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`; const csv = [headers.map(escape).join(','), ...rows.map(row => headers.map(header => escape(row[header] ?? '')).join(','))].join('\r\n'); const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' })); const link = document.createElement('a'); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url); setWorking(false); toast('Report exported') }
  return <Button variant="secondary" onClick={download} disabled={working || rows.length === 0}><ArrowDownToLine size={16} />Export</Button>
}
