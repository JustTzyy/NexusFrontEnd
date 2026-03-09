import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import DateRangeFilter from "../../components/DateRangeFilter";
import { feedbackService } from "../../services/feedbackService";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, AlertCircle, Pencil, Trash2, Star } from "lucide-react";

const getRatingColor = (rating) => {
    if (rating >= 4) return "text-emerald-600";
    if (rating >= 3) return "text-amber-600";
    return "text-red-600";
};

const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
    });
};

const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleString("en-US", {
        year: "numeric", month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const renderStars = (rating) => (
    <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`h-3.5 w-3.5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
            />
        ))}
    </div>
);

export default function FeedbackIndex() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const isAdmin = user?.role === "Super Admin" || user?.role === "Admin";

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [q, setQ] = useState("");
    const [debouncedQ, setDebouncedQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [ratingFilter, setRatingFilter] = useState("all");

    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 5;

    const [viewModal, setViewModal] = useState({ open: false, item: null });
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    /* debounce */
    useEffect(() => {
        const t = setTimeout(() => { setDebouncedQ(q); setPage(1); }, 400);
        return () => clearTimeout(t);
    }, [q]);

    const clearFilters = () => {
        setQ(""); setDebouncedQ(""); setFromDate(undefined);
        setToDate(undefined); setRatingFilter("all"); setPage(1);
    };

    const loadItems = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const params = {
                pageNumber: page,
                pageSize,
                searchTerm: debouncedQ || undefined,
                fromDate: fromDate || undefined,
                toDate: toDate || undefined,
            };
            const res = await feedbackService.getAll(params);
            const data = res.data;
            let list = data?.items || [];

            if (ratingFilter !== "all") {
                list = list.filter(i => i.rating === parseInt(ratingFilter));
            }

            setItems(list);
            setTotalCount(data?.totalCount || 0);
            setTotalPages(data?.totalPages || 0);
        } catch (err) {
            setError(err?.message || "Failed to load feedback");
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, debouncedQ, ratingFilter, fromDate, toDate]);

    useEffect(() => { loadItems(); }, [loadItems]);

    useEffect(() => {
        if (location.state?.alert) {
            setAlert({ show: true, type: location.state.alert.type, message: location.state.alert.message });
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (alert.show) {
            const t = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(t);
        }
    }, [alert.show]);

    const openViewModal = (item) => setViewModal({ open: true, item });
    const confirmView = () => {
        if (viewModal.item) navigate(`/feedback/${viewModal.item.id}`);
        setViewModal({ open: false, item: null });
    };

    return (
        <AppLayout title="Feedback & Reviews">
            {loading && items.length === 0 ? (
                <TableIndexSkeleton
                    columns={5} rows={5} showAddButton={false} showExtraFilter={false}
                    headers={["Teacher", "Rating", "Comment", "Session Date", "Submitted"]}
                />
            ) : (
                <div className="space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Feedback & Reviews</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                {isAdmin
                                    ? "View all customer feedback and ratings"
                                    : "View and manage your submitted feedback"}
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate} toDate={toDate}
                            onFromDateChange={(d) => { setFromDate(d); setPage(1); }}
                            onToDateChange={(d) => { setToDate(d); setPage(1); }}
                            onRangeChange={() => setPage(1)}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search by teacher, subject..."
                                                value={q}
                                                onChange={(e) => setQ(e.target.value)}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by teacher, customer, subject, or comment</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={ratingFilter} onValueChange={(v) => { setRatingFilter(v); setPage(1); }}>
                                                    <SelectTrigger className="w-[160px]">
                                                        <SelectValue placeholder="All Ratings" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Ratings</SelectItem>
                                                        <SelectItem value="5">5 Stars</SelectItem>
                                                        <SelectItem value="4">4 Stars</SelectItem>
                                                        <SelectItem value="3">3 Stars</SelectItem>
                                                        <SelectItem value="2">2 Stars</SelectItem>
                                                        <SelectItem value="1">1 Star</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by rating</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || ratingFilter !== "all") && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>Clear</Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Clear all filters</TooltipContent>
                                        </Tooltip>
                                    )}
                                </>
                            }
                        />
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Comment</TableHead>
                                    <TableHead>Session Date</TableHead>
                                    <TableHead className="text-center">Submitted</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No feedback found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    items.map((fb) => (
                                        <Tooltip key={fb.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow className="cursor-pointer" onClick={() => openViewModal(fb)}>
                                                    <TableCell className="font-medium">{fb.teacherName}</TableCell>
                                                    <TableCell>{renderStars(fb.rating)}</TableCell>
                                                    <TableCell className="text-gray-600 max-w-[200px] truncate">{fb.comment || "—"}</TableCell>
                                                    <TableCell className="text-gray-600">{formatDate(fb.sessionDate)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="inline-grid place-items-center">
                                                            <span className={`col-start-1 row-start-1 font-semibold whitespace-nowrap ${getRatingColor(fb.rating)}`}>
                                                                {formatDate(fb.createdAt)}
                                                            </span>
                                                            <div className="col-start-1 row-start-1 flex items-center justify-center gap-1 invisible select-none">
                                                                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                                                                <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4" /></Button>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </TooltipTrigger>
                                            <TooltipContent>Click to view details</TooltipContent>
                                        </Tooltip>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {!loading && items.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to next page</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View confirm dialog */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, item: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Feedback Details</DialogTitle>
                        <DialogDescription>
                            Would you like to view the detailed feedback for{" "}
                            <span className="font-semibold">{viewModal.item?.teacherName}</span>'s session
                            {viewModal.item?.subjectName ? ` on ${viewModal.item.subjectName}` : ""}?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, item: null })}>Cancel</Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
