# Cyntek Development Workflow

## Overview
This document outlines the optimized development workflow for the Cyntek procurement portal, designed to maximize Claude Code effectiveness while implementing proper version control and development lifecycle management.

## 🔄 Development Lifecycle

### 1. Session Startup Protocol

**Before starting any development session:**

```bash
# 1. Pull latest changes
git pull origin develop

# 2. Check development log for current context
# Read: development-logs/development-log-$(date +%Y-%m-%d).txt

# 3. Create feature branch for new work
git checkout -b feature/your-feature-name

# 4. Start development server
npm run dev -- --port 3012
```

**For Claude Code sessions:**
- Always read the current development log first
- Use TodoWrite tool to track progress
- Update development log in real-time

### 2. Feature Development Process

#### A. Branch Strategy
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/feature-name`: Individual features
- `hotfix/issue-name`: Critical fixes

#### B. Commit Strategy
```bash
# Frequent, descriptive commits
git add .
git commit -m "feat: add user authentication system

- Implement Supabase auth integration
- Add login/logout functionality  
- Create protected route middleware
- Update navigation with user menu

🤖 Generated with Claude Code"

# Push feature branch
git push -u origin feature/feature-name
```

#### C. Commit Message Format
```
type: brief description

- Bullet point details
- What was changed
- Why it was changed
- Testing notes if applicable

🤖 Generated with [Claude Code](https://claude.ai/code)
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 3. Claude Code Optimization Strategies

#### A. Session Management
1. **Context Preservation:**
   - Read development logs at session start
   - Review recent commits for context
   - Check current branch and pending work

2. **Structured Development:**
   - Define clear session goals
   - Use TodoWrite for progress tracking
   - Document decisions and reasoning

3. **File Organization:**
   - Prefer editing existing files over creating new ones
   - Follow established code patterns
   - Maintain consistent naming conventions

#### B. Communication Patterns
```markdown
## Session Context Template

**Goal:** [What we're trying to achieve]
**Files Modified:** [List of changed files]
**Testing Status:** [What's been tested]
**Next Steps:** [Immediate follow-ups needed]
**Blockers:** [Any issues encountered]
```

### 4. Testing & Quality Assurance

#### A. Pre-Commit Checklist
- [ ] Code compiles without errors
- [ ] All TypeScript types are correct
- [ ] No console errors in browser
- [ ] Basic functionality tested
- [ ] Development log updated

#### B. Testing Commands
```bash
# Portal testing
cd cyntek-portal
npm run lint
npm run build
npm run dev -- --port 3012

# Website testing  
cd cyntek-website
npm run lint
npm run build
npm run dev -- --port 3002
```

### 5. Documentation Strategy

#### A. Development Logs
- **Daily logs:** `development-logs/development-log-YYYY-MM-DD.txt`
- **Format:** Structured sessions with clear outcomes
- **Content:** Features, fixes, decisions, next steps
- **Update frequency:** Real-time during development

#### B. Code Documentation
- **README files:** For each major component
- **Inline comments:** For complex logic only
- **Type definitions:** Comprehensive TypeScript types
- **API documentation:** For all endpoints

### 6. GitHub Integration

#### A. Repository Setup
```bash
# Initialize repository
git init
git add .
git commit -m "initial: project setup with development workflow"

# Connect to GitHub
git remote add origin https://github.com/your-username/cyntek-site.git
git push -u origin main

# Create develop branch
git checkout -b develop
git push -u origin develop
```

#### B. Pull Request Process
1. **Create feature branch** from `develop`
2. **Develop feature** with frequent commits
3. **Test thoroughly** before PR
4. **Create Pull Request** to `develop` branch
5. **Review and merge** after approval

#### C. GitHub Actions (Future)
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd cyntek-portal && npm install
          cd ../cyntek-website && npm install
      - name: Run tests
        run: |
          cd cyntek-portal && npm run build
          cd ../cyntek-website && npm run build
```

## 🚀 Quick Start Commands

### Daily Workflow
```bash
# Morning startup
git pull origin develop
git checkout -b feature/new-feature
npm run dev -- --port 3012

# During development
git add . && git commit -m "feat: description"
git push origin feature/new-feature

# End of session
git push origin feature/new-feature
# Create PR via GitHub UI
```

### Claude Code Session
```bash
# 1. Read development log
cat development-logs/development-log-$(date +%Y-%m-%d).txt

# 2. Check git status
git status
git log --oneline -5

# 3. Start development
npm run dev -- --port 3012

# 4. End session with commit
git add .
git commit -m "session: description of work completed

🤖 Generated with Claude Code"
```

## 📋 Tools & Extensions

### Recommended VS Code Extensions
- GitLens
- GitHub Pull Requests
- TypeScript Importer
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets

### Development Tools
- **Version Control:** Git + GitHub
- **Package Manager:** npm
- **Development Server:** Next.js dev server
- **Database:** Supabase
- **Styling:** Tailwind CSS
- **Type Checking:** TypeScript

## 🎯 Success Metrics

### Code Quality
- Zero TypeScript errors
- Clean console output
- Consistent code style
- Proper error handling

### Development Velocity
- Clear session outcomes
- Documented decisions
- Reproducible setups
- Efficient debugging

### Collaboration
- Detailed commit messages
- Updated documentation
- Context preservation
- Knowledge sharing

---

**Last Updated:** $(date)
**Maintained by:** Development Team
**Review Cycle:** Monthly