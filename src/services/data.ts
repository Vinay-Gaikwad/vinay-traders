import { useQuery, useQueryClient } from '@tanstack/react-query'
import { initialData } from '../mock-data'
import type { AppData } from '../types'

const STORAGE_KEY = 'vinay-traders-app-data-v1'
function readData(): AppData { try { const raw = localStorage.getItem(STORAGE_KEY); if (raw) return JSON.parse(raw) as AppData } catch { /* use seed */ } return structuredClone(initialData) }
let memoryData: AppData | undefined
export function getData(): AppData { if (!memoryData) memoryData = readData(); return memoryData }
export function saveData(data: AppData) { memoryData = data; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) } catch { /* persistence is best effort in private mode */ } }
export function useData() { const client = useQueryClient(); const query = useQuery({ queryKey: ['vinay-traders-data'], queryFn: async () => getData(), staleTime: Infinity, initialData: getData }); const mutate = async (updater: (data: AppData) => AppData) => { const next = updater(structuredClone(getData())); saveData(next); await client.invalidateQueries({ queryKey: ['vinay-traders-data'] }) }; return { data: query.data ?? initialData, isLoading: query.isLoading, error: query.error, refresh: () => client.invalidateQueries({ queryKey: ['vinay-traders-data'] }), mutate } }
