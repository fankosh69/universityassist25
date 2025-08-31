# University Assist API Documentation

Complete API documentation for the University Assist platform - your way to German universities.

## 📚 Documentation Structure

```
docs/api/
├── index.html              # Interactive API documentation (Redoc)
├── quickstart.html         # Quick start guide
├── README.md              # This file
└── built/                 # Built documentation (generated)

docs/examples/
├── cities-list.http        # City API examples
├── universities-list.http  # University API examples  
├── programs-search.http    # Program search examples
├── edge-functions.http     # Edge function examples
└── rpc-functions.http      # RPC function examples

public/api/
└── openapi.json           # OpenAPI 3.1 specification
```

## 🚀 Getting Started

### View Documentation

1. **Interactive Docs**: Visit [/docs/api](https://universityassist25.lovable.app/docs/api)
2. **Quick Start**: Visit [/docs/api/quickstart.html](https://universityassist25.lovable.app/docs/api/quickstart.html)
3. **Raw OpenAPI Spec**: [/api/openapi.json](https://universityassist25.lovable.app/api/openapi.json)

### Local Development

```bash
# Serve documentation locally
npm run docs:serve

# Validate OpenAPI specification
npm run docs:lint

# Build static documentation  
npm run docs:build

# Bundle OpenAPI spec
npm run docs:bundle
```

## 📋 API Overview

### Base URLs

- **Supabase REST**: `https://zfiexgjcuojodmnsinsz.supabase.co/rest/v1`
- **Edge Functions**: `https://zfiexgjcuojodmnsinsz.functions.supabase.co`
- **Application API**: `https://universityassist25.lovable.app/api`

### Authentication

```bash
# Required headers
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### Key Endpoints

#### Core Data
- `GET /cities` - List German cities
- `GET /universities` - List universities  
- `GET /programs` - Search programs
- `GET /ambassadors` - Student ambassadors

#### Program Management
- `GET /program_deadlines` - Application deadlines
- `GET /program_requirements` - Admission requirements
- `POST /watchlist` - Save programs (auth required)

#### Edge Functions
- `POST /functions/v1/ingest-universities` - Data import (auth required)
- `GET /functions/v1/get-mapbox-token` - Map token (public)
- `POST /functions/v1/generate-test-packet` - QA packet (public)

#### RPC Functions
- `POST /rpc/get_admin_dashboard_stats` - Admin stats (auth required)
- `POST /rpc/get_safe_profile_data` - Profile data (auth required)

## 🔍 Query Examples

### Basic Queries

```bash
# List cities with coordinates
GET /rest/v1/cities?select=id,name,slug,lat,lng

# Universities in Berlin
GET /rest/v1/universities?city=eq.Berlin&select=id,name,website

# Master's programs in Computer Science
GET /rest/v1/programs?degree_level=eq.master&field_of_study=ilike.*Computer*
```

### Advanced Queries

```bash
# Programs with university and deadlines
GET /rest/v1/programs?select=*,universities(name,city),program_deadlines(*)

# Free English-taught programs in Berlin
GET /rest/v1/programs?select=*,universities(name,city)
    &universities.city=eq.Berlin
    &tuition_fees=eq.0
    &language_of_instruction=cs.{en}
    &published=eq.true
```

### PostgREST Operators

- `eq` - Equal: `city=eq.Berlin`
- `neq` - Not equal: `published=neq.false`  
- `gt/gte` - Greater than: `tuition_fees=gte.1000`
- `lt/lte` - Less than: `ects_credits=lte.240`
- `like/ilike` - Pattern: `name=ilike.*berlin*`
- `in` - In list: `degree_level=in.(bachelor,master)`
- `is` - Is null: `logo_url=is.null`
- `or` - Logical OR: `or=(field1.eq.value1,field2.eq.value2)`

## 🛡️ Security & RLS

All operations are subject to Row Level Security (RLS) policies:

- **Public Data**: Cities, universities, published programs are publicly readable
- **User Data**: Profiles, watchlists require authentication and ownership
- **Admin Data**: Administrative functions require admin role
- **Ambassador Data**: Only published ambassadors are publicly visible

## 📊 Rate Limits

- Respect Supabase usage limits for your plan
- Implement proper pagination with `limit` and `offset`
- Use `select` to fetch only required columns
- Cache responses when appropriate
- Implement exponential backoff for retries

## 🔧 Tools & Testing

### HTTP Clients

Use the provided `.http` files with:
- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) (VS Code)
- [Insomnia](https://insomnia.rest/)
- [Postman](https://www.postman.com/)
- [HTTPie](https://httpie.io/)

### Validation

```bash
# Lint OpenAPI spec
npm run docs:lint

# Validate with Redocly
redocly lint public/api/openapi.json

# Test documentation builds
npm run docs:build
```

## 🤝 Contributing

1. Update OpenAPI spec in `public/api/openapi.json`
2. Add examples to `docs/examples/*.http` 
3. Run `npm run docs:lint` to validate
4. Test documentation locally with `npm run docs:serve`
5. Submit PR - CI will validate automatically

## 📞 Support

- **Documentation Issues**: Check [GitHub Issues](https://github.com/university-assist/issues)
- **API Questions**: Contact development team
- **Authentication Help**: See [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**University Assist** - Your way to German universities 🇩🇪