# Deployment Setup Guide

## Frontend on Domain + Backend on PC Setup

This guide explains how to run your frontend on your domain (https://seagreen-owl-810079.hostingersite.com) while your backend runs on your PC.

### Prerequisites

1. **Backend must be accessible from the internet** - Your PC needs to be reachable from the internet
2. **CORS is already configured** - Your backend allows requests from your domain
3. **Frontend needs to know backend URL** - We'll configure this

---

## Step 1: Expose Your PC Backend to Internet

You have several options to make your PC backend accessible:

### Option A: Using localtunnel (Free Alternative)

1. **Install localtunnel**:
   ```bash
   npm install -g localtunnel
   ```
2. **Run localtunnel**:
   ```bash
   lt --port 5000
   ```
3. **Copy the URL** provided (e.g., `https://abc123.loca.lt`)

### Option C: Port Forwarding (For Permanent Setup)

1. **Find your PC's local IP**: 
   - Windows: `ipconfig` (look for IPv4 Address)
   - Example: `192.168.1.100`
2. **Configure router port forwarding**:
   - Forward external port (e.g., 5000) to your PC's IP:5000
   - You'll need your public IP address (check at https://whatismyipaddress.com/)
3. **Use your public IP**: `http://YOUR_PUBLIC_IP:5000`

⚠️ **Security Note**: Exposing your PC directly to the internet has security risks. Consider using a VPN or cloud hosting for production.

---

## Step 2: Configure Backend

Your backend is already configured to:
- ✅ Listen on all interfaces (0.0.0.0) - allows external connections
- ✅ Allow CORS from your domain
- ✅ Use environment variables

**No changes needed** - just make sure your backend is running:
```bash
npm run server
```

---

## Step 3: Configure Frontend

### For Production Build:

1. **Create/Update your `.env.production` file** in the root directory:
   ```env
   VITE_API_BASE_URL=http://your-vps-ip:5000/api
   ```
   
2. **Build your frontend**:
   ```bash
   npm run build
   ```

3. **Upload the `dist` folder** to your hosting service (e.g., Hostinger).

### Example Configurations:


**Using localtunnel:**
```env
VITE_API_BASE_URL=https://abc123.loca.lt/api
```

**Using public IP:**
```env
VITE_API_BASE_URL=http://123.45.67.89:5000/api
```

---

## Step 4: Update Backend CORS (If Needed)

Your backend already has CORS configured, but if you're using a tunnel service, you might need to add it:

In `backend/env`, update `CORS_ORIGINS`:
```env
CORS_ORIGINS=https://seagreen-owl-810079.hostingersite.com,http://localhost:3000
```

---

## Step 5: Test the Setup

1. **Start your backend** on your PC:
   ```bash
   npm run server
   ```

2. **Verify backend is accessible**:
   - Visit: `http://YOUR_BACKEND_URL/api/health`
   - Should return: `{"status":"OK","timestamp":"..."}`

3. **Deploy frontend** to your domain

4. **Test from browser**:
   - Open your domain
   - Check browser console for any CORS errors
   - Try logging in or making API calls

---

## Troubleshooting

### CORS Errors
- Make sure your backend URL is in `CORS_ORIGINS` in `backend/env`
- Check that backend is running and accessible
- Verify the frontend is using the correct API URL

### Connection Refused
- Check if backend is running
- Verify firewall allows connections on port 5000
- For localtunnel: Make sure the tunnel is active

### Mixed Content (HTTP/HTTPS)
- If your domain is HTTPS, your backend must also be HTTPS
- Use ngrok or localtunnel (they provide HTTPS)
- Or set up SSL on your backend

---

## Important Notes

1. **For Development**: Using localtunnel is fine
2. **For Production**: Consider deploying backend to a cloud service (Railway, Heroku, DigitalOcean, etc.)
3. **Security**: Never expose your backend without proper security measures
4. **Uptime**: Your PC must be running 24/7 for the backend to be available

---

## Alternative: Deploy Backend to Cloud

If you want a more permanent solution, consider deploying your backend to:
- **Railway** (https://railway.app) - Easy Node.js deployment
- **Render** (https://render.com) - Free tier available
- **Heroku** (https://heroku.com) - Popular platform
- **DigitalOcean** (https://digitalocean.com) - More control

Then update your frontend's `VITE_API_BASE_URL` to point to your cloud backend.

