# Debugging Network Requests for Group Creation

## Step-by-Step Instructions

### 1. Open DevTools Network Tab
- Open your browser's Developer Tools (F12 or Cmd+Option+I on Mac, Ctrl+Shift+I on Windows)
- Click on the **"Network"** tab (should already be open based on your screenshot)

### 2. Clear Existing Requests
- Click the **"Clear"** button (circle with diagonal line) to clear any existing requests
- This ensures you only see the new request when you create the group

### 3. Keep Network Tab Open and Recording
- Make sure the **red "Record"** button is active (it should be red/pressed)
- The Network tab should stay open while you perform the action

### 4. Navigate to Create Group Page
- Go to your app at `http://localhost:3000`
- Click on "Create Group" or navigate to `/create-group`

### 5. Fill Out the Form
- Enter a group name (e.g., "Test Group")
- The invite code should auto-generate

### 6. Create the Group (While Network Tab is Open)
- **Before clicking "Create Group"**, make sure:
  - The Network tab is still open and visible
  - The red Record button is active
- Click the **"Create Group"** button
- **Watch the Network tab** - you should see new requests appear immediately

### 7. Find the Groups Request
- Look for a request with a name like:
  - `groups?select=*` 
  - Or just `groups`
- It should show a **403** status code (red)
- Click on this request to see its details

### 8. Check the Request Headers
- With the request selected, look at the right panel
- Click on the **"Headers"** tab
- Scroll down to **"Request Headers"** section
- Look for an **"Authorization"** header
  - ✅ **If it exists**: It should say `Authorization: Bearer <long-token-string>`
  - ❌ **If it's missing**: This confirms the JWT isn't being sent

### 9. Also Check Response
- Still in the Headers tab, scroll to **"Response Headers"**
- Or click the **"Response"** tab to see the error message
- This will confirm it's an RLS policy violation

## What to Look For

**Good (Authorization header present):**
```
Request Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
```

**Bad (Authorization header missing):**
```
Request Headers:
  apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  Content-Type: application/json
  (No Authorization header!)
```

## Alternative: Filter for Specific Requests

If you have many requests, you can filter:
1. In the Network tab, click the **"Filter"** dropdown
2. Select **"Fetch/XHR"** to only show API requests
3. Or type `groups` in the filter box to only show group-related requests

## What to Report Back

Please share:
1. **Does the Authorization header exist?** (Yes/No)
2. **If yes, what does it start with?** (Should start with `Bearer `)
3. **What's the exact status code?** (Should be 403)
4. **Any error message in the Response tab?**
