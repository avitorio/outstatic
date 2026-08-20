import { Skeleton } from '@/components/ui/shadcn/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/shadcn/table'

const CELL_WIDTHS = ['w-48', 'w-16', 'w-32', 'w-28', 'w-24', 'w-20']

type DocumentsTableSkeletonProps = {
  columns?: number
  rows?: number
}

export const DocumentsTableSkeleton = ({
  columns = 4,
  rows = 6
}: DocumentsTableSkeletonProps) => (
  <div className="w-full">
    <div className="flex items-center gap-2 pb-4">
      <Skeleton className="h-9 w-full max-w-sm" />
      <Skeleton className="ml-auto h-9 w-28" />
    </div>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, column) => (
              <TableHead key={column}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, row) => (
            <TableRow key={row}>
              {Array.from({ length: columns }).map((_, column) => (
                <TableCell key={column}>
                  <Skeleton
                    className={`h-4 ${
                      CELL_WIDTHS[column % CELL_WIDTHS.length]
                    }`}
                  />
                </TableCell>
              ))}
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
)
