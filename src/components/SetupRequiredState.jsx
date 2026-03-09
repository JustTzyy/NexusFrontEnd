import { Building2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown to teachers who have no active building/department assignment.
 * Drop this in place of the page content when `hasAssignment === false`.
 */
export default function SetupRequiredState() {
    return (
        <div className="flex items-center justify-center min-h-[60vh] px-4">
            <Card className="max-w-md w-full border shadow-sm">
                <CardContent className="flex flex-col items-center text-center py-14 px-8 gap-5">
                    <div className="rounded-full bg-gray-100 p-5">
                        <Building2 className="h-10 w-10 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-semibold text-gray-900">Setup Required</h2>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Your account hasn't been assigned to a building or department yet.
                            Please wait for an administrator to complete your setup before accessing this section.
                        </p>
                    </div>
                    <p className="text-xs text-gray-400">
                        If you believe this is a mistake, please contact your administrator.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
