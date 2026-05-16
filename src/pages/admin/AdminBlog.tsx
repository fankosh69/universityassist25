import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, Search, ExternalLink, Trash2 } from "lucide-react";

type Candidate = {
  id: string;
  keyword: string;
  est_volume: number | null;
  current_position: number | null;
  source: string;
  source_url: string | null;
  status: "proposed" | "selected" | "rejected" | "drafted";
  score: number | null;
  created_at: string;
};

type Post = {
  id: string;
  slug: string;
  title: string;
  keyword: string | null;
  category: string | null;
  status: "draft" | "published" | "archived";
  reading_minutes: number | null;
  ai_model: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  tldr: string | null;
  intro: string | null;
  sections: unknown;
  faqs: unknown;
  related_links: unknown;
  primary_cta: unknown;
};

export default function AdminBlog() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [generating, setGenerating] = useState<string | null>(null);
  const [discovering, setDiscovering] = useState(false);
  const [manualKw, setManualKw] = useState("");
  const [editorPost, setEditorPost] = useState<Post | null>(null);

  const { data: candidates } = useQuery({
    queryKey: ["blog-candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_topic_candidates")
        .select("*")
        .order("score", { ascending: false, nullsFirst: false })
        .limit(50);
      if (error) throw error;
      return data as Candidate[];
    },
  });

  const { data: posts } = useQuery({
    queryKey: ["blog-posts-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data as Post[];
    },
  });

  async function runDiscovery() {
    setDiscovering(true);
    try {
      const { data, error } = await supabase.functions.invoke("blog-topic-discovery", {});
      if (error) throw error;
      toast({ title: "Discovery complete", description: `${data?.inserted ?? 0} new candidates added.` });
      qc.invalidateQueries({ queryKey: ["blog-candidates"] });
    } catch (e) {
      toast({ title: "Discovery failed", description: String(e), variant: "destructive" });
    } finally {
      setDiscovering(false);
    }
  }

  async function generateDraft(candidate_id?: string, keyword?: string) {
    const id = candidate_id ?? `kw:${keyword}`;
    setGenerating(id);
    try {
      const { data, error } = await supabase.functions.invoke("blog-draft-generator", {
        body: candidate_id ? { candidate_id } : { keyword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Draft created", description: data?.post?.slug ?? "" });
      qc.invalidateQueries({ queryKey: ["blog-candidates"] });
      qc.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      setManualKw("");
    } catch (e) {
      toast({ title: "Generation failed", description: String(e), variant: "destructive" });
    } finally {
      setGenerating(null);
    }
  }

  const updatePost = useMutation({
    mutationFn: async (p: Partial<Post> & { id: string }) => {
      const { id, ...rest } = p;
      const { error } = await supabase
        .from("blog_posts")
        .update(rest as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blog-posts-admin"] });
      toast({ title: "Saved" });
    },
    onError: (e) => toast({ title: "Save failed", description: String(e), variant: "destructive" }),
  });

  async function publishPost(p: Post) {
    const { error } = await supabase
      .from("blog_posts")
      .update({ status: "published", published_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) {
      toast({ title: "Publish failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Published!", description: `Live at /blog/${p.slug}` });
    qc.invalidateQueries({ queryKey: ["blog-posts-admin"] });
  }

  async function archivePost(p: Post) {
    if (!confirm(`Archive "${p.title}"?`)) return;
    await supabase.from("blog_posts").update({ status: "archived" }).eq("id", p.id);
    qc.invalidateQueries({ queryKey: ["blog-posts-admin"] });
  }

  async function rejectCandidate(c: Candidate) {
    await supabase.from("blog_topic_candidates").update({ status: "rejected" }).eq("id", c.id);
    qc.invalidateQueries({ queryKey: ["blog-candidates"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            Auto-discovered SEO topics → AI drafts → your review → publish.
          </p>
        </div>
        <Button onClick={runDiscovery} disabled={discovering} variant="outline">
          {discovering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
          Run discovery now
        </Button>
      </div>

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts">
            Drafts ({posts?.filter((p) => p.status === "draft").length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="published">
            Published ({posts?.filter((p) => p.status === "published").length ?? 0})
          </TabsTrigger>
          <TabsTrigger value="candidates">
            Topic candidates ({candidates?.filter((c) => c.status === "proposed").length ?? 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="drafts" className="space-y-3 mt-4">
          {posts?.filter((p) => p.status === "draft").map((p) => (
            <Card key={p.id} className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Badge variant="secondary">{p.category}</Badge>
                  {p.keyword && <span>kw: {p.keyword}</span>}
                  <span>· {p.reading_minutes} min</span>
                  <span>· {p.ai_model}</span>
                </div>
                <h3 className="font-semibold text-lg truncate">{p.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{p.meta_description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button size="sm" variant="outline" onClick={() => setEditorPost(p)}>Edit</Button>
                <Button size="sm" onClick={() => publishPost(p)}>Publish</Button>
                <Button size="sm" variant="ghost" onClick={() => archivePost(p)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {posts?.filter((p) => p.status === "draft").length === 0 && (
            <p className="text-muted-foreground text-sm py-8 text-center">
              No drafts yet. Run discovery or add a manual keyword in the Candidates tab.
            </p>
          )}
        </TabsContent>

        <TabsContent value="published" className="space-y-3 mt-4">
          {posts?.filter((p) => p.status === "published").map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{p.title}</h3>
                <p className="text-xs text-muted-foreground">
                  /blog/{p.slug} · published {new Date(p.published_at!).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link to={`/blog/${p.slug}`} target="_blank">
                  <Button size="sm" variant="ghost"><ExternalLink className="h-4 w-4" /></Button>
                </Link>
                <Button size="sm" variant="outline" onClick={() => setEditorPost(p)}>Edit</Button>
                <Button size="sm" variant="ghost" onClick={() => archivePost(p)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="candidates" className="space-y-3 mt-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Add a manual keyword</h3>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. how to apply to TUM as international student"
                value={manualKw}
                onChange={(e) => setManualKw(e.target.value)}
              />
              <Button
                onClick={() => generateDraft(undefined, manualKw)}
                disabled={!manualKw.trim() || generating === `kw:${manualKw}`}
              >
                {generating === `kw:${manualKw}` ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Generate draft
              </Button>
            </div>
          </Card>

          {candidates?.filter((c) => c.status === "proposed").map((c) => (
            <Card key={c.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Badge variant="outline">{c.source}</Badge>
                  {c.est_volume && <span>~{c.est_volume} impressions</span>}
                  {c.current_position && <span>· pos {c.current_position}</span>}
                  {c.score && <span>· score {c.score.toFixed(1)}</span>}
                </div>
                <h3 className="font-medium truncate">{c.keyword}</h3>
                {c.source_url && (
                  <a href={c.source_url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-primary">
                    {c.source_url}
                  </a>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => generateDraft(c.id)}
                  disabled={generating === c.id}
                >
                  {generating === c.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate
                </Button>
                <Button size="sm" variant="ghost" onClick={() => rejectCandidate(c)}>Reject</Button>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {editorPost && (
        <PostEditor
          post={editorPost}
          onClose={() => setEditorPost(null)}
          onSave={(updates) => {
            updatePost.mutate({ id: editorPost.id, ...updates });
            setEditorPost(null);
          }}
        />
      )}
    </div>
  );
}

function PostEditor({
  post,
  onClose,
  onSave,
}: {
  post: Post;
  onClose: () => void;
  onSave: (updates: Partial<Post>) => void;
}) {
  const [title, setTitle] = useState(post.title);
  const [metaTitle, setMetaTitle] = useState(post.meta_title ?? "");
  const [metaDescription, setMetaDescription] = useState(post.meta_description ?? "");
  const [slug, setSlug] = useState(post.slug);
  const [tldr, setTldr] = useState(post.tldr ?? "");
  const [intro, setIntro] = useState(post.intro ?? "");
  const [sectionsJson, setSectionsJson] = useState(JSON.stringify(post.sections, null, 2));
  const [faqsJson, setFaqsJson] = useState(JSON.stringify(post.faqs, null, 2));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit blog post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium">Slug (/blog/...)</label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Title (H1)</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">Meta title (≤60 chars)</label>
            <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} maxLength={80} />
          </div>
          <div>
            <label className="text-xs font-medium">Meta description (140-160 chars)</label>
            <Textarea value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} rows={2} />
          </div>
          <div>
            <label className="text-xs font-medium">TL;DR</label>
            <Textarea value={tldr} onChange={(e) => setTldr(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="text-xs font-medium">Intro</label>
            <Textarea value={intro} onChange={(e) => setIntro(e.target.value)} rows={3} />
          </div>
          <div>
            <label className="text-xs font-medium">Sections (JSON)</label>
            <Textarea
              value={sectionsJson}
              onChange={(e) => setSectionsJson(e.target.value)}
              rows={12}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-medium">FAQs (JSON)</label>
            <Textarea
              value={faqsJson}
              onChange={(e) => setFaqsJson(e.target.value)}
              rows={8}
              className="font-mono text-xs"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              try {
                const sections = JSON.parse(sectionsJson);
                const faqs = JSON.parse(faqsJson);
                onSave({
                  slug,
                  title,
                  meta_title: metaTitle,
                  meta_description: metaDescription,
                  tldr,
                  intro,
                  sections,
                  faqs,
                });
              } catch (e) {
                alert("Invalid JSON in sections/faqs: " + e);
              }
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}