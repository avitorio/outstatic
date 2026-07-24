'use client'

import { useEffect, useState } from 'react'

import { ArrowRight, CheckCircle, Mail, Sparkles, Users } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/shadcn/dialog'
import { FeatureGrid } from '@/components/ui/outstatic/feature-grid'
import Link from 'next/link'
import { OUTSTATIC_APP_URL } from '@/utils/constants'
import { Button } from '../shadcn/button'

export type UpgradeFeature =
  | 'team'
  | 'api-keys'
  | 'ai'
  | 'save'
  | 'demo'
  | 'content-setup'

const headline: Record<UpgradeFeature, string> = {
  team: 'Unlock Team Collaboration',
  'api-keys': 'Unlock API Keys',
  ai: 'Write faster with AI',
  save: 'Upgrade to save your content',
  demo: 'This is a demo project',
  'content-setup': 'Set up your dashboard automatically'
}

const getUpgradeUrl = (
  accountSlug: string | undefined,
  dashboardRoute: string | undefined,
  feature: UpgradeFeature
) => {
  if (feature === 'demo') {
    if (!accountSlug) {
      return `${OUTSTATIC_APP_URL}/auth/sign-up?provider=github`
    }

    const destination = new URL(`${OUTSTATIC_APP_URL}/home/${accountSlug}/`)
    destination.searchParams.set('new_project', 'true')

    return destination.toString()
  }

  if (feature === 'content-setup') {
    return accountSlug
      ? `${OUTSTATIC_APP_URL}/home/${accountSlug}/upgrade-set-up`
      : `${OUTSTATIC_APP_URL}/auth/sign-up?provider=github`
  }

  if (feature === 'save') {
    const destination = accountSlug
      ? new URL(`${OUTSTATIC_APP_URL}/home/${accountSlug}/`)
      : new URL(`${OUTSTATIC_APP_URL}/auth/sign-up?provider=github`)

    destination.searchParams.set('feature', 'team')
    destination.searchParams.set('auto_checkout', 'true')

    return destination.toString()
  }

  const baseRoute = dashboardRoute || '/outstatic'

  const destination = accountSlug
    ? new URL(`${OUTSTATIC_APP_URL}/home/${accountSlug}/`)
    : new URL(`${OUTSTATIC_APP_URL}/auth/sign-up?provider=github`)

  destination.searchParams.set('feature', feature)

  return `${baseRoute}/redirect?redirectTo=${encodeURIComponent(destination.toString())}`
}

const features = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'AI Completions',
    description: 'Smart content suggestions and auto-completion powered by AI'
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Team Collaboration',
    description:
      'Add team members to your projects and manage their access to your projects'
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Email and Google Authentication',
    description:
      'Email and Google authentication for seamless access to your projects'
  }
]

const contentSetupFeatures = [
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'Automatic content setup',
    description:
      'Turn the Markdown folders we found into a ready-to-use dashboard in one step.'
  },
  {
    icon: <CheckCircle className="h-5 w-5" />,
    title: 'Safe field matching',
    description:
      'Import only frontmatter fields that match supported Outstatic field types.'
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Everything in Git',
    description:
      'Keep your repository as the source of truth while giving your team a dashboard.'
  }
]

export function UpgradeDialog({
  open = false,
  onOpenChange,
  children,
  feature = 'team',
  accountSlug,
  dashboardRoute
}: React.PropsWithChildren<{
  open?: boolean
  onOpenChange?: (open: boolean) => void
  feature?: UpgradeFeature
  accountSlug?: string
  dashboardRoute?: string
}>) {
  const [isOpen, setIsOpen] = useState(open)
  const [hasMounted, setHasMounted] = useState(false)
  const dialogFeatures =
    feature === 'content-setup'
      ? contentSetupFeatures
      : feature === 'demo'
        ? []
        : features
  const description =
    feature === 'content-setup'
      ? 'Upgrade to Pro to import the content we found and configure your dashboard automatically.'
      : feature === 'demo'
        ? 'This project is read-only. Create your own editable copy to save content, manage collections, and upload media.'
        : feature === 'save'
          ? 'Outstatic.com projects require Pro to save changes. Self-hosted Outstatic remains free.'
          : 'Upgrade to Pro and unlock powerful features to grow your team and boost productivity.'

  useEffect(() => {
    setIsOpen(open)
  }, [open])

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return children
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(newOpen) => {
        setIsOpen(newOpen)
        onOpenChange?.(newOpen)
      }}
      modal
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-2xl font-semibold">
            {headline[feature]}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mx-auto max-w-sm text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        {dialogFeatures.length > 0 ? (
          <div>
            <FeatureGrid className="flex flex-col gap-4">
              {dialogFeatures.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-card hover:bg-accent/50 flex items-start gap-3 rounded-lg border p-4 transition-colors"
                >
                  <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-md">
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-foreground font-medium">
                      {feature.title}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              ))}
            </FeatureGrid>
          </div>
        ) : null}

        <div className="space-y-4">
          <Button variant="default" size="lg" className="w-full" asChild>
            <Link
              target={feature === 'demo' ? '_self' : '_blank'}
              rel="noopener noreferrer"
              href={getUpgradeUrl(accountSlug, dashboardRoute, feature)}
            >
              {feature === 'demo'
                ? 'Create your own'
                : feature === 'content-setup'
                  ? 'Upgrade to set up your dashboard'
                  : 'Start your free trial'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        {feature === 'save' ? (
          <p className="text-muted-foreground text-sm text-center">
            or learn about{' '}
            <a
              href="https://outstatic.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              self-hosting
            </a>
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
