import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { userService } from "@/services/userService";

export function useStudentSetup() {
    const { user } = useAuth();
    const isLeadOrCustomer = user?.roles?.some(r => r === "Lead" || r === "Customer");
    const [isSetupComplete, setIsSetupComplete] = useState(isLeadOrCustomer ? null : true);
    const [loading, setLoading] = useState(!!isLeadOrCustomer);

    useEffect(() => {
        if (!isLeadOrCustomer || !user?.id) return;
        let cancelled = false;
        userService.getMe()
            .then(res => {
                if (!cancelled) {
                    const d = res.data;
                    const complete = !!(d.firstName?.trim() && d.lastName?.trim() && d.address?.cityMunicipality);
                    setIsSetupComplete(complete);
                }
            })
            .catch(() => { if (!cancelled) setIsSetupComplete(true); }) // fail open
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [isLeadOrCustomer, user?.id]);

    return { isSetupComplete, loading };
}
