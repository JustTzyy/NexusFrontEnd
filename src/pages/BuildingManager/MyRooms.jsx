import { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { buildingService } from "../../services/buildingService";
import { roomService } from "../../services/roomService";
import { applyFilters, paginate } from "../../utils/filterUtils";
import { TableIndexSkeleton } from "../../utils/skeletonLoaders";
import AppLayout from "../../layouts/AppLayout";
import DateRangeFilter from "../../components/DateRangeFilter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Search, X, AlertCircle, CheckCircle2, Wrench } from "lucide-react";

function NoBuildingState() {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-100">
                <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <div>
                <p className="text-base font-semibold text-gray-900">No Building Assigned</p>
                <p className="text-sm text-gray-500 mt-1">
                    You have not been assigned to manage any building yet.
                    <br />Contact an administrator to get started.
                </p>
            </div>
        </div>
    );
}

export default function MyRooms() {
    const navigate = useNavigate();
    const location = useLocation();

    /* ------------------------------ api state ------------------------------ */
    const [rooms, setRooms] = useState([]);
    const [myBuilding, setMyBuilding] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [noBuilding, setNoBuilding] = useState(false);

    /* ---------------------------- filter state ---------------------------- */
    const [q, setQ] = useState("");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [status, setStatus] = useState("all");

    /* -------------------------- pagination state -------------------------- */
    const [page, setPage] = useState(1);
    const pageSize = 10;

    /* -------------------------- modal state -------------------------- */
    const [viewModal, setViewModal] = useState({ open: false, room: null });
    const [toggleModal, setToggleModal] = useState({ open: false, room: null });
    const [toggling, setToggling] = useState(false);

    /* -------------------------- alert state -------------------------- */
    const [alert, setAlert] = useState({ show: false, type: "success", message: "" });

    const resetPage = () => setPage(1);

    const clearFilters = () => {
        setQ("");
        setFromDate(undefined);
        setToDate(undefined);
        setStatus("all");
        setPage(1);
    };

    /* ------------------------------ api ------------------------------ */
    const loadData = async () => {
        setLoading(true);
        setError("");
        try {
            const buildingRes = await buildingService.getMy();
            const building = buildingRes.data ?? null;
            if (!building) {
                setNoBuilding(true);
                setLoading(false);
                return;
            }
            setMyBuilding(building);

            const roomsRes = await roomService.getAll({ pageNumber: 1, pageSize: 200 });
            const allRooms = roomsRes.data?.items ?? [];
            const myRooms = allRooms
                .filter(r => r.buildingId === building.id)
                .map(r => ({
                    id: r.id,
                    name: r.name,
                    capacity: r.capacity,
                    isActive: r.isActive,
                    buildingId: r.buildingId,
                    buildingName: r.buildingName || "—",
                    createdAt: new Date(r.createdAt).toLocaleDateString(),
                }));
            setRooms(myRooms);
        } catch (err) {
            setError(err?.message || "Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (location.state?.alert) {
            setAlert({
                show: true,
                type: location.state.alert.type,
                message: location.state.alert.message,
            });
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    useEffect(() => {
        if (alert.show) {
            const timer = setTimeout(() => setAlert({ show: false, type: "success", message: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [alert.show]);

    /* ------------------------------ actions ------------------------------ */
    const openViewModal = (room) => setViewModal({ open: true, room });

    const confirmView = () => {
        if (viewModal.room) navigate(`/my-rooms/${viewModal.room.id}`);
        setViewModal({ open: false, room: null });
    };

    const openToggleModal = (e, room) => {
        e.stopPropagation();
        setToggleModal({ open: true, room });
    };

    const confirmToggle = async () => {
        const room = toggleModal.room;
        setToggleModal({ open: false, room: null });
        if (!room) return;
        setToggling(true);
        try {
            await roomService.update(room.id, {
                name: room.name,
                capacity: room.capacity,
                buildingId: room.buildingId,
                isActive: !room.isActive,
            });
            setRooms(prev =>
                prev.map(r => r.id === room.id ? { ...r, isActive: !r.isActive } : r)
            );
            const newStatus = !room.isActive ? "Active" : "Maintenance";
            setAlert({ show: true, type: "success", message: `Room "${room.name}" set to ${newStatus}.` });
        } catch (err) {
            setAlert({ show: true, type: "error", message: err?.message || "Failed to update room status." });
        } finally {
            setToggling(false);
        }
    };

    /* ------------------------- filtering ------------------------- */
    const filtered = useMemo(() => {
        let result = applyFilters(rooms, {
            search: q,
            searchFields: ["name"],
            fromDate,
            toDate,
            dateField: "createdAt",
        });
        if (status !== "all") {
            result = result.filter(r => r.isActive === (status === "active"));
        }
        return result;
    }, [rooms, q, fromDate, toDate, status]);

    const paginationResult = useMemo(() => paginate(filtered, page, pageSize), [filtered, page, pageSize]);
    const { data: paged, total, totalPages, page: safePage } = paginationResult;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    if (noBuilding) {
        return (
            <AppLayout title="My Rooms">
                <NoBuildingState />
            </AppLayout>
        );
    }

    return (
        <AppLayout title="My Rooms">
            {loading ? (
                <TableIndexSkeleton
                    columns={5}
                    rows={8}
                    headers={["Name", "Status", "Capacity", "Created At", "Actions"]}
                />
            ) : (
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">My Rooms</h1>
                            <p className="mt-1 text-sm text-gray-600">
                                Rooms in <span className="font-medium">{myBuilding?.name}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {alert.show && (
                                <Alert
                                    className={`flex items-center gap-2 py-2 px-4 animate-in fade-in slide-in-from-right-4 duration-300 ${alert.type === "success"
                                        ? "border-green-500 bg-green-50 text-green-800"
                                        : "border-red-500 bg-red-50 text-red-800"
                                        }`}
                                >
                                    {alert.type === "success" ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                    )}
                                    <AlertDescription className={`text-sm whitespace-nowrap ${alert.type === "success" ? "text-green-800" : "text-red-800"}`}>
                                        {alert.message}
                                    </AlertDescription>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-5 w-5 ml-1 flex-shrink-0 ${alert.type === "success"
                                            ? "text-green-600 hover:text-green-700 hover:bg-green-100"
                                            : "text-red-600 hover:text-red-700 hover:bg-red-100"
                                            }`}
                                        onClick={() => setAlert({ show: false, type: "success", message: "" })}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </Alert>
                            )}
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Filters */}
                    <div className="space-y-3">
                        <DateRangeFilter
                            fromDate={fromDate}
                            toDate={toDate}
                            onFromDateChange={(date) => { setFromDate(date); resetPage(); }}
                            onToDateChange={(date) => { setToDate(date); resetPage(); }}
                            onRangeChange={() => resetPage()}
                            leftElement={
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Search rooms..."
                                                value={q}
                                                onChange={(e) => { setQ(e.target.value); resetPage(); }}
                                                className="pl-10 w-[240px]"
                                            />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Search by room name</TooltipContent>
                                </Tooltip>
                            }
                            rightElement={
                                <>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div>
                                                <Select value={status} onValueChange={(v) => { setStatus(v); resetPage(); }}>
                                                    <SelectTrigger className="w-[180px]">
                                                        <SelectValue placeholder="All Status" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All Status</SelectItem>
                                                        <SelectItem value="active">Active</SelectItem>
                                                        <SelectItem value="inactive">Maintenance</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent>Filter by status</TooltipContent>
                                    </Tooltip>

                                    {(q || fromDate || toDate || status !== "all") && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                                    Clear
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Clear all filters</TooltipContent>
                                        </Tooltip>
                                    )}
                                </>
                            }
                        />
                    </div>

                    {/* Table */}
                    <div className="border rounded-lg overflow-hidden bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead className="text-center">Created At</TableHead>
                                    <TableHead className="text-center">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24 mx-auto" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : paged.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                                            No rooms found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paged.map((r) => (
                                        <Tooltip key={r.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow className="cursor-pointer" onClick={() => openViewModal(r)}>
                                                    <TableCell className="font-medium">{r.name}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            {r.isActive ? (
                                                                <span className="text-sm font-medium text-green-700">Active</span>
                                                            ) : (
                                                                <span className="text-sm font-medium text-gray-500">Maintenance</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600">{r.capacity}</TableCell>
                                                    <TableCell className="text-gray-600 text-center">{r.createdAt}</TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        disabled={toggling}
                                                                        onClick={(e) => openToggleModal(e, r)}
                                                                        className={r.isActive
                                                                            ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                            : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                        }
                                                                    >
                                                                        {r.isActive
                                                                            ? <Wrench className="h-4 w-4" />
                                                                            : <CheckCircle2 className="h-4 w-4" />
                                                                        }
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    {r.isActive ? "Set to maintenance" : "Set to active"}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </TooltipTrigger>
                                            <TooltipContent>Click to view room details</TooltipContent>
                                        </Tooltip>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {!loading && paged.length > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <p className="text-sm text-gray-600">
                                    Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, total)} of {total} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>
                                                Previous
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to previous page</TooltipContent>
                                    </Tooltip>
                                    <span className="text-sm text-gray-600">Page {safePage} of {totalPages}</span>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages}>
                                                Next
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Go to next page</TooltipContent>
                                    </Tooltip>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* View confirmation */}
            <Dialog open={viewModal.open} onOpenChange={(open) => !open && setViewModal({ open: false, room: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>View Room</DialogTitle>
                        <DialogDescription>
                            Would you like to view details of <span className="font-semibold">{viewModal.room?.name}</span>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setViewModal({ open: false, room: null })}>Cancel</Button>
                        <Button onClick={confirmView}>View Details</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Toggle maintenance confirmation */}
            <Dialog open={toggleModal.open} onOpenChange={(open) => !open && setToggleModal({ open: false, room: null })}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {toggleModal.room?.isActive ? "Set Room to Maintenance" : "Set Room to Active"}
                        </DialogTitle>
                        <DialogDescription>
                            {toggleModal.room?.isActive
                                ? <>Mark <span className="font-semibold">{toggleModal.room?.name}</span> as under maintenance? It will be unavailable for session scheduling.</>
                                : <>Mark <span className="font-semibold">{toggleModal.room?.name}</span> as active? It will become available for session scheduling.</>
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setToggleModal({ open: false, room: null })}>Cancel</Button>
                        <Button
                            onClick={confirmToggle}
                            className={toggleModal.room?.isActive ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700"}
                        >
                            {toggleModal.room?.isActive ? "Set Maintenance" : "Set Active"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
