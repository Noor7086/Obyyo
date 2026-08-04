# Troubleshooting Login Failed Error

## Problem
You're getting "Login failed" when trying to log in on your domain (https://seagreen-owl-810079.hostingersite.com).

## Root Cause
The frontend is trying to call `/api` which is a **relative path**. When deployed on your domain, it tries to call:
- ❌ `https://seagreen-owl-810079.hostingersite.com/api` (doesn't exist)

Instead of:
- ✅ `http://YOUR-PC-BACKEND-URL/api` (your backend on PC)

## Solution Steps

### Step 1: Expose Your PC Backend

You need to make your PC backend accessible from the internet. Choose one method:

#### Option A: Using ngrok (Recommended)

1. **Download ngrok**: https://ngrok.com/download
2. **Run ngrok**:
   ```bash
   ngrok http 5000
   ```
3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)
   - This URL will change each time you restart ngrok (unless you have a paid plan)

#### Option B: Using localtunnel (Free)

1. **Install localtunnel**:
   ```bash
   npm install -g localtunnel
   ```
2. **Run localtunnel**:
   ```bash
   lt --port 5000
   ```
3. **Copy the URL** (e.g., `https://abc123.loca.lt`)

### Step 2: Test Backend Accessibility

Open your browser and visit:
```
http://YOUR-BACKEND-URL/api/health
```

You should see:
```json
{"status":"OK","timestamp":"2024-01-01T12:00:00.000Z"}
```

If you get an error, your backend isn't accessible. Check:
- ✅ Backend is running (`npm run server`)
- ✅ Firewall allows port 5000
- ✅ ngrok/localtunnel is running

### Step 3: Configure Frontend

Create a `.env.production` file in your project root:

```env
VITE_API_BASE_URL=https://your-ngrok-url.ngrok.io/api
```

**Replace `your-ngrok-url.ngrok.io` with your actual ngrok/localtunnel URL**

Example:
```env
VITE_API_BASE_URL=https://abc123.ngrok.io/api
```

### Step 4: Rebuild Frontend

```bash
npm run build
```

This will create a new `dist` folder with the correct API URL.

### Step 5: Upload to Hostinger

Upload the new `dist` folder contents to your Hostinger hosting.

### Step 6: Test Login

1. Open your domain: https://seagreen-owl-810079.hostingersite.com
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Try to log in
5. Check the console for:
   - `🔗 API Base URL: https://your-ngrok-url.ngrok.io/api` (should show your backend URL)
   - Any error messages

## Debugging

### Check Browser Console

Open Developer Tools (F12) → Console tab. Look for:

1. **API Base URL**: Should show your backend URL, not `/api`
2. **Network errors**: Check Network tab to see if requests are going to the right URL
3. **CORS errors**: If you see CORS errors, add your tunnel URL to `CORS_ORIGINS` in `backend/env`

### Check Network Tab

1. Open Developer Tools (F12) → Network tab
2. Try to log in
3. Look for the `/auth/login` request
4. Check:
   - **Request URL**: Should be your backend URL (not your domain)
   - **Status**: Should be 200 (not 404 or CORS error)

### Common Issues

#### Issue 1: "Network error" or "Cannot connect to server"
- **Cause**: Backend not accessible
- **Fix**: 
  - Make sure backend is running
  - Make sure ngrok/localtunnel is running
  - Check firewall settings

#### Issue 2: CORS Error
- **Cause**: Backend doesn't allow your domain
- **Fix**: Add your domain to `CORS_ORIGINS` in `backend/env`:
  ```env
  CORS_ORIGINS=https://seagreen-owl-810079.hostingersite.com,https://your-ngrok-url.ngrok.io,http://localhost:3000
  ```
  Then restart your backend.

#### Issue 3: Still using `/api` instead of backend URL
- **Cause**: `.env.production` not created or not used during build
- **Fix**: 
  - Make sure `.env.production` exists in project root
  - Make sure you run `npm run build` (not `npm run dev`)
  - Check that `VITE_API_BASE_URL` is set correctly

#### Issue 4: "Invalid credentials"
- **Cause**: This is different - your backend is reachable but credentials are wrong
- **Fix**: Check your email/password are correct

## Quick Test

To quickly test if your backend is accessible, open this URL in your browser:
```
https://your-ngrok-url.ngrok.io/api/health
```

If you see `{"status":"OK",...}`, your backend is accessible! ✅

## Important Notes

1. **ngrok URLs change**: Each time you restart ngrok, you get a new URL. You'll need to:
   - Update `.env.production`
   - Rebuild frontend
   - Re-upload to Hostinger

2. **For permanent solution**: Consider deploying backend to cloud (Railway, Render, etc.)

3. **Keep backend running**: Your PC must be on and backend running for the site to work

## Still Having Issues?

1. Check browser console for specific error messages
2. Check backend console for incoming requests
3. Verify `.env.production` file exists and has correct URL
4. Make sure you rebuilt frontend after creating `.env.production`
5. Clear browser cache and try again

