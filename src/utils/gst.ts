import { roundMoney } from './format'
export function calculateGST(taxable: number, rate: number, interstate = false) { const gst = roundMoney(taxable * rate / 100); const cgst = interstate ? 0 : roundMoney(gst / 2); return { gst, cgst, sgst: interstate ? 0 : roundMoney(gst - cgst), igst: interstate ? gst : 0 } }
