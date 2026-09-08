'use client'

import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import type { Member } from '@/types'
import { formatDate, formatCurrency, SPACE_TYPE_LABELS, getInitials } from '@/lib/utils/formatters'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ChevronRight } from 'lucide-react'

interface MembersTableProps {
  members: (Member & { assigned_seat?: { seat_number: string } | null; assigned_room?: { name: string } | null })[]
}

export default function MembersTable({ members }: MembersTableProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No members found</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Space</TableHead>
          <TableHead>Assignment</TableHead>
          <TableHead className="text-right">Monthly</TableHead>
          <TableHead>Joined</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map(member => {
          const assignment = member.assigned_seat?.seat_number ?? member.assigned_room?.name ?? '—'
          return (
            <TableRow key={member.id} className="group cursor-pointer hover:bg-muted/50">
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                      {getInitials(member.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{member.full_name}</p>
                    {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {SPACE_TYPE_LABELS[member.space_type]}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs font-normal">{assignment}</Badge>
              </TableCell>
              <TableCell className="text-right font-medium text-sm">
                {formatCurrency(member.monthly_amount, 'Rs.')}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(member.joining_date)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={member.status === 'active' ? 'default' : 'secondary'}
                  className={member.status === 'active'
                    ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100'
                    : ''}
                >
                  {member.status === 'active' ? 'Active' : 'Left'}
                </Badge>
              </TableCell>
              <TableCell>
                <Link href={`/members/${member.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
