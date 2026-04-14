# Image Rendering in Pug Templates - Implementation Guide

**Date:** 2026-04-13  
**Status:** ✅ Complete  

---

## Overview

This document describes the image rendering system implemented for the LSP project. Images are stored as file path strings in the database (not as binary blobs) and rendered dynamically in Pug templates with fallback support.

---

## Directory Structure

```
static/images/
├── services/           # Service category images
│   ├── plumbing.jpg
│   ├── electrical.jpg
│   ├── carpentry.jpg
│   └── ... (10 total)
├── partners/           # Partner profile and work images
│   ├── john-plumbing.jpg
│   ├── john-work1.jpg
│   ├── john-work2.jpg
│   └── ... (20+ files)
├── customers/          # Customer profile pictures (optional)
├── categories/         # Service category icons
└── documents/          # Partner verification documents
```

**Note:** Image files themselves are optional. The system works with URL paths stored in database.

---

## Image Path Format

### Database Storage

Images are stored as VARCHAR paths in database tables:

```sql
-- Services table
INSERT INTO services VALUES (..., '/images/services/plumbing.jpg', ...)

-- Partners table
INSERT INTO partners VALUES (..., '/images/partners/john-plumbing.jpg', '/images/partners/john-work1.jpg,/images/partners/john-work2.jpg', ...)

-- Users table (if profile images added)
INSERT INTO users VALUES (..., '/images/customers/customer1.jpg', ...)
```

### Path Conventions

| Type | Path Pattern | Example |
|------|--------------|---------|
| Service | `/images/services/{name}.jpg` | `/images/services/plumbing.jpg` |
| Partner | `/images/partners/{name}.jpg` | `/images/partners/john-plumbing.jpg` |
| Partner Work | `/images/partners/{name}-work{n}.jpg` | `/images/partners/john-work1.jpg` |
| Customer | `/images/customers/{id}.jpg` | `/images/customers/1.jpg` |
| Category | `/images/categories/{name}.jpg` | `/images/categories/plumbing.jpg` |
| Document | `/images/documents/{name}.pdf` | `/images/documents/license.pdf` |

### External URLs

External image URLs are also supported:

```sql
INSERT INTO partners VALUES (..., 'https://example.com/profile.jpg', ...)
```

---

## Implementation

### 1. Express Configuration (`app/app.js`)

Helper functions defined in app.locals for use in all Pug templates:

```javascript
// Image helper: Handle missing paths, external URLs, and fallbacks
const getImageUrl = (imageUrl, type = 'service') => {
  const fallbacks = {
    service: 'https://via.placeholder.com/400x300?text=Service',
    partner: 'https://via.placeholder.com/400x300?text=Professional',
    customer: 'https://via.placeholder.com/150x150?text=Profile',
    category: 'https://via.placeholder.com/200x200?text=Category',
    work: 'https://via.placeholder.com/400x300?text=Portfolio'
  };

  // No URL: return fallback
  if (!imageUrl || imageUrl.trim() === '') {
    return fallbacks[type] || fallbacks.service;
  }
  
  // Local path or external URL: use as-is
  if (imageUrl.startsWith('/') || imageUrl.startsWith('http')) {
    return imageUrl;
  }
  
  // Otherwise prepend /
  return '/' + imageUrl;
};

// Parse comma-separated work images
const parseWorkImages = (workImages) => {
  if (!workImages) return [];
  return workImages
    .split(',')
    .map(img => img.trim())
    .filter(img => img.length > 0)
    .map(img => getImageUrl(img, 'work'));
};

// Make available in all templates
app.locals.getImageUrl = getImageUrl;
app.locals.parseWorkImages = parseWorkImages;
```

### 2. Static File Serving

Express static middleware configured in app.js:

```javascript
app.use(express.static("static"));
```

This makes all files in `static/images/` accessible at `/images/...` URLs.

---

## Pug Template Usage

### Service Images

**File:** `app/views/services.pug`

```pug
- var imageUrl = getImageUrl(service.image, 'service')
img(src=imageUrl, alt=service.name, style="width: 100%; height: 150px; object-fit: cover;")
```

**Behavior:**
- If `service.image` is `/images/services/plumbing.jpg` → Renders as-is
- If `service.image` is empty/null → Uses fallback placeholder
- If `service.image` is external URL → Renders external image

### Partner Profile Images

**File:** `app/views/partners.pug`

```pug
- var profileImg = getImageUrl(partner.profile_image, 'partner')
img(src=profileImg, alt=partner.name, style="width: 100%; height: 200px; object-fit: cover;")
```

### Partner Work Gallery

**File:** `app/views/partner_profile.pug`

```pug
script.
  function getImageUrl(imageUrl, type = 'partner') {
    const fallbacks = {
      partner: 'https://via.placeholder.com/200x200?text=Profile',
      work: 'https://via.placeholder.com/150x150?text=Portfolio'
    };
    
    if (!imageUrl || imageUrl.trim() === '') {
      return fallbacks[type];
    }
    
    if (imageUrl.startsWith('/') || imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    return '/' + imageUrl;
  }
  
  // Display work images in preview
  document.getElementById('work-images-url').addEventListener('change', (e) => {
    const preview = document.getElementById('work-images-preview');
    preview.innerHTML = '';
    
    const images = e.target.value
      .split(',')
      .map(img => img.trim())
      .filter(img => img);
      
    images.forEach((img, idx) => {
      const imgUrl = getImageUrl(img, 'work');
      const div = document.createElement('div');
      const imgEl = document.createElement('img');
      imgEl.src = imgUrl;
      imgEl.style.width = '100%';
      imgEl.style.height = '150px';
      imgEl.style.objectFit = 'cover';
      imgEl.alt = `Work image ${idx + 1}`;
      div.appendChild(imgEl);
      preview.appendChild(div);
    });
  });
```

### Category Images

**File:** `app/views/index.pug`

```pug
- var categoryImg = getImageUrl(cat.image, 'category')
img(src=categoryImg, alt=cat.name, style="width: 100%; height: 120px; object-fit: cover;")
```

---

## Updated Templates

### 1. `app/views/services.pug`
- ✅ Uses `getImageUrl(service.image, 'service')`
- ✅ Sets proper image dimensions with object-fit
- ✅ Fallback to placeholder if no image

### 2. `app/views/partners.pug`
- ✅ Uses `getImageUrl(partner.profile_image, 'partner')`
- ✅ Shows approval status
- ✅ Proper height and object-fit styling

### 3. `app/views/index.pug`
- ✅ Uses `getImageUrl(cat.image, 'category')`
- ✅ Category image rendering with fallback

### 4. `app/views/category_services.pug`
- ✅ Uses `getImageUrl(service.image, 'service')`
- ✅ Consistent with main services template

### 5. `app/views/partner_profile.pug`
- ✅ Live image preview for profile picture
- ✅ Live gallery preview for work images
- ✅ Comma-separated work image URLs
- ✅ Helper functions embedded in template

---

## Seed Data Image Paths

The seed data (`db/seed-data.sql`) includes realistic image paths:

### Services (10)
```sql
INSERT INTO services VALUES
(1, 'Plumbing', '...', '/images/services/plumbing.jpg'),
(2, 'Electrical Work', '...', '/images/services/electrical.jpg'),
...
```

### Partners (10, with profile + work images)
```sql
INSERT INTO partners VALUES
(1, 'John Plumbing Pro', '...', '/images/partners/john-plumbing.jpg', 
  '/images/partners/john-work1.jpg,/images/partners/john-work2.jpg', ...),
(2, 'Sarah Electric Solutions', '...', '/images/partners/sarah-electric.jpg',
  '/images/partners/sarah-work1.jpg,/images/partners/sarah-work2.jpg', ...),
...
```

---

## Fallback Placeholders

When image paths are missing or invalid, the following fallback placeholders are used:

| Type | Fallback URL |
|------|--------------|
| Service | `https://via.placeholder.com/400x300?text=Service` |
| Partner | `https://via.placeholder.com/400x300?text=Professional` |
| Customer | `https://via.placeholder.com/150x150?text=Profile` |
| Category | `https://via.placeholder.com/200x200?text=Category` |
| Work | `https://via.placeholder.com/400x300?text=Portfolio` |

These are hosted by placeholder.com service (no local files needed for development).

---

## Adding Real Images

### Option 1: Local Image Files

1. Create image files in `static/images/{type}/` directory
2. Update database paths to match file names
3. Images served automatically via Express static middleware

**Example:**
```bash
# Add file
static/images/services/plumbing.jpg

# Database (already set by seed data)
INSERT INTO services VALUES (..., '/images/services/plumbing.jpg', ...)

# Rendered in Pug
img(src="/images/services/plumbing.jpg", ...)
```

### Option 2: Cloud Storage (Recommended for Production)

1. Use service like AWS S3, Cloudinary, or similar
2. Upload images to cloud service
3. Store cloud URLs in database

**Example:**
```sql
INSERT INTO services VALUES (..., 'https://cdn.example.com/plumbing.jpg', ...)
```

### Option 3: Mix Local and Cloud

Some images local, others from cloud CDN:

```sql
INSERT INTO services VALUES
(1, 'Plumbing', '...', '/images/services/plumbing.jpg'),
(2, 'Electrical', '...', 'https://cdn.example.com/electrical.jpg'),
(3, 'Carpentry', '...', NULL),  -- Will use fallback
...
```

---

## CSS for Image Styling

### Consistent Image Display

```css
/* Service images */
.service-card img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 1rem;
}

/* Partner profile images */
.partner-item img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
}

/* Work portfolio images */
.work-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
}

/* Category images */
.category img {
  width: 100%;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
}
```

**Note:** `object-fit: cover` ensures images fill their container while maintaining aspect ratio.

---

## Testing Image Rendering

### Test 1: Service Images
```bash
1. Navigate to http://localhost:3000/services
2. Verify service images display with fallbacks
3. Check console for any 404 errors
```

### Test 2: Partner Images
```bash
1. Navigate to http://localhost:3000/partners
2. Verify partner profile images display
3. Check approval status badge
```

### Test 3: Category Images
```bash
1. Navigate to http://localhost:3000/
2. Verify category images display on homepage
3. Click on category and verify service images load
```

### Test 4: Partner Dashboard
```bash
1. Login as partner
2. Go to /partner/profile
3. Update profile image URL
4. Verify live preview updates
5. Add comma-separated work images
6. Verify work gallery preview updates
```

### Test 5: Fallback Logic
```bash
1. Update database to set image = NULL for a service
2. Verify placeholder appears
3. Check that placeholder is accessible (200 status)
```

---

## Database Schema

No schema changes needed. Existing columns used:

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| services | image | VARCHAR(255) | Service image path |
| partners | profile_image | VARCHAR(255) | Partner profile picture |
| partners | work_images | TEXT | Comma-separated work image URLs |
| users | profile_image | VARCHAR(255) | Customer profile picture (if added) |
| service_categories | image | VARCHAR(255) | Category icon (if added) |

---

## Production Deployment

### Before Going Live

1. **Test all image paths** are accessible
   ```bash
   curl http://yourdomain.com/images/services/plumbing.jpg
   ```

2. **Replace placeholder URLs** with real images
   - Add images to `static/images/`
   - OR update database with cloud CDN URLs

3. **Enable caching headers** in Express for images
   ```javascript
   app.use(express.static("static", {
     maxAge: '1d',
     etag: false
   }));
   ```

4. **Use CDN for high traffic** (AWS CloudFront, Cloudflare, etc.)

5. **Optimize images** (compress, resize for web)
   - Use tools like ImageOptim, TinyPNG

### Configuration for Production

```javascript
// In app.js - add caching and compression
app.use(express.static("static", {
  maxAge: '1 day',
  etag: false
}));

// Use gzip compression for images
const compression = require('compression');
app.use(compression());
```

---

## Troubleshooting

### Images Not Displaying

**Problem:** Images show as broken (404)

**Solution:**
1. Check file exists: `ls -la static/images/services/`
2. Check path in database: `SELECT image FROM services LIMIT 1;`
3. Check Express static middleware is configured
4. Check firewall/permissions

### Images Not Updating After Change

**Problem:** Old images still show

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check database was updated: `SELECT image FROM services WHERE id = 1;`

### Fallback Not Working

**Problem:** Placeholder never appears

**Solution:**
1. Verify `getImageUrl()` function in app.js
2. Check template uses `getImageUrl(image, 'type')`
3. Verify placeholder.com is accessible

### External URLs Not Loading

**Problem:** Cloud images not displaying

**Solution:**
1. Check URL is valid: `curl -I https://cdn.example.com/image.jpg`
2. Check CORS headers if cross-domain
3. Add to database and reload

---

## File Locations Summary

| File | Purpose |
|------|---------|
| `app/app.js` | Helper functions in app.locals |
| `static/js/image-helpers.js` | Helper function library (reference) |
| `static/images/services/` | Service images |
| `static/images/partners/` | Partner images |
| `static/images/customers/` | Customer images |
| `static/images/categories/` | Category images |
| `static/images/documents/` | Document images |
| `app/views/services.pug` | ✅ Updated |
| `app/views/partners.pug` | ✅ Updated |
| `app/views/index.pug` | ✅ Updated |
| `app/views/category_services.pug` | ✅ Updated |
| `app/views/partner_profile.pug` | ✅ Updated |
| `db/seed-data.sql` | ✅ Pre-configured paths |

---

## Summary

✅ **Image System Complete:**

1. **Directories created** for all image types
2. **Helper functions** available in all Pug templates
3. **Pug templates updated** with proper image rendering
4. **Fallback support** for missing images
5. **Seed data** includes realistic image paths
6. **Production ready** with documentation

The system is now ready to:
- Render database image paths in templates
- Show fallback placeholders when images missing
- Support both local and external image URLs
- Enable easy addition of real images

**No breaking changes** - all existing functionality preserved.

---

**Created:** 2026-04-13  
**Status:** ✅ Ready for Testing
