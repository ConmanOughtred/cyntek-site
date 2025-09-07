# Issue #9: Admin Parts Management - Forms and Bulk Upload Overhaul

**Issue Link**: https://github.com/ConmanOughtred/cyntek-site/issues/9
**Created**: 2025-09-06
**Priority**: High (Core admin functionality)
**Complexity**: High (~4-5 hours)
**Status**: 🔄 IN PROGRESS

## Issue Summary
Complete restructure of the admin parts management interface with new form layouts, validation, and bulk upload functionality to support the enhanced database schema from Issues #7 and #8.

## Dependencies Status
- ✅ **Issue #7**: Database Schema Migration - COMPLETED
- ✅ **Issue #8**: API Endpoints Update - COMPLETED

## User Personas & Permissions

### Primary Users:
- **Cyntek Admin**: Full system access, can manage all parts and organizations
- **Org Admin**: Organization-specific access, can manage their organization's part details

### Permission Matrix:
| Action | Cyntek Admin | Org Admin | Buyer | Requester |
|--------|--------------|-----------|-------|-----------|
| Create New Parts | ✅ | ❌ | ❌ | ❌ |
| Edit Part Basic Info | ✅ | ❌ | ❌ | ❌ |
| Edit Org-Specific Details | ✅ | ✅ (own org) | ❌ | ❌ |
| Bulk Upload Parts | ✅ | ❌ | ❌ | ❌ |
| View All Parts | ✅ | ✅ (filtered) | ❌ | ❌ |
| Delete Parts | ✅ | ❌ | ❌ | ❌ |

## Feature Requirements

### 1. Manual Part Creation (`Add New Part`)

#### **Basic Information (Required)**
- **Manufacturer** (dropdown/searchable)
  - Integration with existing manufacturer data
  - Option to add new manufacturer
  - Validation: Required, max 255 chars
- **Manufacturer Part Number** 
  - Validation: Required, unique per manufacturer, max 255 chars
- **Part Name**
  - Validation: Required, max 255 chars
- **Description**
  - Optional multi-line text field
  - Max 1000 characters

#### **Technical Specifications (Optional)**
- **Part Type** (dropdown with custom option)
  - Default options: Motor, Motor/Gearbox, Motor/Gearbox & Assembly, Roller Motor, Drum Motor
  - Custom option allows free text entry
  - Integration with `part_types` table
- **Voltage** (free text)
- **Power Rating (HP)** (decimal)
- **Power Rating (kW)** (decimal)
- **Shaft Size** (free text)
- **Gearbox Ratio** (free text)

#### **Default Pricing & Delivery**
- **Estimated Lead Time** (required, integer, days)
- **Price Type**: Fixed/Non-Fixed (required radio buttons)
- **Unit Price** (required, decimal, currency format)
- **Part Repairable**: True/False (required checkbox)
- **Repair Price** (conditional on repairable, decimal)

#### **Organization Access, Pricing & Delivery**
- **Organization dropdown** (multi-select for Cyntek Admin)
- **Organization Item Number** (optional per organization)
- **Application** (optional, dropdown from organization's applications)
- **"Use Default Pricing" checkbox**
- **Override pricing fields** (if not using default)
  - Custom estimated lead time
  - Custom price type
  - Custom unit price
  - Custom repair price

### 2. Part Editing

#### **Functionality**
- Pre-populate all fields from existing part data
- Same form structure as Add New Part
- Warning modal about irreversible changes before submission
- All fields editable by Cyntek Admin
- Org Admins can only edit organization-specific details

#### **Data Loading**
- Load from `/api/admin/parts/[id]` endpoint (Issue #8)
- Handle organization-specific details properly
- Show loading states during data fetch
- Error handling for missing parts

### 3. Bulk Upload Updates

#### **CSV Format Requirements**
New CSV template structure:
```csv
manufacturer,manufacturer_part_number,name,description,part_type,voltage,power_rating_hp,power_rating_kw,shaft_size,gearbox_ratio,estimated_lead_time_days,price_type,unit_price,is_repairable,repair_price
```

#### **Validation Rules**
- **Required fields**: manufacturer, manufacturer_part_number, name, estimated_lead_time_days, price_type, unit_price, is_repairable
- **Data types**: Proper validation for numbers, decimals, booleans
- **Enum validation**: price_type must be 'fixed' or 'non_fixed'
- **Duplicate detection**: Check manufacturer + manufacturer_part_number uniqueness
- **Row limit**: Max 1000 parts per upload

#### **Upload Process**
1. **File validation**: CSV format, size limits
2. **Data parsing**: Handle various CSV formats (comma, semicolon)
3. **Validation feedback**: Show validation errors per row
4. **Preview mode**: Show parsed data before final upload
5. **Batch processing**: Process in chunks to avoid timeouts
6. **Progress indicator**: Real-time upload progress
7. **Results summary**: Success/failure counts with detailed report

#### **Error Handling**
- Row-specific error reporting
- Continue processing valid rows if some fail
- Downloadable error report
- Rollback capability for failed uploads

### 4. Search & Filter Improvements

#### **Filter Options**
- **Client (Organization)**: Multi-select dropdown
- **Manufacturer**: Multi-select dropdown
- **Part Type**: Multi-select dropdown
- **Price Type**: Fixed/Non-Fixed radio buttons
- **Stock Status**: In Stock/Low Stock/Out of Stock
- **Repairable**: Yes/No/All

#### **Search Functionality**
Search across multiple fields:
- Part name (fuzzy matching)
- Manufacturer part number (exact and partial)
- Client item number (organization-specific)
- Description (full-text search)

#### **Advanced Search**
- Voltage range filtering
- Power rating range filtering (HP and kW)
- Lead time range filtering
- Price range filtering
- Date range filtering (created/updated)

### 5. Parts Grid Layout Update

#### **Column Structure**
| Column | Width | Sortable | Filterable |
|--------|-------|----------|------------|
| Part Name | 20% | ✅ | ✅ |
| Manufacturer | 15% | ✅ | ✅ |
| MFG Part # | 15% | ✅ | ✅ |
| Part Type | 10% | ✅ | ✅ |
| Power (HP/kW) | 10% | ✅ | ❌ |
| Price Type | 8% | ✅ | ✅ |
| Organizations | 15% | ❌ | ✅ |
| Actions | 7% | ❌ | ❌ |

#### **Removed Columns**
- Inventory/Stock Quantity (moved to separate inventory management)
- Client Part Number (now in organization details)

#### **Interactive Elements**
- Row hover effects
- Quick actions dropdown
- Inline editing for simple fields
- Bulk selection capabilities

## Technical Implementation Plan

### Phase 1: Component Analysis and Preparation (30 minutes)
- [ ] Analyze existing AdminPartsManager component
- [ ] Review CreatePartModal and EditPartModal components
- [ ] Check BulkUploadModal component
- [ ] Identify reusable form components
- [ ] Plan component hierarchy changes

### Phase 2: Form Structure Updates (90 minutes)
- [ ] Update CreatePartModal with new form fields
  - [ ] Basic information section
  - [ ] Technical specifications section
  - [ ] Default pricing section
  - [ ] Organization access section
- [ ] Update EditPartModal with pre-population logic
- [ ] Add form validation with react-hook-form
- [ ] Implement conditional field rendering
- [ ] Add proper TypeScript interfaces

### Phase 3: API Integration (45 minutes)
- [ ] Update API calls to use new endpoints from Issue #8
- [ ] Handle organization-specific data properly
- [ ] Add error handling and loading states
- [ ] Implement optimistic updates
- [ ] Add proper error messages

### Phase 4: Bulk Upload Overhaul (90 minutes)
- [ ] Update CSV template with new field structure
- [ ] Implement new validation rules
- [ ] Add preview functionality
- [ ] Update progress tracking
- [ ] Improve error reporting
- [ ] Add batch processing logic

### Phase 5: Search and Filter Enhancement (60 minutes)
- [ ] Add new filter options
- [ ] Implement advanced search functionality
- [ ] Update parts grid layout
- [ ] Add sorting capabilities
- [ ] Optimize query performance

### Phase 6: UX and Polish (45 minutes)
- [ ] Fix React `asChild` prop error
- [ ] Add proper cursor states
- [ ] Improve form user experience
- [ ] Add success/error feedback
- [ ] Test responsive design
- [ ] Add keyboard navigation

## Database Integration Points

### Tables Used:
- **`parts`**: Core part information with new fields
- **`part_organization_details`**: Organization-specific data
- **`part_types`**: Part type lookup
- **`applications`**: Organization applications
- **`part_applications`**: Part-application relationships
- **`organizations`**: Organization data for dropdowns

### RLS Considerations:
- Cyntek Admins: Bypass RLS for full access
- Org Admins: Filtered by organization_id
- Proper error handling for access denied scenarios

## UI/UX Requirements

### Form Design:
- **Section-based layout**: Group related fields
- **Progressive disclosure**: Optional sections collapsible
- **Field dependencies**: Show/hide fields based on selections
- **Validation feedback**: Real-time validation with clear error messages
- **Loading states**: Skeleton loading for form fields
- **Auto-save**: Save draft progress automatically

### Accessibility:
- **Keyboard navigation**: Full keyboard support
- **Screen reader compatibility**: Proper ARIA labels
- **Color contrast**: Meet WCAG AA standards
- **Focus management**: Clear focus indicators
- **Error announcements**: Screen reader error notifications

## Testing Strategy

### Unit Tests:
- Form validation logic
- CSV parsing and validation
- API integration functions
- Component rendering with different props
- Permission-based rendering

### Integration Tests:
- End-to-end part creation workflow
- Bulk upload process
- Search and filtering functionality
- Organization access control
- API error handling

### Browser Tests:
- Multi-organization part creation
- Bulk upload with various CSV formats
- Form validation edge cases
- Responsive design on different screen sizes
- Cross-browser compatibility (Chrome, Firefox, Safari)

### Role-Based Tests:
- **Cyntek Admin**: Full functionality access
- **Org Admin**: Limited to organization-specific features
- **Unauthorized users**: Proper access denial

## Security Considerations

### Data Validation:
- Server-side validation for all form inputs
- SQL injection prevention
- File upload security (CSV parsing)
- Rate limiting for API endpoints

### Access Control:
- Proper RLS implementation
- Role-based UI rendering
- API endpoint permission checking
- Audit trail for all changes

### Error Handling:
- No sensitive data in error messages
- Proper error logging
- User-friendly error messages
- Graceful degradation

## Performance Optimization

### Database Queries:
- Use pagination for large parts lists
- Implement search indexing
- Optimize JOIN queries for organization data
- Cache dropdown data appropriately

### Frontend Performance:
- Lazy load modal components
- Debounce search inputs
- Virtual scrolling for large lists
- Image optimization for part photos

### Bulk Operations:
- Process uploads in batches
- Background processing for large uploads
- Progress indicators for long operations
- Timeout handling for slow operations

## Files to Modify

### Primary Components:
1. **`src/app/admin/parts/page.tsx`** - Main admin parts page
2. **`components/admin/AdminPartsManager.tsx`** - Parts management interface
3. **`components/admin/CreatePartModal.tsx`** - New part creation form
4. **`components/admin/EditPartModal.tsx`** - Part editing form
5. **`components/admin/BulkUploadModal.tsx`** - Bulk upload functionality

### Supporting Files:
6. **`lib/types/parts.ts`** - TypeScript interfaces (if exists)
7. **`components/ui/`** - Reusable form components
8. **`lib/validation/`** - Form validation schemas
9. **`public/templates/`** - CSV template file

## Acceptance Criteria

### Functional Requirements:
- [ ] **Add New Part form** restructured with all new fields
- [ ] **Edit Part form** working with pre-populated data
- [ ] **Bulk upload** supports new CSV format with comprehensive validation
- [ ] **Search and filtering** working with all new fields
- [ ] **Parts grid** displays updated layout without inventory column
- [ ] **Organization access** properly managed for both creation and editing
- [ ] **React prop error** resolved
- [ ] **Form UX improvements** implemented (loading states, validation, etc.)

### Quality Requirements:
- [ ] **TypeScript**: No compilation errors
- [ ] **Testing**: All tests passing
- [ ] **Performance**: Forms load within 2 seconds
- [ ] **Accessibility**: WCAG AA compliance
- [ ] **Security**: Proper validation and access control
- [ ] **Responsive**: Works on mobile and desktop

### Integration Requirements:
- [ ] **API Integration**: Seamlessly works with Issue #8 endpoints
- [ ] **Database**: Properly uses new schema from Issue #7
- [ ] **Permissions**: Role-based access working correctly
- [ ] **Error Handling**: User-friendly error messages throughout

## Risk Assessment

### High Risk:
- **Complex form dependencies**: Many conditional fields based on selections
- **Bulk upload performance**: Large CSV files may cause timeouts
- **Data migration**: Existing parts need to work with new interface

### Medium Risk:
- **Permission complexity**: Multiple user roles with different access levels
- **API integration**: Dependency on Issue #8 endpoints working correctly
- **Browser compatibility**: Complex forms may have cross-browser issues

### Low Risk:
- **UI component updates**: Existing component structure is solid
- **Database schema**: Already validated in Issue #7

## Success Metrics

### Performance Metrics:
- Form load time < 2 seconds
- Search results returned < 1 second  
- Bulk upload processing 100 parts/minute
- Page responsiveness maintained

### Quality Metrics:
- Zero TypeScript compilation errors
- 100% test coverage for critical paths
- WCAG AA accessibility compliance
- Zero security vulnerabilities

### Business Metrics:
- Reduced part creation time by 50%
- Improved data accuracy through validation
- Enhanced user experience satisfaction
- Streamlined bulk operations workflow

---

**Status**: 🔄 IN PROGRESS - Planning Phase Complete
**Next Phase**: Component Analysis and Implementation
**Estimated Completion**: 4-5 hours from implementation start

This comprehensive plan ensures the admin parts management interface will fully support the enhanced database schema and provide a superior user experience for Cyntek admins managing the parts catalog.