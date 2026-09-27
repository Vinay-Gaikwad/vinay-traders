/* eslint-disable react-refresh/only-export-components */
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { cva } from 'class-variance-authority'
import { ArrowUpRight, Check, PackageOpen, X } from 'lucide-react'
import { cn } from '../lib/cn'
export { toast } from 'sonner'

const buttonVariants = cva('button', {variants:{variant:{primary:'button-primary',secondary:'button-secondary',ghost:'button-ghost',danger:'button-danger'}},defaultVariants:{variant:'secondary'}})
export function Button({variant='secondary',className,children,type='button',...props}:ButtonHTMLAttributes<HTMLButtonElement> & {variant?:'primary'|'secondary'|'ghost'|'danger'}) { return <button type={type} className={cn(buttonVariants({variant}),className)} {...props}>{children}</button> }
export function Badge({children,tone='gray'}:{children:ReactNode;tone?:'green'|'amber'|'red'|'blue'|'gray'}) { return <span className={`badge badge-${tone}`}><span className="badge-dot"/>{children}</span> }
export function Card({children,className,...props}:HTMLAttributes<HTMLDivElement>) { return <div className={cn('card',className)} {...props}>{children}</div> }
export function PageHeader({title,description,actions}:{title:ReactNode;description?:ReactNode;actions?:ReactNode}) { return <div className="page-heading"><div><h1>{title}</h1>{description&&<p>{description}</p>}</div>{actions&&<div className="page-actions">{actions}</div>}</div> }
export function StatCard({label,value,detail,icon}:{label:string;value:ReactNode;detail?:ReactNode;icon?:ReactNode}) { return <Card className="stat-card"><div className="stat-label">{label}{icon&&<span className="stat-icon">{icon}</span>}</div><div className="stat-value">{value}</div>{detail&&<div className="stat-detail">{detail}</div>}</Card> }
export function Modal({open,onClose,title,children,wide=false}:{open:boolean;onClose:()=>void;title:string;children:ReactNode;wide?:boolean}) {return <Dialog.Root open={open} onOpenChange={value=>{if(!value)onClose()}}><Dialog.Portal><Dialog.Overlay className="modal-overlay"/><Dialog.Content aria-describedby={undefined} className={cn('modal',wide&&'modal-wide')}><div className="modal-header"><Dialog.Title>{title}</Dialog.Title><Dialog.Close asChild><Button variant="ghost" aria-label="Close dialog"><X size={19}/></Button></Dialog.Close></div><div className="modal-body">{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>}
export function Field({label,children,error}:{label:string;children:ReactNode;error?:string}) {return <label className="field"><span>{label}</span>{children}{error&&<small className="field-error" role="alert">{error}</small>}</label>}
export function EmptyState({title,description,action}:{title:string;description?:string;action?:ReactNode}) {return <div className="empty-state"><PackageOpen size={32}/><h3>{title}</h3>{description&&<p>{description}</p>}{action}</div>}
export function SectionTitle({children,action}:{children:ReactNode;action?:ReactNode}) {return <div className="section-title"><h2>{children}</h2>{action}</div>}
export function Trend({children}:{children:ReactNode}) {return <span className="trend"><ArrowUpRight size={13}/>{children}</span>}
export function CheckLabel({children}:{children:ReactNode}) {return <span className="check-label"><Check size={14}/>{children}</span>}
