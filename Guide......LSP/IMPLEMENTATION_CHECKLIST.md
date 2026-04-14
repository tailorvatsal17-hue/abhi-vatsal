# Docker & Environment Setup - Implementation Checklist

## 📋 Pre-Implementation Checklist

- [ ] Closed Docker Desktop (if running)
- [ ] Read README_DOCKER_FIXES.txt
- [ ] Read DOCKER_FIXES.md to understand issues
- [ ] Backed up current Dockerfile (optional but recommended)
- [ ] Backed up current docker-compose.yml (optional but recommended)
- [ ] Backed up current app/services/db.js (optional but recommended)

---

## 🛠️ Implementation Checklist

### Step 1: Copy 3 Files

**File 1: Dockerfile**
- [ ] Locate: `d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex\Dockerfile`
- [ ] Open: `Dockerfile.fixed` (in same directory)
- [ ] Copy all content from `.fixed`
- [ ] Paste into original `Dockerfile`
- [ ] Save file

**File 2: docker-compose.yml**
- [ ] Locate: `d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex\docker-compose.yml`
- [ ] Open: `docker-compose.yml.fixed` (in same directory)
- [ ] Copy all content from `.fixed`
- [ ] Paste into original `docker-compose.yml`
- [ ] Save file

**File 3: app/services/db.js**
- [ ] Locate: `d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex\app\services\db.js`
- [ ] Open: `app/services/db.js.fixed` (in same directory)
- [ ] Copy all content from `.fixed`
- [ ] Paste into original `db.js`
- [ ] Save file

### Step 2: Clean Docker Environment

- [ ] Open PowerShell
- [ ] Navigate: `cd "d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex"`
- [ ] Run: `docker compose down -v`
- [ ] Wait for completion (should show: "Network removed")
- [ ] Verify no errors in output

### Step 3: Build & Start

- [ ] Run: `docker compose up --build`
- [ ] Wait 2-3 minutes for full build
- [ ] Look for these success messages:
  - [ ] "Building web"
  - [ ] "Successfully built"
  - [ ] "Creating db"
  - [ ] "MySQL Server is now running"
  - [ ] "✅ Successfully connected to the database!"
  - [ ] "Server running on port 3000"

---

## ✅ Verification Checklist

After `docker compose up --build` completes:

### Verification 1: Web App
- [ ] Open browser: `http://localhost:3000`
- [ ] Page loads without error
- [ ] See LSP homepage with categories
- [ ] Click on a category
- [ ] Services display correctly

### Verification 2: PhpMyAdmin
- [ ] Open browser: `http://localhost:8082`
- [ ] Login page appears
- [ ] Enter user: `root`
- [ ] Enter password: `rootpassword`
- [ ] Successfully logged in
- [ ] See database `service_booking`
- [ ] See all tables listed
- [ ] Can view table contents

### Verification 3: API Endpoint
- [ ] Open browser: `http://localhost:3000/api/services`
- [ ] JSON response loads (even if empty array)
- [ ] No connection errors

### Verification 4: Docker Logs
- [ ] Open new PowerShell tab
- [ ] Navigate to project directory
- [ ] Run: `docker compose logs web`
- [ ] Look for: "Successfully connected to the database!"
- [ ] No red error messages
- [ ] Run: `docker compose logs db`
- [ ] Look for: "MySQL Server is now running"
- [ ] Run: `docker ps`
- [ ] See 3 containers running:
  - [ ] web container (node app)
  - [ ] db container (mysql)
  - [ ] phpmyadmin container

---

## 🐛 Troubleshooting Checklist

### Issue: Cannot connect to database

- [ ] Run: `docker compose logs db`
- [ ] Check for error messages
- [ ] If "Unknown database", run: `docker compose down -v && docker compose up --build`
- [ ] If "Access denied", verify .env has correct password
- [ ] If "Connection refused", wait 30 seconds more (MySQL takes time)

### Issue: Port 3000 already in use

- [ ] Run: `netstat -ano | findstr :3000`
- [ ] Get PID of process
- [ ] Run: `taskkill /PID <PID> /F` (replace with actual PID)
- [ ] Retry: `docker compose up --build`
- [ ] Or change port in docker-compose.yml to 3001

### Issue: Docker build fails

- [ ] Run: `docker system prune -a`
- [ ] Run: `docker compose down -v`
- [ ] Retry: `docker compose up --build`

### Issue: PhpMyAdmin won't connect

- [ ] Run: `docker compose logs phpmyadmin`
- [ ] Restart just PhpMyAdmin: `docker compose restart phpmyadmin`
- [ ] Check MySQL is running: `docker compose logs db | grep -i running`

---

## 📊 Post-Implementation Checklist

After all verifications pass:

- [ ] All 3 containers running (docker ps)
- [ ] Web app loads (localhost:3000)
- [ ] PhpMyAdmin accessible (localhost:8082)
- [ ] API responds (localhost:3000/api/services)
- [ ] No connection errors in logs
- [ ] Database initialized with all tables
- [ ] Ready for next phase of fixes

---

## 🎯 Optional: Test Auto-Reload (Supervisor)

- [ ] Open: `app/views/index.pug` in editor
- [ ] Make a small change (edit text in a pug file)
- [ ] Save file
- [ ] Refresh: `http://localhost:3000`
- [ ] Change appears (supervisor auto-reloaded)
- [ ] Revert your change

---

## 💾 Cleanup Checklist

After everything works:

- [ ] Delete `.fixed` files if desired (optional, they're just for reference)
- [ ] Or keep them for rollback reference
- [ ] Backup your working docker-compose.yml
- [ ] Backup your working Dockerfile
- [ ] Commit changes to git with message: "Fix: Docker & environment setup"

---

## 📝 Notes for This Implementation

**What was changed**:
- ✅ Dockerfile (Node version, dependencies)
- ✅ docker-compose.yml (health checks, env vars, service config)
- ✅ app/services/db.js (database user credentials)

**What was NOT changed**:
- ❌ .env file
- ❌ package.json
- ❌ Application code
- ❌ Database schema
- ❌ API endpoints

**Result**:
- ✅ Stable Docker environment
- ✅ Reliable database connection
- ✅ Ready for next phase of fixes

---

## 📞 Quick Reference Commands

```bash
# Navigate to project
cd "d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex"

# Clean & reset
docker compose down -v

# Build & start
docker compose up --build

# View logs
docker compose logs web
docker compose logs db
docker compose logs phpmyadmin

# Check status
docker ps

# Stop (keep data)
docker compose stop

# Start again
docker compose start

# Restart all
docker compose restart
```

---

## ✅ Sign Off

- [ ] All files copied
- [ ] Docker environment cleaned
- [ ] `docker compose up --build` executed
- [ ] All 4 verification tests passed
- [ ] No errors in logs
- [ ] Ready for application fixes

---

**Estimated Time**: 10-15 minutes (including downloads)  
**Difficulty**: Easy (mostly copy-paste)  
**Risk Level**: Very Low  

**Status**: Ready to implement

---

*Docker & Environment Setup - Complete Implementation Checklist*  
*All 10 issues identified and corrected*  
*Ready to restore your development environment*
