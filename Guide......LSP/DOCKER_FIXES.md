# Docker & Environment Setup Fixes

## Issues Found

### 1. **Node.js Image Not Pinned** (Dockerfile line 2)
- **Problem**: `FROM node:latest` uses unpredictable version
- **Risk**: Different environments get different Node versions
- **Fix**: Pin to `node:18-alpine` (lightweight, stable)

### 2. **MySQL Image Not Pinned** (docker-compose.yml line 14)
- **Problem**: `image: mysql` uses latest version
- **Risk**: Major version jumps break compatibility
- **Fix**: Pin to `mysql:8.0` (stable, compatible)

### 3. **Missing Health Checks**
- **Problem**: Web service starts before database is ready
- **Risk**: Connection failures, restart loops
- **Fix**: Add `depends_on` with health check for MySQL

### 4. **Environment Variables Not Passed to Web Service**
- **Problem**: docker-compose doesn't pass .env to web service
- **Risk**: App can't access DB credentials
- **Fix**: Add `env_file` to web service in compose

### 5. **Wrong Database User in Connection**
- **Problem**: db.js uses MYSQL_ROOT_USER (root) instead of MYSQL_USER
- **Risk**: Connection attempts with wrong credentials
- **Fix**: Use correct app user from .env

### 6. **Database Initialization Race Condition**
- **Problem**: DB might not be fully initialized when app connects
- **Risk**: "Unknown database" errors
- **Fix**: Increase retry attempts and delays

### 7. **Missing Restart Policy on Web Service**
- **Problem**: App container crashes but doesn't restart
- **Risk**: Downtime if something fails
- **Fix**: Add `restart: unless-stopped`

### 8. **PhpMyAdmin Missing Web Service Link**
- **Problem**: PhpMyAdmin has `env_file` but doesn't know about `db` service
- **Risk**: PhpMyAdmin can't connect to MySQL
- **Fix**: Add explicit `links` or use depends_on

### 9. **Supervisor Command Not Environment-Aware**
- **Problem**: Hard-coded NODE_ENV not explicitly set in container
- **Risk**: App might think it's production
- **Fix**: Set NODE_ENV=development in environment

### 10. **Volume Mount Could Cause Issues on Windows**
- **Problem**: Anonymous volume `/src/node_modules` might conflict
- **Risk**: node_modules permission issues on Windows
- **Fix**: Ensure named volume is used properly

---

## Files That Need Changes

✅ **Dockerfile** - Pin Node version  
✅ **docker-compose.yml** - Pin MySQL, add env_file to web, add health checks, restart policies  
✅ **app/services/db.js** - Use MYSQL_USER instead of MYSQL_ROOT_USER  
⏭️ **.env** - Already OK, no changes needed

---

## Corrected Files (Below)

Use these to replace your current files.
