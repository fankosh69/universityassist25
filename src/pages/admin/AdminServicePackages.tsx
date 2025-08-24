import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Search, Package, Euro } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface ServicePackage {
  id: string;
  name: string;
  description?: string;
  package_type: 'basic' | 'standard' | 'premium' | 'vip';
  price_eur: number;
  features: any;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export const AdminServicePackages = () => {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    package_type: 'basic' | 'standard' | 'premium' | 'vip';
    price_eur: number;
    features: any;
    is_active: boolean;
    sort_order: number;
  }>({
    name: "",
    description: "",
    package_type: "basic",
    price_eur: 0,
    features: [],
    is_active: true,
    sort_order: 0,
  });

  const [newFeature, setNewFeature] = useState("");

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error('Error fetching service packages:', error);
      toast({
        title: "Error",
        description: "Failed to fetch service packages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingPackage) {
        const { error } = await supabase
          .from('service_packages')
          .update(formData)
          .eq('id', editingPackage.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Service package updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('service_packages')
          .insert(formData);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Service package created successfully",
        });
      }

      resetForm();
      fetchPackages();
    } catch (error) {
      console.error('Error saving service package:', error);
      toast({
        title: "Error",
        description: "Failed to save service package",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service package?')) return;

    try {
      const { error } = await supabase
        .from('service_packages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Service package deleted successfully",
      });
      fetchPackages();
    } catch (error) {
      console.error('Error deleting service package:', error);
      toast({
        title: "Error",
        description: "Failed to delete service package",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      package_type: pkg.package_type,
      price_eur: pkg.price_eur,
      features: Array.isArray(pkg.features) ? pkg.features : [],
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: "",
      description: "",
      package_type: "basic",
      price_eur: 0,
      features: [],
      is_active: true,
      sort_order: 0,
    });
    setNewFeature("");
    setIsDialogOpen(false);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
      setFormData({
        ...formData,
        features: [...currentFeatures, newFeature.trim()]
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    const currentFeatures = Array.isArray(formData.features) ? formData.features : [];
    setFormData({
      ...formData,
      features: currentFeatures.filter((_, i) => i !== index)
    });
  };

  const filteredPackages = packages.filter(pkg =>
    pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPackageTypeColor = (type: string) => {
    switch (type) {
      case 'vip':
        return 'default';
      case 'premium':
        return 'secondary';
      case 'standard':
        return 'outline';
      case 'basic':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Service Packages</h1>
          <p className="text-muted-foreground">
            Manage service packages and pricing
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Package
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPackages.map((pkg) => (
          <Card key={pkg.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                {pkg.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={getPackageTypeColor(pkg.package_type)}>
                  {pkg.package_type.replace('_', ' ')}
                </Badge>
                <Badge variant={pkg.is_active ? "default" : "secondary"}>
                  {pkg.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xl font-bold">€{pkg.price_eur}</span>
                </div>

                {pkg.description && (
                  <p className="text-sm text-muted-foreground">
                    {pkg.description}
                  </p>
                )}

                {pkg.features && Array.isArray(pkg.features) && pkg.features.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Features:</h4>
                    <ul className="text-xs space-y-1">
                      {pkg.features.slice(0, 3).map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-1">
                          <span className="text-green-500">✓</span>
                          {feature}
                        </li>
                      ))}
                      {pkg.features.length > 3 && (
                        <li className="text-muted-foreground">
                          +{pkg.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(pkg)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(pkg.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Service Package' : 'Add New Service Package'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Package Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="price">Price (EUR)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  value={formData.price_eur}
                  onChange={(e) => setFormData({ ...formData, price_eur: parseInt(e.target.value) || 0 })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="package_type">Package Type</Label>
                <Select
                  value={formData.package_type}
                  onValueChange={(value: any) => setFormData({ ...formData, package_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sort_order">Sort Order</Label>
                <Input
                  id="sort_order"
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label>Features</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                  />
                  <Button type="button" onClick={addFeature}>Add</Button>
                </div>
                <div className="space-y-1">
                  {Array.isArray(formData.features) && formData.features.map((feature: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">{feature}</span>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => removeFeature(index)}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: !!checked })}
              />
              <Label htmlFor="is_active">Active Package</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingPackage ? 'Update' : 'Create'} Package
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};