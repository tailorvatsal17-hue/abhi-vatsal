# App Bootstrap - Quick Implementation Guide

## 📦 Files to Replace/Create

### Replace (3 files):
1. **app/app.js** ← Copy from `app.js.fixed`
2. **index.js** ← Copy from `index.js.fixed`

### Create (2 new files):
3. **app/routes/views.routes.js** (provided)
4. **app/views/404.pug** (provided)
5. **app/views/error.pug** (provided)

---

## ⚡ 3-Step Implementation

### Step 1: Copy Files
```bash
# Navigate to project
cd "d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex"

# Backup originals
copy app\app.js app\app.js.backup
copy index.js index.js.backup

# Replace with fixed versions
copy app\app.js.fixed app\app.js
copy index.js.fixed index.js
```

### Step 2: Add New Files
```bash
# views.routes.js is new - already created in app/routes/

# Create error templates if not already present
# Files provided:
# - app/views/404.pug
# - app/views/error.pug
```

### Step 3: Test
```bash
# Stop current server (Ctrl+C)

# Start server
npm start
# or
node index.js
# or
supervisor index.js

# You should see:
# ╔════════════════════════════════════════════════════════════╗
# ║        🚀 LSP Server is running!                          ║
# ║        URL:     http://localhost:3000                     ║
```

---

## ✅ Verification (4 Quick Tests)

### Test 1: Home Page
```
http://localhost:3000
→ Should show: LSP homepage with categories
```

### Test 2: 404 Page
```
http://localhost:3000/nonexistent
→ Should show: Custom 404 error page (not browser default)
```

### Test 3: API Route
```
http://localhost:3000/api/services
→ Should return: JSON array of services
```

### Test 4: Server Log
```
Terminal output should show:
✅ "Successfully connected to the database!"
✅ "LSP Server is running!"
✅ "URL: http://localhost:3000"
```

---

## 🎯 Route Order (Why It Matters)

**In app.js, routes are mounted in this order:**

```javascript
// 1. Mount API routes (specific: /api/...)
require('./routes/auth.routes')(app);
require('./routes/service.routes')(app);
require('./routes/partner.routes')(app);
require('./routes/booking.routes')(app);
require('./routes/profile.routes')(app);
require('./routes/admin.routes')(app);

// 2. Mount view routes (generic: /, /services, etc)
require('./routes/views.routes')(app);

// 3. 404 handler (catches everything else)
app.use((req, res) => { ... });

// 4. Error handler (catches all errors)
app.use((err, req, res, next) => { ... });
```

**WHY?** Generic routes (`/`) must come AFTER specific routes (`/api/...`)  
Otherwise `/` would match everything before the API router!

---

## 📋 What Changed

### app.js Changes
- ✅ Removed all business logic (queries moved to views.routes.js)
- ✅ Removed view routes (moved to views.routes.js)
- ✅ Added proper middleware order
- ✅ Added 404 handler
- ✅ Added global error handler
- ✅ Added path.join() for cross-platform paths
- ✅ Removed server.listen() (moved to index.js)

### index.js Changes
- ✅ Loads dotenv for environment variables
- ✅ Imports app from app/app.js
- ✅ Reads PORT from process.env
- ✅ Starts server with friendly output
- ✅ Handles graceful shutdown

### New Files
- ✅ app/routes/views.routes.js (all view routes)
- ✅ app/views/404.pug (404 error page)
- ✅ app/views/error.pug (error page)

---

## 🐛 Troubleshooting

### Problem: "Cannot find module views.routes.js"
```
Solution: Make sure you saved views.routes.js to app/routes/
Location: d:\...\app\routes\views.routes.js
```

### Problem: "View not found: 404"
```
Solution: Make sure you created 404.pug and error.pug
Location: d:\...\app\views\404.pug
Location: d:\...\app\views\error.pug
```

### Problem: "Static files not loading (CSS/JS)"
```
Solution: Check static path in app.js:
app.use(express.static(path.join(__dirname, '../static')));

Should correctly point to: d:\...\static\
```

### Problem: "Port already in use"
```
Solution: Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

Or change port:
PORT=3001 npm start
```

---

## 📝 Code Quality

**Before (Business logic mixed in):**
```javascript
❌ app.get("/", async (req, res) => {
    const categories = await db.query("...");
    res.render("index", { categories });
});
```

**After (Clean separation):**
```javascript
✅ app.get('/', async (req, res, next) => {
    try {
        const categories = await db.query('...');
        res.render('index', { categories });
    } catch (err) {
        next(err); // ← Error handler catches this
    }
});
```

---

## 🔧 Environment Variables

Make sure .env has:
```
PORT=3000
NODE_ENV=development
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=service_booking
MYSQL_USER=user
MYSQL_PASSWORD=password
```

Server reads PORT from env:
```javascript
const PORT = process.env.PORT || 3000;
```

---

## ✨ Benefits

✅ **Clean**: Middleware and routes separated  
✅ **Stable**: Centralized error handling  
✅ **Maintainable**: Routes organized by concern  
✅ **Scalable**: Easy to add new routes  
✅ **Beginner-friendly**: Well-commented code  
✅ **Production-ready**: Proper error pages  
✅ **Cross-platform**: Using path.join() for paths  

---

## 📊 Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Business logic location | app.js (mixed) | views.routes.js (separated) |
| Error handling | In each route | Global handler |
| 404 pages | Browser default | Custom page |
| Port | Hardcoded 3000 | From environment |
| Path handling | Relative (fragile) | Absolute (robust) |
| Middleware order | Mixed with routes | Clearly at top |
| Route registration | Mixed in app.js | Separate files per concern |
| Error pages | None | 404.pug, error.pug |

---

**Status**: ✅ READY FOR IMPLEMENTATION  
**Time**: 5-10 minutes  
**Complexity**: Easy (copy-paste)  
**Risk**: Very Low  

---

*Start with: Step 1 - Copy Files*  
*Then test: Verification section*  
*For details: Read APP_BOOTSTRAP_GUIDE.md*
