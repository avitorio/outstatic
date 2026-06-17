'use client';

import DefaultSearchDialog from 'fumadocs-ui/components/dialog/search-default';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';
import { getVersionFromPathname } from '@/lib/docs-version';

type VersionedSearchDialogProps = ComponentProps<typeof DefaultSearchDialog>;

export function VersionedSearchDialog(props: VersionedSearchDialogProps) {
  const pathname = usePathname();
  const defaultTag = getVersionFromPathname(pathname);

  return <DefaultSearchDialog {...props} defaultTag={defaultTag} />;
}
