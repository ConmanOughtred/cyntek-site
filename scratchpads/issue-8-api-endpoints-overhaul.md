# Issue #8: API Endpoints - Parts Management System Overhaul

**Issue Link**: https://github.com/ConmanOughtred/cyntek-site/issues/8
**Created**: 2025-09-06
**Priority**: High (Foundation)
**Complexity**: High (~3-4 hours)
**Status**: 🔄 IN PROGRESS

## Issue Summary
Update all parts-related API endpoints to support the new database schema implemented in Issue #7, including new tables, relationships, and organization-specific data isolation.

## Database Schema Changes (from Issue #7)
The database migration in Issue #7 introduced significant changes that require API updates:

### New Tables:
1. **`part_organization_details`** - Organization-specific part data
2. **`part_types`** - Standardized part type lookup
3. **`applications`** - Application-based organization (replaces projects)
4. **`part_applications`** - Many-to-many part-application relationships

### Updated Parts Table Fields:
- ✅ Added `manufacturer` (required)
- ✅ Added `part_type` (optional)
- ✅ Added `voltage`, `power_rating_hp`, `power_rating_kw`, `shaft_size`, `gearbox_ratio`
- ✅ Updated `price_type` constraint (`fixed`, `non_fixed`)

## API Endpoints Analysis

### Current API Endpoints (Needs Review):
Based on typical Next.js API structure, likely endpoints to update:

1. **Parts CRUD Operations**:
   - `GET /api/parts` - List parts with filters
   - `GET /api/parts/[id]` - Get single part details
   - `POST /api/parts` - Create new part
   - `PUT /api/parts/[id]` - Update part
   - `DELETE /api/parts/[id]` - Delete part

2. **Parts Search & Filter**:
   - `GET /api/parts/search` - Search parts functionality
   - `GET /api/parts/filters` - Get filter options

3. **Organization-Specific Endpoints**:
   - Organization-specific part details
   - Organization item numbers
   - Applications management

4. **Lookup Data**:
   - Part types dropdown
   - Applications dropdown
   - Manufacturer lists

## Implementation Plan

### Phase 1: Discovery & Current State Analysis
- [ ] Identify all existing parts-related API endpoints
- [ ] Review current database queries and data structures
- [ ] Document existing authentication and authorization patterns
- [ ] Map current frontend components to API endpoints

### Phase 2: Core Parts API Updates
- [ ] Update parts list endpoint to include new fields
- [ ] Modify parts detail endpoint for organization-specific data
- [ ] Update parts creation to handle new required fields
- [ ] Modify parts update endpoint for new schema
- [ ] Ensure RLS policies are properly utilized

### Phase 3: Organization-Specific API Development
- [ ] Create endpoints for part organization details management
- [ ] Implement organization item number handling
- [ ] Add endpoints for organization-specific pricing
- [ ] Create application assignment endpoints

### Phase 4: Lookup & Utility APIs
- [ ] Create part types endpoint for dropdowns
- [ ] Implement applications management API
- [ ] Add manufacturer lookup functionality
- [ ] Create search and filter endpoints with new criteria

### Phase 5: Testing & Validation
- [ ] Test all CRUD operations with new schema
- [ ] Verify organization data isolation
- [ ] Validate API responses match frontend expectations
- [ ] Test error handling and edge cases

## Technical Requirements

### Authentication & Authorization:
- Maintain existing Supabase server-side auth patterns
- Ensure RLS policies are respected in all queries
- Handle organization-specific data access properly

### Data Validation:
- Validate required fields (manufacturer, name, manufacturer_part_number)
- Enforce price_type constraints ('fixed', 'non_fixed')
- Validate organization access permissions

### Performance Considerations:
- Utilize new database indexes for efficient queries
- Optimize joins between new tables
- Consider pagination for large parts lists

### Response Format:
- Include new fields in API responses
- Maintain backward compatibility where possible
- Structure organization-specific data appropriately

## API Response Structure Updates

### Parts List Response (Enhanced):
```json
{
  "parts": [
    {
      "id": "uuid",
      "name": "string",
      "manufacturer": "string",
      "manufacturer_part_number": "string",
      "part_type": "string",
      "voltage": "string",
      "power_rating_hp": "number",
      "power_rating_kw": "number",
      "shaft_size": "string",
      "gearbox_ratio": "string",
      "price_type": "fixed|non_fixed",
      "organization_details": {
        "organization_item_number": "string",
        "estimated_lead_time_days": "number",
        "unit_price": "number",
        "is_repairable": "boolean",
        "repair_price": "number"
      },
      "applications": ["application1", "application2"]
    }
  ]
}
```

## Files to Modify/Create

### API Endpoints (Estimated):
- `cyntek-portal/src/app/api/parts/route.ts`
- `cyntek-portal/src/app/api/parts/[id]/route.ts`
- `cyntek-portal/src/app/api/parts/search/route.ts`
- `cyntek-portal/src/app/api/part-types/route.ts`
- `cyntek-portal/src/app/api/applications/route.ts`

### Utility/Helper Files:
- Database query helpers for new schema
- Validation schemas for new fields
- Type definitions for API responses

## Risk Assessment

### High Risk:
- Breaking changes to existing API contracts
- Complex joins between new tables affecting performance
- Organization data isolation edge cases

### Medium Risk:
- Frontend component compatibility with new API responses
- Migration of existing parts data references
- Search functionality with new fields

### Low Risk:
- Adding new optional endpoints
- Enhancing existing responses with new fields

## Success Criteria

### Functional Requirements:
- [ ] All existing parts functionality continues to work
- [ ] New database fields are accessible via API
- [ ] Organization-specific data properly isolated
- [ ] Search and filtering includes new criteria
- [ ] Part types and applications are manageable

### Quality Requirements:
- [ ] All API endpoints have proper error handling
- [ ] Performance is maintained or improved
- [ ] Security policies are correctly implemented
- [ ] API documentation is updated

### Integration Requirements:
- [ ] Frontend components can consume new API responses
- [ ] Admin interfaces can manage new data structures
- [ ] Search functionality works with enhanced data

## Dependencies

### Completed:
- ✅ Issue #7: Database Schema Migration

### Required for Testing:
- Working development environment
- Database with migrated schema
- Sample data for testing

### Future Dependencies:
- Issue #9: Admin Parts Management interface updates
- Frontend component updates for new fields

## Next Steps After Completion

1. **Issue #9**: Admin Parts Management - Update forms and interfaces
2. **Frontend Updates**: Update components to use new API structures
3. **Testing**: Comprehensive testing of new functionality
4. **Documentation**: Update API documentation

---

**Status**: 🔄 IN PROGRESS - Planning Phase
**Next Phase**: Discovery & Current State Analysis
**Estimated Completion**: 3-4 hours after implementation begins

This scratchpad will be updated throughout the implementation process to track progress and document any changes or discoveries.