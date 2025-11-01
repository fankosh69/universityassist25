import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Pencil } from "lucide-react";

export default function AdminRegionsEnrich() {
  const [editingRegion, setEditingRegion] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});

  const { data: regions, refetch } = useQuery({
    queryKey: ["admin-regions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regions")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleEdit = (region: any) => {
    setEditingRegion(region);
    setFormData({
      hero_image_url: region.hero_image_url || "",
      hashtags: region.hashtags?.join(", ") || "",
      welcome_text: region.welcome_text || "",
      description: region.description || "",
      highlights: region.highlights || "",
      total_universities: region.total_universities || "",
      total_students: region.total_students || "",
      gallery_images: JSON.stringify(region.gallery_images || [], null, 2),
      fun_facts: JSON.stringify(region.fun_facts || [], null, 2),
    });
  };

  const handleSubmit = async () => {
    try {
      const updateData: any = {
        hero_image_url: formData.hero_image_url || null,
        hashtags: formData.hashtags ? formData.hashtags.split(",").map((t: string) => t.trim()) : [],
        welcome_text: formData.welcome_text || null,
        description: formData.description || null,
        highlights: formData.highlights || null,
        total_universities: formData.total_universities ? parseInt(formData.total_universities) : null,
        total_students: formData.total_students ? parseInt(formData.total_students) : null,
      };

      if (formData.gallery_images) {
        try {
          updateData.gallery_images = JSON.parse(formData.gallery_images);
        } catch (e) {
          toast.error("Invalid JSON for gallery images");
          return;
        }
      }

      if (formData.fun_facts) {
        try {
          updateData.fun_facts = JSON.parse(formData.fun_facts);
        } catch (e) {
          toast.error("Invalid JSON for fun facts");
          return;
        }
      }

      const { error } = await supabase
        .from("regions")
        .update(updateData)
        .eq("id", editingRegion.id);

      if (error) throw error;

      toast.success("Region updated successfully");
      setEditingRegion(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Enrich Region Content</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {regions?.map((region) => (
            <Card key={region.id} className="p-4">
              <h3 className="font-semibold mb-2">{region.name}</h3>
              <Button onClick={() => handleEdit(region)} size="sm" variant="outline">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Content
              </Button>
            </Card>
          ))}
        </div>

        <Dialog open={!!editingRegion} onOpenChange={() => setEditingRegion(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Region: {editingRegion?.name}</DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="basic">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div>
                  <Label>Total Universities</Label>
                  <Input
                    type="number"
                    value={formData.total_universities || ""}
                    onChange={(e) => setFormData({ ...formData, total_universities: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Total Students</Label>
                  <Input
                    type="number"
                    value={formData.total_students || ""}
                    onChange={(e) => setFormData({ ...formData, total_students: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hashtags (comma-separated)</Label>
                  <Input
                    value={formData.hashtags || ""}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    placeholder="education, technology, culture"
                  />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Welcome Text</Label>
                  <Textarea
                    rows={6}
                    value={formData.welcome_text || ""}
                    onChange={(e) => setFormData({ ...formData, welcome_text: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={4}
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Highlights</Label>
                  <Textarea
                    rows={4}
                    value={formData.highlights || ""}
                    onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <div>
                  <Label>Hero Image URL</Label>
                  <Input
                    value={formData.hero_image_url || ""}
                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gallery Images (JSON)</Label>
                  <Textarea
                    rows={6}
                    value={formData.gallery_images || ""}
                    onChange={(e) => setFormData({ ...formData, gallery_images: e.target.value })}
                    placeholder='[{"url": "...", "caption": "..."}]'
                  />
                </div>
                <div>
                  <Label>Fun Facts (JSON)</Label>
                  <Textarea
                    rows={6}
                    value={formData.fun_facts || ""}
                    onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })}
                    placeholder='[{"title": "...", "description": "..."}]'
                  />
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingRegion(null)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
