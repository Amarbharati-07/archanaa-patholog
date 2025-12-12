import { useQuery, useMutation } from "@tanstack/react-query";
import { MessageSquare, Check, X, Trash2, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { AdminLayout } from "@/components/admin-layout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Review } from "@shared/schema";

export default function AdminReviews() {
  const { toast } = useToast();

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ["/api/admin/reviews"],
  });

  const approveMutation = useMutation({
    mutationFn: async ({ id, isApproved }: { id: string; isApproved: boolean }) => {
      return apiRequest("PATCH", `/api/admin/reviews/${id}/approve`, { isApproved });
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.isApproved ? "Review Approved" : "Review Rejected",
        description: variables.isApproved 
          ? "The review is now visible on the homepage." 
          : "The review has been hidden from the homepage.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update review.", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/reviews/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Review Deleted", description: "The review has been removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete review.", variant: "destructive" });
    },
  });

  const pendingReviews = reviews?.filter((r) => !r.isApproved) || [];
  const approvedReviews = reviews?.filter((r) => r.isApproved) || [];

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase();
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Customer Reviews
          </h1>
          <p className="text-muted-foreground">Manage and moderate customer reviews</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {pendingReviews.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Badge variant="secondary">{pendingReviews.length}</Badge>
                  Pending Approval
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingReviews.map((review) => (
                    <Card key={review.id} className="border-amber-200 dark:border-amber-800" data-testid={`card-review-pending-${review.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                                {getInitials(review.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{review.name}</p>
                              <p className="text-sm text-muted-foreground">{review.location}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                            Pending
                          </Badge>
                        </div>
                        <div className="flex gap-0.5 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{review.review}</p>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.createdAt)}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-green-600"
                              onClick={() => approveMutation.mutate({ id: review.id, isApproved: true })}
                              disabled={approveMutation.isPending}
                              data-testid={`button-approve-${review.id}`}
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-red-600"
                              onClick={() => deleteMutation.mutate(review.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-reject-${review.id}`}
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Badge>{approvedReviews.length}</Badge>
                Approved Reviews
              </h2>
              {approvedReviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {approvedReviews.map((review) => (
                    <Card key={review.id} data-testid={`card-review-approved-${review.id}`}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {getInitials(review.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{review.name}</p>
                              <p className="text-sm text-muted-foreground">{review.location}</p>
                            </div>
                          </div>
                          <Badge variant="default">Approved</Badge>
                        </div>
                        <div className="flex gap-0.5 mb-3">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{review.review}</p>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(review.createdAt)}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveMutation.mutate({ id: review.id, isApproved: false })}
                              disabled={approveMutation.isPending}
                              data-testid={`button-hide-${review.id}`}
                            >
                              Hide
                            </Button>
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => deleteMutation.mutate(review.id)}
                              disabled={deleteMutation.isPending}
                              data-testid={`button-delete-${review.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Approved Reviews</h3>
                    <p className="text-muted-foreground text-center">
                      Approved reviews will appear on the homepage for visitors to see.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
