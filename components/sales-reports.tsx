"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, ArrowLeft, TrendingUp, DollarSign, Package, Download } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { getShifts, getBeers } from "@/lib/storage"
import type { Shift, Beer, SalesReport } from "@/types"

interface SalesReportsProps {
  onBack: () => void
}

export default function SalesReports({ onBack }: SalesReportsProps) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const [beers, setBeers] = useState<Beer[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month" | "all">("today")
  const [reports, setReports] = useState<SalesReport[]>([])

  useEffect(() => {
    const allShifts = getShifts()
    const allBeers = getBeers()
    setShifts(allShifts)
    setBeers(allBeers)
    generateReports(allShifts, allBeers)
  }, [])

  const generateReports = (allShifts: Shift[], allBeers: Beer[]) => {
    const completedShifts = allShifts.filter((shift) => !shift.isActive && shift.beersSold && shift.expectedCash)

    const generatedReports: SalesReport[] = completedShifts.map((shift) => {
      const totalRevenue = shift.expectedCash || 0
      const totalCost = Object.entries(shift.beersSold || {}).reduce((sum, [beerId, quantity]) => {
        const beer = allBeers.find((b) => b.id === beerId)
        return sum + (beer ? beer.purchasePrice * quantity : 0)
      }, 0)
      const profit = totalRevenue - totalCost
      const cashDifference = (shift.actualCash || 0) - (shift.expectedCash || 0)

      return {
        date: shift.endTime || shift.startTime,
        shiftId: shift.id,
        workerName: shift.workerName,
        beersSold: shift.beersSold || {},
        totalRevenue,
        totalCost,
        profit,
        cashDifference,
      }
    })

    setReports(generatedReports)
  }

  const filterReportsByPeriod = (reports: SalesReport[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

    switch (selectedPeriod) {
      case "today":
        return reports.filter((report) => {
          const reportDate = new Date(report.date)
          return reportDate >= today
        })
      case "week":
        return reports.filter((report) => {
          const reportDate = new Date(report.date)
          return reportDate >= weekAgo
        })
      case "month":
        return reports.filter((report) => {
          const reportDate = new Date(report.date)
          return reportDate >= monthAgo
        })
      default:
        return reports
    }
  }

  const filteredReports = filterReportsByPeriod(reports)

  // Calculate summary metrics
  const totalRevenue = filteredReports.reduce((sum, report) => sum + report.totalRevenue, 0)
  const totalCost = filteredReports.reduce((sum, report) => sum + report.totalCost, 0)
  const totalProfit = totalRevenue - totalCost
  const totalBeersSold = filteredReports.reduce(
    (sum, report) => sum + Object.values(report.beersSold).reduce((beerSum, qty) => beerSum + qty, 0),
    0,
  )
  const totalCashDifference = filteredReports.reduce((sum, report) => sum + report.cashDifference, 0)

  // Prepare chart data
  const dailySalesData = filteredReports.reduce(
    (acc, report) => {
      const date = new Date(report.date).toLocaleDateString("es-CO")
      const existing = acc.find((item) => item.date === date)

      if (existing) {
        existing.revenue += report.totalRevenue
        existing.profit += report.profit
        existing.beers += Object.values(report.beersSold).reduce((sum, qty) => sum + qty, 0)
      } else {
        acc.push({
          date,
          revenue: report.totalRevenue,
          profit: report.profit,
          beers: Object.values(report.beersSold).reduce((sum, qty) => sum + qty, 0),
        })
      }

      return acc
    },
    [] as Array<{ date: string; revenue: number; profit: number; beers: number }>,
  )

  // Beer sales distribution
  const beerSalesData = beers
    .map((beer) => {
      const totalSold = filteredReports.reduce((sum, report) => sum + (report.beersSold[beer.id] || 0), 0)
      return {
        name: beer.name,
        value: totalSold,
        revenue: totalSold * beer.sellingPrice,
      }
    })
    .filter((item) => item.value > 0)

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"]

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
              <div className="bg-purple-500 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reportes de Ventas</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">Análisis de ventas y ganancias</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Último Mes</SelectItem>
                  <SelectItem value="all">Todo el Tiempo</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">${totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">pesos colombianos</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Costos Totales</CardTitle>
              <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">${totalCost.toLocaleString()}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">costo de productos vendidos</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Ganancia Neta</CardTitle>
              <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                ${totalProfit.toLocaleString()}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {totalRevenue > 0 ? `${((totalProfit / totalRevenue) * 100).toFixed(1)}% margen` : "0% margen"}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Cervezas Vendidas
              </CardTitle>
              <Package className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalBeersSold}</div>
              <p className="text-xs text-slate-600 dark:text-slate-400">unidades vendidas</p>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Diferencia Efectivo
              </CardTitle>
              <DollarSign className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  totalCashDifference === 0
                    ? "text-slate-900 dark:text-white"
                    : totalCashDifference > 0
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-red-600 dark:text-red-400"
                }`}
              >
                {totalCashDifference === 0
                  ? "Exacto"
                  : totalCashDifference > 0
                    ? `+$${totalCashDifference.toLocaleString()}`
                    : `-$${Math.abs(totalCashDifference).toLocaleString()}`}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">vs efectivo esperado</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Daily Sales Chart */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Ventas Diarias</CardTitle>
              <CardDescription>Ingresos y ganancias por día</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        `$${value.toLocaleString()}`,
                        name === "revenue" ? "Ingresos" : "Ganancia",
                      ]}
                    />
                    <Bar dataKey="revenue" fill="#8884d8" name="revenue" />
                    <Bar dataKey="profit" fill="#82ca9d" name="profit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Beer Sales Distribution */}
          <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
            <CardHeader>
              <CardTitle>Distribución de Ventas por Cerveza</CardTitle>
              <CardDescription>Cantidad vendida por tipo de cerveza</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={beerSalesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {beerSalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value} unidades`, "Vendidas"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports Table */}
        <Card className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
          <CardHeader>
            <CardTitle>Reportes Detallados por Turno</CardTitle>
            <CardDescription>Información completa de cada turno completado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div
                  key={report.shiftId}
                  className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{report.workerName}</h3>
                      <Badge variant="secondary">{new Date(report.date).toLocaleDateString("es-CO")}</Badge>
                      {report.cashDifference !== 0 && (
                        <Badge
                          className={
                            report.cashDifference > 0
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }
                        >
                          {report.cashDifference > 0 ? "+" : ""}${report.cashDifference.toLocaleString()}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                      <div>
                        <span className="font-medium">Cervezas:</span>{" "}
                        {Object.values(report.beersSold).reduce((sum, qty) => sum + qty, 0)}
                      </div>
                      <div>
                        <span className="font-medium">Ingresos:</span> ${report.totalRevenue.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Costos:</span> ${report.totalCost.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Ganancia:</span>{" "}
                        <span className="text-green-600 dark:text-green-400">${report.profit.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="font-medium">Margen:</span>{" "}
                        {report.totalRevenue > 0
                          ? `${((report.profit / report.totalRevenue) * 100).toFixed(1)}%`
                          : "0%"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filteredReports.length === 0 && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  No hay reportes disponibles para el período seleccionado.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
