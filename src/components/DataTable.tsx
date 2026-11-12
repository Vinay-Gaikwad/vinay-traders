import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDownUp, ChevronLeft, ChevronRight, Download, Search, SlidersHorizontal } from 'lucide-react'
import { Button, EmptyState } from './ui'
import { printPdfReport, type PdfRow } from '../utils/pdf'

export interface Column<T> { key: string; label: string; render?: (row: T) => ReactNode }
export interface ExportDetails { businessName?: string; address?: string; mobile?: string; email?: string; gstin?: string }
export interface DataTableProps<T> {
 columns: Column<T>[]
 rows: T[]
 searchKeys?: (keyof T | string)[]
 onRowClick?: (row: T) => void
 actions?: ReactNode | ((row: T) => ReactNode)
 emptyTitle?: string
 pageSize?: number
 exportTitle?: string
 exportDateKey?: string
 exportDetails?: ExportDetails
 hideSearch?: boolean
 onExport?: (rows: T[]) => void | Promise<void>
}

function cell<T>(row: T, key: string) { return (row as Record<string, unknown>)[key] }
function exportValue(value: unknown): string | number | null {
 if (value === null || value === undefined) return ''
 if (typeof value === 'string' || typeof value === 'number') return value
 if (typeof value === 'boolean') return value ? 'Yes' : 'No'
 if (Array.isArray(value)) return `${value.length} item${value.length === 1 ? '' : 's'}`
 return ''
}

export function DataTable<T extends { id: string }>({ columns, rows, searchKeys, onRowClick, actions, emptyTitle = 'No matching records', pageSize = 8, exportTitle = 'Report', exportDateKey, exportDetails, hideSearch = false, onExport }: DataTableProps<T>) {
 const [query, setQuery] = useState('')
 const [page, setPage] = useState(0)
 const [sort, setSort] = useState({ key: '', asc: true })
 const [hidden, setHidden] = useState<string[]>([])
 const [showColumns, setShowColumns] = useState(false)
 const [dense, setDense] = useState(false)
 const [selected, setSelected] = useState<string[]>([])
 const [from, setFrom] = useState('')
 const [to, setTo] = useState('')
 const filtered = useMemo(() => rows.filter(row => !query || (searchKeys ?? columns.map(column => column.key)).some(key => String(cell(row, String(key)) ?? '').toLowerCase().includes(query.toLowerCase()))).sort((a, b) => {
  if (!sort.key) return 0
  const x = cell(a, sort.key), y = cell(b, sort.key)
  return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true })) * (sort.asc ? 1 : -1)
 }), [rows, query, searchKeys, columns, sort])
 const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
 const safePage = Math.min(page, pages - 1)
 const shown = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize)
 const visible = columns.filter(column => !hidden.includes(column.key))
 const exportRows = () => {
  const selectedRows = selected.length ? filtered.filter(row => selected.includes(row.id)) : filtered
  const dateRows = exportDateKey ? selectedRows.filter(row => {
   const value = String(cell(row, exportDateKey) ?? '').slice(0, 10)
   return (!from || value >= from) && (!to || value <= to)
  }) : selectedRows
  const output: PdfRow[] = dateRows.map(row => Object.fromEntries(columns.map(column => [column.label, exportValue(cell(row, column.key))])))
  if (onExport) void onExport(dateRows)
  else void printPdfReport(exportTitle, output, exportDetails)
 }
 return <div className={`datatable ${dense ? 'dense' : ''}`}>
  <div className="table-toolbar">
   {!hideSearch && <label className="search-input"><Search size={16} /><input aria-label="Search records" placeholder="Search records…" value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} /></label>}
   {exportDateKey && <div className="export-period"><label>From<input aria-label="Export from date" type="date" value={from} onChange={event => setFrom(event.target.value)} /></label><label>To<input aria-label="Export to date" type="date" value={to} onChange={event => setTo(event.target.value)} /></label></div>}
   <div className="table-controls">{selected.length > 0 && <span className="muted">{selected.length} selected</span>}{typeof actions !== 'function' && actions}<Button aria-label="Export records" onClick={exportRows}><Download size={15} /><span className="desktop-label">Export PDF</span></Button><Button aria-label="Table display settings" onClick={() => setShowColumns(!showColumns)}><SlidersHorizontal size={15} /></Button></div>
  </div>
  {showColumns && <div className="column-controls"><label><input type="checkbox" checked={dense} onChange={event => setDense(event.target.checked)} /> Compact rows</label>{columns.map(column => <label key={column.key}><input type="checkbox" checked={!hidden.includes(column.key)} onChange={() => setHidden(hidden.includes(column.key) ? hidden.filter(key => key !== column.key) : [...hidden, column.key])} />{column.label}</label>)}</div>}
  {shown.length === 0 ? <EmptyState title={emptyTitle} description="Try a different search or clear your filters." action={query ? <Button onClick={() => setQuery('')}>Clear search</Button> : undefined} /> : <>
   <div className="table-wrap desktop-data"><table className="data-table"><thead><tr><th className="check-cell"><input aria-label="Select visible records" type="checkbox" checked={shown.length > 0 && shown.every(row => selected.includes(row.id))} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...shown.map(row => row.id)])] : selected.filter(id => !shown.some(row => row.id === id)))} /></th>{visible.map(column => <th key={column.key} aria-sort={sort.key === column.key ? (sort.asc ? 'ascending' : 'descending') : 'none'}><button type="button" aria-label={`Sort by ${column.label}`} onClick={() => setSort({ key: column.key, asc: sort.key === column.key ? !sort.asc : true })}>{column.label}<ArrowDownUp size={12} /></button></th>)}{typeof actions === 'function' && <th>Actions</th>}</tr></thead><tbody>{shown.map(row => <tr key={row.id} className={onRowClick ? 'clickable-row' : ''}><td><input aria-label={`Select ${row.id}`} type="checkbox" checked={selected.includes(row.id)} onChange={event => setSelected(event.target.checked ? [...selected, row.id] : selected.filter(id => id !== row.id))} /></td>{visible.map((column, index) => <td key={column.key}>{onRowClick && index === 0 ? <button className="row-link" onClick={() => onRowClick(row)}>{column.render ? column.render(row) : String(cell(row, column.key) ?? '—')}</button> : column.render ? column.render(row) : String(cell(row, column.key) ?? '—')}</td>)}{typeof actions === 'function' && <td>{actions(row)}</td>}</tr>)}</tbody></table></div>
   <div className="mobile-data">{shown.map(row => <div className="mobile-record" key={row.id}>{visible.slice(0, 6).map((column, index) => <div key={column.key} className={index === 0 ? 'mobile-record-title' : ''}>{index > 0 && <span className="muted">{column.label}</span>}{index === 0 && onRowClick ? <button className="row-link" onClick={() => onRowClick(row)}>{column.render ? column.render(row) : String(cell(row, column.key) ?? '—')}</button> : <div>{column.render ? column.render(row) : String(cell(row, column.key) ?? '—')}</div>}</div>)}{typeof actions === 'function' && <div className="mobile-record-actions">{actions(row)}</div>}</div>)}</div>
  </>}
  <div className="pagination"><span>Showing {filtered.length ? safePage * pageSize + 1 : 0}–{Math.min((safePage + 1) * pageSize, filtered.length)} of {filtered.length}</span><div><Button aria-label="Previous page" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft size={15} /></Button><span>{safePage + 1} / {pages}</span><Button aria-label="Next page" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)}><ChevronRight size={15} /></Button></div></div>
 </div>
}
