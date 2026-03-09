import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { feedbackService } from "../../services/feedbackService";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { DetailViewSkeleton } from "../../utils/skeletonLoaders";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, User, BookOpen, Star, MessageSquare, AlertCircle, Trash2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function FeedbackView() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { user } = useAuth();

    const [feedback, setFeedback] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [deleteModal, setDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const isAdmin = user?.role === "Super Admin" || user?.role === "Admin";
    const isOwner = feedback?.customerId === user?.id;

    const goBack = () => navigate("/feedback");

    const loadFeedback = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await feedbackService.getById(id);
            setFeedback(response.data);
        } catch (err) {
            setError(err?.message || "Failed to load feedback");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeedback();
    }, [id]);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await feedbackService.delete(id);
            navigate("/feedback", {
                state: { alert: { type: "success", message: "Feedback deleted successfully" } }
            });
        } catch (err) {
            setError(err?.message || "Failed to delete feedback");
        } finally {
            setDeleting(false);
            setDeleteModal(false);
        }
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
                    className={`h-5 w-5 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                />
            ))}
            <span className="ml-2 text-sm font-medium text-gray-700">{rating}/5</span>
        </div>
    );

    const getRatingBadgeColor = (rating) => {
        if (rating >= 4) return "bg-emerald-600";
        if (rating >= 3) return "bg-amber-600";
        return "bg-red-600";
    };

    return (
        <AppLayout title="View Feedback">
            <div className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <DetailViewSkeleton fields={6} />
                ) : feedback ? (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" size="icon" onClick={goBack}>
                                            <ArrowLeft className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Back to feedback list</TooltipContent>
                                </Tooltip>
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Feedback Details</h1>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Review submitted on {formatDate(feedback.createdAt)}
                                    </p>
                                </div>
                            </div>
                            {(isAdmin || isOwner) && (
                                <div className="flex items-center gap-2">
                                    {isOwner && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => navigate(`/feedback/${id}/edit`)}
                                                >
                                                    Edit
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Edit your feedback</TooltipContent>
                                        </Tooltip>
                                    )}
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => setDeleteModal(true)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Delete feedback</TooltipContent>
                                    </Tooltip>
                                </div>
                            )}
                        </div>

                        {/* Content Card */}
                        <div className="border rounded-lg bg-white overflow-hidden">
                            {/* Gradient Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-2xl font-bold text-gray-900">{feedback.subjectName ?? "Feedback"}</h2>
                                            <Badge variant="default" className={getRatingBadgeColor(feedback.rating)}>
                                                {feedback.rating} Star{feedback.rating !== 1 ? "s" : ""}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 max-w-2xl">
                                            Feedback for session on {formatDate(feedback.sessionDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
                                    {/* Rating */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Star className="h-4 w-4" />
                                            <span>Rating</span>
                                        </div>
                                        {renderStars(feedback.rating)}
                                    </div>

                                    {/* Customer */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>Customer</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{feedback.customerName}</p>
                                    </div>

                                    {/* Teacher */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>Teacher</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{feedback.teacherName}</p>
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <BookOpen className="h-4 w-4" />
                                            <span>Subject</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{feedback.subjectName ?? "—"}</p>
                                    </div>

                                    {/* Session Date */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Session Date</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{formatDate(feedback.sessionDate)}</p>
                                    </div>

                                    {/* Submitted At */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <Calendar className="h-4 w-4" />
                                            <span>Submitted At</span>
                                        </div>
                                        <p className="text-sm text-gray-900 font-medium">{formatDateTime(feedback.createdAt)}</p>
                                    </div>

                                    <Separator className="md:col-span-3" />

                                    {/* Comment */}
                                    <div className="space-y-1.5 md:col-span-3">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>Comment</span>
                                        </div>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
                                            {feedback.comment || "No comment provided."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : !error && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
                        <p>Feedback not found</p>
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Feedback</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this feedback? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteModal(false)} disabled={deleting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
