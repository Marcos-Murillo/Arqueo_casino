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
import { AlertTriangle, Package, Plus, Edit, RefreshCw, ArrowLeft } from "lucide-react"
import { getBeers, saveBeers } from "@/lib/storage"
import type { Beer } from "@/types"

interface InventoryManagementProps {
  onBack: () => void
}

export default function InventoryManagement({ onBack }: InventoryManagementProps) {
  const [beers, setBeers] = useState<Beer[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false)
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null)
  const [newBeer, setNewBeer] = useState({
    name: "",
    quantity: 0,
    purchasePrice: 0,
    weeklyRestockDay: "monday" as const,
  })

  useEffect(() => {
    setBeers(getBeers())
  }, [])

  const handleAddBeer = () => {
    if (!newBeer.name || newBeer.purchasePrice <= 0) return

    const beer: Beer = {
      id: Date.now().toString(),
      name: newBeer.name,
      quantity: newBeer.quantity,
      purchasePrice: newBeer.purchasePrice,
      sellingPrice: 4000, // Fixed selling price
      lastRestockDate: new Date(),
      weeklyRestockDay: newBeer.weeklyRestockDay,
    }

    const updatedBeers = [...beers, beer]
    setBeers(updatedBeers)
    saveBeers(updatedBeers)
    setNewBeer({ name: "", quantity: 0, purchasePrice: 0, weeklyRestockDay: "monday" })
    setIsAddDialogOpen(false)
  }

  const handleUpdateBeer = () => {
    if (!selectedBeer) return

    const updatedBeers = beers.map((beer) => (beer.id === selectedBeer.id ? selectedBeer : beer))
    setBeers(updatedBeers)
    saveBeers(updatedBeers)
    setIsEditDialogOpen(false)
    setSelectedBeer(null)
  }

  const handleRestock = (beerId: string, additionalQuantity: number) => {
    const updatedBeers = beers.map((beer) =>
      beer.id === beerId
        ? {
            ...beer,
            quantity: beer.quantity + additionalQuantity,
            lastRestockDate: new Date(),
          }
        : beer,
    )
    setBeers(updatedBeers)
    saveBeers(updatedBeers)
    setIsRestockDialogOpen(false)
    setSelectedBeer(null)
  }

  const totalInventoryValue = beers.reduce((sum, beer) => sum + beer.quantity * beer.purchasePrice, 0)
  const lowStockBeers = beers.filter((beer) => beer.quantity < 20)

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
              <div className="bg-amber-500 p-2 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Gestión de Inventario</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Administrar stock y precios de cerveza</p>
              </div>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-amber-500 hover:bg-amber-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Cerveza
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Nueva Cerveza</DialogTitle>
                  <DialogDescription>Ingresa los detalles de la nueva cerveza al inventario</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nombre de la Cerveza</Label>
                    <Input
                      id="name"
                      value={newBeer.name}
                      onChange={(e) => setNewBeer({ ...newBeer, name: e.target.value })}
                      placeholder="Ej: Cerveza Premium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantity">Cantidad Inicial</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={newBeer.quantity}
                      onChange={(e) => setNewBeer({ ...newBeer, quantity: Number.parseInt(e.target.value) || 0 })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="purchasePrice">Precio de Compra (COP)</Label>
                    <Input
                      id="purchasePrice"
                      type="number"
                      value={newBeer.purchasePrice}
                      onChange={(e) => setNewBeer({ ...newBeer, purchasePrice: Number.parseInt(e.target.value) || 0 })}
                      placeholder="2500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="restockDay">Día de Reabastecimiento Semanal</Label>
                    <Select
                      value={newBeer.weeklyRestockDay}
                      onValueChange={(value) =>
                        setNewBeer({ ...newBeer, weeklyRestockDay: value as Beer["weeklyRestockDay"] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monday">Lunes</SelectItem>
                        <SelectItem value="tuesday">Martes</SelectItem>
                        <SelectItem value="wednesday">Miércoles</SelectItem>
                        <SelectItem value="thursday">Jueves</SelectItem>
                        <SelectItem value="friday">Viernes</SelectItem>
                        <SelectItem value="saturday">Sábado</SelectItem>
                        <SelectItem value="sunday">Domingo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddBeer} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    Agregar Cerveza
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
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Valor Total Inventario
              </CardTitle>
              <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                ${totalInventoryValue.toLocaleString()}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">pesos colombianos</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Tipos de Cerveza</CardTitle>
              <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{beers.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">productos registrados</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Stock Bajo</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{lowStockBeers.length}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">productos con menos de 20 unidades</p>
            </CardContent>
          </Card>
        </div>

        {/* Inventory Table */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Inventario de Cervezas</CardTitle>
            <CardDescription>Gestiona el stock y precios de todas las cervezas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {beers.map((beer) => (
                <div
                  key={beer.id}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{beer.name}</h3>
                      {beer.quantity < 20 && (
                        <Badge
                          variant="destructive"
                          className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200"
                        >
                          Stock Bajo
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Cantidad:</span> {beer.quantity} unidades
                      </div>
                      <div>
                        <span className="font-medium">Precio Compra:</span> ${beer.purchasePrice.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Precio Venta:</span> ${beer.sellingPrice.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Ganancia:</span> $
                        {(beer.sellingPrice - beer.purchasePrice).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBeer(beer)
                        setIsRestockDialogOpen(true)
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Reabastecer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBeer(beer)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </div>
                </div>
              ))}
              {beers.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No hay cervezas registradas. Agrega tu primera cerveza para comenzar.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Cerveza</DialogTitle>
            <DialogDescription>Actualiza los detalles de la cerveza</DialogDescription>
          </DialogHeader>
          {selectedBeer && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre de la Cerveza</Label>
                <Input
                  id="edit-name"
                  value={selectedBeer.name}
                  onChange={(e) => setSelectedBeer({ ...selectedBeer, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-purchasePrice">Precio de Compra (COP)</Label>
                <Input
                  id="edit-purchasePrice"
                  type="number"
                  value={selectedBeer.purchasePrice}
                  onChange={(e) =>
                    setSelectedBeer({ ...selectedBeer, purchasePrice: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-restockDay">Día de Reabastecimiento Semanal</Label>
                <Select
                  value={selectedBeer.weeklyRestockDay}
                  onValueChange={(value) =>
                    setSelectedBeer({ ...selectedBeer, weeklyRestockDay: value as Beer["weeklyRestockDay"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Lunes</SelectItem>
                    <SelectItem value="tuesday">Martes</SelectItem>
                    <SelectItem value="wednesday">Miércoles</SelectItem>
                    <SelectItem value="thursday">Jueves</SelectItem>
                    <SelectItem value="friday">Viernes</SelectItem>
                    <SelectItem value="saturday">Sábado</SelectItem>
                    <SelectItem value="sunday">Domingo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleUpdateBeer} className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                Actualizar Cerveza
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reabastecer Inventario</DialogTitle>
            <DialogDescription>Agrega más unidades de {selectedBeer?.name} al inventario</DialogDescription>
          </DialogHeader>
          {selectedBeer && (
            <RestockForm
              beer={selectedBeer}
              onRestock={(quantity) => handleRestock(selectedBeer.id, quantity)}
              onCancel={() => setIsRestockDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RestockForm({
  beer,
  onRestock,
  onCancel,
}: {
  beer: Beer
  onRestock: (quantity: number) => void
  onCancel: () => void
}) {
  const [quantity, setQuantity] = useState(0)

  const handleSubmit = () => {
    if (quantity > 0) {
      onRestock(quantity)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
        <div className="text-sm text-slate-600 dark:text-slate-400">Stock actual: {beer.quantity} unidades</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          Precio de compra: ${beer.purchasePrice.toLocaleString()}
        </div>
      </div>
      <div>
        <Label htmlFor="restock-quantity">Cantidad a Agregar</Label>
        <Input
          id="restock-quantity"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 0)}
          placeholder="0"
          min="1"
        />
      </div>
      {quantity > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <div>Nuevo stock total: {beer.quantity + quantity} unidades</div>
            <div>Costo del reabastecimiento: ${(quantity * beer.purchasePrice).toLocaleString()}</div>
          </div>
        </div>
      )}
      <div className="flex space-x-2">
        <Button
          onClick={handleSubmit}
          disabled={quantity <= 0}
          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
        >
          Confirmar Reabastecimiento
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
          Cancelar
        </Button>
      </div>
    </div>
  )
}
