import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Reusable skeleton loader for index/list pages with tables
 * @param {Object} props - Configuration props
 * @param {number} props.columns - Number of table columns (default: 5)
 * @param {number} props.rows - Number of skeleton rows (default: 10)
 * @param {boolean} props.showFilters - Whether to show filter skeletons (default: true)
 * @param {boolean} props.showPagination - Whether to show pagination skeleton (default: true)
 * @param {Array<string>} props.headers - Table header labels (optional)
 */
export const TableIndexSkeleton = ({
    columns = 5,
    rows = 10,
    showFilters = true,
    showPagination = true,
    showAddButton = true,
    showExtraFilter = true,
    headers = []
}) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <Skeleton className="h-9 w-32 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                {showAddButton && <Skeleton className="h-10 w-32 rounded-lg" />}
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Skeleton className="h-10 w-64" />
                        <Skeleton className="h-10 w-[140px]" />
                        <Skeleton className="h-10 w-[140px]" />
                        <Skeleton className="h-10 w-[200px]" />
                    </div>
                    {showExtraFilter && <Skeleton className="h-10 w-24 rounded-lg" />}
                </div>
            )}

            {/* Table */}
            <div className="border rounded-lg overflow-hidden bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {headers.length > 0 ? (
                                headers.map((header, i) => (
                                    <TableHead key={i}>{header}</TableHead>
                                ))
                            ) : (
                                Array.from({ length: columns }).map((_, i) => (
                                    <TableHead key={i}>
                                        <Skeleton className="h-4 w-20" />
                                    </TableHead>
                                ))
                            )}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: rows }).map((_, i) => (
                            <TableRow key={i}>
                                {Array.from({ length: columns }).map((_, j) => (
                                    <TableCell key={j}>
                                        {j === columns - 1 ? (
                                            // Actions column - matches width of standard 2-button action cell
                                            <div className="flex items-center justify-center gap-1">
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                                <Skeleton className="h-8 w-8 rounded-md" />
                                            </div>
                                        ) : (
                                            <Skeleton
                                                className={`h-4 ${j === 0 ? 'w-32' :
                                                    j === 1 ? 'w-24' :
                                                        j === 2 ? 'w-full max-w-[300px]' : // Description/Details column
                                                            'w-28' // Date/other columns
                                                    }`}
                                            />
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                {/* Pagination Skeleton */}
                {showPagination && (
                    <div className="flex items-center justify-between border-t px-6 py-4">
                        <Skeleton className="h-4 w-48" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-9 w-16" />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

/**
 * Reusable skeleton loader for detail/view pages
 * @param {Object} props - Configuration props
 * @param {number} props.fields - Number of detail fields to show (default: 8)
 */
export const DetailViewSkeleton = ({ fields = 8 }) => {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10" />
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-80" />
                    </div>
                </div>
            </div>

            {/* Content skeleton */}
            <div className="border rounded-lg bg-white p-8 space-y-6">
                <div className="space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-full max-w-md" />
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: fields }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-full" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

/**
 * Reusable skeleton loader for form pages
 * @param {Object} props - Configuration props
 * @param {number} props.fields - Number of form fields to show (default: 10)
 * @param {boolean} props.showTabs - Whether to show tabs skeleton (default: false)
 */
export const FormSkeleton = ({ fields = 10, showTabs = false }) => {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10" />
                <div className="space-y-2">
                    <Skeleton className="h-9 w-64" />
                    <Skeleton className="h-4 w-96" />
                </div>
            </div>

            {/* Separator */}
            <Separator />

            {/* Tabs skeleton */}
            {showTabs && (
                <Skeleton className="h-10 w-full max-w-md" />
            )}

            {/* Form skeleton */}
            <div className="border rounded-lg bg-white p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: fields }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    ))}
                </div>

                <Separator />

                {/* Action buttons skeleton */}
                <div className="flex items-center justify-end gap-3">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </div>
        </div>
    );
};

/**
 * Reusable skeleton loader for card-grid pages (e.g. BookRequest)
 * @param {Object}  props
 * @param {number}  props.cards        - Number of skeleton cards (default: 6)
 * @param {number}  props.detailRows   - Key-value rows per card (default: 2)
 * @param {boolean} props.showFilters  - Show filter bar skeleton (default: true)
 * @param {boolean} props.showActions  - Show action button skeletons in each card (default: true)
 * @param {boolean} props.showBackButton - Show back-button skeleton in header (default: false)
 * @param {boolean} props.showAddButton  - Show add-button skeleton in header (default: true)
 */
export const CardGridSkeleton = ({
    cards = 6,
    detailRows = 2,
    showFilters = true,
    showActions = true,
    showBackButton = false,
    showAddButton = true,
}) => {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    {showBackButton && <Skeleton className="h-10 w-10 rounded-lg" />}
                    <div>
                        <Skeleton className="h-9 w-48 mb-2" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                </div>
                {showAddButton && <Skeleton className="h-10 w-36 rounded-lg" />}
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <Skeleton className="h-10 w-[240px]" />
                        <Skeleton className="h-10 w-[140px]" />
                        <Skeleton className="h-10 w-[140px]" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-lg" />
                </div>
            )}

            {/* Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: cards }).map((_, i) => (
                    <div
                        key={i}
                        className="border border-gray-200 rounded-2xl bg-white overflow-hidden"
                    >
                        {/* Accent stripe */}
                        <Skeleton className="h-1.5 w-full rounded-none" />

                        <div className="p-6 space-y-4">
                            {/* Title + badge */}
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1.5 flex-1">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                <Skeleton className="h-6 w-24 rounded-full" />
                            </div>

                            {/* Detail rows */}
                            <div className="space-y-2.5">
                                {Array.from({ length: detailRows }).map((_, j) => (
                                    <div key={j} className="flex items-center justify-between">
                                        <Skeleton className="h-3.5 w-20" />
                                        <Skeleton className="h-3.5 w-28" />
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            {showActions && (
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                    <Skeleton className="h-8 flex-1 rounded-md" />
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * Reusable skeleton loader for pages with lateral navigation (like Settings)
 */
export const LateralFormSkeleton = () => {
    return (
        <div className="space-y-6">
            {/* Header skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-4 w-96" />
            </div>

            <Separator />

            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 pt-2">
                {/* Sidebar skeleton */}
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-11 w-full rounded-lg" />
                    ))}
                </div>

                {/* Content skeleton */}
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                        ))}
                    </div>

                    <Separator />

                    <div className="flex items-center justify-end gap-3">
                        <Skeleton className="h-10 w-24 rounded-lg" />
                        <Skeleton className="h-10 w-32 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    );
};
