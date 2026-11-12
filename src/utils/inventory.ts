import type { Product, StockTransaction } from '../types'
import { roundMoney } from './format'
export const availableStock = (product: Product) => Math.round((product.stock - product.reserved) * 10000) / 10000
export const stockValue = (product: Product) => roundMoney(product.stock * product.purchaseRate / product.conversionFactor)
export const stockStatus = (product: Product): 'In Stock' | 'Low Stock' | 'Critical' | 'Out of Stock' => availableStock(product) <= 0 ? 'Out of Stock' : availableStock(product) <= product.minimumStock ? 'Critical' : availableStock(product) <= product.reorderLevel ? 'Low Stock' : 'In Stock'
export const calculateStockBalance = (transactions: Pick<StockTransaction, 'in' | 'out'>[]) => Math.round(transactions.reduce((sum, entry) => sum + entry.in - entry.out, 0) * 10000) / 10000
