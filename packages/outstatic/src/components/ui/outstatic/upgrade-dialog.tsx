'use client';

import { useEffect, useState } from 'react';


import { ArrowRight, CheckCircle, Mail, Sparkles, Users } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/shadcn/dialog';
import { FeatureGrid } from '@/components/ui/outstatic/feature-grid';
import Link from 'next/link';
import { OUTSTATIC_APP_URL } from '@/utils/constants';
import { Button } from '../shadcn/button';

const features = [
  {
    icon: <Users className="h-5 w-5" />,
    title: 'Invite Members',
    description: 'Add team members to your projects',
  },
  {
    icon: <Mail className="h-5 w-5" />,
    title: 'Email Authentication',
    description: 'Email authentication for seamless access to your projects',
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: 'AI Completions',
    description: 'Smart content suggestions and auto-completion powered by AI',
  },
];

export function UpgradeDialog({
  open = false,
  onOpenChange,
  children,
  title,
  accountSlug,
  dashboardRoute
}: React.PropsWithChildren<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title?: string;
  accountSlug?: string;
  dashboardRoute?: string;
}>) {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  return (
    <Dialog open={isOpen} onOpenChange={(newOpen) => { setIsOpen(newOpen); onOpenChange?.(newOpen); }} modal>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent
        className="max-w-2xl"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-semibold">
            {title || 'Unlock Team Collaboration'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mx-auto max-w-sm text-base">
            Upgrade to Pro and unlock powerful features to grow your team and boost productivity.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6">
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

        <div className="mt-6 space-y-4">
          <div className="from-primary/10 to-primary/5 rounded-lg bg-gradient-to-r p-4 text-center">
            <p className="text-foreground text-sm font-medium">
              Ready to scale your team?
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Start your free trial today
            </p>
          </div>

          <Button variant="default" size="lg" className="w-full" asChild>
            <Link
              href={`${accountSlug ? `${dashboardRoute}/redirect?redirectTo=${encodeURIComponent(`${OUTSTATIC_APP_URL}/home/${accountSlug}/billing`)}` : `${dashboardRoute || '/outstatic'}/redirect?redirectTo=${encodeURIComponent(`${OUTSTATIC_APP_URL}/auth/sign-up?provider=github`)}`}`}
            >
              Upgrade to Pro
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
