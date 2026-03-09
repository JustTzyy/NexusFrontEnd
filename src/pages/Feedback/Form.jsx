import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import AppLayout from "../../layouts/AppLayout";
import { feedbackService } from "../../services/feedbackService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Star, AlertCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function FeedbackForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const isEdit = Boolean(id);

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // For create mode, we need tutoringRequestId and sessionLogId from query params
    const tutoringRequestId = searchParams.get("tutoringRequestId");
    const sessionLogId = searchParams.get("sessionLogId");

    const goBack = () => {
        if (isEdit) {
            navigate(`/feedback/${id}`);
        } else {
            navigate(-1);
        }
    };

    // Load existing feedback for edit mode
    useEffect(() => {
        if (isEdit) {
            setLoading(true);
            feedbackService.getById(id)
                .then((response) => {
                    const data = response.data;
                    setRating(data.rating || 0);
                    setComment(data.comment || "");
                })
                .catch((err) => {
                    setError(err?.message || "Failed to load feedback");
                })
                .finally(() => setLoading(false));
        }
    }, [id, isEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (rating === 0) {
            setError("Please select a rating");
            return;
        }

        setSubmitting(true);
        try {
            if (isEdit) {
                await feedbackService.update(id, {
                    rating,
                    comment: comment.trim() || null,
                });
                navigate(`/feedback/${id}`, {
                    state: { alert: { type: "success", message: "Feedback updated successfully" } }
                });
            } else {
                if (!tutoringRequestId || !sessionLogId) {
                    setError("Missing session information. Please try again from your session logs.");
                    setSubmitting(false);
                    return;
                }
                await feedbackService.create({
                    tutoringRequestId: parseInt(tutoringRequestId),
                    sessionLogId: parseInt(sessionLogId),
                    rating,
                    comment: comment.trim() || null,
                });
                navigate("/feedback", {
                    state: { alert: { type: "success", message: "Feedback submitted successfully!" } }
                });
            }
        } catch (err) {
            setError(err?.message || "Failed to submit feedback");
        } finally {
            setSubmitting(false);
        }
    };

    const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

    return (
        <AppLayout title={isEdit ? "Edit Feedback" : "Submit Feedback"}>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="outline" size="icon" onClick={goBack}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Go back</TooltipContent>
                    </Tooltip>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isEdit ? "Edit Feedback" : "Submit Feedback"}
                        </h1>
                        <p className="mt-1 text-sm text-gray-600">
                            {isEdit
                                ? "Update your review and rating"
                                : "Share your experience from the tutoring session"}
                        </p>
                    </div>
                </div>

                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="max-w-2xl">
                        <div className="border rounded-lg bg-white overflow-hidden">
                            <div className="p-6 space-y-6">
                                {/* Rating */}
                                <div className="space-y-3">
                                    <Label className="text-base font-semibold">How would you rate your experience?</Label>
                                    <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoverRating(star)}
                                                onMouseLeave={() => setHoverRating(0)}
                                            >
                                                <Star
                                                    className={`h-8 w-8 transition-colors ${
                                                        star <= (hoverRating || rating)
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "text-gray-300"
                                                    }`}
                                                />
                                            </button>
                                        ))}
                                        {(hoverRating || rating) > 0 && (
                                            <span className="ml-3 text-sm font-medium text-gray-600">
                                                {ratingLabels[hoverRating || rating]}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Comment */}
                                <div className="space-y-2">
                                    <Label htmlFor="comment" className="text-base font-semibold">
                                        Your Review <span className="text-gray-400 font-normal">(optional)</span>
                                    </Label>
                                    <Textarea
                                        id="comment"
                                        placeholder="Tell us about your tutoring experience..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={5}
                                        maxLength={2000}
                                        className="resize-none"
                                    />
                                    <p className="text-xs text-gray-400 text-right">{comment.length}/2000</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 border-t px-6 py-4 bg-gray-50">
                                <Button type="button" variant="outline" onClick={goBack} disabled={submitting}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting || rating === 0}>
                                    {submitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {isEdit ? "Updating..." : "Submitting..."}
                                        </>
                                    ) : (
                                        isEdit ? "Update Feedback" : "Submit Feedback"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </AppLayout>
    );
}
