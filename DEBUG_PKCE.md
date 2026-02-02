# Debugging PKCE Code Verifier Issue

## What to Check

### 1. Browser Console Logs
After requesting a magic link, check your browser console (F12 → Console tab) for:
- `[LOGIN]` logs showing cookies being set
- Look for cookies with names containing "code", "verifier", or "pkce"

### 2. Server Logs
Check your terminal where `npm run dev` is running for:
- `[AUTH CALLBACK]` logs showing what cookies the server receives
- Any errors during the code exchange

### 3. Browser Cookies
1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** → `http://localhost:3000`
4. Look for cookies starting with:
   - `sb-` (Supabase cookies)
   - `sb-<project-ref>-auth-token`
   - Any cookies with "code" or "verifier" in the name

### 4. What to Report
When reporting the issue, please include:
1. **Browser console logs** from when you request the magic link
2. **Server terminal logs** from when you click the magic link
3. **List of cookies** from DevTools (you can blur sensitive values)
4. **Browser and version** (e.g., Chrome 120, Firefox 121)
5. **Whether you're using incognito/private mode**

### 5. Quick Test
Try this in your browser console after requesting a magic link:
```javascript
// Check all cookies
console.log('All cookies:', document.cookie)

// Check Supabase-related cookies
const cookies = document.cookie.split('; ')
const supabaseCookies = cookies.filter(c => c.includes('sb-'))
console.log('Supabase cookies:', supabaseCookies)
```

### 6. Common Issues
- **Cookies blocked**: Check if your browser is blocking third-party cookies
- **SameSite issues**: Some browsers require SameSite=None; Secure for cross-site requests
- **Localhost vs 127.0.0.1**: Make sure you're consistently using `localhost:3000` (not `127.0.0.1:3000`)
