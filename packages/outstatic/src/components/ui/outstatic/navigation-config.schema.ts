import { z } from 'zod/v4'

const RouteMatchingEnd = z
  .union([z.boolean(), z.custom<(input: string) => boolean>()])
  .default(false)
  .optional();

const Divider = z.object({
  divider: z.literal(true),
});

const RouteSubChild = z.object({
  label: z.string(),
  path: z.string(),
  Icon: z.custom<React.ReactNode>().optional(),
  action: z.custom<React.ReactNode>().optional(),
  end: RouteMatchingEnd,
  renderAction: z.custom<React.ReactNode>().optional(),
});

const RouteChild = z.object({
  label: z.string(),
  path: z.string(),
  Icon: z.custom<React.ReactNode>().optional(),
  end: RouteMatchingEnd,
  action: z.custom<React.ReactNode>().optional(),
  children: z.array(RouteSubChild).default([]).optional(),
  collapsible: z.boolean().default(false).optional(),
  collapsed: z.boolean().default(false).optional(),
  renderAction: z.custom<React.ReactNode>().optional(),
  badge: z.custom<React.ReactNode>().optional(),
  dialog: z.custom<React.ReactNode>().optional(),
  newTab: z.boolean().default(false).optional(),
});

const RouteGroup = z.object({
  label: z.string(),
  collapsible: z.boolean().optional(),
  collapsed: z.boolean().optional(),
  Icon: z.custom<React.ReactNode>().optional(),
  get children(): z.ZodUnion<[z.ZodArray<typeof RouteChild>, z.ZodArray<typeof RouteGroup>]> {
    return z.union([z.array(RouteChild), z.array(RouteGroup)])
  },
  renderAction: z.custom<React.ReactNode>().optional(),
  badge: z.custom<React.ReactNode>().optional(),
  dialog: z.custom<React.ReactNode>().optional(),
  newTab: z.boolean().default(false).optional(),
})

export const NavigationConfigSchema = z.object({
  // @ts-ignore
  routes: z.array(z.union([RouteGroup, Divider]))
})
