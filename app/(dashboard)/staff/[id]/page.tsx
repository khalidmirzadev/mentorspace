import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  getStaffMember,
  getStaffSalaries,
  getStaffAdvances,
  getOutstandingAdvances,
} from '@/lib/queries/staff'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PageHeader from '@/components/shared/PageHeader'
import StaffDetailActions from '@/components/staff/StaffDetailActions'
import { formatDate, formatCurrency, formatMonth, getInitials } from '@/lib/utils/formatters'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Phone, Calendar, DollarSign, Briefcase, Clock, CheckCircle2 } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await getStaffMember(id)
  return { title: staff ? `${staff.full_name} — Staff` : 'Staff Not Found' }
}

const SALARY_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  paid:    'bg-green-100 text-green-700 border-green-200',
}

const ADVANCE_STATUS_COLORS: Record<string, string> = {
  outstanding:      'bg-red-100 text-red-700 border-red-200',
  partially_repaid: 'bg-amber-100 text-amber-800 border-amber-200',
  cleared:          'bg-green-100 text-green-700 border-green-200',
}

const ADVANCE_STATUS_LABELS: Record<string, string> = {
  outstanding:      'Outstanding',
  partially_repaid: 'Partially Repaid',
  cleared:          'Cleared',
}

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [staff, salaries, advances, outstandingAdvances] = await Promise.all([
    getStaffMember(id),
    getStaffSalaries(id),
    getStaffAdvances(id),
    getOutstandingAdvances(id),
  ])

  if (!staff) notFound()

  const symbol = 'Rs.'
  const totalAdvancesOutstanding = outstandingAdvances.reduce((s, a) => s + a.remaining, 0)
  const totalSalariesPaid = salaries
    .filter(s => s.payment_status === 'paid')
    .reduce((s, sal) => s + sal.net_paid, 0)

  return (
    <div className="space-y-6">
      <PageHeader
        title={staff.full_name}
        description={`${staff.role || 'Staff Member'} · Joined ${formatDate(staff.joining_date)}`}
        backHref="/staff"
        backLabel="Staff"
        actions={
          <StaffDetailActions
            staffId={staff.id}
            staffName={staff.full_name}
            baseSalary={staff.monthly_salary}
            isActive={staff.status === 'active'}
            outstandingAdvances={outstandingAdvances}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Staff Info & Overview */}
        <div className="space-y-4">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-bold">
                    {getInitials(staff.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg leading-tight">{staff.full_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{staff.role || 'Staff'}</p>
                  <Badge
                    variant={staff.status === 'active' ? 'default' : 'secondary'}
                    className={staff.status === 'active' ? 'bg-green-100 text-green-700 border-green-200 mt-2' : 'mt-2'}
                  >
                    {staff.status === 'active' ? 'Active' : 'Left'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {staff.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{staff.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Joined {formatDate(staff.joining_date)}</span>
                </div>
                {staff.leaving_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Left {formatDate(staff.leaving_date)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Salary Summary Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Compensation & Advances</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Salary</span>
                <span className="font-semibold">{formatCurrency(staff.monthly_salary, symbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Advance Debt</span>
                <span className={`font-semibold ${totalAdvancesOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(totalAdvancesOutstanding, symbol)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Paid to Date</span>
                <span className="font-semibold text-green-600">{formatCurrency(totalSalariesPaid, symbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Salary Records</span>
                <span className="font-semibold">{salaries.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes Card */}
          {staff.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{staff.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Tabbed Lists (Salaries & Advances) */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="salaries" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="salaries">Salary History ({salaries.length})</TabsTrigger>
              <TabsTrigger value="advances">Advances ({advances.length})</TabsTrigger>
            </TabsList>

            {/* Salaries Tab */}
            <TabsContent value="salaries" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Salary Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {salaries.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      No salary records recorded yet.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Month</TableHead>
                          <TableHead className="text-right">Base</TableHead>
                          <TableHead className="text-right">Advance Ded.</TableHead>
                          <TableHead className="text-right">Net Paid</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Paid On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {salaries.map(sal => (
                          <TableRow key={sal.id}>
                            <TableCell className="font-medium text-sm">
                              {formatMonth(sal.billing_month)}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(sal.base_salary, symbol)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-amber-600">
                              {sal.advance_deducted > 0 ? `- ${formatCurrency(sal.advance_deducted, symbol)}` : '—'}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-green-600">
                              {formatCurrency(sal.net_paid, symbol)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${SALARY_STATUS_COLORS[sal.payment_status] ?? ''}`}>
                                {sal.payment_status === 'paid' ? 'Paid' : 'Pending'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {sal.paid_on ? formatDate(sal.paid_on) : '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Advances Tab */}
            <TabsContent value="advances" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Advances & Repayments</CardTitle>
                </CardHeader>
                <CardContent>
                  {advances.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground text-sm">
                      No advances recorded for this staff member.
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="text-right">Repaid</TableHead>
                          <TableHead className="text-right">Remaining</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {advances.map(adv => (
                          <TableRow key={adv.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(adv.advance_date)}
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {adv.reason || 'Salary advance'}
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              {formatCurrency(adv.amount, symbol)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-green-600">
                              {formatCurrency(adv.amount_repaid ?? 0, symbol)}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold text-amber-600">
                              {formatCurrency(adv.remaining, symbol)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${ADVANCE_STATUS_COLORS[adv.status] ?? ''}`}>
                                {ADVANCE_STATUS_LABELS[adv.status] ?? adv.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
