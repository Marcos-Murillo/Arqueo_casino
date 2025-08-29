"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DollarSign, Calculator, ArrowLeft, CheckCircle, Banknote, Coins } from "lucide-react"
import { getShifts, saveShifts } from "@/lib/storage"
import type { Shift, CashBreakdown } from "@/types"

interface CashCountingProps {
  onBack: () => void
}

export default function CashCounting({ onBack }: CashCountingProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [isCountingDialogOpen, setIsCountingDialogOpen] = useState(false)
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
    coins: 0,
    nequi: 0,
    billetesVarios: 0,
    bonuses: 0,
    prizes: 0,
    total: 0,
  })

  useEffect(() => {
    setShifts(getShifts())
  }, [])

  const activeShifts = shifts.filter((shift) => shift.isActive && shift.expectedCash && !shift.actualCash)
  const completedShifts = shifts.filter((shift) => shift.actualCash !== undefined).slice(0, 10)

  const calculateTotal = (breakdown: CashBreakdown) => {
    const billsTotal = Object.entries(breakdown.bills).reduce(
      (sum, [denomination, quantity]) => sum + Number.parseInt(denomination) * quantity,
      0,
    )
    return (
      billsTotal + breakdown.coins + breakdown.nequi + breakdown.billetesVarios + breakdown.bonuses + breakdown.prizes
    )
  }

  const updateCashBreakdown = (
    type: "bills" | "coins" | "nequi" | "billetesVarios" | "bonuses" | "prizes",
    denomination: string,
    quantity: number,
  ) => {
    if (type === "nequi" || type === "billetesVarios" || type === "coins" || type === "bonuses" || type === "prizes") {
      const newBreakdown = {
        ...cashBreakdown,
        [type]: Math.max(0, quantity),
      }
      newBreakdown.total = calculateTotal(newBreakdown)
      setCashBreakdown(newBreakdown)
    } else {
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
  }

  const handleSaveCashCount = () => {
    if (!selectedShift) return

    const updatedShift: Shift = {
      ...selectedShift,
      actualCash: cashBreakdown.total,
      cashBreakdown,
    }

    const updatedShifts = shifts.map((shift) => (shift.id === selectedShift.id ? updatedShift : shift))

    setShifts(updatedShifts)
    saveShifts(updatedShifts)
    setSelectedShift(null)
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
    setIsCountingDialogOpen(false)
  }

  const getDifferenceStatus = (expected: number, actual: number) => {
    const difference = actual - expected
    if (difference === 0) return { status: "exact", color: "green", text: "Exacto" }
    if (difference > 0) return { status: "over", color: "blue", text: `+$${difference.toLocaleString()}` }
    return { status: "under", color: "red", text: `-$${Math.abs(difference).toLocaleString()}` }
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
              <div className="bg-green-500 p-2 rounded-lg">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Conteo de Efectivo</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Contar billetes y monedas al final del turno
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Turnos Pendientes
              </CardTitle>
              <Calculator className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeShifts.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">turnos sin contar efectivo</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Efectivo Esperado
              </CardTitle>
              <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ${activeShifts.reduce((sum, shift) => sum + (shift.expectedCash || 0), 0).toLocaleString()}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">total de turnos pendientes</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-amber-500" />
                <span>Conteos Hoy</span>
              </CardTitle>
              <CardDescription>Conteos completados hoy</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-amber-50 dark:bg-amber-900/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{shift.workerName}</h3>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Pendiente
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-medium">Turno:</span> {shift.startTime.toLocaleDateString("es-CO")}
                        </div>
                        <div>
                          <span className="font-medium">Cervezas Vendidas:</span>{" "}
                          {shift.beersSold ? Object.values(shift.beersSold).reduce((sum, qty) => sum + qty, 0) : 0}
                        </div>
                        <div>
                          <span className="font-medium">Efectivo Esperado:</span> $
                          {shift.expectedCash?.toLocaleString() || 0}
                        </div>
                        <div>
                          <span className="font-medium">Estado:</span> Finalizado
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedShift(shift)
                        setIsCountingDialogOpen(true)
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Contar Efectivo
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Cash Counts */}
        {activeShifts.length > 0 && (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5 text-amber-500" />
                <span>Turnos Pendientes de Conteo</span>
              </CardTitle>
              <CardDescription>Turnos que necesitan conteo de efectivo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-amber-50 dark:bg-amber-900/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{shift.workerName}</h3>
                        <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                          Pendiente
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-medium">Turno:</span> {shift.startTime.toLocaleDateString("es-CO")}
                        </div>
                        <div>
                          <span className="font-medium">Cervezas Vendidas:</span>{" "}
                          {shift.beersSold ? Object.values(shift.beersSold).reduce((sum, qty) => sum + qty, 0) : 0}
                        </div>
                        <div>
                          <span className="font-medium">Efectivo Esperado:</span> $
                          {shift.expectedCash?.toLocaleString() || 0}
                        </div>
                        <div>
                          <span className="font-medium">Estado:</span> Finalizado
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedShift(shift)
                        setIsCountingDialogOpen(true)
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white"
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      Contar Efectivo
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completed Cash Counts */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Conteos Completados Recientes</CardTitle>
            <CardDescription>Últimos 10 conteos de efectivo realizados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedShifts.map((shift) => {
                const expected = shift.expectedCash || 0
                const actual = shift.actualCash || 0
                const difference = getDifferenceStatus(expected, actual)

                return (
                  <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{shift.workerName}</h3>
                        <Badge
                          className={
                            difference.color === "green"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : difference.color === "blue"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }
                        >
                          {difference.text}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-medium">Fecha:</span>{" "}
                          {shift.endTime?.toLocaleDateString("es-CO") || "N/A"}
                        </div>
                        <div>
                          <span className="font-medium">Esperado:</span> ${expected.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Contado:</span> ${actual.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Diferencia:</span>{" "}
                          <span
                            className={
                              difference.color === "green"
                                ? "text-green-600 dark:text-green-400"
                                : difference.color === "blue"
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-red-600 dark:text-red-400"
                            }
                          >
                            {difference.text}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              {completedShifts.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No hay conteos de efectivo registrados.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Cash Counting Dialog */}
      <Dialog open={isCountingDialogOpen} onOpenChange={setIsCountingDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Conteo de Efectivo</DialogTitle>
            <DialogDescription>
              Cuenta todos los billetes y monedas del turno de {selectedShift?.workerName}
            </DialogDescription>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-6">
              {/* Shift Summary */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <div className="font-medium mb-2">Información del Turno:</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Trabajador: {selectedShift.workerName}</div>
                    <div>Fecha: {selectedShift.startTime.toLocaleDateString("es-CO")}</div>
                    <div>
                      Cervezas vendidas:{" "}
                      {selectedShift.beersSold
                        ? Object.values(selectedShift.beersSold).reduce((sum, qty) => sum + qty, 0)
                        : 0}
                    </div>
                    <div>Efectivo esperado: ${selectedShift.expectedCash?.toLocaleString() || 0}</div>
                  </div>
                </div>
              </div>

              {/* Bills Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Banknote className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Billetes</h3>
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

              {/* Coins Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Coins className="h-5 w-5 text-amber-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Monedas</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="coins" className="text-sm font-medium">
                      Total Monedas
                    </Label>
                    <Input
                      id="coins"
                      type="number"
                      min="0"
                      value={cashBreakdown.coins}
                      onChange={(e) => updateCashBreakdown("coins", "", Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <div className="text-xs text-slate-500 text-center">${cashBreakdown.coins.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Nequi Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Nequi</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nequi" className="text-sm font-medium">
                      Nequi
                    </Label>
                    <Input
                      id="nequi"
                      type="number"
                      min="0"
                      value={cashBreakdown.nequi}
                      onChange={(e) => updateCashBreakdown("nequi", "", Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <div className="text-xs text-slate-500 text-center">${cashBreakdown.nequi.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Billetes Varios Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="h-5 w-5 text-red-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Billetes Varios</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billetesVarios" className="text-sm font-medium">
                      Billetes Varios
                    </Label>
                    <Input
                      id="billetesVarios"
                      type="number"
                      min="0"
                      value={cashBreakdown.billetesVarios}
                      onChange={(e) => updateCashBreakdown("billetesVarios", "", Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <div className="text-xs text-slate-500 text-center">
                      ${cashBreakdown.billetesVarios.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bonuses Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="h-5 w-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Bonos</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bonuses" className="text-sm font-medium">
                      Bonos
                    </Label>
                    <Input
                      id="bonuses"
                      type="number"
                      min="0"
                      value={cashBreakdown.bonuses}
                      onChange={(e) => updateCashBreakdown("bonuses", "", Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <div className="text-xs text-slate-500 text-center">${cashBreakdown.bonuses.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Prizes Section */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <span className="h-5 w-5 text-orange-600" />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Premios</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prizes" className="text-sm font-medium">
                      Premios
                    </Label>
                    <Input
                      id="prizes"
                      type="number"
                      min="0"
                      value={cashBreakdown.prizes}
                      onChange={(e) => updateCashBreakdown("prizes", "", Number.parseInt(e.target.value) || 0)}
                      className="text-center"
                    />
                    <div className="text-xs text-slate-500 text-center">${cashBreakdown.prizes.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <div className="font-medium mb-2">Resumen del Conteo:</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Total contado: ${cashBreakdown.total.toLocaleString()}</div>
                    <div>Efectivo esperado: ${selectedShift.expectedCash?.toLocaleString() || 0}</div>
                    <div>
                      Diferencia:{" "}
                      <span
                        className={
                          cashBreakdown.total === (selectedShift.expectedCash || 0)
                            ? "text-green-600 dark:text-green-400"
                            : cashBreakdown.total > (selectedShift.expectedCash || 0)
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-red-600 dark:text-red-400"
                        }
                      >
                        {cashBreakdown.total === (selectedShift.expectedCash || 0)
                          ? "Exacto"
                          : cashBreakdown.total > (selectedShift.expectedCash || 0)
                            ? `+$${(cashBreakdown.total - (selectedShift.expectedCash || 0)).toLocaleString()}`
                            : `-$${((selectedShift.expectedCash || 0) - cashBreakdown.total).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <Button onClick={handleSaveCashCount} className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Guardar Conteo
                </Button>
                <Button variant="outline" onClick={() => setIsCountingDialogOpen(false)} className="flex-1">
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
