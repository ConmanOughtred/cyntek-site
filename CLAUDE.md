# Claude Code Configuration

This file contains configuration and context for optimizing Claude Code sessions.

## Project Context

**Application:** Cyntek Procurement Portal
**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase
**Architecture:** Dual-app setup (Portal + Website)
**Development Server:** http://localhost:3012

## Current Development State

**Active Features:**
- Live search functionality for parts catalog
- Role-based permission system
- Purchase request workflow
- Shopping cart with quantity controls
- Real-time UI updates

**Recent Additions:**
- Price visibility controls
- User surname integration
- Sample data prefixing
- Performance optimizations

## Claude Code Optimization Settings

### Session Startup Protocol
1. Read current development log: `development-logs/development-log-$(date +%Y-%m-%d).txt`
2. Check git status: `git status && git log --oneline -3`
3. Verify server status: `curl -I http://localhost:3012`
4. Load project context from this file

### Development Guidelines
- **Always use TodoWrite** for task tracking
- **Update development logs** in real-time
- **Commit frequently** with descriptive messages
- **Test changes** before completing tasks
- **Prefer editing existing files** over creating new ones

### Key File Locations
- **Portal Code:** `cyntek-portal/src/`
- **Components:** `cyntek-portal/components/`
- **API Routes:** `cyntek-portal/src/app/api/`
- **Database Schemas:** `cyntek-portal/database/`
- **Development Logs:** `development-logs/`

### Testing Commands
```bash
# Start development server
cd cyntek-portal && npm run dev -- --port 3012

# Check build
cd cyntek-portal && npm run build

# Lint code
cd cyntek-portal && npm run lint
```

### Common Task Patterns

#### UI Components
- Location: `cyntek-portal/components/`
- Patterns: TypeScript + Tailwind CSS
- State: React hooks + Context API

#### API Endpoints
- Location: `cyntek-portal/src/app/api/`
- Auth: Supabase server-side client
- Validation: Server-side validation required

#### Database Operations
- Client: Supabase with Row Level Security
- Service Role: Available for admin operations
- Migrations: Manual SQL files in `database/`

### Performance Considerations
- **Server-side auth** can be slow (4-5 seconds)
- **Client-side operations** preferred for UI responsiveness
- **Database queries** should be optimized
- **Environment variables** must be correctly configured

### Debugging Notes
- Check server logs with BashOutput tool
- Verify Supabase connection status
- Monitor console errors in browser
- Test API endpoints with curl

## Recent Workflow Improvements
- Removed unified proxy server (deprecated)
- Fixed environment configuration for direct hosting
- Optimized homepage performance
- Added systematic testing approach

---

**Last Updated:** 2025-09-05
**Next Review:** Weekly
**Optimization Level:** Advanced