import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Search, MapPin, Image as ImageIcon } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
  description?: string;
  hero_image_url?: string;
  hashtags?: string[];
  welcome_text?: string;
  living_text?: string;
  student_count?: number;
  tips?: string;
  gallery_images?: any[];
  fun_facts?: any[];
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
    description: string;
    website: string;
    hero_image_url: string;
    hashtags: string;
    welcome_text: string;
    living_text: string;
    student_count: number | null;
    tips: string;
    gallery_images: string;
    fun_facts: string;
  }>({
    name: "",
    region: "",
    country_code: "DE",
    slug: "",
    lat: null,
    lng: null,
    population_total: null,
    city_type: "City",
    description: "",
    website: "",
    hero_image_url: "",
    hashtags: "",
    welcome_text: "",
    living_text: "",
    student_count: null,
    tips: "",
    gallery_images: "",
    fun_facts: "",
  });

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
      url.searchParams.set('operation', 'get_cities');
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cities');
      }

      const result = await response.json();
      setCities(result.cities || []);
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
      // Parse hashtags and arrays
      const hashtags = formData.hashtags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Parse gallery images JSON
      let galleryImages = [];
      if (formData.gallery_images.trim()) {
        try {
          galleryImages = JSON.parse(formData.gallery_images);
        } catch (e) {
          toast({
            title: "Error",
            description: "Invalid gallery images JSON format",
            variant: "destructive",
          });
          return;
        }
      }

      // Parse fun facts JSON
      let funFacts = [];
      if (formData.fun_facts.trim()) {
        try {
          funFacts = JSON.parse(formData.fun_facts);
        } catch (e) {
          toast({
            title: "Error",
            description: "Invalid fun facts JSON format",
            variant: "destructive",
          });
          return;
        }
      }

      const submitData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.name),
        lat: formData.lat || null,
        lng: formData.lng || null,
        website: formData.website || null,
        hero_image_url: formData.hero_image_url || null,
        hashtags: hashtags.length > 0 ? hashtags : null,
        welcome_text: formData.welcome_text || null,
        living_text: formData.living_text || null,
        student_count: formData.student_count || null,
        tips: formData.tips || null,
        gallery_images: galleryImages.length > 0 ? galleryImages : null,
        fun_facts: funFacts.length > 0 ? funFacts : null,
      };

      if (editingCity) {
        const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
        url.searchParams.set('operation', 'update_city');
        
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: editingCity.id, ...submitData }),
        });

        if (!response.ok) {
          throw new Error('Failed to update city');
        }
        toast({
          title: "Success",
          description: "City updated successfully",
        });
      } else {
        const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
        url.searchParams.set('operation', 'create_city');
        
        const response = await fetch(url.toString(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          throw new Error('Failed to create city');
        }
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
      const url = new URL(`https://zfiexgjcuojodmnsinsz.supabase.co/functions/v1/admin-secure-operations`);
      url.searchParams.set('operation', 'delete_city');
      
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete city');
      }
      
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
      description: city.description || "",
      website: (city.metadata as any)?.website || "",
      hero_image_url: city.hero_image_url || "",
      hashtags: city.hashtags ? city.hashtags.join(', ') : "",
      welcome_text: city.welcome_text || "",
      living_text: city.living_text || "",
      student_count: city.student_count || null,
      tips: city.tips || "",
      gallery_images: city.gallery_images ? JSON.stringify(city.gallery_images, null, 2) : "",
      fun_facts: city.fun_facts ? JSON.stringify(city.fun_facts, null, 2) : "",
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
      description: "",
      website: "",
      hero_image_url: "",
      hashtags: "",
      welcome_text: "",
      living_text: "",
      student_count: null,
      tips: "",
      gallery_images: "",
      fun_facts: "",
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
                {city.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {city.description.length > 80 ? `${city.description.substring(0, 80)}...` : city.description}
                  </p>
                )}
                {(city.metadata as any)?.website && (
                  <p className="text-sm text-primary mt-2">
                    Website: {(city.metadata as any)?.website}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCity ? 'Edit City' : 'Add New City'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4 mt-4">
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

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                className="w-full min-h-[80px] p-3 border border-input bg-background rounded-md text-sm resize-vertical"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the city for visitors..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="website">City Website URL</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://example.de"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This website will appear as a clickable link on the city page
              </p>
            </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="hashtags">Hashtags (comma-separated)</Label>
                  <Input
                    id="hashtags"
                    value={formData.hashtags}
                    onChange={(e) => setFormData({ ...formData, hashtags: e.target.value })}
                    placeholder="#students, #vibrant, #historic"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter hashtags separated by commas
                  </p>
                </div>

                <div>
                  <Label htmlFor="student_count">Student Count</Label>
                  <Input
                    id="student_count"
                    type="number"
                    value={formData.student_count || ""}
                    onChange={(e) => setFormData({ ...formData, student_count: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="e.g., 50000"
                  />
                </div>

                <div>
                  <Label htmlFor="welcome_text">Welcome Text</Label>
                  <Textarea
                    id="welcome_text"
                    value={formData.welcome_text}
                    onChange={(e) => setFormData({ ...formData, welcome_text: e.target.value })}
                    placeholder="Welcome to [City Name]! This vibrant city..."
                    rows={4}
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Introductory text for the city (use \n\n for paragraph breaks)
                  </p>
                </div>

                <div>
                  <Label htmlFor="living_text">Living in City Text</Label>
                  <Textarea
                    id="living_text"
                    value={formData.living_text}
                    onChange={(e) => setFormData({ ...formData, living_text: e.target.value })}
                    placeholder="Living in [City Name] offers..."
                    rows={4}
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Description of living conditions and lifestyle (use \n\n for paragraph breaks)
                  </p>
                </div>

                <div>
                  <Label htmlFor="tips">Tips</Label>
                  <Textarea
                    id="tips"
                    value={formData.tips}
                    onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                    placeholder="Pro tip: The best time to visit..."
                    rows={3}
                    className="resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Helpful tips for students (use \n\n for paragraph breaks)
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="media" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="hero_image_url">Hero Image URL</Label>
                  <Input
                    id="hero_image_url"
                    type="url"
                    value={formData.hero_image_url}
                    onChange={(e) => setFormData({ ...formData, hero_image_url: e.target.value })}
                    placeholder="https://images.unsplash.com/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Large banner image for city page header
                  </p>
                </div>

                <div>
                  <Label htmlFor="gallery_images">Gallery Images (JSON)</Label>
                  <Textarea
                    id="gallery_images"
                    value={formData.gallery_images}
                    onChange={(e) => setFormData({ ...formData, gallery_images: e.target.value })}
                    placeholder='[{"url": "https://...", "caption": "City center", "credit": "Photo by..."}]'
                    rows={6}
                    className="font-mono text-xs resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JSON array of gallery images with url, caption, and credit
                  </p>
                </div>

                <div>
                  <Label htmlFor="fun_facts">Fun Facts (JSON)</Label>
                  <Textarea
                    id="fun_facts"
                    value={formData.fun_facts}
                    onChange={(e) => setFormData({ ...formData, fun_facts: e.target.value })}
                    placeholder='[{"title": "Founded", "value": "805 AD"}, {"title": "Universities", "value": "3"}]'
                    rows={6}
                    className="font-mono text-xs resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    JSON array of fun facts with title and value
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
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