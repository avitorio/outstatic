import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useCreateBranch } from '@/utils/hooks/useCreateBranch'
import { CreateBranchSchema } from '@/utils/schemas/create-branch-schema'
import { Button } from '@/components/ui/shadcn/button'
import { Input } from '@/components/ui/shadcn/input'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage
} from '@/components/ui/shadcn/form'
import { useState } from 'react'
import { toast } from 'sonner'

type CreateBranchFormProps = {
  onBranchCreated?: (data: { branchName: string }) => void
}

export function CreateBranchForm({ onBranchCreated }: CreateBranchFormProps) {
  const createBranch = useCreateBranch()
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm({
    resolver: zodResolver(CreateBranchSchema),
    defaultValues: {
      branchName: ''
    }
  })

  const handleSubmit = async (data: { branchName: string }) => {
    setIsLoading(true)
    try {
      toast.promise(createBranch.mutateAsync(data), {
        loading: 'Creating branch...',
        success: 'Branch created successfully',
        error: 'Failed to create branch'
      })
      onBranchCreated?.(data)
    } catch (error) {
      console.error('Failed to create branch:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="branchName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Branch Name</FormLabel>
              <FormControl>
                <Input placeholder="feature/new-branch" {...field} />
              </FormControl>
              <FormDescription>
                Enter a name for your new branch.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isLoading} type="submit">
          {isLoading ? 'Creating...' : 'Create Branch'}
        </Button>
      </form>
    </Form>
  )
}
