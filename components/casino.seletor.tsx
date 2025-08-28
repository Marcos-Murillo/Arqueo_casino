"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, MapPin } from "lucide-react"
import type { Casino } from "@/types"

interface CasinoSelectorProps {
  onCasinoSelect: (casinoId: string) => void
}

export default function CasinoSelector({ onCasinoSelect }: CasinoSelectorProps) {
  const casinos: Casino[] = [
    { id: "spezia", name: "Spezia" },
    { id: "cali-gran-casino", name: "Cali Gran Casino" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
        <CardHeader className="text-center">
          <div className="bg-amber-500 p-3 rounded-lg w-fit mx-auto mb-4">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Seleccionar Casino</CardTitle>
          <CardDescription>Elige el casino donde trabajarás hoy</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {casinos.map((casino) => (
            <Button
              key={casino.id}
              onClick={() => onCasinoSelect(casino.id)}
              variant="outline"
              className="w-full h-16 text-left justify-start space-x-3 hover:bg-amber-50 hover:border-amber-200 dark:hover:bg-amber-900/20 dark:hover:border-amber-800"
            >
              <MapPin className="h-5 w-5 text-amber-600" />
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">{casino.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Sistema de ventas de cerveza</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
