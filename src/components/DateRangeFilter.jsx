import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "lucide-react";

/**
 * DateRangeFilter - A reusable date range filter component with preset options
 * 
 * @param {Object} props
 * @param {Date|undefined} props.fromDate - The start date
 * @param {Date|undefined} props.toDate - The end date
 * @param {Function} props.onFromDateChange - Callback when from date changes
 * @param {Function} props.onToDateChange - Callback when to date changes
 * @param {Function} props.onRangeChange - Callback when preset range changes (optional)
 * @param {boolean} props.showQuickFilters - Whether to show quick filter buttons (default: true)
 * @param {boolean} props.showBadge - Whether to show the date range badge (default: true)
 * @param {React.ReactNode} props.leftElement - Optional element to display on the left of date pickers
 * @param {React.ReactNode} props.rightElement - Optional element to display on the right of date pickers
 */
export default function DateRangeFilter({
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
    onRangeChange,
    showQuickFilters = true,
    showBadge = true,
    leftElement,
    rightElement
}) {
    const [dateRange, setDateRange] = useState("all");

    // Date validation helpers
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Smart detection: Auto-select matching preset when dates align
    useEffect(() => {
        if (!fromDate || !toDate) {
            if (!fromDate && !toDate) {
                setDateRange("all");
            }
            return;
        }

        // Helper to check if two dates are the same day
        const isSameDay = (date1, date2) => {
            return date1.getFullYear() === date2.getFullYear() &&
                date1.getMonth() === date2.getMonth() &&
                date1.getDate() === date2.getDate();
        };

        // Get today's date
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        // Check for "Today"
        if (isSameDay(fromDate, todayStart) && isSameDay(toDate, todayEnd)) {
            setDateRange("today");
            return;
        }

        // Check for "Last 7 Days"
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        if (isSameDay(fromDate, sevenDaysAgo) && isSameDay(toDate, todayEnd)) {
            setDateRange("7days");
            return;
        }

        // Check for "Last 30 Days"
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        if (isSameDay(fromDate, thirtyDaysAgo) && isSameDay(toDate, todayEnd)) {
            setDateRange("30days");
            return;
        }

        // Check for "Last 90 Days"
        const ninetyDaysAgo = new Date(now);
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
        ninetyDaysAgo.setHours(0, 0, 0, 0);
        if (isSameDay(fromDate, ninetyDaysAgo) && isSameDay(toDate, todayEnd)) {
            setDateRange("90days");
            return;
        }

        // If no preset matches, set to custom
        setDateRange("custom");
    }, [fromDate, toDate]);

    // Date range preset handler
    const handleDateRangeChange = (range) => {
        setDateRange(range);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        switch (range) {
            case "today":
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                onFromDateChange(startOfToday);
                onToDateChange(todayEnd);
                break;
            case "7days":
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);
                onFromDateChange(sevenDaysAgo);
                onToDateChange(todayEnd);
                break;
            case "30days":
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
                thirtyDaysAgo.setHours(0, 0, 0, 0);
                onFromDateChange(thirtyDaysAgo);
                onToDateChange(todayEnd);
                break;
            case "90days":
                const ninetyDaysAgo = new Date();
                ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
                ninetyDaysAgo.setHours(0, 0, 0, 0);
                onFromDateChange(ninetyDaysAgo);
                onToDateChange(todayEnd);
                break;
            case "all":
                onFromDateChange(undefined);
                onToDateChange(undefined);
                break;
            // "custom" doesn't change dates, user sets them manually
        }

        // Call optional callback
        if (onRangeChange) {
            onRangeChange(range);
        }
    };

    // Get label for current date range
    const getDateRangeLabel = () => {
        switch (dateRange) {
            case "today": return "Today";
            case "7days": return "Last 7 Days";
            case "30days": return "Last 30 Days";
            case "90days": return "Last 90 Days";
            case "custom":
                if (fromDate && toDate) {
                    // Normalize dates to midnight for accurate day counting
                    const d1 = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
                    const d2 = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());

                    // Calculate the number of days (inclusive)
                    const timeDiff = d2.getTime() - d1.getTime();
                    const daysDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24)) + 1;

                    if (daysDiff === 1) {
                        return "Today";
                    } else {
                        return `Last ${daysDiff} Days`;
                    }
                }
                return "Custom Range";
            default: return "All Time";
        }
    };

    const handleFromDateSelect = (date) => {
        onFromDateChange(date);
        // Auto-set toDate to today if not set or if toDate is before new fromDate
        if (!toDate || (date && toDate < date)) {
            onToDateChange(new Date());
        }
    };

    const handleToDateSelect = (date) => {
        onToDateChange(date);
    };

    return (
        <div className="space-y-3">
            {/* Date Range Preset Pills */}
            {showQuickFilters && (
                <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Quick Filter:</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => handleDateRangeChange("all")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === "all"
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            All Time
                        </button>
                        <button
                            onClick={() => handleDateRangeChange("today")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === "today"
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => handleDateRangeChange("7days")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === "7days"
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            Last 7 Days
                        </button>
                        <button
                            onClick={() => handleDateRangeChange("30days")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === "30days"
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            Last 30 Days
                        </button>
                        <button
                            onClick={() => handleDateRangeChange("90days")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === "90days"
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            Last 90 Days
                        </button>
                        <button
                            onClick={() => handleDateRangeChange("custom")}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${dateRange === "custom"
                                ? "bg-gray-900 text-white shadow-sm"
                                : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            Custom Range
                        </button>
                    </div>
                </div>
            )}

            {/* Date Pickers and Badge Row */}
            <div className="flex items-center gap-3">
                {/* Left Element (e.g., Search) */}
                {leftElement}

                {/* From Date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {fromDate ? fromDate.toLocaleDateString() : "From date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                            mode="single"
                            selected={fromDate}
                            onSelect={handleFromDateSelect}
                            disabled={(date) => date > today}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={new Date().getFullYear()}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* To Date */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-[140px] justify-start text-left font-normal">
                            <Calendar className="mr-2 h-4 w-4" />
                            {toDate ? toDate.toLocaleDateString() : "To date"}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                            mode="single"
                            selected={toDate}
                            onSelect={handleToDateSelect}
                            disabled={(date) => {
                                if (date > today) return true;
                                if (fromDate && date < fromDate) return true;
                                return false;
                            }}
                            captionLayout="dropdown"
                            fromYear={2020}
                            toYear={new Date().getFullYear()}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>

                {/* Right Element (e.g., Module Filter) */}
                {rightElement}

                {/* Date Range Badge */}
                {showBadge && dateRange !== "all" && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-900 rounded-md text-sm font-semibold border border-gray-200 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{getDateRangeLabel()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
