import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getMember, getAvailableSeats, getAvailableRooms } from '@/lib/queries/members'
import MemberForm from '@/components/members/MemberForm'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Edit Member' }

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [member, availableSeats, availableRooms] = await Promise.all([
    getMember(id),
    getAvailableSeats(id), // exclude this member's current seat
    getAvailableRooms(id), // exclude this member's current room
  ])

  if (!member) notFound()

  return (
    <div>
      <PageHeader
        title={`Edit — ${member.full_name}`}
        backHref={`/members/${id}`}
        backLabel={member.full_name}
      />
      <MemberForm
        member={member as any}
        availableSeats={availableSeats}
        availableRooms={availableRooms}
      />
    </div>
  )
}
