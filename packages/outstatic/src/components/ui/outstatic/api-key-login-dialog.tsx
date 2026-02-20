'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, Github, KeyRound, Loader2, Rocket } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/shadcn/dialog'
import { Button } from '@/components/ui/shadcn/button'
import {
  buildApiKeySignupUrl,
  buildOutstaticCallbackOrigin
} from '@/utils/buildApiKeySignupUrl'
import { useClientOrigin } from '@/utils/hooks/useClientOrigin'

type ApiKeyLoginDialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  triggerLabel?: string
  basePath?: string
}

const setupSteps = [
  {
    title: 'Create your Outstatic account',
    description:
      'Sign up with GitHub and create your project on Outstatic.com.',
    icon: Github
  },
  {
    title: 'Generate a project API key',
    description: 'Open your project API Keys page and create a new key.',
    icon: KeyRound
  },
  {
    title: 'Add it to your app',
    description:
      'Set OUTSTATIC_API_KEY in your .env file, then restart your app.',
    icon: Rocket
  }
] as const

export function ApiKeyLoginDialog({
  open,
  onOpenChange,
  triggerLabel,
  basePath
}: ApiKeyLoginDialogProps) {
  const [isCreatingApiKey, setIsCreatingApiKey] = useState(false)
  const clientOrigin = useClientOrigin()
  const callbackOrigin = useMemo(() => {
    if (!clientOrigin) {
      return undefined
    }

    return buildOutstaticCallbackOrigin(clientOrigin, basePath)
  }, [basePath, clientOrigin])

  const apiKeysUrl = useMemo(
    () =>
      buildApiKeySignupUrl({
        autoGenerateApiKey: true,
        callbackOrigin
      }),
    [callbackOrigin]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {triggerLabel ? (
        <DialogTrigger asChild>
          <Button className="w-full sm:w-auto">{triggerLabel}</Button>
        </DialogTrigger>
      ) : null}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Connect GitHub in 3 quick steps
          </DialogTitle>
          <DialogDescription className="text-base">
            Use an Outstatic API key to enable GitHub login for your dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {setupSteps.map((step, index) => {
            const StepIcon = step.icon

            return (
              <div
                key={step.title}
                className="bg-card flex items-start gap-3 rounded-lg border p-3"
              >
                <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <p className="text-foreground flex items-center gap-2 text-sm font-medium">
                    <StepIcon className="h-4 w-4 text-primary" />
                    {step.title}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {step.description}
                  </p>
                  {index === 2 ? (
                    <code className="bg-muted mt-2 inline-block rounded px-2 py-1 text-xs">
                      OUTSTATIC_API_KEY=your_api_key_here
                    </code>
                  ) : null}
                </div>
              </div>
            )
          })}
        </div>
        <div className="from-primary/10 to-primary/5 rounded-lg bg-gradient-to-r p-4">
          <p className="text-foreground text-sm font-medium">
            After setup, come back, reload and click Sign in with GitHub again.
          </p>
        </div>
        <DialogFooter>
          <Button asChild size="lg" className="w-full">
            <Link
              target="_blank"
              rel="noopener noreferrer"
              href={apiKeysUrl}
              aria-busy={isCreatingApiKey}
              aria-label="Create a FREE API Key on Outstatic.com"
              onClick={(event) => {
                if (isCreatingApiKey) {
                  event.preventDefault()
                  return
                }
                setIsCreatingApiKey(true)
              }}
            >
              {isCreatingApiKey ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Create a <span className="font-bold">FREE</span> API Key on
                  Outstatic.com
                  <ArrowUpRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
