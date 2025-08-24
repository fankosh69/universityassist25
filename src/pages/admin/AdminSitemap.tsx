import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, GitBranch } from 'lucide-react';

export default function AdminSitemap() {
  const { t } = useTranslation();

  const sitemapFiles = [
    { name: 'sitemap-index.xml', description: 'Main sitemap index', url: '/sitemap-index.xml' },
    { name: 'sitemap-cities.xml', description: 'All city pages', url: '/sitemap-cities.xml' },
    { name: 'sitemap-universities.xml', description: 'All university pages', url: '/sitemap-universities.xml' },
    { name: 'sitemap-programs.xml', description: 'All program pages', url: '/sitemap-programs.xml' },
    { name: 'sitemap-ambassadors.xml', description: 'All ambassador pages', url: '/sitemap-ambassadors.xml' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Site Architecture</h1>
        <p className="text-muted-foreground">
          Visual sitemaps, user flows, and SEO XML sitemaps for University Assist
        </p>
      </div>

      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="visual">Visual Sitemaps</TabsTrigger>
          <TabsTrigger value="flows">User Flows</TabsTrigger>
          <TabsTrigger value="seo">SEO Sitemaps</TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Site Structure
              </CardTitle>
              <CardDescription>
                Interactive site map showing all pages and navigation paths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-6">
                <div className="mb-4 text-center">
                  <h4 className="font-medium mb-2">Interactive Site Structure</h4>
                  <p className="text-sm text-muted-foreground">Complete navigation hierarchy</p>
                </div>
                <div className="flex justify-center">
                  <img 
                    src="/docs/sitemap.svg" 
                    alt="Site Structure Diagram"
                    className="max-w-full h-auto border rounded"
                  />
                </div>
                <div className="mt-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = '/docs/sitemap.svg';
                      link.download = 'sitemap.svg';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Download SVG
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Onboarding Flow</CardTitle>
                <CardDescription>
                  User registration and profile completion process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4">
                  <img 
                    src="/docs/flows-onboarding.svg" 
                    alt="Onboarding Flow"
                    className="w-full h-auto border rounded"
                  />
                  <div className="mt-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/docs/flows-onboarding.svg';
                        link.download = 'flows-onboarding.svg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Download SVG
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ambassador Flow</CardTitle>
                <CardDescription>
                  Student ambassador recruitment and publishing process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-4">
                  <img 
                    src="/docs/flows-ambassador.svg" 
                    alt="Ambassador Flow"
                    className="w-full h-auto border rounded"
                  />
                  <div className="mt-3 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/docs/flows-ambassador.svg';
                        link.download = 'flows-ambassador.svg';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Download SVG
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                XML Sitemaps
              </CardTitle>
              <CardDescription>
                SEO-optimized XML sitemaps with hreflang support for search engines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {sitemapFiles.map((file) => (
                  <div key={file.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{file.name}</h4>
                      <p className="text-sm text-muted-foreground">{file.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">XML</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = file.url;
                          link.download = file.name;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
                
                {/* Exportable Files */}
                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <h4 className="font-medium mb-4 text-primary">📁 Exportable Files</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-background rounded border">
                      <div>
                        <span className="font-medium">Site Structure (JSON)</span>
                        <span className="text-sm text-muted-foreground ml-2">Complete site architecture data</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = '/docs/sitemap-data.json';
                          link.download = 'sitemap-data.json';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background rounded border">
                      <div>
                        <span className="font-medium">Visual Sitemap (SVG)</span>
                        <span className="text-sm text-muted-foreground ml-2">Interactive site structure diagram</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = '/docs/sitemap.svg';
                          link.download = 'sitemap.svg';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background rounded border">
                      <div>
                        <span className="font-medium">Onboarding Flow (SVG)</span>
                        <span className="text-sm text-muted-foreground ml-2">User registration flowchart</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = '/docs/flows-onboarding.svg';
                          link.download = 'flows-onboarding.svg';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background rounded border">
                      <div>
                        <span className="font-medium">Ambassador Flow (SVG)</span>
                        <span className="text-sm text-muted-foreground ml-2">Ambassador recruitment flowchart</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = '/docs/flows-ambassador.svg';
                          link.download = 'flows-ambassador.svg';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-background rounded border">
                      <div>
                        <span className="font-medium">Mermaid Sources (.mmd)</span>
                        <span className="text-sm text-muted-foreground ml-2">Editable diagram source files</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = '/docs/flows-onboarding.mmd';
                            link.download = 'onboarding-flow.mmd';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Onboarding
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = '/docs/flows-ambassador.mmd';
                            link.download = 'ambassador-flow.mmd';
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          Ambassador
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Multi-language support (EN, AR, DE) with hreflang attributes</li>
                  <li>• Automatic generation from Supabase data</li>
                  <li>• SEO-optimized with proper priority and changefreq</li>
                  <li>• Submitted to search engines via robots.txt</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}