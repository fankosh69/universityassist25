import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface City {
  id: string;
  name: string;
  region?: string;
  country_code: string;
  lat?: number;
  lng?: number;
  slug: string;
  population_total?: number;
  city_type?: string;
  created_at: string;
  metadata?: any;
}

export const AdminCities = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    region: string;
    country_code: string;
    slug: string;
    lat: number | null;
    lng: number | null;
    population_total: number | null;
    city_type: string;
  }>({
    name: "",
    region: "",
    country_code: "DE",
    slug: "",
    lat: null,
    lng: null,
    population_total: null,
    city_type: "City",
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('admin-secure-operations', {
        method: 'GET',
        body: null,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (error) throw error;
      setCities(data.cities || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch cities securely",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/ä/g, 'ae')
      .replace(/ö/g, 'oe')
      .replace(/ü/g, 'ue')
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        lat: formData.lat || null,
        lng: formData.lng || null,
      };

      if (editingCity) {
        const { data, error } = await supabase.functions.invoke('admin-secure-operations', {
          method: 'POST',
          body: { operation: 'update_city', id: editingCity.id, ...submitData },
        });

        if (error) throw error;
        toast({
          title: "Success",
          description: "City updated successfully",
        });
      } else {
        const { data, error } = await supabase.functions.invoke('admin-secure-operations', {
          method: 'POST',
          body: { operation: 'create_city', ...submitData },
        });

        if (error) throw error;
        toast({
          title: "Success",
          description: "City created successfully",
        });
      }

      resetForm();
      fetchCities();
    } catch (error) {
      console.error('Error saving city:', error);
      toast({
        title: "Error",
        description: "Failed to save city",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this city? This may affect related universities.')) return;

    try {
      const { data, error } = await supabase.functions.invoke('admin-secure-operations', {
        method: 'POST',
        body: { operation: 'delete_city', id },
      });

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "City deleted successfully",
      });
      fetchCities();
    } catch (error) {
      console.error('Error deleting city:', error);
      toast({
        title: "Error",
        description: "Failed to delete city",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (city: City) => {
    setEditingCity(city);
    setFormData({
      name: city.name,
      region: city.region || "",
      country_code: city.country_code,
      slug: city.slug,
      lat: city.lat || null,
      lng: city.lng || null,
      population_total: city.population_total || null,
      city_type: city.city_type || "City",
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCity(null);
    setFormData({
      name: "",
      region: "",
      country_code: "DE",
      slug: "",
      lat: null,
      lng: null,
      population_total: null,
      city_type: "City",
    });
    setIsDialogOpen(false);
  };

  const filteredCities = cities.filter(city =>
    city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    city.region?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold">Cities Management</h1>
          <p className="text-muted-foreground">
            Manage cities and their information
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add City
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search cities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCities.map((city) => (
          <Card key={city.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {city.name}
              </CardTitle>
              {city.region && (
                <p className="text-sm text-muted-foreground">{city.region}</p>
              )}
              {city.city_type && (
                <Badge variant="outline" className="text-xs mt-1">
                  {city.city_type}
                </Badge>
              )}
              {city.population_total && (
                <p className="text-sm text-muted-foreground">
                  Population: {city.population_total.toLocaleString()}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{city.country_code}</Badge>
                  {city.slug && (
                    <Badge variant="secondary" className="text-xs">
                      /{city.slug}
                    </Badge>
                  )}
                </div>
                
                {(city.lat && city.lng) && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Coordinates:</strong> {city.lat.toFixed(4)}, {city.lng.toFixed(4)}
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(city)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(city.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCity ? 'Edit City' : 'Add New City'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">City Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({ 
                      ...formData, 
                      name,
                      slug: formData.slug || generateSlug(name)
                    });
                  }}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="Auto-generated from name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="region">State/Region</Label>
                <Select 
                  value={formData.region} 
                  onValueChange={(value) => setFormData({ ...formData, region: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baden-Württemberg">Baden-Württemberg</SelectItem>
                    <SelectItem value="Bayern">Bayern (Bavaria)</SelectItem>
                    <SelectItem value="Berlin">Berlin</SelectItem>
                    <SelectItem value="Brandenburg">Brandenburg</SelectItem>
                    <SelectItem value="Bremen">Bremen</SelectItem>
                    <SelectItem value="Hamburg">Hamburg</SelectItem>
                    <SelectItem value="Hessen">Hessen (Hesse)</SelectItem>
                    <SelectItem value="Mecklenburg-Vorpommern">Mecklenburg-Vorpommern</SelectItem>
                    <SelectItem value="Niedersachsen">Niedersachsen (Lower Saxony)</SelectItem>
                    <SelectItem value="Nordrhein-Westfalen">Nordrhein-Westfalen (North Rhine-Westphalia)</SelectItem>
                    <SelectItem value="Rheinland-Pfalz">Rheinland-Pfalz (Rhineland-Palatinate)</SelectItem>
                    <SelectItem value="Saarland">Saarland</SelectItem>
                    <SelectItem value="Sachsen">Sachsen (Saxony)</SelectItem>
                    <SelectItem value="Sachsen-Anhalt">Sachsen-Anhalt (Saxony-Anhalt)</SelectItem>
                    <SelectItem value="Schleswig-Holstein">Schleswig-Holstein</SelectItem>
                    <SelectItem value="Thüringen">Thüringen (Thuringia)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="city_type">City Type</Label>
                <Select 
                  value={formData.city_type} 
                  onValueChange={(value) => setFormData({ ...formData, city_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="City">City</SelectItem>
                    <SelectItem value="County">County</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="population_total">Population</Label>
                <Input
                  id="population_total"
                  type="number"
                  value={formData.population_total || ""}
                  onChange={(e) => setFormData({ ...formData, population_total: e.target.value ? parseInt(e.target.value) : null })}
                  placeholder="Enter population"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="country_code">Country Code</Label>
                <Input
                  id="country_code"
                  value={formData.country_code}
                  onChange={(e) => setFormData({ ...formData, country_code: e.target.value })}
                  placeholder="DE"
                  maxLength={2}
                />
              </div>
              
              <div>
                <Label htmlFor="lat">Latitude (Optional)</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  value={formData.lat || ""}
                  onChange={(e) => setFormData({ ...formData, lat: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="lng">Longitude (Optional)</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  value={formData.lng || ""}
                  onChange={(e) => setFormData({ ...formData, lng: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button type="submit">
                {editingCity ? 'Update' : 'Create'} City
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};