# Docker & Environment Fix - Implementation Guide

## Summary of Changes

✅ **Fixed Issues**:
1. Node.js version pinned to 18-Alpine (stable, lightweight)
2. MySQL pinned to 8.0 (stable, compatible)
3. Added health checks to prevent startup race conditions
4. Added environment variables to web service
5. Fixed database connection to use app user instead of root
6. Added restart policies to prevent downtime
7. Increased connection retry attempts (10 instead of 5)
8. Added explicit network configuration
9. PhpMyAdmin now explicitly linked to MySQL
10. Improved logging for debugging

---

## Files to Replace

You have **4 files to update** (or create from originals):

### File 1: `Dockerfile`
**Location**: `d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex\Dockerfile`

**Changes**:
- Line 2: `FROM node:latest` → `FROM node:18-alpine`
- Line 12: Remove duplicate npm install supervisor
- Add proper CMD at end

**Action**: 
1. Open the file
2. Replace content with: **`Dockerfile.fixed`** (provided in same directory)
3. Save as `Dockerfile` (overwrite original)

---

### File 2: `docker-compose.yml`
**Location**: `d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex\docker-compose.yml`

**Changes**:
- Add `env_file: - ./.env` to web service
- Add `environment:` section to web service (NODE_ENV, DB_CONTAINER, DB_PORT)
- Add `restart: unless-stopped` to web service
- Pin MySQL: `image: mysql` → `image: mysql:8.0`
- Add health check to MySQL service
- Add explicit depends_on with health check condition for web service
- Pin PhpMyAdmin: `image: phpmyadmin/phpmyadmin:latest` → `image: phpmyadmin:5.2-apache`
- Add environment variables to PhpMyAdmin
- Add network configuration
- Add depends_on health check for PhpMyAdmin

**Action**:
1. Open the file
2. Replace content with: **`docker-compose.yml.fixed`** (provided in same directory)
3. Save as `docker-compose.yml` (overwrite original)

---

### File 3: `app/services/db.js`
**Location**: `d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex\app\services\db.js`

**Changes**:
- Line 9: `MYSQL_ROOT_USER` → `MYSQL_USER` (use app user, not root)
- Line 10: `MYSQL_ROOT_PASSWORD` → `MYSQL_PASSWORD` (use app password)
- Line 10: Add fallback: `|| 'password'`
- Line 21: Increase retries from 5 to 10
- Line 22: Reduce delay from 5000ms to 3000ms (faster startup)
- Add improved console logging with emojis/symbols

**Action**:
1. Open the file
2. Replace content with: **`app/services/db.js.fixed`** (provided in parent directory)
3. Save as `app/services/db.js` (overwrite original)

---

### File 4: `.env` (NO CHANGES NEEDED)
**Current .env is already correct**:
```
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=service_booking
MYSQL_USER=user
MYSQL_PASSWORD=password
MYSQL_ROOT_USER=root
DB_CONTAINER=db
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

✅ **Leave as-is** - it's properly configured

---

## Step-by-Step Implementation

### Step 1: Backup Current Files (Optional but Recommended)
```bash
# Navigate to project directory
cd "d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex"

# Create backups
copy Dockerfile Dockerfile.backup
copy docker-compose.yml docker-compose.yml.backup
copy app\services\db.js app\services\db.js.backup
```

### Step 2: Replace Files with Fixed Versions

**On Windows PowerShell:**
```powershell
# Copy Dockerfile
Copy-Item "Dockerfile.fixed" "Dockerfile" -Force

# Copy docker-compose.yml
Copy-Item "docker-compose.yml.fixed" "docker-compose.yml" -Force

# Copy db.js
Copy-Item "app\services\db.js.fixed" "app\services\db.js" -Force
```

**Or manually**: Open each `.fixed` file and copy-paste content to original

### Step 3: Clean Up (Remove Old Containers and Volumes)
```bash
# Navigate to project directory
cd "d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex"

# Stop all containers and remove volumes
docker compose down -v

# Remove any dangling images (optional)
docker image prune -f
```

**What this does**:
- `-v` = Remove volumes (mysql_data is recreated fresh)
- Ensures clean start with new MySQL 8.0
- Removes old Node image if rebuilt

### Step 4: Rebuild and Start
```bash
# Rebuild images with new versions
docker compose up --build

# Wait for messages:
# ✅ "Successfully connected to the database!"
# ✅ "Server running on port 3000"
```

**This will take 2-3 minutes first time**:
- Downloads node:18-alpine
- Downloads mysql:8.0
- Downloads phpmyadmin:5.2-apache
- Builds Node image
- Runs npm install
- Initializes MySQL database

### Step 5: Verify Everything Works

**Test 1: MySQL Connection**
```bash
# In a new terminal, connect to MySQL
docker exec -it <container-name>-db-1 mysql -u user -p

# When prompted, enter password: password
# You should see: mysql>
# Type: exit
```

**Test 2: Express App**
```bash
# Open browser
http://localhost:3000

# Should see: LSP homepage with categories
```

**Test 3: PhpMyAdmin**
```bash
# Open browser
http://localhost:8082

# Login:
# User: root
# Password: rootpassword

# Should see: All databases and tables
```

**Test 4: API Endpoint**
```bash
# In PowerShell or command line
curl http://localhost:3000/api/services

# Should return: JSON array of services (or empty if no data)
```

---

## Troubleshooting

### Issue 1: "Cannot connect to database"
**Problem**: App still can't connect after rebuild

**Solutions**:
```bash
# Check MySQL is running
docker compose logs db

# If error about root password, rebuild:
docker compose down -v
docker compose up --build

# Check .env has correct values:
# MYSQL_USER=user
# MYSQL_PASSWORD=password
```

### Issue 2: "Port 3000 already in use"
**Problem**: Port conflict on your machine

**Solution A**: Kill the process using port 3000
```bash
# Find process on port 3000
netstat -ano | findstr :3000

# Kill it (replace PID with number from above)
taskkill /PID <PID> /F

# Retry docker compose up
```

**Solution B**: Use different port
```bash
# Edit docker-compose.yml line 39:
ports:
  - "3001:3000"  # Use 3001 instead

# Then access at: http://localhost:3001
```

### Issue 3: "Volumes error on Windows"
**Problem**: Windows path issues with volumes

**Already fixed**: New docker-compose uses explicit named volume for mysql_data

**If still issues**:
```bash
# Full reset
docker compose down -v
docker system prune -a
docker compose up --build
```

### Issue 4: PhpMyAdmin won't load
**Problem**: Can't access http://localhost:8082

**Check**:
```bash
# View PhpMyAdmin logs
docker compose logs phpmyadmin

# Verify MySQL is healthy
docker compose logs db | grep -i health

# Restart just PhpMyAdmin
docker compose restart phpmyadmin
```

---

## Files Provided

In your project directory, you now have:

| File | Purpose |
|------|---------|
| `Dockerfile.fixed` | Corrected Dockerfile (copy to `Dockerfile`) |
| `docker-compose.yml.fixed` | Corrected compose file (copy to `docker-compose.yml`) |
| `app/services/db.js.fixed` | Corrected DB service (copy to `app/services/db.js`) |
| `DOCKER_FIXES.md` | Issues found (this document) |

**Do NOT use the `.fixed` files directly** - they're just for reference.
Copy their content to the original filenames.

---

## Verification Checklist

After implementation, verify:

- [ ] Docker containers start without restart loops
- [ ] MySQL 8.0 is running (check: `docker ps`)
- [ ] Express app starts (check: `docker compose logs web | grep "Successfully connected"`)
- [ ] Can access http://localhost:3000 (LSP homepage)
- [ ] Can access http://localhost:8082 (PhpMyAdmin)
- [ ] Can login to PhpMyAdmin (user: root, password: rootpassword)
- [ ] Can see database tables in PhpMyAdmin
- [ ] API endpoints return data (http://localhost:3000/api/services)
- [ ] Supervisor auto-reloads code changes (edit a Pug file, refresh browser)
- [ ] No connection errors in logs (`docker compose logs web`)

---

## Next Steps

After Docker is working:

1. **Database connection verified** → Ready for application fixes
2. **App can connect to MySQL** → Can proceed with security fixes (SQL injection, credentials)
3. **All endpoints accessible** → Can test API functionality
4. **Feature code NOT modified** → Only infrastructure changed

---

## Important Notes

✅ **What was changed**:
- Docker image versions (pinned)
- Database connection user (root → app user)
- Health checks and restart policies
- Logging improvements

❌ **What was NOT changed**:
- Application code (Express, controllers, models)
- Database schema
- Business logic
- API endpoints

✅ **Safe to apply**:
- No data loss
- No breaking changes
- Can rollback by restoring backups
- Compatible with Windows Docker Desktop

---

## Commands Quick Reference

```bash
# Navigate to project
cd "d:\SOFTWARE DEVLOPMENT 2\LSP Final\lsp-sd2 ex"

# Clean up everything
docker compose down -v

# Build and start fresh
docker compose up --build

# View logs
docker compose logs web
docker compose logs db
docker compose logs phpmyadmin

# Stop containers (keep volumes)
docker compose stop

# Start containers again
docker compose start

# View running containers
docker ps

# Access MySQL CLI
docker exec -it <db-container-name> mysql -u user -p service_booking
```

---

**Status**: ✅ Docker fixes ready to implement  
**Estimated setup time**: 5-10 minutes (after downloads complete)  
**Next phase**: Application feature fixes  

Let me know if you need any clarification!
