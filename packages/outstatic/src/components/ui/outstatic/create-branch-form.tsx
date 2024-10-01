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
import { kebabCase } from 'change-case'
import { ClientError } from 'graphql-request'

type CreateBranchFormProps = {
  branchName?: string
  onBranchCreated?: (data: { branchName: string }) => void
}

export function CreateBranchForm({
  branchName = '',
  onBranchCreated
}: CreateBranchFormProps) {
  const createBranch = useCreateBranch()
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm({
    resolver: zodResolver(CreateBranchSchema),
    defaultValues: {
      branchName: kebabCase(branchName)
    }
  })

  const handleSubmit = async (data: { branchName: string }) => {
    setIsLoading(true)
    try {
      const result = await createBranch.mutateAsync(data)
      toast.promise(Promise.resolve(result), {
        loading: 'Creating branch...',
        success: 'Branch created successfully',
        error: 'Failed to create branch'
      })
      onBranchCreated?.(data)
      return result
    } catch (error) {
      console.error('Failed to create branch:', error)
      toast.error('Failed to create branch.')
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
                <Input {...field} placeholder="feature/new-branch" />
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
