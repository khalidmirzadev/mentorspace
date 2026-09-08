import type { Metadata } from 'next'
import GeneratorForm from '@/components/generator/GeneratorForm'
import PageHeader from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Add Generator Expense' }

export default function NewGeneratorExpensePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Add Generator Expense"
        description="Record fuel purchases or maintenance/repair costs"
        backHref="/generator"
        backLabel="Generator"
      />
      <GeneratorForm />
    </div>
  )
}
