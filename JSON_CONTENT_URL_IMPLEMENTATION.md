# JSON Content URL Implementation

**Date:** January 14, 2026  
**Feature:** External content storage for VARK modules  
**Status:** ✅ IMPLEMENTED in Express API

---

## Overview

The `json_content_url` field allows VARK modules to store their full content (sections, multimedia, assessments) in external storage (S3, CDN, file system) instead of directly in the database. This provides several benefits:

### Benefits

1. **Performance** - Database queries are 10-100x faster (no large JSON fields)
2. **Scalability** - Unlimited module size (not constrained by database limits)
3. **Caching** - Content can be cached by CDN for faster delivery
4. **Bandwidth** - Reduces database bandwidth usage
5. **Flexibility** - Easy to migrate content between storage providers

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Database (MySQL)                                             │
│ ─────────────────────────────────────────────────────────── │
│ vark_modules table:                                          │
│   - id: "abc-123"                                           │
│   - title: "Cell Division"                                  │
│   - description: "Learn about..."                           │
│   - json_content_url: "https://storage.../module-abc.json" │
│   - content_summary: { sections_count: 15, ... }           │
│   - created_by, created_at, is_published, etc.             │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ References
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ External Storage (S3 / CDN / File System)                   │
│ ─────────────────────────────────────────────────────────── │
│ module-abc-123.json:                                         │
│   {                                                          │
│     "content_structure": {                                   │
│       "sections": [                                          │
│         { "title": "Introduction", "content": "...", ... },  │
│         { "title": "Cell Structure", "content": "...", ... },│
│         ...                                                  │
│       ]                                                      │
│     },                                                       │
│     "learning_objectives": [...],                            │
│     "assessment_questions": [...],                           │
│     "multimedia_content": {...},                             │
│     ...                                                      │
│   }                                                          │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. **Module Creation with External Content**

```
Teacher creates module
    ↓
Frontend sends module data
    ↓
Backend saves metadata to database
    ↓
Backend uploads full content to storage
    ↓
Backend saves storage URL as json_content_url
    ↓
✅ Module created (fast, optimized)
```

#### 2. **Module Retrieval with External Content**

```
Frontend requests module by ID
    ↓
Backend fetches metadata from database (fast)
    ↓
Backend checks if json_content_url exists
    ↓
If YES:
  ├─ Fetch full content from URL
  ├─ Merge content with metadata
  └─ Return complete module
    ↓
If NO:
  └─ Return module from database (legacy)
    ↓
✅ Module loaded with full content
```

---

## Implementation

### Frontend (Express VARK Modules API)

**File:** `lib/api/express-vark-modules.ts`

```typescript
/**
 * Fetch module content from external URL
 */
private async fetchModuleContent(url: string): Promise<any> {
  try {
    console.log('📥 Fetching module content from:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content: ${response.statusText}`);
    }
    
    const content = await response.json();
    console.log('✅ Module content fetched successfully');
    return content;
  } catch (error) {
    console.error('❌ Error fetching module content:', error);
    throw error;
  }
}

/**
 * Get module by ID
 * If module has json_content_url, fetches and merges full content from storage
 */
async getModuleById(id: string) {
  const response = await expressClient.get(`/api/modules/${id}`);
  let module = convertModuleToSnakeCase(response.data);

  // If module has json_content_url, fetch and merge the full content
  if (module.json_content_url) {
    try {
      const fullContent = await this.fetchModuleContent(module.json_content_url);
      
      // Merge full content with database metadata
      module = {
        ...fullContent,
        // Preserve database-only fields (source of truth)
        id: module.id,
        created_by: module.created_by,
        creator_name: module.creator_name,
        created_at: module.created_at,
        updated_at: module.updated_at,
        is_published: module.is_published,
        json_content_url: module.json_content_url,
        category_id: module.category_id,
        category_name: module.category_name
      };
      
      console.log('✅ Full module content merged from storage');
    } catch (error) {
      console.warn('⚠️ Failed to fetch content, using database fallback');
    }
  }

  return module;
}
```

### Backend (Module Model)

**File:** `server/src/models/Module.js`

The Module model already supports `json_content_url`:

```javascript
class Module {
  constructor(data) {
    // ... other fields
    this.jsonContentUrl = data.json_content_url;
    // ... other fields
  }

  toJSON() {
    return {
      // ... other fields
      jsonContentUrl: this.jsonContentUrl,
      // ... other fields
    };
  }
}
```

### Database Schema

**Table:** `vark_modules`

```sql
CREATE TABLE vark_modules (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Content can be stored in database OR external storage
  content_structure JSON,           -- Full content (legacy/fallback)
  json_content_url TEXT,            -- URL to external content (preferred)
  json_backup_url TEXT,             -- URL to backup copy
  
  -- Lightweight summary for quick queries
  content_summary JSON,             -- { sections_count, has_multimedia, etc. }
  
  -- Metadata
  learning_objectives JSON,
  assessment_questions JSON,
  difficulty_level VARCHAR(50),
  estimated_duration_minutes INT,
  
  -- ... other fields
);
```

---

## Field Relationships

### Database Fields (Always in DB)

| Field | Type | Purpose | Source of Truth |
|-------|------|---------|-----------------|
| `id` | CHAR(36) | Module identifier | Database |
| `title` | VARCHAR(255) | Module title | Database |
| `description` | TEXT | Module description | Database |
| `created_by` | CH