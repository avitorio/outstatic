import React from 'react';

import { cn } from '@/utils/ui';

export const FeatureGrid: React.FC<React.HTMLAttributes<HTMLDivElement>> =
  function FeatureGridComponent({ className, children, ...props }) {
    return (
      <div
        className={cn(
          'mt-2 grid w-full grid-cols-1 gap-4 md:mt-6 md:grid-cols-2 md:grid-cols-3 lg:grid-cols-3',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  };
