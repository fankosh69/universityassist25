import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Search, RefreshCw, Building, Users, Handshake, ScrollText, Loader2 } from "lucide-react";

// ─── Contacts Tab ───
function ContactsTab() {
  const [email, setEmail] = useState("");
  const [searchEmail, setSearchEmail] = useState("");

  const { data: contacts, isLoading, refetch } = useQuery({
    queryKey: ["hubspot-contacts", searchEmail],
    queryFn: async () => {
      const params: Record<string, string> = { limit: "20" };
      if (searchEmail) params.email = searchEmail;
      const { data, error } = await supabase.functions.invoke("hubspot-read-contacts", {
        method: "GET",
        headers: params,
      });
      // Use POST body workaround since invoke doesn't support query params well
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-read-contacts?${new URLSearchParams(params)}`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    enabled: true,
  });

  const results = contacts?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search by email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setSearchEmail(email)}
        />
        <Button onClick={() => setSearchEmail(email)} size="sm">
          <Search className="h-4 w-4 mr-1" /> Search
        </Button>
        <Button onClick={() => { setEmail(""); setSearchEmail(""); refetch(); }} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Lifecycle Stage</TableHead>
              <TableHead>Lead Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((contact: any) => (
              <TableRow key={contact.id}>
                <TableCell>{contact.properties?.firstname} {contact.properties?.lastname}</TableCell>
                <TableCell>{contact.properties?.email}</TableCell>
                <TableCell>{contact.properties?.phone || "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{contact.properties?.lifecyclestage || "—"}</Badge>
                </TableCell>
                <TableCell>{contact.properties?.hs_lead_status || "—"}</TableCell>
              </TableRow>
            ))}
            {results.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No contacts found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── Deals Tab ───
function DealsTab() {
  const { data: deals, isLoading, refetch } = useQuery({
    queryKey: ["hubspot-deals"],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hubspot-manage-deals?limit=20`,
        {
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
  });

  const results = deals?.results || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Deal Name</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Close Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {results.map((deal: any) => (
              <TableRow key={deal.id}>
                <TableCell className="font-medium">{deal.properties?.dealname}</TableCell>
                <TableCell><Badge variant="secondary">{deal.properties?.dealstage}</Badge></TableCell>
                <TableCell>{deal.properties?.amount ? `€${deal.properties.amount}` : "—"}</TableCell>
                <TableCell>{deal.properties?.closedate ? new Date(deal.properties.closedate).toLocaleDateString() : "—"}</TableCell>
              </TableRow>
            ))}
            {results.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No deals found</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── Companies Tab ───
function CompaniesTab() {
  const queryClient = useQueryClient();

  const { data: universities, isLoading } = useQuery({
    queryKey: ["universities-hubspot"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name, website, control_type, hubspot_company_id")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (universityId: string | undefined) => {
      const { data, error } = await supabase.functions.invoke("hubspot-sync-universities", {
        body: universityId ? { universityId } : {},
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`Synced ${data.synced} universities to HubSpot`);
      queryClient.invalidateQueries({ queryKey: ["universities-hubspot"] });
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => syncMutation.mutate(undefined)}
          disabled={syncMutation.isPending}
          size="sm"
        >
          {syncMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Sync All to HubSpot
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>University</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>HubSpot Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {universities?.map((uni) => (
              <TableRow key={uni.id}>
                <TableCell className="font-medium">{uni.name}</TableCell>
                <TableCell>{uni.control_type || "—"}</TableCell>
                <TableCell className="max-w-[200px] truncate">{uni.website || "—"}</TableCell>
                <TableCell>
                  {uni.hubspot_company_id ? (
                    <Badge variant="default">Synced</Badge>
                  ) : (
                    <Badge variant="outline">Not synced</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => syncMutation.mutate(uni.id)}
                    disabled={syncMutation.isPending}
                  >
                    Sync
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

// ─── Sync Log Tab ───
function SyncLogTab() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["hubspot-sync-log"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hubspot_sync_log")
        .select("*")
        .order("synced_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sync Log</CardTitle>
          <CardDescription>Records of data synced from UA → HubSpot</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>HubSpot ID</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>{log.sync_type}</TableCell>
                    <TableCell>
                      <Badge variant={log.sync_status === "success" ? "default" : "destructive"}>
                        {log.sync_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.hubspot_contact_id || "—"}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate">{log.error_message || "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(log.synced_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                {(!logs || logs.length === 0) && (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-4">No sync logs</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Page ───
export default function AdminHubSpot() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HubSpot CRM</h1>
        <p className="text-muted-foreground">Manage contacts, deals, companies, and sync logs</p>
      </div>

      <Tabs defaultValue="contacts">
        <TabsList>
          <TabsTrigger value="contacts" className="gap-1"><Users className="h-4 w-4" /> Contacts</TabsTrigger>
          <TabsTrigger value="deals" className="gap-1"><Handshake className="h-4 w-4" /> Deals</TabsTrigger>
          <TabsTrigger value="companies" className="gap-1"><Building className="h-4 w-4" /> Companies</TabsTrigger>
          <TabsTrigger value="logs" className="gap-1"><ScrollText className="h-4 w-4" /> Sync Log</TabsTrigger>
        </TabsList>

        <TabsContent value="contacts"><ContactsTab /></TabsContent>
        <TabsContent value="deals"><DealsTab /></TabsContent>
        <TabsContent value="companies"><CompaniesTab /></TabsContent>
        <TabsContent value="logs"><SyncLogTab /></TabsContent>
      </Tabs>
    </div>
  );
}
