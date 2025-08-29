"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Beer, BarChart3, Users, Clock, DollarSign, Package, Droplets } from "lucide-react"
import { getBeers, getWorkers, getShifts } from "@/lib/firebase-storage"
import type { Beer as BeerType, Worker, Shift } from "@/types"
import InventoryManagement from "@/components/inventory-management"
import ShiftManagement from "@/components/shift-management"
import SalesReports from "@/components/sales-reports"
import StaffManagement from "@/components/staff-management"
import { CasinoSelector } from "@/components/casino-selector"
import { SoftDrinksManagement } from "@/components/soft-drinks-managements"

export default function CasinoBeerSalesPage() {
  const [beers, setBeers] = useState<BeerType[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [activeShifts, setActiveShifts] = useState<Shift[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [selectedCasino, setSelectedCasino] = useState<string>("")
  const [currentView, setCurrentView] = useState<
    "dashboard" | "inventory" | "shifts" | "reports" | "staff" | "soft-drinks"
  >("dashboard")

  useEffect(() => {
    if (selectedCasino) {
      loadData()
    }
  }, [selectedCasino])

  const loadData = async () => {
    try {
      const [beersData, workersData, shiftsData] = await Promise.all([
        getBeers(selectedCasino),
        getWorkers(selectedCasino),
        getShifts(selectedCasino),
      ])
      setBeers(beersData)
      setWorkers(workersData)
      setActiveShifts(shiftsData.filter((shift) => shift.isActive))
      setIsLoaded(true)
    } catch (error) {
      console.error("Error loading data:", error)
      setIsLoaded(true)
    }
  }

  if (!selectedCasino) {
    return <CasinoSelector onCasinoSelect={setSelectedCasino} />
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Beer className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Cargando sistema...</p>
        </div>
      </div>
    )
  }

  if (currentView === "inventory") {
    return <InventoryManagement selectedCasino={selectedCasino} onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "shifts") {
    return <ShiftManagement selectedCasino={selectedCasino} onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "reports") {
    return <SalesReports selectedCasino={selectedCasino} onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "staff") {
    return <StaffManagement selectedCasino={selectedCasino} onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "soft-drinks") {
    return <SoftDrinksManagement selectedCasino={selectedCasino} onBack={() => setCurrentView("dashboard")} />
  }

  const totalBeers = beers.reduce((sum, beer) => sum + beer.quantity, 0)
  const activeWorkers = workers.filter((w) => w.isActive).length
  const totalInventoryValue = beers.reduce((sum, beer) => sum + beer.quantity * beer.purchasePrice, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500 p-2 rounded-lg">
                <Beer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Sistema de Ventas Casino</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedCasino === "spezia" ? "Spezia" : "Cali Gran Casino"} - Gestión de inventario y turnos
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Sistema Activo
              </Badge>
              <Button variant="outline" size="sm" onClick={() => setSelectedCasino("")}>
                Cambiar Casino
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Inventario Total</CardTitle>
              <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalBeers}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">cervezas disponibles</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Trabajadores Activos
              </CardTitle>
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeWorkers}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">empleados registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Turnos Activos</CardTitle>
              <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeShifts.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">turnos en curso</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Inventario</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ${totalInventoryValue.toLocaleString()}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">pesos colombianos</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-amber-500" />
                <span>Gestión de Inventario</span>
              </CardTitle>
              <CardDescription>Administrar stock de cervezas y precios de compra</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                onClick={() => setCurrentView("inventory")}
              >
                Gestionar Inventario
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Droplets className="h-5 w-5 text-cyan-500" />
                <span>Gaseosas y Jugos</span>
              </CardTitle>
              <CardDescription>Administrar inventario de bebidas no alcohólicas</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-cyan-500 hover:bg-cyan-600 text-white"
                onClick={() => setCurrentView("soft-drinks")}
              >
                Gestionar Bebidas
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span>Control de Turnos</span>
              </CardTitle>
              <CardDescription>Iniciar/finalizar turnos, contar efectivo y generar reportes</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => setCurrentView("shifts")}
              >
                Gestionar Turnos
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <span>Reportes de Ventas</span>
              </CardTitle>
              <CardDescription>Ver reportes de ventas y ganancias</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                onClick={() => setCurrentView("reports")}
              >
                Ver Reportes
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-indigo-500" />
                <span>Gestión de Personal</span>
              </CardTitle>
              <CardDescription>Agregar/eliminar trabajadores del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                onClick={() => setCurrentView("staff")}
              >
                Gestionar Personal
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
