import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getStaffMember } from '@/lib/queries/staff'
import StaffForm from '@/components/staff/StaffForm'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Edit Staff' }

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const staff = await getStaffMember(id)

  if (!staff) notFound()

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit — ${staff.full_name}`}
        description="Update staff profile and salary details"
        backHref={`/staff/${id}`}
        backLabel={staff.full_name}
      />
      <StaffForm staff={staff} />
    </div>
  )
}
