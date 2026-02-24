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

export type UpgradeFeature = 'team' | 'api-keys' | 'ai'

const headline: Record<UpgradeFeature, string> = {
  team: 'Unlock Team Collaboration',
  'api-keys': 'Unlock API Keys',
  ai: 'Write faster with AI'
}

const getUpgradeUrl = (
  accountSlug: string | undefined,
  dashboardRoute: string | undefined,
  feature: UpgradeFeature
) => {
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
    description: 'Add team members to your projects and manage their access to your projects'
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Email and Google Authentication',
    description: 'Email and Google authentication for seamless access to your projects'
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

  useEffect(() => {
    setIsOpen(open)
  }, [open])

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
            Upgrade to Pro and unlock powerful features to grow your team and
            boost productivity.
          </DialogDescription>
        </DialogHeader>

        <div>
          <FeatureGrid className="flex flex-col gap-4">
            {features.map((feature) => (
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

        <div className="space-y-4">
          <Button variant="default" size="lg" className="w-full" asChild>
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={getUpgradeUrl(accountSlug, dashboardRoute, feature)}
            >
              Upgrade to Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
