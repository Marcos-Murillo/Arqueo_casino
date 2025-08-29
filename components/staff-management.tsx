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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Users, ArrowLeft, Plus, Edit, Trash2, UserCheck, UserX, Clock } from "lucide-react"
import { getWorkers, saveWorker, getShifts } from "@/lib/firebase-storage"
import type { Worker, Shift } from "@/types"

interface StaffManagementProps {
  selectedCasino: string
  onBack: () => void
}

export default function StaffManagement({ selectedCasino, onBack }: StaffManagementProps) {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [shifts, setShifts] = useState<Shift[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
  const [newWorkerName, setNewWorkerName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [workersData, shiftsData] = await Promise.all([getWorkers(selectedCasino), getShifts(selectedCasino)])
        setWorkers(workersData)
        setShifts(shiftsData)
      } catch (error) {
        console.error("Error loading staff data:", error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedCasino])

  const activeWorkers = workers.filter((worker) => worker.isActive)
  const inactiveWorkers = workers.filter((worker) => !worker.isActive)

  const getWorkerStats = (workerId: string) => {
    const workerShifts = shifts.filter((shift) => shift.workerId === workerId)
    const completedShifts = workerShifts.filter((shift) => !shift.isActive)
    const totalBeersSold = completedShifts.reduce(
      (sum, shift) =>
        sum + (shift.beersSold ? Object.values(shift.beersSold).reduce((beerSum, qty) => beerSum + qty, 0) : 0),
      0,
    )
    const totalRevenue = completedShifts.reduce((sum, shift) => sum + (shift.expectedCash || 0), 0)
    const totalCashDifference = completedShifts.reduce(
      (sum, shift) => sum + ((shift.actualCash || 0) - (shift.expectedCash || 0)),
      0,
    )

    return {
      totalShifts: completedShifts.length,
      totalBeersSold,
      totalRevenue,
      totalCashDifference,
      averageBeersPerShift: completedShifts.length > 0 ? Math.round(totalBeersSold / completedShifts.length) : 0,
    }
  }

  const handleAddWorker = async () => {
    if (!newWorkerName.trim()) return

    const newWorker: Worker = {
      id: Date.now().toString(),
      name: newWorkerName.trim(),
      isActive: true,
      createdAt: new Date(),
    }

    try {
      await saveWorker(selectedCasino, newWorker)
      const updatedWorkers = [...workers, newWorker]
      setWorkers(updatedWorkers)
      setNewWorkerName("")
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding worker:", error)
    }
  }

  const handleEditWorker = async () => {
    if (!selectedWorker || !selectedWorker.name.trim()) return

    try {
      await saveWorker(selectedCasino, selectedWorker)
      const updatedWorkers = workers.map((worker) => (worker.id === selectedWorker.id ? selectedWorker : worker))
      setWorkers(updatedWorkers)
      setSelectedWorker(null)
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating worker:", error)
    }
  }

  const handleToggleWorkerStatus = async (workerId: string) => {
    const worker = workers.find((w) => w.id === workerId)
    if (!worker) return

    const updatedWorker = { ...worker, isActive: !worker.isActive }

    try {
      await saveWorker(selectedCasino, updatedWorker)
      const updatedWorkers = workers.map((w) => (w.id === workerId ? updatedWorker : w))
      setWorkers(updatedWorkers)
    } catch (error) {
      console.error("Error updating worker status:", error)
    }
  }

  const handleDeleteWorker = async (workerId: string) => {
    // Check if worker has any shifts
    const workerShifts = shifts.filter((shift) => shift.workerId === workerId)
    if (workerShifts.length > 0) {
      // Don't actually delete, just deactivate
      await handleToggleWorkerStatus(workerId)
    } else {
      // Safe to delete if no shifts - for now just deactivate since Firebase doesn't have delete function
      await handleToggleWorkerStatus(workerId)
    }
  }

  const canDeleteWorker = (workerId: string) => {
    const workerShifts = shifts.filter((shift) => shift.workerId === workerId)
    return workerShifts.length === 0
  }

  const formatDate = (date: Date | string | number) => {
    if (date instanceof Date) {
      return date.toLocaleDateString("es-CO")
    }
    // Handle Firebase timestamp or string dates
    return new Date(date).toLocaleDateString("es-CO")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando personal...</p>
        </div>
      </div>
    )
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
              <div className="bg-indigo-500 p-2 rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Personal</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Administrar trabajadores del sistema - {selectedCasino}
                </p>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-indigo-500 hover:bg-indigo-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Trabajador
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nuevo Trabajador</DialogTitle>
                  <DialogDescription>Ingresa los datos del nuevo empleado</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="worker-name">Nombre Completo</Label>
                    <Input
                      id="worker-name"
                      value={newWorkerName}
                      onChange={(e) => setNewWorkerName(e.target.value)}
                      placeholder="Ej: Juan Pérez"
                    />
                  </div>
                  <Button
                    onClick={handleAddWorker}
                    disabled={!newWorkerName.trim()}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
                  >
                    Agregar Trabajador
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Empleados</CardTitle>
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{workers.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">empleados registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Empleados Activos
              </CardTitle>
              <UserCheck className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeWorkers.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">disponibles para turnos</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Empleados Inactivos
              </CardTitle>
              <UserX className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{inactiveWorkers.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">no disponibles</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Turnos Activos</CardTitle>
              <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {shifts.filter((shift) => shift.isActive).length}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">turnos en curso</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Workers */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <span>Empleados Activos</span>
            </CardTitle>
            <CardDescription>Trabajadores disponibles para asignar turnos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeWorkers.map((worker) => {
                const stats = getWorkerStats(worker.id)
                const hasActiveShift = shifts.some((shift) => shift.workerId === worker.id && shift.isActive)

                return (
                  <div
                    key={worker.id}
                    className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-green-50 dark:bg-green-900/10"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{worker.name}</h3>
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Activo
                        </Badge>
                        {hasActiveShift && (
                          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            En Turno
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        <div>
                          <span className="font-medium">Turnos:</span> {stats.totalShifts}
                        </div>
                        <div>
                          <span className="font-medium">Cervezas Vendidas:</span> {stats.totalBeersSold}
                        </div>
                        <div>
                          <span className="font-medium">Ingresos:</span> ${stats.totalRevenue.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Promedio/Turno:</span> {stats.averageBeersPerShift} cervezas
                        </div>
                        <div>
                          <span className="font-medium">Diferencia Efectivo:</span>{" "}
                          <span
                            className={
                              stats.totalCashDifference === 0
                                ? "text-slate-600 dark:text-slate-400"
                                : stats.totalCashDifference > 0
                                  ? "text-blue-600 dark:text-blue-400"
                                  : "text-red-600 dark:text-red-400"
                            }
                          >
                            {stats.totalCashDifference === 0
                              ? "Exacto"
                              : stats.totalCashDifference > 0
                                ? `+$${stats.totalCashDifference.toLocaleString()}`
                                : `-$${Math.abs(stats.totalCashDifference).toLocaleString()}`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedWorker(worker)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleWorkerStatus(worker.id)}
                        className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Desactivar
                      </Button>
                    </div>
                  </div>
                )
              })}
              {activeWorkers.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No hay empleados activos. Agrega trabajadores para comenzar.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inactive Workers */}
        {inactiveWorkers.length > 0 && (
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-red-500" />
                <span>Empleados Inactivos</span>
              </CardTitle>
              <CardDescription>Trabajadores desactivados o dados de baja</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {inactiveWorkers.map((worker) => {
                  const stats = getWorkerStats(worker.id)

                  return (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-red-50 dark:bg-red-900/10"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{worker.name}</h3>
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Inactivo</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                          <div>
                            <span className="font-medium">Turnos Completados:</span> {stats.totalShifts}
                          </div>
                          <div>
                            <span className="font-medium">Cervezas Vendidas:</span> {stats.totalBeersSold}
                          </div>
                          <div>
                            <span className="font-medium">Ingresos Generados:</span> $
                            {stats.totalRevenue.toLocaleString()}
                          </div>
                          <div>
                            <span className="font-medium">Fecha Registro:</span> {formatDate(worker.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleWorkerStatus(worker.id)}
                          className="border-green-200 text-green-600 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/20"
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Reactivar
                        </Button>
                        {canDeleteWorker(worker.id) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20 bg-transparent"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Eliminar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar trabajador?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará permanentemente a {worker.name} del sistema. Esta acción no se
                                  puede deshacer.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteWorker(worker.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Edit Worker Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Trabajador</DialogTitle>
            <DialogDescription>Actualiza la información del empleado</DialogDescription>
          </DialogHeader>
          {selectedWorker && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-worker-name">Nombre Completo</Label>
                <Input
                  id="edit-worker-name"
                  value={selectedWorker.name}
                  onChange={(e) => setSelectedWorker({ ...selectedWorker, name: e.target.value })}
                />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  <div className="font-medium mb-2">Información del Empleado:</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Estado: {selectedWorker.isActive ? "Activo" : "Inactivo"}</div>
                    <div>Fecha de Registro: {formatDate(selectedWorker.createdAt)}</div>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleEditWorker}
                disabled={!selectedWorker.name.trim()}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white"
              >
                Actualizar Trabajador
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
