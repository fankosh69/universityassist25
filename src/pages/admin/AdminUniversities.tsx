import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, Search, Globe, MapPin, ExternalLink } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InstitutionTypeBadge } from "@/components/InstitutionTypeBadge";
import { ControlTypeBadge } from "@/components/ControlTypeBadge";
import { INSTITUTION_TYPES, CONTROL_TYPES } from "@/lib/institution-types";

interface University {
  id: string;
  name: string;
  city: string;
  website?: string;
  logo_url?: string;
  type?: string;
  control_type?: string;
  ranking?: number;
  lat?: number;
  lng?: number;
  created_at: string;
  programs?: Array<{
    id: string;
    name: string;
    degree_type: string;
    degree_level: string;
    published: boolean;
  }>;
}

export const AdminUniversities = () => {
  const [universities, setUniversities] = useState<University[]>([]);
  const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [editingUniversity, setEditingUniversity] = useState<University | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const [formData, setFormData] = useState<{
    name: string;
    city: string;
    city_id: string;
    website: string;
    logo_url: string;
    type: string;
    control_type: string;
    ranking: number | null;
    lat: number | null;
    lng: number | null;
  }>({
    name: "",
    city: "",
    city_id: "",
    website: "",
    logo_url: "",
    type: "",
    control_type: "public",
    ranking: null,
    lat: null,
    lng: null,
  });

  useEffect(() => {
    fetchUniversities();
    fetchCities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select(`
          *,
          programs (
            id,
            name,
            degree_type,
            degree_level,
            published
          )
        `)
        .order('name');

      if (error) throw error;
      setUniversities(data || []);
    } catch (error) {
      console.error('Error fetching universities:', error);
      toast({
        title: "Error",
        description: "Failed to fetch universities",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const { data, error } = await supabase
        .from('cities')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCities(data || []);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const submitData = {
        name: formData.name,
        city: formData.city,
        city_id: formData.city_id || null,
        website: formData.website,
        logo_url: formData.logo_url,
        type: formData.type,
        control_type: formData.control_type,
        ranking: formData.ranking || null,
        lat: formData.lat || null,
        lng: formData.lng || null,
      };

      console.log('Saving university with data:', submitData);

      if (editingUniversity) {
        const { data, error } = await supabase
          .from('universities')
          .update(submitData)
          .eq('id', editingUniversity.id)
          .select();

        if (error) throw error;
        console.log('Updated university:', data);
        
        toast({
          title: "Success",
          description: `University updated successfully. Type: ${data?.[0]?.type}`,
        });
      } else {
        const { data, error } = await supabase
          .from('universities')
          .insert(submitData)
          .select();

        if (error) throw error;
        console.log('Created university:', data);
        
        toast({
          title: "Success",
          description: `University created successfully. Type: ${data?.[0]?.type}`,
        });
      }

      resetForm();
      await fetchUniversities();
    } catch (error) {
      console.error('Error saving university:', error);
      toast({
        title: "Error",
        description: "Failed to save university",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this university? This will also delete all associated programs.')) return;

    try {
      const { error } = await supabase
        .from('universities')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "University deleted successfully",
      });
      fetchUniversities();
    } catch (error) {
      console.error('Error deleting university:', error);
      toast({
        title: "Error",
        description: "Failed to delete university",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (university: University) => {
    setEditingUniversity(university);
    
    // Find the city_id from the cities list
    const selectedCity = cities.find(c => c.name === university.city);
    
    setFormData({
      name: university.name,
      city: university.city,
      city_id: selectedCity?.id || "",
      website: university.website || "",
      logo_url: university.logo_url || "",
      type: university.type || "",
      control_type: university.control_type || "public",
      ranking: university.ranking || null,
      lat: university.lat || null,
      lng: university.lng || null,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingUniversity(null);
    setFormData({
      name: "",
      city: "",
      city_id: "",
      website: "",
      logo_url: "",
      type: "",
      control_type: "public",
      ranking: null,
      lat: null,
      lng: null,
    });
    setIsDialogOpen(false);
  };

  const filteredUniversities = universities.filter(uni =>
    uni.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    uni.city.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold">Universities Management</h1>
          <p className="text-muted-foreground">
            Manage universities and view their programs
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add University
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search universities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUniversities.map((university) => (
          <Card key={university.id} className="hover:shadow-medium transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{university.name}</CardTitle>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3 w-3" />
                    {university.city}
                  </div>
                </div>
                {university.logo_url && (
                  <img 
                    src={university.logo_url} 
                    alt={`${university.name} logo`}
                    className="w-12 h-12 object-contain rounded"
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {university.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={university.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm hover:underline flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                
                {university.type && (
                  <div className="flex gap-2 flex-wrap">
                    <InstitutionTypeBadge type={university.type} />
                    {university.control_type && (
                      <ControlTypeBadge type={university.control_type} />
                    )}
                    {/* Debug info */}
                    <span className="text-xs text-muted-foreground">
                      (DB: {university.type})
                    </span>
                  </div>
                )}
                
                {university.ranking && (
                  <div className="text-sm">
                    <strong>Ranking:</strong> #{university.ranking}
                  </div>
                )}

                <div className="text-sm">
                  <strong>Programs:</strong> {university.programs?.length || 0}
                  {university.programs && university.programs.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {university.programs.slice(0, 3).map((program) => (
                        <Badge 
                          key={program.id} 
                          variant={program.published ? "default" : "outline"}
                          className="text-xs"
                        >
                          {program.name}
                        </Badge>
                      ))}
                      {university.programs.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{university.programs.length - 3} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(university)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(university.id)}>
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
              {editingUniversity ? 'Edit University' : 'Add New University'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">University Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="city">City</Label>
                <Select 
                  value={formData.city_id} 
                  onValueChange={(cityId) => {
                    const selectedCity = cities.find(c => c.id === cityId);
                    setFormData({ 
                      ...formData, 
                      city_id: cityId,
                      city: selectedCity?.name || ""
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="website">Website URL</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="logo_url">Logo URL</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="type">Institution Type</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => {
                    console.log('Institution type changed to:', value);
                    setFormData({ ...formData, type: value });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select institution type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INSTITUTION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.labelEn} ({type.labelDe})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="control_type">Control Type</Label>
                <Select 
                  value={formData.control_type} 
                  onValueChange={(value) => setFormData({ ...formData, control_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select control type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTROL_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.labelEn} ({type.labelDe})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="ranking">Ranking (Optional)</Label>
                <Input
                  id="ranking"
                  type="number"
                  value={formData.ranking || ""}
                  onChange={(e) => setFormData({ ...formData, ranking: e.target.value ? parseInt(e.target.value) : null })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                {editingUniversity ? 'Update' : 'Create'} University
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};