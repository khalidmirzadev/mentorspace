'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, UserX, PlusCircle, CreditCard } from 'lucide-react'
import RecordAdvanceDialog from './RecordAdvanceDialog'
import PaySalaryDialog from './PaySalaryDialog'
import MarkStaffLeftDialog from './MarkStaffLeftDialog'
import type { StaffAdvance } from '@/types'

interface StaffDetailActionsProps {
  staffId: string
  staffName: string
  baseSalary: number
  isActive: boolean
  outstandingAdvances: (StaffAdvance & { remaining: number })[]
}

export default function StaffDetailActions({
  staffId,
  staffName,
  baseSalary,
  isActive,
  outstandingAdvances,
}: StaffDetailActionsProps) {
  const [showAdvance, setShowAdvance] = useState(false)
  const [showPaySalary, setShowPaySalary] = useState(false)
  const [showMarkLeft, setShowMarkLeft] = useState(false)

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isActive && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
            onClick={() => setShowAdvance(true)}
          >
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" /> Give Advance
          </Button>

          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-500 text-white"
            onClick={() => setShowPaySalary(true)}
          >
            <CreditCard className="w-3.5 h-3.5 mr-1.5" /> Disburse Salary
          </Button>
        </>
      )}

      <Link href={`/staff/${staffId}/edit`}>
        <Button variant="outline" size="sm">
          <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
        </Button>
      </Link>

      {isActive && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setShowMarkLeft(true)}
          >
            <UserX className="w-3.5 h-3.5 mr-1.5" /> Mark as Left
          </Button>

          <RecordAdvanceDialog
            staffId={staffId}
            staffName={staffName}
            open={showAdvance}
            onOpenChange={setShowAdvance}
          />

          <PaySalaryDialog
            staffId={staffId}
            staffName={staffName}
            baseSalary={baseSalary}
            outstandingAdvances={outstandingAdvances}
            open={showPaySalary}
            onOpenChange={setShowPaySalary}
          />

          <MarkStaffLeftDialog
            staffId={staffId}
            staffName={staffName}
            open={showMarkLeft}
            onOpenChange={setShowMarkLeft}
          />
        </>
      )}
    </div>
  )
}
