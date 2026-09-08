import type { Metadata } from 'next'
import { getAvailableSeats, getAvailableRooms } from '@/lib/queries/members'
import MemberForm from '@/components/members/MemberForm'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Add Member' }

export default async function NewMemberPage() {
  const [availableSeats, availableRooms] = await Promise.all([
    getAvailableSeats(),
    getAvailableRooms(),
  ])

  return (
    <div>
      <PageHeader
        title="Add Member"
        description="Add a new member to MentorSpace"
        backHref="/members"
        backLabel="Members"
      />
      <MemberForm availableSeats={availableSeats} availableRooms={availableRooms} />
    </div>
  )
}
