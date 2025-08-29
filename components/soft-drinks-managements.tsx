"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus, Package, Edit, Trash2, ArrowLeft, Minus } from "lucide-react"
import type { SoftDrink } from "@/types"
import { saveSoftDrinks, loadSoftDrinks } from "@/lib/firebase-storage"

interface SoftDrinksManagementProps {
  selectedCasino: string
  onBack: () => void
}

export function SoftDrinksManagement({ selectedCasino, onBack }: SoftDrinksManagementProps) {
  const [softDrinks, setSoftDrinks] = useState<SoftDrink[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConsumedDialogOpen, setIsConsumedDialogOpen] = useState(false)
  const [editingSoftDrink, setEditingSoftDrink] = useState<SoftDrink | null>(null)
  const [consumedDrink, setConsumedDrink] = useState<SoftDrink | null>(null)
  const [consumedQuantity, setConsumedQuantity] = useState(0)
  const [newSoftDrink, setNewSoftDrink] = useState({
    name: "",
    quantity: 0,
    cost: 0,
  })

  useEffect(() => {
    loadSoftDrinksData()
  }, [selectedCasino])

  const loadSoftDrinksData = async () => {
    try {
      const data = await loadSoftDrinks(selectedCasino)
      setSoftDrinks(data)
    } catch (error) {
      console.error("Error loading soft drinks:", error)
    }
  }

  const handleAddSoftDrink = async () => {
    if (!newSoftDrink.name.trim()) return

    const softDrink: SoftDrink = {
      id: Date.now().toString(),
      name: newSoftDrink.name,
      quantity: newSoftDrink.quantity,
      cost: newSoftDrink.cost,
      lastRestockDate: new Date(),
    }

    const updatedSoftDrinks = [...softDrinks, softDrink]
    setSoftDrinks(updatedSoftDrinks)
    await saveSoftDrinks(selectedCasino, updatedSoftDrinks)

    setNewSoftDrink({ name: "", quantity: 0, cost: 0 })
    setIsAddDialogOpen(false)
  }

  const handleEditSoftDrink = async () => {
    if (!editingSoftDrink) return

    const updatedSoftDrinks = softDrinks.map((drink) => (drink.id === editingSoftDrink.id ? editingSoftDrink : drink))
    setSoftDrinks(updatedSoftDrinks)
    await saveSoftDrinks(selectedCasino, updatedSoftDrinks)

    setEditingSoftDrink(null)
    setIsEditDialogOpen(false)
  }

  const handleDeleteSoftDrink = async (id: string) => {
    const updatedSoftDrinks = softDrinks.filter((drink) => drink.id !== id)
    setSoftDrinks(updatedSoftDrinks)
    await saveSoftDrinks(selectedCasino, updatedSoftDrinks)
  }

  const handleConsumedDrinks = async () => {
    if (!consumedDrink || consumedQuantity <= 0) return

    const updatedSoftDrinks = softDrinks.map((drink) =>
      drink.id === consumedDrink.id ? { ...drink, quantity: Math.max(0, drink.quantity - consumedQuantity) } : drink,
    )
    setSoftDrinks(updatedSoftDrinks)
    await saveSoftDrinks(selectedCasino, updatedSoftDrinks)

    setConsumedDrink(null)
    setConsumedQuantity(0)
    setIsConsumedDialogOpen(false)
  }

  const totalInventoryValue = softDrinks.reduce((total, drink) => total + drink.quantity * drink.cost, 0)
  const totalPurchased = softDrinks.reduce((total, drink) => total + drink.quantity, 0)
  const totalInvestment = softDrinks.reduce((total, drink) => total + drink.quantity * drink.cost, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack} className="flex items-center bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Menú
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-amber-800">Inventario de Gaseosas y Jugos</h2>
            <p className="text-gray-600">Gestiona el inventario de bebidas no alcohólicas</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isConsumedDialogOpen} onOpenChange={setIsConsumedDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-red-50 hover:bg-red-100 border-red-200">
                <Minus className="w-4 h-4 mr-2" />
                Gaseosas Gastadas
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar Gaseosas Gastadas</DialogTitle>
                <DialogDescription>Selecciona el producto y la cantidad consumida</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="consumed-product">Producto</Label>
                  <select
                    id="consumed-product"
                    className="w-full p-2 border rounded-md"
                    value={consumedDrink?.id || ""}
                    onChange={(e) => {
                      const drink = softDrinks.find((d) => d.id === e.target.value)
                      setConsumedDrink(drink || null)
                    }}
                  >
                    <option value="">Seleccionar producto</option>
                    {softDrinks.map((drink) => (
                      <option key={drink.id} value={drink.id}>
                        {drink.name} (Stock: {drink.quantity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="consumed-quantity">Cantidad Gastada</Label>
                  <Input
                    id="consumed-quantity"
                    type="number"
                    value={consumedQuantity}
                    onChange={(e) => setConsumedQuantity(Number.parseInt(e.target.value) || 0)}
                    max={consumedDrink?.quantity || 0}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsConsumedDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConsumedDrinks} className="bg-red-600 hover:bg-red-700">
                  Registrar Gasto
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="w-4 h-4 mr-2" />
                Agregar Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nuevo Producto</DialogTitle>
                <DialogDescription>Ingresa los datos del nuevo producto de bebidas</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    value={newSoftDrink.name}
                    onChange={(e) => setNewSoftDrink({ ...newSoftDrink, name: e.target.value })}
                    placeholder="Ej: Coca Cola 350ml"
                  />
                </div>
                <div>
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={newSoftDrink.quantity}
                    onChange={(e) =>
                      setNewSoftDrink({ ...newSoftDrink, quantity: Number.parseInt(e.target.value) || 0 })
                    }
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="cost">Costo por Unidad</Label>
                  <Input
                    id="cost"
                    type="number"
                    value={newSoftDrink.cost}
                    onChange={(e) => setNewSoftDrink({ ...newSoftDrink, cost: Number.parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAddSoftDrink} className="bg-amber-600 hover:bg-amber-700">
                  Agregar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-blue-800 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Total Compradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-800">{totalPurchased}</div>
            <p className="text-sm text-blue-600">unidades totales</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-green-800 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Inversión Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800">${totalInvestment.toLocaleString()}</div>
            <p className="text-sm text-green-600">dinero invertido</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-amber-800 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Productos Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-800">{softDrinks.length}</div>
            <p className="text-sm text-amber-600">tipos de productos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {softDrinks.map((drink) => (
          <Card key={drink.id} className="border-gray-200 hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-gray-800">{drink.name}</CardTitle>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingSoftDrink(drink)
                      setIsEditDialogOpen(true)
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteSoftDrink(drink.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cantidad:</span>
                  <Badge variant={drink.quantity > 10 ? "default" : "destructive"}>{drink.quantity} unidades</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Costo unitario:</span>
                  <span className="font-semibold">${drink.cost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor total:</span>
                  <span className="font-semibold text-green-600">
                    ${(drink.quantity * drink.cost).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>Modifica los datos del producto</DialogDescription>
          </DialogHeader>
          {editingSoftDrink && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre del Producto</Label>
                <Input
                  id="edit-name"
                  value={editingSoftDrink.name}
                  onChange={(e) => setEditingSoftDrink({ ...editingSoftDrink, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-quantity">Cantidad</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editingSoftDrink.quantity}
                  onChange={(e) =>
                    setEditingSoftDrink({ ...editingSoftDrink, quantity: Number.parseInt(e.target.value) || 0 })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-cost">Costo por Unidad</Label>
                <Input
                  id="edit-cost"
                  type="number"
                  value={editingSoftDrink.cost}
                  onChange={(e) =>
                    setEditingSoftDrink({ ...editingSoftDrink, cost: Number.parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditSoftDrink} className="bg-amber-600 hover:bg-amber-700">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
