import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { formatDate, formatCurrency, SPACE_TYPE_LABELS } from '@/lib/utils/formatters'
import { Plus, Search, Users, UserCheck, UserX } from 'lucide-react'
import MembersTable from '@/components/members/MembersTable'
import SearchInput from '@/components/shared/SearchInput'

export const metadata: Metadata = { title: 'Members' }

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const status  = params.status ?? 'active'
  const query   = params.q ?? ''

  let dbQuery = supabase
    .from('members')
    .select(`
      *,
      assigned_seat:seats(seat_number),
      assigned_room:rooms(name)
    `)
    .order('created_at', { ascending: false })

  if (status !== 'all') dbQuery = dbQuery.eq('status', status)
  if (query) dbQuery = dbQuery.ilike('full_name', `%${query}%`)

  const { data: members } = await dbQuery

  const { count: activeCount  } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active')
  const { count: leftCount    } = await supabase.from('members').select('*', { count: 'exact', head: true }).eq('status', 'left')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage coworking space members
          </p>
        </div>
        <Link href="/members/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500">
            <Plus className="w-4 h-4 mr-2" /> Add Member
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Active', count: activeCount ?? 0, icon: UserCheck, color: 'text-green-600', href: '?status=active' },
          { label: 'Left',   count: leftCount   ?? 0, icon: UserX,     color: 'text-muted-foreground', href: '?status=left' },
          { label: 'Total',  count: (activeCount ?? 0) + (leftCount ?? 0), icon: Users, color: 'text-indigo-600', href: '?status=all' },
        ].map(s => (
          <Link key={s.label} href={s.href}>
            <Card className={`hover:shadow-md transition-all cursor-pointer ${status === (s.label === 'Active' ? 'active' : s.label === 'Left' ? 'left' : 'all') ? 'ring-1 ring-indigo-500' : ''}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <div>
                  <p className="text-2xl font-bold">{s.count}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-3">
            <SearchInput
              placeholder="Search members by name…"
              defaultValue={query}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <MembersTable members={members ?? []} />
        </CardContent>
      </Card>
    </div>
  )
}
