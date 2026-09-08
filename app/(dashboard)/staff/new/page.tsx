import type { Metadata } from 'next'
import StaffForm from '@/components/staff/StaffForm'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Add Staff' }

export default function NewStaffPage() {
  return (
    <div>
      <PageHeader
        title="Add Staff Member"
        description="Add a new staff member to MentorSpace"
        backHref="/staff"
        backLabel="Staff"
      />
      <StaffForm />
    </div>
  )
}
