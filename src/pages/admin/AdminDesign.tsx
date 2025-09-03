import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Upload, Eye, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface DesignSettings {
  logo: {
    url: string;
    alt: string;
  };
  fonts: {
    heading: string;
    body: string;
    arabic: string;
  };
  textSizes: {
    hero: number;
    heading1: number;
    heading2: number;
    heading3: number;
    body: number;
    small: number;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const defaultSettings: DesignSettings = {
  logo: {
    url: "/lovable-uploads/fda0393f-0b68-4ef6-bd9a-3d02ac39e07b.png",
    alt: "University Assist"
  },
  fonts: {
    heading: "Poppins",
    body: "Ubuntu", 
    arabic: "Noto Kufi Arabic"
  },
  textSizes: {
    hero: 60,
    heading1: 48,
    heading2: 36,
    heading3: 24,
    body: 16,
    small: 14
  },
  colors: {
    primary: "#2E57F6",
    secondary: "#5DC6C5", 
    accent: "#63D581"
  }
};

const googleFonts = [
  "Poppins", "Ubuntu", "Inter", "Roboto", "Open Sans", "Lato", 
  "Montserrat", "Source Sans Pro", "Raleway", "Nunito", "Playfair Display",
  "Merriweather", "Lora", "Oswald", "Fira Sans", "Noto Sans"
];

const arabicFonts = [
  "Noto Kufi Arabic", "Noto Sans Arabic", "Cairo", "Amiri", "Scheherazade New"
];

const AdminDesign = () => {
  const [settings, setSettings] = useState<DesignSettings>(defaultSettings);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedSettings = localStorage.getItem('admin-design-settings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Error loading design settings:', error);
      }
    }
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('admin-design-settings', JSON.stringify(settings));
    
    // Apply settings to the document
    applySettingsToDocument();
    
    toast.success("Design settings saved successfully!");
  };

  const applySettingsToDocument = () => {
    const root = document.documentElement;
    
    // Update CSS custom properties
    root.style.setProperty('--font-heading', settings.fonts.heading);
    root.style.setProperty('--font-body', settings.fonts.body);
    root.style.setProperty('--font-arabic', settings.fonts.arabic);
    
    // Update text sizes
    root.style.setProperty('--text-hero', `${settings.textSizes.hero}px`);
    root.style.setProperty('--text-h1', `${settings.textSizes.heading1}px`);
    root.style.setProperty('--text-h2', `${settings.textSizes.heading2}px`);
    root.style.setProperty('--text-h3', `${settings.textSizes.heading3}px`);
    root.style.setProperty('--text-body', `${settings.textSizes.body}px`);
    root.style.setProperty('--text-small', `${settings.textSizes.small}px`);
  };

  const handleResetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('admin-design-settings');
    toast.info("Design settings reset to default");
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setSettings(prev => ({
          ...prev,
          logo: {
            ...prev.logo,
            url: result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const updateTextSize = (key: keyof DesignSettings['textSizes'], value: number[]) => {
    setSettings(prev => ({
      ...prev,
      textSizes: {
        ...prev.textSizes,
        [key]: value[0]
      }
    }));
  };

  const updateFont = (type: keyof DesignSettings['fonts'], value: string) => {
    setSettings(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [type]: value
      }
    }));

    // Dynamically load Google Font
    if (!document.querySelector(`link[href*="${value}"]`)) {
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${value.replace(' ', '+')}:wght@300;400;500;600;700&display=swap`;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Design Management</h1>
          <p className="text-muted-foreground">Customize your website's appearance</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            {previewMode ? 'Exit Preview' : 'Preview'}
          </Button>
          <Button
            variant="outline"
            onClick={handleResetSettings}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSaveSettings} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="logo" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="fonts">Typography</TabsTrigger>
          <TabsTrigger value="sizes">Text Sizes</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
        </TabsList>

        {/* Logo Management */}
        <TabsContent value="logo">
          <Card>
            <CardHeader>
              <CardTitle>Logo Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="logo-upload">Upload New Logo</Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="mt-2"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="logo-alt">Logo Alt Text</Label>
                    <Input
                      id="logo-alt"
                      value={settings.logo.alt}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        logo: { ...prev.logo, alt: e.target.value }
                      }))}
                      placeholder="University Assist"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Current Logo Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/30 flex items-center justify-center min-h-[200px]">
                    <img
                      src={settings.logo.url}
                      alt={settings.logo.alt}
                      className="max-h-32 max-w-full object-contain"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Typography */}
        <TabsContent value="fonts">
          <Card>
            <CardHeader>
              <CardTitle>Typography Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Heading Font</Label>
                    <Select
                      value={settings.fonts.heading}
                      onValueChange={(value) => updateFont('heading', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {googleFonts.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Body Font</Label>
                    <Select
                      value={settings.fonts.body}
                      onValueChange={(value) => updateFont('body', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {googleFonts.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Arabic Font</Label>
                    <Select
                      value={settings.fonts.arabic}
                      onValueChange={(value) => updateFont('arabic', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {arabicFonts.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Font Preview</Label>
                  <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
                    <div style={{ fontFamily: settings.fonts.heading }}>
                      <h2 className="text-2xl font-bold">Heading Font Preview</h2>
                    </div>
                    <div style={{ fontFamily: settings.fonts.body }}>
                      <p>This is how your body text will look with the selected font.</p>
                    </div>
                    <div style={{ fontFamily: settings.fonts.arabic }} dir="rtl">
                      <p>نص تجريبي باللغة العربية</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Text Sizes */}
        <TabsContent value="sizes">
          <Card>
            <CardHeader>
              <CardTitle>Text Size Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  {Object.entries(settings.textSizes).map(([key, size]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</Label>
                        <Badge variant="outline">{size}px</Badge>
                      </div>
                      <Slider
                        value={[size]}
                        onValueChange={(value) => updateTextSize(key as keyof DesignSettings['textSizes'], value)}
                        max={key === 'hero' ? 80 : key === 'heading1' ? 60 : key === 'heading2' ? 48 : 32}
                        min={key === 'small' ? 10 : 12}
                        step={2}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <Label>Size Preview</Label>
                  <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
                    <h1 style={{ fontSize: `${settings.textSizes.hero}px` }} className="font-bold">
                      Hero Text
                    </h1>
                    <h1 style={{ fontSize: `${settings.textSizes.heading1}px` }} className="font-bold">
                      Heading 1
                    </h1>
                    <h2 style={{ fontSize: `${settings.textSizes.heading2}px` }} className="font-semibold">
                      Heading 2
                    </h2>
                    <h3 style={{ fontSize: `${settings.textSizes.heading3}px` }} className="font-medium">
                      Heading 3
                    </h3>
                    <p style={{ fontSize: `${settings.textSizes.body}px` }}>
                      Body text paragraph
                    </p>
                    <small style={{ fontSize: `${settings.textSizes.small}px` }}>
                      Small text
                    </small>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Colors */}
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Color Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {Object.entries(settings.colors).map(([key, color]) => (
                    <div key={key} className="space-y-2">
                      <Label className="capitalize">{key}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={color}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            colors: { ...prev.colors, [key]: e.target.value }
                          }))}
                          className="w-16 h-10 p-1 border rounded"
                        />
                        <Input
                          type="text"
                          value={color}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            colors: { ...prev.colors, [key]: e.target.value }
                          }))}
                          className="flex-1"
                          placeholder="#2E57F6"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <Label>Color Preview</Label>
                  <div className="border rounded-lg p-6 space-y-4 bg-muted/30">
                    <div 
                      className="p-4 rounded text-white font-semibold"
                      style={{ backgroundColor: settings.colors.primary }}
                    >
                      Primary Color
                    </div>
                    <div 
                      className="p-4 rounded text-white font-semibold"
                      style={{ backgroundColor: settings.colors.secondary }}
                    >
                      Secondary Color
                    </div>
                    <div 
                      className="p-4 rounded text-white font-semibold"
                      style={{ backgroundColor: settings.colors.accent }}
                    >
                      Accent Color
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDesign;