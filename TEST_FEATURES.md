# Feature Testing Guide

Use this guide to test each "broken" feature once the database is connected.

---

## ✅ **Quick Test Commands**

### **Test 1: Sign Up**

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Candidate",
    "email": "candidate@test.com",
    "password": "SecurePass123!",
    "roleSubtype": "CANDIDATE"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "random-refresh-token-string",
    "user": {
      "id": "671a3c8d9f2b1c3d4e5f6789",  ← Real MongoDB ObjectId
      "email": "candidate@test.com",
      "name": "Test Candidate",
      "role": "USER",
      "roleSubtype": "CANDIDATE"
    }
  }
}
```

**✅ Pass:** Returns real MongoDB ObjectId (24 hex chars)  
**❌ Fail:** Returns "mock-user-..." ID

---

### **Test 2: Sign In**

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "candidate@test.com",
    "password": "SecurePass123!"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "random-refresh-token-string",
    "user": {
      "id": "671a3c8d9f2b1c3d4e5f6789",
      "email": "candidate@test.com",
      "name": "Test Candidate"
    }
  }
}
```

**✅ Pass:** Same user ID as registration, tokens returned  
**❌ Fail:** "User not found" or mock data

---

### **Test 3: Sign Out**

First, save the accessToken from login, then:

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**✅ Pass:** Session is revoked in database  
**❌ Fail:** Error or mock response

---

### **Test 4: Assessment Questions**

```bash
curl http://localhost:5000/api/v1/assessment/questions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "q1",
        "question": "I am very outgoing and sociable",
        "category": "D"
      },
      ...15 questions total...
    ]
  }
}
```

**✅ Pass:** Returns 15 DISC questions  
**❌ Fail:** Empty array or error

---

### **Test 5: Submit Assessment**

```bash
curl -X POST http://localhost:5000/api/v1/assessment/submit \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "q1": 5, "q2": 4, "q3": 3, "q4": 5, "q5": 2,
      "q6": 4, "q7": 5, "q8": 3, "q9": 4, "q10": 5,
      "q11": 3, "q12": 4, "q13": 5, "q14": 2, "q15": 4
    }
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Assessment submitted successfully",
  "data": {
    "result": {
      "personalityType": "Influential Leader",
      "primaryType": "I",
      "secondaryType": "D",
      "scores": {
        "D": 15,
        "I": 18,
        "S": 10,
        "C": 12
      }
    }
  }
}
```

**✅ Pass:** Returns personality type and scores, saved to database  
**❌ Fail:** Error or data not persisted

---

### **Test 6: Get Assessment Results**

```bash
curl http://localhost:5000/api/v1/assessment/results \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "personalityType": "Influential Leader",
    "primaryType": "I",
    "scores": { "D": 15, "I": 18, "S": 10, "C": 12 },
    "completedAt": "2025-10-24T17:00:00.000Z"
  }
}
```

**✅ Pass:** Returns saved assessment results  
**❌ Fail:** Null or "No assessment found"

---

### **Test 7: Create Company (Recruiter)**

First, register as a recruiter:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Recruiter",
    "email": "recruiter@test.com",
    "password": "SecurePass123!",
    "roleSubtype": "RECRUITER"
  }'
```

Save the recruiter's accessToken, then create a company:

```bash
curl -X POST http://localhost:5000/api/v1/web/company/v2 \
  -H "Authorization: Bearer RECRUITER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company Inc",
    "website": "https://testcompany.com",
    "description": "A test company for verification",
    "industry": "Technology",
    "size": "50-200"
  }'
```

**Expected Result:**
```json
{
  "success": true,
  "message": "Company created successfully",
  "data": {
    "company": {
      "_id": "671a3d9e8f1b2c3d4e5f6789",
      "name": "Test Company Inc",
      "website": "https://testcompany.com",
      "ownerId": "recruiter-user-id",
      "createdAt": "2025-10-24T17:00:00.000Z"
    }
  }
}
```

**✅ Pass:** Company created with real MongoDB ObjectId  
**❌ Fail:** Error or mock data

---

### **Test 8: Get Company**

```bash
curl "http://localhost:5000/api/v1/web/company/me" \
  -H "Authorization: Bearer RECRUITER_ACCESS_TOKEN"
```

**Expected Result:**
```json
{
  "success": true,
  "data": {
    "company": {
      "_id": "671a3d9e8f1b2c3d4e5f6789",
      "name": "Test Company Inc",
      "website": "https://testcompany.com",
      ...company details...
    }
  }
}
```

**✅ Pass:** Returns the company just created  
**❌ Fail:** Null or "No company found"

---

### **Test 9: Image Upload**

This requires multipart/form-data, so test via browser or Postman:

1. Sign in as recruiter at http://localhost:5000/login.html
2. Go to recruiter dashboard
3. Navigate to company profile
4. Upload a company logo (PNG/JPG image)
5. Check that the image URL is saved

**Expected Result:**
- Image uploads to storage service
- Company record updated with image URL
- Image persists after page refresh

**✅ Pass:** Image URL saved to database  
**❌ Fail:** Upload fails or URL not persisted

---

### **Test 10: Video Upload**

Similar to image upload:

1. Sign in as recruiter
2. Go to company profile
3. Upload a company video (MP4)
4. Verify video URL is saved

**Expected Result:**
- Video uploads to storage service
- Company record updated with video URL
- Video persists after refresh

**✅ Pass:** Video URL saved to database  
**❌ Fail:** Upload fails or URL not persisted

---

## 🎯 **Full Test Sequence**

Run all tests in order:

```bash
# 1. Test health check
curl http://localhost:5000/health | jq

# 2. Register candidate
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Candidate","email":"candidate@test.com","password":"SecurePass123!","roleSubtype":"CANDIDATE"}' | jq

# 3. Login candidate (save token)
CANDIDATE_TOKEN=$(curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"candidate@test.com","password":"SecurePass123!"}' | jq -r '.data.accessToken')

# 4. Get assessment questions
curl http://localhost:5000/api/v1/assessment/questions \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" | jq

# 5. Submit assessment
curl -X POST http://localhost:5000/api/v1/assessment/submit \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answers":{"q1":5,"q2":4,"q3":3,"q4":5,"q5":2,"q6":4,"q7":5,"q8":3,"q9":4,"q10":5,"q11":3,"q12":4,"q13":5,"q14":2,"q15":4}}' | jq

# 6. Get assessment results
curl http://localhost:5000/api/v1/assessment/results \
  -H "Authorization: Bearer $CANDIDATE_TOKEN" | jq

# 7. Register recruiter
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Recruiter","email":"recruiter@test.com","password":"SecurePass123!","roleSubtype":"RECRUITER"}' | jq

# 8. Login recruiter (save token)
RECRUITER_TOKEN=$(curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"recruiter@test.com","password":"SecurePass123!"}' | jq -r '.data.accessToken')

# 9. Create company
curl -X POST http://localhost:5000/api/v1/web/company/v2 \
  -H "Authorization: Bearer $RECRUITER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Company","website":"https://test.com","description":"Test company"}' | jq

# 10. Get company
curl http://localhost:5000/api/v1/web/company/me \
  -H "Authorization: Bearer $RECRUITER_TOKEN" | jq

echo "✅ All tests complete!"
```

**✅ All Pass:** App is production-ready!  
**❌ Any Fail:** Check specific test for debugging

---

## 📝 **Frontend Testing**

After API tests pass, test the frontend:

### **1. Sign Up Flow**

1. Go to http://localhost:5000
2. Fill out signup form:
   - Name: Test User
   - Email: test@example.com
   - Password: SecurePass123!
   - Role: Job Seeker
   - ✅ Check AI acknowledgement
3. Click "Create Account"
4. Should redirect to candidate dashboard

**✅ Pass:** Redirects to dashboard, user data shows in localStorage  
**❌ Fail:** Error message or no redirect

### **2. Sign In Flow**

1. Go to http://localhost:5000/login.html
2. Enter credentials from signup
3. Click "Sign In"
4. Should redirect to dashboard

**✅ Pass:** Successful login, dashboard loads  
**❌ Fail:** "Invalid credentials" or error

### **3. Assessment Flow (Candidate)**

1. Sign in as candidate
2. Dashboard should show "Take Assessment" prompt
3. Click to start assessment
4. Answer all 15 questions
5. Submit assessment
6. View personality results

**✅ Pass:** Results display, persist on refresh  
**❌ Fail:** Submission fails or results disappear

### **4. Upload Flow (Recruiter)**

1. Sign in as recruiter
2. Go to company profile
3. Upload company logo (image)
4. Upload company video
5. Save profile
6. Refresh page

**✅ Pass:** Uploads persist, URLs visible  
**❌ Fail:** Files disappear or errors

### **5. Sign Out Flow**

1. Click "Sign Out" button
2. Should redirect to login
3. localStorage cleared
4. Cannot access dashboard without re-login

**✅ Pass:** Complete sign out, session ended  
**❌ Fail:** Still logged in or errors

---

## ✅ **Success Criteria**

Your app is ready for deployment when:

- [ ] All 10 API tests pass
- [ ] All 5 frontend flows work
- [ ] Data persists after server restart
- [ ] Health check shows database "connected"
- [ ] No "mock-..." IDs in responses
- [ ] Assessment results save and load correctly
- [ ] Uploads work and URLs persist
- [ ] Company creation works for recruiters
- [ ] Sign out clears sessions properly

**All checked?** Deploy to DigitalOcean! 🚀
