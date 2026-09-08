import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import SeatForm from '@/components/spaces/SeatForm'
import PageHeader from '@/components/shared/PageHeader'
import type { Room } from '@/types'

export const metadata: Metadata = { title: 'Add Seat' }

export default async function NewSeatPage() {
  const supabase = await createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Seat"
        description="Add a dedicated or hot desk to your space inventory"
        backHref="/spaces"
        backLabel="Spaces"
      />
      <SeatForm rooms={(rooms ?? []) as Room[]} />
    </div>
  )
}
