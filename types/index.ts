// Data models for the casino beer sales management system

export interface Beer {
  id: string
  name: string
  quantity: number
  purchasePrice: number // Variable purchase price
  sellingPrice: number // Fixed at 4000 pesos
  lastRestockDate: Date
  lastRestockWorker?: string // Added lastRestockWorker property
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
  freeBeersSold?: Record<string, number> // Free beers given away
  bonuses?: number // Bonuses amount
  prizes?: number // Prizes amount
  expectedCash?: number
  actualCash?: number
  cashBreakdown?: CashBreakdown
  restockDuringShift?: boolean
  restockDetails?: string
}

export interface CashBreakdown {
  bills: {
    "100000": number // 100,000 peso bills
    "50000": number // 50,000 peso bills
    "20000": number // 20,000 peso bills
    "10000": number // 10,000 peso bills
    "5000": number // 5,000 peso bills
    "2000": number // 2,000 peso bills
  }
  coins: number // Total coins amount
  nequi: number // Nequi digital money
  billetesVarios: number // Various bills
  completarBase: number
  bonuses: number // Bonuses amount
  prizes: number // Prizes amount
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
  freeBeersSold?: Record<string, number>
  bonuses?: number
  prizes?: number
  totalRevenue: number
  totalCost: number
  profit: number
  cashDifference: number // actualCash - expectedCash
}

export interface SoftDrink {
  id: string
  name: string
  quantity: number
  cost: number
  lastRestockDate: Date
}

export interface RestockRecord {
  id: string
  date: Date
  workerName: string
  beerId: string
  beerName: string
  quantityAdded: number
  newTotalQuantity: number
  type: "beer" | "softdrink" // Added type property
  duringActiveShift?: boolean
  shiftId?: string
}
