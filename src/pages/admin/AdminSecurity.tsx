import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Eye, Edit, Trash2, AlertTriangle, Search, Filter } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  user_id: string;
  old_data: any;
  new_data: any;
  created_at: string;
}

const AdminSecurity = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [operationFilter, setOperationFilter] = useState<string>("all");
  const { toast } = useToast();
  const { isAdmin, loading: adminLoading } = useAdmin();

  useEffect(() => {
    if (!adminLoading && isAdmin) {
      fetchAuditLogs();
    }
  }, [isAdmin, adminLoading]);

  const fetchAuditLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getOperationBadge = (operation: string) => {
    const variants = {
      INSERT: "default",
      UPDATE: "secondary", 
      DELETE: "destructive",
      SELECT: "outline"
    } as const;
    
    return (
      <Badge variant={variants[operation as keyof typeof variants] || "outline"}>
        {operation}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSensitiveFieldChanges = (oldData: any, newData: any) => {
    if (!oldData || !newData) return [];
    
    const sensitiveFields = ['email', 'phone', 'full_name', 'date_of_birth'];
    const changes = [];
    
    for (const field of sensitiveFields) {
      if (oldData[field] !== newData[field]) {
        changes.push(field);
      }
    }
    
    return changes;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesOperation = operationFilter === "all" || log.operation === operationFilter;
    
    return matchesSearch && matchesOperation;
  });

  if (adminLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Security & Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor access to sensitive student data and security events
          </p>
        </div>
        <Button onClick={fetchAuditLogs} className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          Refresh Logs
        </Button>
      </div>

      {/* Security Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Access Events</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{auditLogs.length}</div>
            <p className="text-xs text-muted-foreground">
              Last 100 events shown
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Updates</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {auditLogs.filter(log => log.operation === 'UPDATE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Student profile modifications
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Deletions</CardTitle>
            <Trash2 className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {auditLogs.filter(log => log.operation === 'DELETE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sensitive data deletions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Audit Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by table name or user ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="operation">Operation Type</Label>
              <Select value={operationFilter} onValueChange={setOperationFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All operations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Operations</SelectItem>
                  <SelectItem value="INSERT">Insert</SelectItem>
                  <SelectItem value="UPDATE">Update</SelectItem>
                  <SelectItem value="DELETE">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Audit Log Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No audit logs found</h3>
              <p className="text-muted-foreground">
                {searchTerm || operationFilter !== "all" 
                  ? "Try adjusting your filters"
                  : "Security events will appear here"
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Table</TableHead>
                    <TableHead>Operation</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Changes</TableHead>
                    <TableHead>Risk Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const sensitiveChanges = getSensitiveFieldChanges(log.old_data, log.new_data);
                    const isHighRisk = sensitiveChanges.length > 0;
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {formatDate(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.table_name}</Badge>
                        </TableCell>
                        <TableCell>
                          {getOperationBadge(log.operation)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.user_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          {sensitiveChanges.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {sensitiveChanges.map(field => (
                                <Badge key={field} variant="secondary" className="text-xs">
                                  {field}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              {log.operation === 'INSERT' ? 'New record' : 'Non-sensitive'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {isHighRisk ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <AlertTriangle className="h-3 w-3" />
                              High
                            </Badge>
                          ) : (
                            <Badge variant="outline">Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card className="shadow-soft border-l-4 border-l-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <p className="font-medium">Enable Leaked Password Protection</p>
              <p className="text-sm text-muted-foreground">
                Go to Authentication → Settings in your Supabase dashboard to enable this security feature.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <p className="font-medium">Review OTP Expiry Settings</p>
              <p className="text-sm text-muted-foreground">
                Consider reducing OTP expiry time for enhanced security.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
            <div>
              <p className="font-medium">Monitor High-Risk Changes</p>
              <p className="text-sm text-muted-foreground">
                Regularly review updates to sensitive fields like email, phone, and personal information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecurity;