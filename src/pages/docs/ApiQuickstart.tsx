import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const ApiQuickstart = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary to-secondary text-white py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">University Assist API</h1>
          <p className="text-xl">Quick Start Guide - Your way to German universities</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card rounded-lg shadow-lg p-8 -mt-8 relative z-10">
          
          <div className="flex flex-wrap gap-4 mb-8">
            <Link to="/docs/api">
              <Button>📖 Full API Documentation</Button>
            </Link>
            <Button variant="outline" onClick={() => document.getElementById('authentication')?.scrollIntoView()}>
              🔐 Authentication
            </Button>
            <Button variant="outline" onClick={() => document.getElementById('examples')?.scrollIntoView()}>
              💡 Examples
            </Button>
          </div>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">Base URLs</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Supabase REST API</h3>
                <code className="text-sm break-all">https://zfiexgjcuojodmnsinsz.supabase.co/rest/v1</code>
                <p className="text-sm text-muted-foreground mt-2">PostgREST API for database operations</p>
              </div>
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Edge Functions</h3>
                <code className="text-sm break-all">https://zfiexgjcuojodmnsinsz.functions.supabase.co</code>
                <p className="text-sm text-muted-foreground mt-2">Serverless functions for custom logic</p>
              </div>
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Application API</h3>
                <code className="text-sm break-all">https://universityassist25.lovable.app/api</code>
                <p className="text-sm text-muted-foreground mt-2">Application-specific endpoints</p>
              </div>
            </div>
          </section>

          <section className="mb-12" id="authentication">
            <h2 className="text-3xl font-bold mb-6">Authentication</h2>
            <p className="mb-4">University Assist API uses Supabase authentication with API keys and JWT tokens.</p>
            
            <h3 className="text-xl font-semibold mb-4">Headers Required</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm relative group">
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
                onClick={() => copyToClipboard('apikey: {SUPABASE_ANON_KEY}\nAuthorization: Bearer {JWT_TOKEN}\nContent-Type: application/json')}
              >
                Copy
              </Button>
              <pre>{`apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json`}</pre>
            </div>

            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mt-4">
              <strong>Note:</strong> Replace <code>{'{SUPABASE_ANON_KEY}'}</code> with your actual Supabase anonymous key and <code>{'{JWT_TOKEN}'}</code> with a valid JWT token from authentication.
            </div>

            <h3 className="text-xl font-semibold mb-4 mt-8">JavaScript Example</h3>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm relative group">
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
                onClick={() => copyToClipboard(`const response = await fetch('https://zfiexgjcuojodmnsinsz.supabase.co/rest/v1/cities', {
  method: 'GET',
  headers: {
    'apikey': '{SUPABASE_ANON_KEY}',
    'Authorization': \`Bearer \${jwtToken}\`,
    'Content-Type': 'application/json'
  }
});

const cities = await response.json();`)}
              >
                Copy
              </Button>
              <pre>{`const response = await fetch('https://zfiexgjcuojodmnsinsz.supabase.co/rest/v1/cities', {
  method: 'GET',
  headers: {
    'apikey': '{SUPABASE_ANON_KEY}',
    'Authorization': \`Bearer \${jwtToken}\`,
    'Content-Type': 'application/json'
  }
});

const cities = await response.json();`}</pre>
            </div>
          </section>

          <section className="mb-12" id="examples">
            <h2 className="text-3xl font-bold mb-6">Common Examples</h2>
            
            <div className="space-y-6">
              <div className="border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold mr-2">GET</span>
                  <strong>List all cities</strong>
                </div>
                <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                  <code>GET /rest/v1/cities?select=id,name,slug,lat,lng</code>
                </div>
              </div>

              <div className="border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold mr-2">GET</span>
                  <strong>Universities in Berlin</strong>
                </div>
                <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                  <code>GET /rest/v1/universities?select=id,name,slug,website&city=eq.Berlin</code>
                </div>
              </div>

              <div className="border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-bold mr-2">GET</span>
                  <strong>Master's programs in Computer Science</strong>
                </div>
                <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-sm">
                  <code>GET /rest/v1/programs?select=id,name,university_id,universities(name)&degree_level=eq.master&field_of_study=ilike.*Computer*&published=eq.true</code>
                </div>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold mb-6">PostgREST Query Parameters</h2>
            <p className="mb-4">The REST API supports powerful querying via URL parameters:</p>
            
            <ul className="space-y-2">
              <li><code className="bg-muted px-2 py-1 rounded">select</code> - Choose columns: <code>select=id,name,slug</code></li>
              <li><code className="bg-muted px-2 py-1 rounded">order</code> - Sort results: <code>order=name.asc,created_at.desc</code></li>
              <li><code className="bg-muted px-2 py-1 rounded">limit</code> - Limit results: <code>limit=10</code></li>
              <li><code className="bg-muted px-2 py-1 rounded">offset</code> - Pagination: <code>offset=20</code></li>
              <li><code className="bg-muted px-2 py-1 rounded">eq</code> - Equal: <code>city_id=eq.{'{uuid}'}</code></li>
              <li><code className="bg-muted px-2 py-1 rounded">like/ilike</code> - Pattern match: <code>name=ilike.*berlin*</code></li>
              <li><code className="bg-muted px-2 py-1 rounded">in</code> - In list: <code>degree_level=in.(bachelor,master)</code></li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-6">Resources</h2>
            <ul className="space-y-2">
              <li><Link to="/docs/api" className="text-primary hover:underline">📖 Complete API Documentation</Link></li>
              <li><a href="https://postgrest.org/en/stable/api.html" className="text-primary hover:underline" target="_blank" rel="noopener">📚 PostgREST Documentation</a></li>
              <li><a href="https://supabase.com/docs" className="text-primary hover:underline" target="_blank" rel="noopener">🔧 Supabase Documentation</a></li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
};

export default ApiQuickstart;