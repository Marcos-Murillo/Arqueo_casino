// Local storage utilities for data persistence

import type { Beer, Worker, Shift, SalesReport } from "@/types"

const STORAGE_KEYS = {
  BEERS: "casino-beers",
  WORKERS: "casino-workers",
  SHIFTS: "casino-shifts",
  REPORTS: "casino-reports",
} as const

// Generic storage functions
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage key ${key}:`, error)
    return defaultValue
  }
}

export function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error(`Error saving to localStorage key ${key}:`, error)
  }
}

// Beer inventory functions
export function getBeers(): Beer[] {
  return getFromStorage(STORAGE_KEYS.BEERS, [])
}

export function saveBeers(beers: Beer[]): void {
  saveToStorage(STORAGE_KEYS.BEERS, beers)
}

// Worker functions
export function getWorkers(): Worker[] {
  return getFromStorage(STORAGE_KEYS.WORKERS, [])
}

export function saveWorkers(workers: Worker[]): void {
  saveToStorage(STORAGE_KEYS.WORKERS, workers)
}

// Shift functions
export function getShifts(): Shift[] {
  const shifts = getFromStorage<Shift[]>(STORAGE_KEYS.SHIFTS, [])
  // Convert date strings back to Date objects
  return shifts.map((shift) => ({
    ...shift,
    startTime: new Date(shift.startTime),
    endTime: shift.endTime ? new Date(shift.endTime) : undefined,
  }))
}

export function saveShifts(shifts: Shift[]): void {
  saveToStorage(STORAGE_KEYS.SHIFTS, shifts)
}

// Reports functions
export function getReports(): SalesReport[] {
  const reports = getFromStorage<SalesReport[]>(STORAGE_KEYS.REPORTS, [])
  return reports.map((report) => ({
    ...report,
    date: new Date(report.date),
  }))
}

export function saveReports(reports: SalesReport[]): void {
  saveToStorage(STORAGE_KEYS.REPORTS, reports)
}

// Initialize default data
export function initializeDefaultData(): void {
  const existingBeers = getBeers()
  const existingWorkers = getWorkers()

  // Initialize with sample beer inventory if empty
  if (existingBeers.length === 0) {
    const defaultBeers: Beer[] = [
      {
        id: "1",
        name: "Cerveza Premium",
        quantity: 100,
        purchasePrice: 2500,
        sellingPrice: 4000,
        lastRestockDate: new Date(),
        weeklyRestockDay: "monday",
      },
      {
        id: "2",
        name: "Cerveza Clásica",
        quantity: 150,
        purchasePrice: 2000,
        sellingPrice: 4000,
        lastRestockDate: new Date(),
        weeklyRestockDay: "monday",
      },
    ]
    saveBeers(defaultBeers)
  }

  // Initialize with sample worker if empty
  if (existingWorkers.length === 0) {
    const defaultWorkers: Worker[] = [
      {
        id: "1",
        name: "Trabajador Demo",
        isActive: true,
        createdAt: new Date(),
      },
    ]
    saveWorkers(defaultWorkers)
  }
}
