import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getMember, getMemberPayments } from '@/lib/queries/members'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import PageHeader from '@/components/shared/PageHeader'
import MemberDetailActions from './MemberDetailActions'
import {
  formatDate, formatCurrency, formatMonth,
  SPACE_TYPE_LABELS, PAYMENT_STATUS_LABELS, getInitials,
} from '@/lib/utils/formatters'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Phone, Mail, Calendar, MapPin, DollarSign, Shield,
  Edit, UserX, CreditCard,
} from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const member = await getMember(id)
  return { title: member ? member.full_name : 'Member Not Found' }
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  pending:        'bg-amber-100 text-amber-800 border-amber-200',
  partially_paid: 'bg-blue-100 text-blue-700 border-blue-200',
  paid:           'bg-green-100 text-green-700 border-green-200',
  overdue:        'bg-red-100 text-red-700 border-red-200',
}

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [member, payments] = await Promise.all([
    getMember(id),
    getMemberPayments(id),
  ])

  if (!member) notFound()

  const symbol = 'Rs.'
  const totalPaid    = payments.filter(p => p.payment_status === 'paid').length
  const totalPending = payments.filter(p => ['pending','partially_paid','overdue'].includes(p.payment_status)).length
  const totalCollected = payments.reduce((s, p) => s + p.amount_paid, 0)

  const planLabel = member.space_type === 'individual_seat'
    ? member.plan_type === 'morning'
      ? 'Morning Shift (9am–6pm)'
      : member.plan_type === 'evening'
      ? 'Evening Shift (6pm–3am)'
      : 'Dedicated (24H)'
    : 'Private Room'

  const assignment = member.space_type === 'individual_seat'
    ? member.assigned_seat ? `${(member.assigned_seat as any).seat_number} · ${planLabel}` : 'Unassigned'
    : member.assigned_room ? (member.assigned_room as any).name : 'Unassigned'

  return (
    <div>
      <PageHeader
        title={member.full_name}
        description={`${assignment} · Joined ${formatDate(member.joining_date)}`}
        backHref="/members"
        backLabel="Members"
        actions={
          <MemberDetailActions
            memberId={member.id}
            memberName={member.full_name}
            depositAmount={member.security_deposit}
            isActive={member.status === 'active'}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Member Info */}
        <div className="space-y-4">
          {/* Profile Card */}
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-4 mb-5">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="bg-indigo-100 text-indigo-700 text-lg font-bold">
                    {getInitials(member.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg leading-tight">{member.full_name}</p>
                  <Badge
                    variant={member.status === 'active' ? 'default' : 'secondary'}
                    className={member.status === 'active' ? 'bg-green-100 text-green-700 border-green-200 mt-1' : 'mt-1'}
                  >
                    {member.status === 'active' ? 'Active' : 'Left'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {member.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span>{member.phone}</span>
                  </div>
                )}
                {member.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Joined {formatDate(member.joining_date)}</span>
                </div>
                {member.leaving_date && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Left {formatDate(member.leaving_date)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>{assignment}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financials Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Financials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Amount</span>
                <span className="font-semibold">{formatCurrency(member.monthly_amount, symbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-semibold">{formatCurrency(member.security_deposit, symbol)}</span>
              </div>
              {member.security_deposit > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit Status</span>
                  <Badge variant="outline" className={member.deposit_refunded ? 'border-green-200 text-green-700' : 'border-amber-200 text-amber-700'}>
                    {member.deposit_refunded ? 'Refunded' : 'Held'}
                  </Badge>
                </div>
              )}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Collected</span>
                <span className="font-semibold text-green-600">{formatCurrency(totalCollected, symbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payments Paid</span>
                <span className="font-semibold">{totalPaid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending Payments</span>
                <span className={`font-semibold ${totalPending > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>{totalPending}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {member.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{member.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Payment History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No payment records yet.{' '}
                  <Link href="/payments" className="text-indigo-600 hover:underline">
                    Generate payments
                  </Link>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Due</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid On</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map(payment => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium text-sm">{formatMonth(payment.billing_month)}</TableCell>
                        <TableCell className="text-right text-sm">{formatCurrency(payment.amount_due, symbol)}</TableCell>
                        <TableCell className="text-right text-sm text-green-600">{formatCurrency(payment.amount_paid, symbol)}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${PAYMENT_STATUS_COLORS[payment.payment_status] ?? ''}`}>
                            {PAYMENT_STATUS_LABELS[payment.payment_status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {payment.payment_date ? formatDate(payment.payment_date) : '—'}
                        </TableCell>
                        <TableCell>
                          <Link href={`/payments/${payment.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 text-xs">
                              <CreditCard className="w-3 h-3 mr-1" /> Pay
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
