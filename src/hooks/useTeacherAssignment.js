import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { teacherAssignmentService } from "@/services/teacherAssignmentService";

/**
 * Returns whether the currently logged-in teacher has at least one active
 * building/department assignment.
 *
 * For non-teacher roles (admin, super admin, etc.) `hasAssignment` is always
 * `true` so those roles never see the setup-required state.
 */
export function useTeacherAssignment() {
    const { user } = useAuth();
    const isTeacher = user?.roles?.includes("Teacher");

    // null  = still loading
    // true  = has assignment (or not a teacher)
    // false = no assignment
    const [hasAssignment, setHasAssignment] = useState(isTeacher ? null : true);
    const [loading, setLoading] = useState(!!isTeacher);

    useEffect(() => {
        if (!isTeacher) return;

        let cancelled = false;
        teacherAssignmentService.getMine()
            .then(res => {
                if (!cancelled)
                    setHasAssignment(!!res.data?.hasAssignment);
            })
            .catch(() => {
                // Fail open — don't block the teacher if the check fails
                if (!cancelled) setHasAssignment(true);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => { cancelled = true; };
    }, [isTeacher]);

    return { hasAssignment, loading };
}
