'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Edit, UserX } from 'lucide-react'
import MarkLeftDialog from '@/components/members/MarkLeftDialog'

interface MemberDetailActionsProps {
  memberId: string
  memberName: string
  depositAmount: number
  isActive: boolean
}

export default function MemberDetailActions({ memberId, memberName, depositAmount, isActive }: MemberDetailActionsProps) {
  const [showMarkLeft, setShowMarkLeft] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <Link href={`/members/${memberId}/edit`}>
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
          <MarkLeftDialog
            memberId={memberId}
            memberName={memberName}
            depositAmount={depositAmount}
            open={showMarkLeft}
            onOpenChange={setShowMarkLeft}
          />
        </>
      )}
    </div>
  )
}
