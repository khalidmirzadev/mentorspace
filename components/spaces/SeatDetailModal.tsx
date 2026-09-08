'use client'

import Link from 'next/link'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'
import type { SeatWithShifts } from '@/types'
import { Sun, Moon, Zap, User, Phone, Calendar, ArrowRight, Plus } from 'lucide-react'

interface SeatDetailModalProps {
  seat: SeatWithShifts | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SeatDetailModal({ seat, open, onOpenChange }: SeatDetailModalProps) {
  if (!seat) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-xl font-bold">{seat.seat_number}</DialogTitle>
            <Badge variant="outline" className="text-xs">
              Shared Physical Desk
            </Badge>
          </div>
          <DialogDescription>
            Occupancy breakdown and member assignments for this physical seat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Dedicated Status (if active) */}
          {seat.dedicated_member ? (
            <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/50 dark:border-indigo-900/50 dark:bg-indigo-950/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Dedicated / Full-Time</p>
                    <p className="text-[11px] text-muted-foreground">24-Hour Access</p>
                  </div>
                </div>
                <Badge className="bg-indigo-600 hover:bg-indigo-600">Occupied (24H)</Badge>
              </div>

              <Separator className="bg-indigo-200 dark:bg-indigo-900/50" />

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Member:
                  </span>
                  <Link
                    href={`/members/${seat.dedicated_member.id}`}
                    className="font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    {seat.dedicated_member.full_name} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {seat.dedicated_member.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone:
                    </span>
                    <span>{seat.dedicated_member.phone}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Joined:
                  </span>
                  <span>{formatDate(seat.dedicated_member.joining_date)}</span>
                </div>
                <div className="flex items-center justify-between pt-1 font-medium">
                  <span className="text-muted-foreground">Monthly Fee:</span>
                  <span>{formatCurrency(seat.dedicated_member.monthly_amount, 'Rs.')}</span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Morning Shift Card */}
              <div className={`p-3.5 rounded-xl border ${seat.morning_member ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/40 dark:bg-amber-950/20' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 flex items-center justify-center">
                      <Sun className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs">Morning Shift</p>
                      <p className="text-[10px] text-muted-foreground">9:00 AM – 6:00 PM</p>
                    </div>
                  </div>
                  <Badge
                    variant={seat.morning_member ? 'destructive' : 'outline'}
                    className={seat.morning_member ? 'text-xs' : 'border-green-300 text-green-700 bg-green-50 text-xs'}
                  >
                    {seat.morning_member ? 'Occupied' : 'Available'}
                  </Badge>
                </div>

                {seat.morning_member ? (
                  <div className="space-y-1.5 text-xs pt-1 border-t border-amber-200/60 dark:border-amber-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Occupant:</span>
                      <Link
                        href={`/members/${seat.morning_member.id}`}
                        className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        {seat.morning_member.full_name} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <span>{formatDate(seat.morning_member.joining_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-medium">{formatCurrency(seat.morning_member.monthly_amount, 'Rs.')}</span>
                    </div>
                  </div>
                ) : (
                  <Link href={`/members/new?seat_id=${seat.id}&plan=morning`} className="block pt-1">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-indigo-600 h-7 hover:bg-indigo-50">
                      <Plus className="w-3 h-3 mr-1" /> Assign Morning Member
                    </Button>
                  </Link>
                )}
              </div>

              {/* Evening Shift Card */}
              <div className={`p-3.5 rounded-xl border ${seat.evening_member ? 'border-indigo-200 bg-indigo-50/40 dark:border-indigo-900/40 dark:bg-indigo-950/20' : 'border-border bg-card'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 flex items-center justify-center">
                      <Moon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs">Evening Shift</p>
                      <p className="text-[10px] text-muted-foreground">6:00 PM – 3:00 AM</p>
                    </div>
                  </div>
                  <Badge
                    variant={seat.evening_member ? 'destructive' : 'outline'}
                    className={seat.evening_member ? 'text-xs' : 'border-green-300 text-green-700 bg-green-50 text-xs'}
                  >
                    {seat.evening_member ? 'Occupied' : 'Available'}
                  </Badge>
                </div>

                {seat.evening_member ? (
                  <div className="space-y-1.5 text-xs pt-1 border-t border-indigo-200/60 dark:border-indigo-900/40">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Occupant:</span>
                      <Link
                        href={`/members/${seat.evening_member.id}`}
                        className="font-medium text-indigo-600 hover:underline flex items-center gap-1"
                      >
                        {seat.evening_member.full_name} <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Joined:</span>
                      <span>{formatDate(seat.evening_member.joining_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Fee:</span>
                      <span className="font-medium">{formatCurrency(seat.evening_member.monthly_amount, 'Rs.')}</span>
                    </div>
                  </div>
                ) : (
                  <Link href={`/members/new?seat_id=${seat.id}&plan=evening`} className="block pt-1">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-indigo-600 h-7 hover:bg-indigo-50">
                      <Plus className="w-3 h-3 mr-1" /> Assign Evening Member
                    </Button>
                  </Link>
                )}
              </div>

              {/* Dedicated Option (if both morning & evening are free) */}
              {seat.dedicated_available && (
                <div className="p-3 rounded-lg border border-dashed text-center text-xs space-y-1.5 bg-muted/30">
                  <p className="text-muted-foreground">Both shifts are currently free on this seat.</p>
                  <Link href={`/members/new?seat_id=${seat.id}&plan=dedicated`}>
                    <Button variant="outline" size="sm" className="text-xs h-7">
                      <Zap className="w-3 h-3 mr-1 text-amber-500" /> Book as Dedicated (24H)
                    </Button>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
