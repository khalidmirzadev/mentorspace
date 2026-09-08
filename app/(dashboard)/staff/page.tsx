import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDate, formatCurrency, getInitials } from '@/lib/utils/formatters'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Plus, ChevronRight } from 'lucide-react'

export const metadata: Metadata = { title: 'Staff' }

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .order('status', { ascending: false })
    .order('full_name')

  const activeStaff = staff?.filter(s => s.status === 'active') ?? []
  const symbol = 'Rs.'
  const totalSalaryBill = activeStaff.reduce((s, m) => s + m.monthly_salary, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Office staff and salary management</p>
        </div>
        <Link href="/staff/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500">
            <Plus className="w-4 h-4 mr-2" /> Add Staff
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{activeStaff.length}</p><p className="text-xs text-muted-foreground">Active Staff</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-2xl font-bold">{staff?.filter(s => s.status === 'left').length ?? 0}</p><p className="text-xs text-muted-foreground">Former Staff</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xl font-bold">{formatCurrency(totalSalaryBill, symbol, true)}</p><p className="text-xs text-muted-foreground">Monthly Salary Bill</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Monthly Salary</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(staff ?? []).map(member => (
                <TableRow key={member.id} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-slate-100 text-slate-600 text-xs font-semibold">{getInitials(member.full_name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.full_name}</p>
                        {member.phone && <p className="text-xs text-muted-foreground">{member.phone}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{member.role ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium text-sm">{formatCurrency(member.monthly_salary, symbol)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(member.joining_date)}</TableCell>
                  <TableCell>
                    <Badge variant={member.status === 'active' ? 'default' : 'secondary'}
                      className={member.status === 'active' ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-100' : ''}>
                      {member.status === 'active' ? 'Active' : 'Left'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Link href={`/staff/${member.id}`}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
