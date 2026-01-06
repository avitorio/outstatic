import { Button } from '@/components/ui/shadcn/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/shadcn/card'
import { useOutstatic } from '@/utils/hooks/useOutstatic'
import Link from 'next/link'

export default function SingletonOnboarding() {
  const { dashboardRoute } = useOutstatic()

  return (
    <div className="max-w-2xl">
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Create a Singleton</CardTitle>
          <CardDescription>
            Get started with your first Singleton
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert">
          <p>
            Singletons are one-off documents that exist independently of
            collections.
            <br />
            They&apos;re perfect for static pages like About or Contact, and
            for site-wide settings.
          </p>
          <p>Create your first Singleton by clicking the button below.</p>
          <Button asChild>
            <Link href={`${dashboardRoute}/singletons/new`}>
              New Singleton
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
