import type { Metadata } from 'next'
import RoomForm from '@/components/spaces/RoomForm'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Add Room' }

export default function NewRoomPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Room"
        description="Configure a private office, meeting room, or shared space"
        backHref="/spaces"
        backLabel="Spaces"
      />
      <RoomForm />
    </div>
  )
}
