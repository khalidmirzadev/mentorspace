'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import SeatDetailModal from './SeatDetailModal'
import type { SeatWithShifts } from '@/types'
import { Sofa, Sun, Moon, Zap, LayoutGrid, Table as TableIcon } from 'lucide-react'

interface SeatMatrixProps {
  seats: SeatWithShifts[]
}

export default function SeatMatrix({ seats }: SeatMatrixProps) {
  const [selectedSeat, setSelectedSeat] = useState<SeatWithShifts | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function handleSeatClick(seat: SeatWithShifts) {
    setSelectedSeat(seat)
    setModalOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-base font-semibold flex items-center gap-2">
          <Sofa className="w-4 h-4 text-indigo-600" /> 19 Physical Desks & Shifts
        </h2>
        <span className="text-xs text-muted-foreground">Click any seat to view occupants or assign shifts</span>
      </div>

      <Tabs defaultValue="grid" className="w-full">
        <div className="flex justify-end mb-3">
          <TabsList className="h-8">
            <TabsTrigger value="grid" className="text-xs px-2.5 h-6">
              <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Grid View
            </TabsTrigger>
            <TabsTrigger value="table" className="text-xs px-2.5 h-6">
              <TableIcon className="w-3.5 h-3.5 mr-1" /> Matrix Table
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Visual Grid View */}
        <TabsContent value="grid" className="mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {seats.map(seat => {
              const isDedicated = !!seat.dedicated_member
              const hasMorning = !!seat.morning_member
              const hasEvening = !!seat.evening_member
              const isFullyOccupied = isDedicated || (hasMorning && hasEvening)
              const isFullyFree = !isDedicated && !hasMorning && !hasEvening

              return (
                <Card
                  key={seat.id}
                  onClick={() => handleSeatClick(seat)}
                  className={`cursor-pointer transition-all duration-150 hover:shadow-md hover:scale-[1.02] border ${
                    isFullyOccupied
                      ? 'border-red-200 bg-red-50/20 dark:border-red-900/30 dark:bg-red-950/10'
                      : isFullyFree
                      ? 'border-green-200 bg-green-50/20 dark:border-green-900/30 dark:bg-green-950/10'
                      : 'border-amber-200 bg-amber-50/20 dark:border-amber-900/30 dark:bg-amber-950/10'
                  }`}
                >
                  <CardContent className="p-3.5 space-y-2.5">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                            isFullyOccupied
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300'
                              : isFullyFree
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/60 dark:text-green-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300'
                          }`}
                        >
                          {seat.seat_index < 100 ? seat.seat_index : 'S'}
                        </div>
                        <span className="font-bold text-sm">{seat.seat_number}</span>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 h-5 ${
                          isFullyOccupied
                            ? 'border-red-300 text-red-700 bg-red-50'
                            : isFullyFree
                            ? 'border-green-300 text-green-700 bg-green-50'
                            : 'border-amber-300 text-amber-700 bg-amber-50'
                        }`}
                      >
                        {isDedicated ? 'Dedicated' : isFullyOccupied ? 'Full' : isFullyFree ? 'All Free' : 'Partial'}
                      </Badge>
                    </div>

                    {/* Shifts breakdown */}
                    {isDedicated ? (
                      <div className="p-2 rounded-md bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-indigo-700 dark:text-indigo-300 font-medium truncate">
                          <Zap className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">{seat.dedicated_member?.full_name}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground shrink-0">24H</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-xs">
                        {/* Morning */}
                        <div className="flex items-center justify-between p-1.5 rounded-md bg-background/80 border border-border/60">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                            <span className="text-[11px] text-muted-foreground">Morning:</span>
                          </div>
                          {seat.morning_member ? (
                            <span className="font-medium text-[11px] text-red-600 truncate max-w-[90px]">
                              {seat.morning_member.full_name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-green-600">🟢 Free</span>
                          )}
                        </div>

                        {/* Evening */}
                        <div className="flex items-center justify-between p-1.5 rounded-md bg-background/80 border border-border/60">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Moon className="w-3 h-3 text-indigo-500 shrink-0" />
                            <span className="text-[11px] text-muted-foreground">Evening:</span>
                          </div>
                          {seat.evening_member ? (
                            <span className="font-medium text-[11px] text-red-600 truncate max-w-[90px]">
                              {seat.evening_member.full_name}
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-green-600">🟢 Free</span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Matrix Table View */}
        <TabsContent value="table" className="mt-0">
          <Card>
            <CardContent className="pt-4 p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Desk</TableHead>
                    <TableHead>☀️ Morning Shift (9am – 6pm)</TableHead>
                    <TableHead>🌙 Evening Shift (6pm – 3am)</TableHead>
                    <TableHead>⚡ Dedicated (24H Access)</TableHead>
                    <TableHead className="text-right w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seats.map(seat => (
                    <TableRow
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      className="cursor-pointer hover:bg-muted/60"
                    >
                      <TableCell className="font-bold text-sm">
                        {seat.seat_number}
                      </TableCell>

                      {/* Morning */}
                      <TableCell>
                        {seat.dedicated_member ? (
                          <span className="text-xs text-muted-foreground italic">Blocked (Dedicated 24H)</span>
                        ) : seat.morning_member ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="destructive" className="text-[11px]">Occupied</Badge>
                            <span className="text-xs font-medium">{seat.morning_member.full_name}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-[11px]">
                            🟢 Available
                          </Badge>
                        )}
                      </TableCell>

                      {/* Evening */}
                      <TableCell>
                        {seat.dedicated_member ? (
                          <span className="text-xs text-muted-foreground italic">Blocked (Dedicated 24H)</span>
                        ) : seat.evening_member ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="destructive" className="text-[11px]">Occupied</Badge>
                            <span className="text-xs font-medium">{seat.evening_member.full_name}</span>
                          </div>
                        ) : (
                          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-[11px]">
                            🟢 Available
                          </Badge>
                        )}
                      </TableCell>

                      {/* Dedicated */}
                      <TableCell>
                        {seat.dedicated_member ? (
                          <div className="flex items-center gap-1.5">
                            <Badge className="bg-indigo-600 text-[11px]">Occupied (24H)</Badge>
                            <span className="text-xs font-medium">{seat.dedicated_member.full_name}</span>
                          </div>
                        ) : seat.morning_member || seat.evening_member ? (
                          <span className="text-xs text-muted-foreground italic">Unavailable (Shift active)</span>
                        ) : (
                          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50 text-[11px]">
                            🟢 Available (24H)
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs text-indigo-600">
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Seat Detail Modal */}
      <SeatDetailModal
        seat={selectedSeat}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
