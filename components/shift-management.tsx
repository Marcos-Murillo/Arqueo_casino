"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Clock,
  Play,
  Square,
  ArrowLeft,
  User,
  Calendar,
  AlertCircle,
  Banknote,
  DollarSign,
  Save,
  Gift,
  Award,
} from "lucide-react"
import { loadShifts, saveShifts, loadWorkers, loadBeers, saveBeers } from "@/lib/firebase-storage"
import type { Shift, Worker, Beer, CashBreakdown } from "@/types"

interface ShiftManagementProps {
  selectedCasino: string
  onBack: () => void
}

export default function ShiftManagement({ selectedCasino, onBack }: ShiftManagementProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [workers, setWorkers] = useState<Worker[]>([])
  const [beers, setBeers] = useState<Beer[]>([])
  const [isStartShiftDialogOpen, setIsStartShiftDialogOpen] = useState(false)
  const [isEndShiftDialogOpen, setIsEndShiftDialogOpen] = useState(false)
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [selectedWorkerId, setSelectedWorkerId] = useState("")
  const [salesData, setSalesData] = useState<Record<string, number>>({})
  const [freeBeerData, setFreeBeerData] = useState<Record<string, number>>({})
  const [bonuses, setBonuses] = useState(0)
  const [prizes, setPrizes] = useState(0)
  const [savedProgress, setSavedProgress] = useState<any>(null)
  const [cashBreakdown, setCashBreakdown] = useState<CashBreakdown>({
    bills: {
      "100000": 0,
      "50000": 0,
      "20000": 0,
      "10000": 0,
      "5000": 0,
      "2000": 0,
      "1000": 0,
    },
    coins: 0, // Changed to single number instead of object
    nequi: 0,
    billetesVarios: 0,
    bonuses: 0,
    prizes: 0,
    total: 0,
  })

  useEffect(() => {
    loadData()
  }, [selectedCasino])

  const loadData = async () => {
    try {
      const [shiftsData, workersData, beersData] = await Promise.all([
        loadShifts(selectedCasino),
        loadWorkers(selectedCasino),
        loadBeers(selectedCasino),
      ])
      setShifts(shiftsData)
      setWorkers(workersData)
      setBeers(beersData)
    } catch (error) {
      console.error("Error loading data:", error)
    }
  }

  const activeShifts = shifts.filter((shift) => shift.isActive)
  const completedShifts = shifts.filter((shift) => !shift.isActive).slice(0, 10)

  const calculateTotal = (breakdown: CashBreakdown) => {
    const billsTotal = Object.entries(breakdown.bills).reduce(
      (sum, [denomination, quantity]) => sum + Number.parseInt(denomination) * quantity,
      0,
    )
    return (
      billsTotal + breakdown.coins + breakdown.nequi + breakdown.billetesVarios + breakdown.bonuses + breakdown.prizes
    )
  }

  const updateCashBreakdown = (type: "bills", denomination: string, quantity: number) => {
    const newBreakdown = {
      ...cashBreakdown,
      [type]: {
        ...cashBreakdown[type],
        [denomination]: Math.max(0, quantity),
      },
    }
    newBreakdown.total = calculateTotal(newBreakdown)
    setCashBreakdown(newBreakdown)
  }

  const saveProgress = () => {
    const progress = {
      salesData,
      freeBeerData,
      bonuses,
      prizes,
      cashBreakdown,
      shiftId: selectedShift?.id,
    }
    setSavedProgress(progress)
    localStorage.setItem(`shift_progress_${selectedCasino}_${selectedShift?.id}`, JSON.stringify(progress))
    alert("Progreso guardado exitosamente")
  }

  const loadSavedProgress = (shiftId: string) => {
    const saved = localStorage.getItem(`shift_progress_${selectedCasino}_${shiftId}`)
    if (saved) {
      const progress = JSON.parse(saved)
      setSalesData(progress.salesData || {})
      setFreeBeerData(progress.freeBeerData || {})
      setBonuses(progress.bonuses || 0)
      setPrizes(progress.prizes || 0)
      setCashBreakdown(progress.cashBreakdown || cashBreakdown)
    }
  }

  const handleStartShift = async () => {
    if (!selectedWorkerId) return

    const worker = workers.find((w) => w.id === selectedWorkerId)
    if (!worker) return

    const initialInventory: Record<string, number> = {}
    let totalInitialInventory = 0
    beers.forEach((beer) => {
      initialInventory[beer.id] = beer.quantity
      totalInitialInventory += beer.quantity
    })

    const newShift: Shift = {
      id: Date.now().toString(),
      workerId: worker.id,
      workerName: worker.name,
      startTime: new Date(),
      isActive: true,
      initialInventory,
    }

    const updatedShifts = [...shifts, newShift]
    setShifts(updatedShifts)
    await saveShifts(selectedCasino, updatedShifts)
    setSelectedWorkerId("")
    setIsStartShiftDialogOpen(false)
  }

  const handleEndShift = async () => {
    if (!selectedShift) return

    const finalInventory: Record<string, number> = {}
    const beersSold: Record<string, number> = {}
    const freeBeersSold: Record<string, number> = {}
    let expectedCash = 0

    beers.forEach((beer) => {
      const initialQty = selectedShift.initialInventory[beer.id] || 0
      const soldQty = salesData[beer.id] || 0
      const freeQty = freeBeerData[beer.id] || 0
      const finalQty = initialQty - soldQty - freeQty

      finalInventory[beer.id] = finalQty
      beersSold[beer.id] = soldQty
      freeBeersSold[beer.id] = freeQty
      expectedCash += soldQty * beer.sellingPrice

      // Update beer inventory
      beer.quantity = finalQty
    })

    const updatedCashBreakdown = {
      ...cashBreakdown,
      bonuses,
      prizes,
      total: calculateTotal({ ...cashBreakdown, bonuses, prizes }),
    }

    const updatedShift: Shift = {
      ...selectedShift,
      endTime: new Date(),
      isActive: false,
      finalInventory,
      beersSold,
      freeBeersSold,
      bonuses,
      prizes,
      expectedCash,
      actualCash: updatedCashBreakdown.total,
      cashBreakdown: updatedCashBreakdown,
    }

    const updatedShifts = shifts.map((shift) => (shift.id === selectedShift.id ? updatedShift : shift))

    setShifts(updatedShifts)
    await Promise.all([saveShifts(selectedCasino, updatedShifts), saveBeers(selectedCasino, beers)])

    localStorage.removeItem(`shift_progress_${selectedCasino}_${selectedShift.id}`)

    setSelectedShift(null)
    setSalesData({})
    setFreeBeerData({})
    setBonuses(0)
    setPrizes(0)
    setCashBreakdown({
      bills: {
        "100000": 0,
        "50000": 0,
        "20000": 0,
        "10000": 0,
        "5000": 0,
        "2000": 0,
        "1000": 0,
      },
      coins: 0,
      nequi: 0,
      billetesVarios: 0,
      bonuses: 0,
      prizes: 0,
      total: 0,
    })
    setIsEndShiftDialogOpen(false)
  }

  const formatDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date()
    const duration = Math.floor((endTime.getTime() - start.getTime()) / (1000 * 60 * 60))
    return `${duration}h`
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm" onClick={onBack} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="bg-blue-500 p-2 rounded-lg">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Control de Turnos</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Gestionar turnos de trabajo de 8 horas</p>
              </div>
            </div>
            <Dialog open={isStartShiftDialogOpen} onOpenChange={setIsStartShiftDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Iniciar Nuevo Turno</DialogTitle>
                  <DialogDescription>Selecciona el trabajador que iniciará el turno</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="worker">Trabajador</Label>
                    <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar trabajador" />
                      </SelectTrigger>
                      <SelectContent>
                        {workers
                          .filter((worker) => worker.isActive)
                          .map((worker) => (
                            <SelectItem key={worker.id} value={worker.id}>
                              {worker.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <div className="font-medium mb-2">Inventario inicial será registrado:</div>
                      <div className="space-y-1">
                        {beers.map((beer) => (
                          <div key={beer.id} className="flex justify-between">
                            <span>{beer.name}:</span>
                            <span>{beer.quantity} unidades</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 mt-2 font-semibold">
                          <div className="flex justify-between">
                            <span>Total inicial:</span>
                            <span>{beers.reduce((sum, beer) => sum + beer.quantity, 0)} unidades</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={handleStartShift}
                    disabled={!selectedWorkerId}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Iniciar Turno
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Trabajadores Disponibles
              </CardTitle>
              <User className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {workers.filter((w) => w.isActive).length}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">empleados activos</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Turnos Hoy</CardTitle>
              <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {
                  shifts.filter((shift) => {
                    const today = new Date()
                    const shiftDate = new Date(shift.startTime)
                    return shiftDate.toDateString() === today.toDateString()
                  }).length
                }
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">turnos registrados hoy</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Shifts */}
        {activeShifts.length > 0 && (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5 text-green-500" />
                <span>Turnos Activos</span>
              </CardTitle>
              <CardDescription>Turnos actualmente en curso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-green-50 dark:bg-green-900/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{shift.workerName}</h3>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          En Curso
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-medium">Entrada:</span> {formatTime(shift.startTime)}
                        </div>
                        <div>
                          <span className="font-medium">Duración:</span> {formatDuration(shift.startTime)}
                        </div>
                        <div>
                          <span className="font-medium">Inventario Inicial:</span>{" "}
                          {Object.values(shift.initialInventory).reduce((sum, qty) => sum + qty, 0)} unidades
                        </div>
                        {shift.restockDuringShift && (
                          <div className="text-amber-600">
                            <span className="font-medium">⚠️ Reabastecido durante turno</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedShift(shift)
                        const initialSalesData: Record<string, number> = {}
                        const initialFreeBeerData: Record<string, number> = {}
                        beers.forEach((beer) => {
                          initialSalesData[beer.id] = 0
                          initialFreeBeerData[beer.id] = 0
                        })
                        setSalesData(initialSalesData)
                        setFreeBeerData(initialFreeBeerData)
                        setBonuses(0)
                        setPrizes(0)
                        loadSavedProgress(shift.id)
                        setIsEndShiftDialogOpen(true)
                      }}
                      className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                      <Square className="h-4 w-4 mr-1" />
                      Finalizar Turno
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Completed Shifts */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Turnos Completados Recientes</CardTitle>
            <CardDescription>Últimos 10 turnos finalizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{shift.workerName}</h3>
                      <Badge variant="secondary">Completado</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Fecha:</span> {shift.startTime.toLocaleDateString("es-CO")}
                      </div>
                      <div>
                        <span className="font-medium">Entrada:</span> {formatTime(shift.startTime)}
                      </div>
                      <div>
                        <span className="font-medium">Salida:</span> {shift.endTime ? formatTime(shift.endTime) : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Duración:</span>{" "}
                        {shift.endTime ? formatDuration(shift.startTime, shift.endTime) : "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Cervezas Vendidas:</span>{" "}
                        {shift.beersSold ? Object.values(shift.beersSold).reduce((sum, qty) => sum + qty, 0) : 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {completedShifts.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No hay turnos completados registrados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* End Shift Dialog */}
      <Dialog open={isEndShiftDialogOpen} onOpenChange={setIsEndShiftDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Turno - Arqueo Completo</DialogTitle>
            <DialogDescription>
              Registra las ventas y cuenta el efectivo del turno de {selectedShift?.workerName}
            </DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <div className="font-medium mb-2">Información del Turno:</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Trabajador: {selectedShift.workerName}</div>
                    <div>Entrada: {formatTime(selectedShift.startTime)}</div>
                    <div>Duración: {formatDuration(selectedShift.startTime)}</div>
                    <div>
                      Total Inicial: {Object.values(selectedShift.initialInventory).reduce((sum, qty) => sum + qty, 0)}{" "}
                      unidades
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">Registrar Ventas por Cerveza</Label>
                <div className="space-y-4 mt-4">
                  {beers.map((beer) => {
                    const initialQty = selectedShift.initialInventory[beer.id] || 0
                    const soldQty = salesData[beer.id] || 0
                    const freeQty = freeBeerData[beer.id] || 0
                    const remainingQty = initialQty - soldQty - freeQty

                    return (
                      <div key={beer.id} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-slate-900 dark:text-white">{beer.name}</h4>
                          <Badge variant="outline">Stock inicial: {initialQty}</Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <Label htmlFor={`sold-${beer.id}`}>Cervezas Vendidas</Label>
                            <Input
                              id={`sold-${beer.id}`}
                              type="number"
                              min="0"
                              max={initialQty}
                              value={soldQty}
                              onChange={(e) =>
                                setSalesData({
                                  ...salesData,
                                  [beer.id]: Math.min(Number.parseInt(e.target.value) || 0, initialQty),
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label htmlFor={`free-${beer.id}`}>Cervezas Regaladas</Label>
                            <Input
                              id={`free-${beer.id}`}
                              type="number"
                              min="0"
                              max={initialQty - soldQty}
                              value={freeQty}
                              onChange={(e) =>
                                setFreeBeerData({
                                  ...freeBeerData,
                                  [beer.id]: Math.min(Number.parseInt(e.target.value) || 0, initialQty - soldQty),
                                })
                              }
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="text-sm text-slate-600 dark:text-slate-400">
                              <div>Stock restante: {remainingQty}</div>
                              <div>Ingresos: ${(soldQty * beer.sellingPrice).toLocaleString()}</div>
                            </div>
                          </div>
                          {remainingQty < 0 && (
                            <div className="flex items-center text-red-600 dark:text-red-400">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span className="text-sm">Cantidad inválida</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bonuses" className="text-base font-medium flex items-center">
                    <Award className="h-4 w-4 mr-2" />
                    Bonos
                  </Label>
                  <Input
                    id="bonuses"
                    type="number"
                    min="0"
                    value={bonuses}
                    onChange={(e) => setBonuses(Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="prizes" className="text-base font-medium flex items-center">
                    <Gift className="h-4 w-4 mr-2" />
                    Premios
                  </Label>
                  <Input
                    id="prizes"
                    type="number"
                    min="0"
                    value={prizes}
                    onChange={(e) => setPrizes(Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                <div className="flex items-center space-x-2 mb-4">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Conteo de Efectivo</h3>
                </div>

                {/* Bills Section */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Banknote className="h-5 w-5 text-green-600" />
                    <h4 className="text-base font-medium text-slate-900 dark:text-white">Billetes</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(cashBreakdown.bills).map(([denomination, quantity]) => (
                      <div key={denomination} className="space-y-2">
                        <Label htmlFor={`bill-${denomination}`} className="text-sm font-medium">
                          ${Number.parseInt(denomination).toLocaleString()}
                        </Label>
                        <Input
                          id={`bill-${denomination}`}
                          type="number"
                          min="0"
                          value={quantity}
                          onChange={(e) =>
                            updateCashBreakdown("bills", denomination, Number.parseInt(e.target.value) || 0)
                          }
                          className="text-center"
                        />
                        <div className="text-xs text-slate-500 text-center">
                          ${(Number.parseInt(denomination) * quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="coins" className="text-base font-medium">
                      Monedas (Total)
                    </Label>
                    <Input
                      id="coins"
                      type="number"
                      min="0"
                      value={cashBreakdown.coins}
                      onChange={(e) => {
                        const newBreakdown = {
                          ...cashBreakdown,
                          coins: Number.parseInt(e.target.value) || 0,
                        }
                        newBreakdown.total = calculateTotal(newBreakdown)
                        setCashBreakdown(newBreakdown)
                      }}
                      className="text-center"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Other Payment Methods */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    <h4 className="text-base font-medium text-slate-900 dark:text-white">Otros Medios de Pago</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nequi" className="text-sm font-medium">
                        Nequi
                      </Label>
                      <Input
                        id="nequi"
                        type="number"
                        min="0"
                        value={cashBreakdown.nequi}
                        onChange={(e) => {
                          const newBreakdown = {
                            ...cashBreakdown,
                            nequi: Number.parseInt(e.target.value) || 0,
                          }
                          newBreakdown.total = calculateTotal(newBreakdown)
                          setCashBreakdown(newBreakdown)
                        }}
                        className="text-center"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billetes-varios" className="text-sm font-medium">
                        Billetes Varios
                      </Label>
                      <Input
                        id="billetes-varios"
                        type="number"
                        min="0"
                        value={cashBreakdown.billetesVarios}
                        onChange={(e) => {
                          const newBreakdown = {
                            ...cashBreakdown,
                            billetesVarios: Number.parseInt(e.target.value) || 0,
                          }
                          newBreakdown.total = calculateTotal(newBreakdown)
                          setCashBreakdown(newBreakdown)
                        }}
                        className="text-center"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-medium mb-2">Resumen del Turno:</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Total vendido: {Object.values(salesData).reduce((sum, qty) => sum + qty, 0)} cervezas</div>
                    <div>Total regalado: {Object.values(freeBeerData).reduce((sum, qty) => sum + qty, 0)} cervezas</div>
                    <div>Bonos: ${bonuses.toLocaleString()}</div>
                    <div>Premios: ${prizes.toLocaleString()}</div>
                    <div>
                      Efectivo esperado: $
                      {beers
                        .reduce((sum, beer) => sum + (salesData[beer.id] || 0) * beer.sellingPrice, 0)
                        .toLocaleString()}
                    </div>
                    <div>Total contado: ${calculateTotal({ ...cashBreakdown, bonuses, prizes }).toLocaleString()}</div>
                  </div>

                  {/* Base Amount Comparison */}
                  <div className="mt-4 p-3 rounded-lg border-2 border-dashed">
                    {(() => {
                      const baseAmount = 10000000
                      const totalCounted = calculateTotal({ ...cashBreakdown, bonuses, prizes })
                      const difference = totalCounted - baseAmount

                      if (difference === 0) {
                        return (
                          <div className="text-green-600 dark:text-green-400 font-medium text-center">
                            ✓ Cantidad exacta en base: $10,000,000
                          </div>
                        )
                      } else if (difference < 0) {
                        return (
                          <div className="text-red-600 dark:text-red-400 font-medium text-center">
                            Hace falta dinero: ${Math.abs(difference).toLocaleString()}
                          </div>
                        )
                      } else {
                        return (
                          <div className="text-green-600 dark:text-green-400 font-medium text-center">
                            -_- Hay más dinero: +${difference.toLocaleString()}
                          </div>
                        )
                      }
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={saveProgress}
                  variant="outline"
                  className="flex-1 bg-amber-50 hover:bg-amber-100 border-amber-200"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Avances de Arqueo
                </Button>
                <Button
                  onClick={handleEndShift}
                  disabled={Object.values(salesData).some((qty, index) => {
                    const beer = beers[index]
                    const initialQty = selectedShift.initialInventory[beer.id] || 0
                    const freeQty = freeBeerData[beer.id] || 0
                    return qty + freeQty > initialQty
                  })}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  Finalizar Turno y Guardar Conteo
                </Button>
                <Button variant="outline" onClick={() => setIsEndShiftDialogOpen(false)} className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
