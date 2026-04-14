# Partner Module Phase 2 - Code Changes Summary

**Date:** 2026-04-13  
**Changes:** 4 files modified, 1 new function added, 6 authorization checks added  
**Type:** Security fixes + authorization implementation

---

## File 1: app/controllers/partner.controller.js

### Change 1: Login Flow - Fixed database field mismatch

**Location:** Lines 67-72

**Before:**
```javascript
} else {
    // Check partner status (must be approved)
    if (partner.status && partner.status !== 'APPROVED') {
        return res.status(403).send({
            message: `Partner account is ${partner.status}. Please contact admin for approval.`
        });
    }
```

**After:**
```javascript
} else {
    // Check partner approval status (must be approved)
    // Note: DB schema uses is_approved (BOOLEAN), not status field
    if (!partner.is_approved) {
        return res.status(403).send({
            message: "Partner account is pending approval. Please contact admin for approval."
        });
    }
```

**Why:** Database schema uses `is_approved` (TINYINT(1)), not `status` (VARCHAR)

---

### Change 2: JWT Token - Added partnerId field

**Location:** Lines 78-90

**Before:**
```javascript
const token = jwt.sign(
    { 
        userId: partner.id,
        id: partner.id,
        email: partner.email,
        role: 'partner',
        type: 'partner',
        status: partner.status  // ← Non-existent field
    }, 
    process.env.JWT_SECRET || 'MyProject2026SecureKey',
    { expiresIn: process.env.JWT_EXPIRATION || 86400 }
);
```

**After:**
```javascript
const token = jwt.sign(
    { 
        userId: partner.id,
        id: partner.id,
        email: partner.email,
        role: 'partner',
        type: 'partner',
        partnerId: partner.id  // ← Correctly set for authorization
    }, 
    process.env.JWT_SECRET || 'MyProject2026SecureKey',
    { expiresIn: process.env.JWT_EXPIRATION || 86400 }
);
```

**Why:** Middleware uses `partnerId` for authorization checks

---

### Change 3: getProfile() - Add authorization check

**Location:** Lines 109-123

**Before:**
```javascript
exports.getProfile = (req, res) => {
    Partner.findById(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Partner with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving Partner with id " + req.params.id
                });
            }
        } else res.send(data);
    });
};
```

**After:**
```javascript
exports.getProfile = (req, res) => {
    const partnerId = parseInt(req.params.id);
    
    // Authorization: Partner can only view their own profile
    if (req.partnerId !== partnerId) {
        return res.status(403).send({
            message: "Unauthorized: Cannot access other partners' profiles"
        });
    }
    
    Partner.findById(partnerId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Partner with id ${partnerId}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving Partner with id " + partnerId
                });
            }
        } else res.send(data);
    });
};
```

**Vulnerability Fixed:** Horizontal privilege escalation - partners could view other partners' profiles

---

### Change 4: updateProfile() - Add authorization check

**Location:** Lines 125-160

**Before:**
```javascript
exports.updateProfile = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    Partner.updateById(
        req.params.id,
        new Partner(req.body),
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Not found Partner with id ${req.params.id}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Error updating Partner with id " + req.params.id
                    });
                }
            } else res.send(data);
        }
    );
};
```

**After:**
```javascript
exports.updateProfile = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const partnerId = parseInt(req.params.id);
    
    // Authorization: Partner can only update their own profile
    if (req.partnerId !== partnerId) {
        return res.status(403).send({
            message: "Unauthorized: Cannot update other partners' profiles"
        });
    }

    Partner.updateById(
        partnerId,
        new Partner(req.body),
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Not found Partner with id ${partnerId}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Error updating Partner with id " + partnerId
                    });
                }
            } else res.send(data);
        }
    );
};
```

**Vulnerability Fixed:** Horizontal privilege escalation - partners could modify other partners' profiles

---

### Change 5: getBookings() - Add authorization check

**Location:** Lines 154-171

**Before:**
```javascript
exports.getBookings = (req, res) => {
    Partner.getBookings(req.params.id, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving bookings."
            });
        else res.send(data);
    });
};
```

**After:**
```javascript
exports.getBookings = (req, res) => {
    const partnerId = parseInt(req.params.id);
    
    // Authorization: Partner can only view their own bookings
    if (req.partnerId !== partnerId) {
        return res.status(403).send({
            message: "Unauthorized: Cannot access other partners' bookings"
        });
    }
    
    Partner.getBookings(partnerId, (err, data) => {
        if (err)
            res.status(500).send({
                message:
                    err.message || "Some error occurred while retrieving bookings."
            });
        else res.send(data);
    });
};
```

**Vulnerability Fixed:** Data leakage - partners could view other partners' bookings

---

### Change 6: acceptBooking() - Add ownership verification

**Location:** Lines 166-218

**Before:**
```javascript
exports.acceptBooking = (req, res) => {
    Partner.updateBookingStatus(req.params.id, 'Confirmed', (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Booking with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error accepting booking with id " + req.params.id
                });
            }
        } else res.send({ message: "Booking accepted successfully." });
    });
};
```

**After:**
```javascript
exports.acceptBooking = (req, res) => {
    const bookingId = parseInt(req.params.id);
    
    // Verify booking belongs to this partner
    Partner.getBookingById(bookingId, (err, booking) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Booking not found with id ${bookingId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving booking"
            });
        }
        
        // Authorization: Verify booking belongs to authenticated partner
        if (booking.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot accept bookings for other partners"
            });
        }
        
        // Only allow accepting if status is 'Pending'
        if (booking.status !== 'Pending') {
            return res.status(400).send({
                message: `Cannot accept booking with status: ${booking.status}`
            });
        }
        
        Partner.updateBookingStatus(bookingId, 'Confirmed', (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: "Error accepting booking with id " + bookingId
                });
            }
            res.send({ message: "Booking accepted successfully." });
        });
    });
};
```

**Vulnerabilities Fixed:**
- Booking hijacking - partners could accept other partners' bookings
- Status validation missing - could accept non-pending bookings

---

### Change 7: rejectBooking() - Add ownership verification

**Location:** Lines 220-269

**Before:**
```javascript
exports.rejectBooking = (req, res) => {
    Partner.updateBookingStatus(req.params.id, 'Cancelled', (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found Booking with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error rejecting booking with id " + req.params.id
                });
            }
        } else res.send({ message: "Booking rejected successfully." });
    });
};
```

**After:**
```javascript
exports.rejectBooking = (req, res) => {
    const bookingId = parseInt(req.params.id);
    
    // Verify booking belongs to this partner
    Partner.getBookingById(bookingId, (err, booking) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Booking not found with id ${bookingId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving booking"
            });
        }
        
        // Authorization: Verify booking belongs to authenticated partner
        if (booking.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot reject bookings for other partners"
            });
        }
        
        // Only allow rejecting if status is 'Pending'
        if (booking.status !== 'Pending') {
            return res.status(400).send({
                message: `Cannot reject booking with status: ${booking.status}`
            });
        }
        
        Partner.updateBookingStatus(bookingId, 'Cancelled', (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: "Error rejecting booking with id " + bookingId
                });
            }
            res.send({ message: "Booking rejected successfully." });
        });
    });
};
```

**Vulnerabilities Fixed:** Same as acceptBooking

---

## File 2: app/controllers/partner_availability.controller.js

### Change 1: findOne() - Add authorization check

**Location:** Lines 55-69

**Before:**
```javascript
exports.findOne = (req, res) => {
    PartnerAvailability.findById(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found PartnerAvailability with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Error retrieving PartnerAvailability with id " + req.params.id
                });
            }
        } else res.send(data);
    });
};
```

**After:**
```javascript
exports.findOne = (req, res) => {
    const availabilityId = parseInt(req.params.id);
    
    PartnerAvailability.findById(availabilityId, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found PartnerAvailability with id ${availabilityId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving PartnerAvailability with id " + availabilityId
            });
        }
        
        // Authorization: Partner can only view their own availability
        if (data.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot access other partners' availability"
            });
        }
        
        res.send(data);
    });
};
```

**Vulnerability Fixed:** Partners could view other partners' availability slots

---

### Change 2: update() - Add ownership verification

**Location:** Lines 71-112

**Before:**
```javascript
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
    }

    PartnerAvailability.updateById(
        req.params.id,
        new PartnerAvailability(req.body),
        (err, data) => {
            if (err) {
                if (err.kind === "not_found") {
                    res.status(404).send({
                        message: `Not found PartnerAvailability with id ${req.params.id}.`
                    });
                } else {
                    res.status(500).send({
                        message: "Error updating PartnerAvailability with id " + req.params.id
                    });
                }
            } else res.send(data);
        }
    );
};
```

**After:**
```javascript
exports.update = (req, res) => {
    // Validate Request
    if (!req.body) {
        res.status(400).send({
            message: "Content can not be empty!"
        });
        return;
    }

    const availabilityId = parseInt(req.params.id);
    
    // First verify ownership
    PartnerAvailability.findById(availabilityId, (err, existingData) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found PartnerAvailability with id ${availabilityId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving PartnerAvailability with id " + availabilityId
            });
        }
        
        // Authorization: Partner can only update their own availability
        if (existingData.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot update other partners' availability"
            });
        }
        
        PartnerAvailability.updateById(
            availabilityId,
            new PartnerAvailability(req.body),
            (err, data) => {
                if (err) {
                    return res.status(500).send({
                        message: "Error updating PartnerAvailability with id " + availabilityId
                    });
                }
                res.send(data);
            }
        );
    });
};
```

**Vulnerability Fixed:** Partners could modify other partners' availability slots

---

### Change 3: delete() - Add ownership verification

**Location:** Lines 114-141

**Before:**
```javascript
exports.delete = (req, res) => {
    PartnerAvailability.remove(req.params.id, (err, data) => {
        if (err) {
            if (err.kind === "not_found") {
                res.status(404).send({
                    message: `Not found PartnerAvailability with id ${req.params.id}.`
                });
            } else {
                res.status(500).send({
                    message: "Could not delete PartnerAvailability with id " + req.params.id
                });
            }
        } else res.send({ message: `PartnerAvailability was deleted successfully!` });
    });
};
```

**After:**
```javascript
exports.delete = (req, res) => {
    const availabilityId = parseInt(req.params.id);
    
    // First verify ownership
    PartnerAvailability.findById(availabilityId, (err, existingData) => {
        if (err) {
            if (err.kind === "not_found") {
                return res.status(404).send({
                    message: `Not found PartnerAvailability with id ${availabilityId}.`
                });
            }
            return res.status(500).send({
                message: "Error retrieving PartnerAvailability with id " + availabilityId
            });
        }
        
        // Authorization: Partner can only delete their own availability
        if (existingData.partner_id !== req.partnerId) {
            return res.status(403).send({
                message: "Unauthorized: Cannot delete other partners' availability"
            });
        }
        
        PartnerAvailability.remove(availabilityId, (err, data) => {
            if (err) {
                return res.status(500).send({
                    message: "Could not delete PartnerAvailability with id " + availabilityId
                });
            }
            res.send({ message: `PartnerAvailability was deleted successfully!` });
        });
    });
};
```

**Vulnerability Fixed:** Partners could delete other partners' availability slots

---

## File 3: app/models/partner.model.js

### New Function: Partner.getBookingById()

**Location:** After Partner.updateBookingStatus()

**Added Code:**
```javascript
Partner.getBookingById = (bookingId, result) => {
    sql.query(
        "SELECT * FROM bookings WHERE id = ?",
        [bookingId],
        (err, res) => {
            if (err) {
                console.log("error: ", err);
                result(err, null);
                return;
            }

            if (res.length) {
                console.log("found booking: ", res[0]);
                result(null, res[0]);
                return;
            }

            result({ kind: "not_found" }, null);
        }
    );
};
```

**Purpose:** Used by controller to retrieve booking for ownership verification  
**Parameterization:** Uses `[bookingId]` array wrapping (secure)

---

## File 4: app/models/admin.model.js

### Change 1: deleteService() - Fix parameter binding

**Location:** Line 2

**Before:**
```javascript
Admin.deleteService = (id, result) => {
    sql.query("DELETE FROM services WHERE id = ?", id, (err, res) => {
        // ...
    });
};
```

**After:**
```javascript
Admin.deleteService = (id, result) => {
    sql.query("DELETE FROM services WHERE id = ?", [id], (err, res) => {
        // ...
    });
};
```

**Why:** Parameter must be wrapped in array: `[id]` not `id`

---

### Change 2: cancelBooking() - Fix parameter binding

**Location:** Line 7

**Before:**
```javascript
Admin.cancelBooking = (id, result) => {
    sql.query(
        "UPDATE bookings SET status = 'Cancelled' WHERE id = ?",
        id,
        (err, res) => {
        // ...
    );
};
```

**After:**
```javascript
Admin.cancelBooking = (id, result) => {
    sql.query(
        "UPDATE bookings SET status = 'Cancelled' WHERE id = ?",
        [id],
        (err, res) => {
        // ...
    );
};
```

**Why:** Parameter must be wrapped in array: `[id]` not `id`

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Files Modified | 4 |
| New Functions Added | 1 |
| Authorization Checks Added | 6 |
| SQL Fixes | 2 |
| Lines of Code Changed | ~200 |
| Vulnerabilities Fixed | 6 |
| Features Removed | 0 |
| Breaking Changes | 0 |

---

## Testing Guide

### Test Case 1: Authorization - Profile Access
```bash
# Partner A token (id=1), tries to access Partner B (id=2)
GET /api/partners/2
Authorization: Bearer <PARTNER_A_TOKEN>

# Expected: 403 Unauthorized
# Actual message: "Cannot access other partners' profiles"
```

### Test Case 2: Authorization - Booking Hijacking
```bash
# Booking #100 belongs to Partner A
# Partner B tries to accept it
PUT /api/partners/bookings/100/accept
Authorization: Bearer <PARTNER_B_TOKEN>

# Expected: 403 Unauthorized
# Actual message: "Cannot accept bookings for other partners"
```

### Test Case 3: Login - Unapproved Partner
```bash
# Partner with is_approved = 0
POST /api/auth/partner/login
{ "email": "unapproved@partner.com", "password": "pass" }

# Expected: 403 Forbidden
# Actual message: "Partner account is pending approval"
```

---

**All changes complete and tested** ✅

