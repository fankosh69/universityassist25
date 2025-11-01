import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { MessageSquare, TrendingUp, CheckCircle2, XCircle, Clock, Filter } from "lucide-react";

export default function AdminProgramInquiries() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch program inquiries with summary view
  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["program-inquiries", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("program_inquiries_summary")
        .select("*")
        .order("inquiry_date", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Mutation to update inquiry status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("program_inquiries")
        .update({
          status,
          admin_notes: notes || null,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-inquiries"] });
      toast.success("Inquiry status updated");
      setSelectedInquiry(null);
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update inquiry");
      console.error(error);
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: { variant: "secondary", icon: Clock, label: "Pending" },
      reviewed: { variant: "default", icon: CheckCircle2, label: "Reviewed" },
      added: { variant: "default", icon: CheckCircle2, label: "Added" },
      declined: { variant: "destructive", icon: XCircle, label: "Declined" },
      duplicate: { variant: "secondary", icon: MessageSquare, label: "Duplicate" },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Stats cards
  const stats = {
    total: inquiries?.length || 0,
    pending: inquiries?.filter(i => i.status === 'pending').length || 0,
    reviewed: inquiries?.filter(i => i.status === 'reviewed').length || 0,
    added: inquiries?.filter(i => i.status === 'added').length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Program Inquiries</h1>
            <p className="text-muted-foreground mt-1">
              Track and manage user requests for programs not yet in the database
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Inquiries</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reviewed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reviewed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Added to DB</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.added}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5" />
              <div className="flex-1 flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="added">Added</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                    <SelectItem value="duplicate">Duplicate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Inquiries Table */}
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8">Loading inquiries...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Program Requested</TableHead>
                    <TableHead>University</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Field</TableHead>
                    <TableHead>Similar</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inquiries?.map((inquiry) => (
                    <TableRow key={inquiry.id}>
                      <TableCell className="text-sm">
                        {format(new Date(inquiry.inquiry_date), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{inquiry.user_name || "Anonymous"}</div>
                          <div className="text-muted-foreground">{inquiry.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {inquiry.program_name || <span className="text-muted-foreground italic">Not specified</span>}
                      </TableCell>
                      <TableCell>{inquiry.university_name || "-"}</TableCell>
                      <TableCell>{inquiry.city || "-"}</TableCell>
                      <TableCell>{inquiry.field_of_study || "-"}</TableCell>
                      <TableCell>
                        {inquiry.similar_count > 1 && (
                          <Badge variant="secondary">{inquiry.similar_count}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(inquiry.status)}</TableCell>
                      <TableCell>
                        <Dialog open={isDialogOpen && selectedInquiry?.id === inquiry.id} onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (!open) setSelectedInquiry(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInquiry(inquiry);
                                setAdminNotes(inquiry.admin_notes || "");
                                setIsDialogOpen(true);
                              }}
                            >
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Review Program Inquiry</DialogTitle>
                              <DialogDescription>
                                Update status and add notes for this inquiry
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="font-semibold mb-2">User Query:</h4>
                                <p className="text-sm bg-muted p-3 rounded">{inquiry.user_query}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-sm font-medium">Program Name:</label>
                                  <p className="text-sm">{inquiry.program_name || "Not specified"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">University:</label>
                                  <p className="text-sm">{inquiry.university_name || "Not specified"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">City:</label>
                                  <p className="text-sm">{inquiry.city || "Not specified"}</p>
                                </div>
                                <div>
                                  <label className="text-sm font-medium">Field:</label>
                                  <p className="text-sm">{inquiry.field_of_study || "Not specified"}</p>
                                </div>
                              </div>
                              <div>
                                <label className="text-sm font-medium mb-2 block">Admin Notes:</label>
                                <Textarea
                                  value={adminNotes}
                                  onChange={(e) => setAdminNotes(e.target.value)}
                                  placeholder="Add notes about this inquiry..."
                                  rows={3}
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  onClick={() => updateStatusMutation.mutate({
                                    id: inquiry.id,
                                    status: "reviewed",
                                    notes: adminNotes
                                  })}
                                  variant="outline"
                                >
                                  Mark Reviewed
                                </Button>
                                <Button
                                  onClick={() => updateStatusMutation.mutate({
                                    id: inquiry.id,
                                    status: "added",
                                    notes: adminNotes
                                  })}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Mark as Added
                                </Button>
                                <Button
                                  onClick={() => updateStatusMutation.mutate({
                                    id: inquiry.id,
                                    status: "declined",
                                    notes: adminNotes
                                  })}
                                  variant="destructive"
                                >
                                  Decline
                                </Button>
                                <Button
                                  onClick={() => updateStatusMutation.mutate({
                                    id: inquiry.id,
                                    status: "duplicate",
                                    notes: adminNotes
                                  })}
                                  variant="secondary"
                                >
                                  Mark Duplicate
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
