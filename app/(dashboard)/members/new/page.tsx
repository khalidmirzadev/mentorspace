import type { Metadata } from 'next'
import { getAvailableSeats, getAvailableRooms } from '@/lib/queries/members'
import MemberForm from '@/components/members/MemberForm'
import PageHeader from '@/components/shared/PageHeader'
import type { SeatPlanType } from '@/types'

export const metadata: Metadata = { title: 'Add Member' }

export default async function NewMemberPage({
  searchParams,
}: {
  searchParams?: Promise<{ seat_id?: string; plan?: string }>
}) {
  const params = searchParams ? await searchParams : {}
  const [availableSeats, availableRooms] = await Promise.all([
    getAvailableSeats(),
    getAvailableRooms(),
  ])

  return (
    <div>
      <PageHeader
        title="Add Member"
        description="Register a new member and assign their physical seat and shift plan"
        backHref="/members"
        backLabel="Members"
      />
      <MemberForm
        availableSeats={availableSeats}
        availableRooms={availableRooms}
        initialSeatId={params.seat_id}
        initialPlan={params.plan as SeatPlanType}
      />
    </div>
  )
}
