// Data models for the casino beer sales management system

export interface Beer {
  id: string
  name: string
  quantity: number
  purchasePrice: number // Variable purchase price
  sellingPrice: number // Fixed at 4000 pesos
  lastRestockDate: Date
  weeklyRestockDay: "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday"
}

export interface Worker {
  id: string
  name: string
  isActive: boolean
  createdAt: Date
}

export interface Shift {
  id: string
  workerId: string
  workerName: string
  startTime: Date
  endTime?: Date
  isActive: boolean
  initialInventory: Record<string, number> // beerId -> quantity
  finalInventory?: Record<string, number>
  beersSold?: Record<string, number>
  expectedCash?: number
  actualCash?: number
  cashBreakdown?: CashBreakdown
}

export interface CashBreakdown {
  bills: {
    "100000": number // 100,000 peso bills
    "50000": number // 50,000 peso bills
    "20000": number // 20,000 peso bills
    "10000": number // 10,000 peso bills
    "5000": number // 5,000 peso bills
    "2000": number // 2,000 peso bills
    "1000": number // 1,000 peso bills
  }
  coins: {
    "1000": number // 1,000 peso coins
    "500": number // 500 peso coins
    "200": number // 200 peso coins
    "100": number // 100 peso coins
    "50": number // 50 peso coins
  }
  nequi: number // Nequi digital money
  billetesVarios: number // Various bills
  total: number
}

export interface Casino {
  id: string
  name: string
}

export interface SalesReport {
  date: Date
  shiftId: string
  workerName: string
  beersSold: Record<string, number>
  totalRevenue: number
  totalCost: number
  profit: number
  cashDifference: number // actualCash - expectedCash
}
