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
                <iframe 
                  src="https://mermaid.live/view#pako:eNqFkk1uwjAQha8SzbotuAE7G1pVqlSpH6tWXRnHE_CqY49mHFEi790JpKJA1a48b967782M5wK0dQJK8FqNzZa0HmRF1mqSFcnr69t7LhJvP4lzIuUkn5PJPeX5guQ5yUoyG5N8QfKCFDdk9kBmM1IuyXxJZkty80hua3LbkNuO3PbkdiC3I7mLDhCzYjgNdBxG7xgOdDgcYT5vPVMHVYPxfq_0QEfVGhs0Gg_WB2U62tgG49paa7qgWu-17owK2rXOGOeDtbUzlbN9a7vBqsHWnfGDNb3TQbe2s96rrrGu7521QbfWmeB90HVrvLdBd021k7R1R5DbkfyE3E7kdyG3K_ndyO1Bbnfye5Dbk_w-5PYlvz-5A8gfSO4g8oeSO4T84eQOJX8EuRfJH0nu5eQPJ3cY-SPJHU7-KHJH_gOH2bQk" 
                  width="100%" 
                  height="600"
                  style={{ border: 'none' }}
                  title="Site Structure Diagram"
                />
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
                  <iframe 
                    src="https://mermaid.live/view#pako:eNqFks1uwjAQhF8l8hkquAE7OdCqUpWqP0etemoVOd4EXHXt1Y5DCOLdd-OQQqHqyTvfzIxnvRdQglHQgld6bLek9SArslaTrihen97e8rHw9oM4J0pO8jmZ3FOeL0iek6wk8zHJFyQvyLwisweZzUi5JPMlmS3JzSO5rcltQ257cjuQ25HcRQeIWTGcBjoOo3cMBzocjjCft56pg6rBeL9XeqCjao0NGo0H64MiHW1sg3FtrdWdka13WndGBe1aZ4zzwdrakcrZvrXdYFVn6874wZreaadb281edc6rrmmt9zZo11rjvQ_6Z02z3uOX5Z7kp-R2Jr8LuV3J70ZuD3K7k9-D3J7k9yG3L_n9yR1A_kByB5E_lNwh5A8ndyj5I8i9SP4Ici8nfzi5w8gfSe5w8keROxJvP8gfSe7l5A8ndxj5I8kdTv4ockfiWJY_ktzLyR9O7jDyR5I7nPwR5I4gfyS5l5P_j-Q_1v_YQcYzaw" 
                    width="100%" 
                    height="400"
                    style={{ border: 'none' }}
                    title="Onboarding Flow"
                  />
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
                  <iframe 
                    src="https://mermaid.live/view#pako:eNqFktFuwjAMRX8l8jOd8Ads8wBppGnSNGniZdNeonQJHS7xSuw2wKj_fWkLBTaYX2zfe3Pt-F5ACUZBCdbo0O1I60FWZKOmLJO8vby853PhHQdxTpSc5HMyvac8X5A8J1lJ5mOSL0hekHlFZg8ym5FySWZLMluSmwdyW5PbhtxOyW1PbgdyO5G76AAxa4bTQMch_I7hQIfDEebzLjB1UE0w3h-VHmBUtcEGjcaj9UFRjra2wbi21poh6MY7rXujgnZd4BzqUbNgvj3mBMEHa3ung25tN3vVOa-6pl3fRed915rOex_0r3VNu41fl3uSn5LbmfwO5HYlvxu5Pcjtjujo_Mb1ILcn-X3I7Ut-f3IHyF1EznVduz4Agjc" 
                    width="100%" 
                    height="400"
                    style={{ border: 'none' }}
                    title="Ambassador Flow"
                  />
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
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
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