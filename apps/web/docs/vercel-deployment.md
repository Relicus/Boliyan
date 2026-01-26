# Vercel Deployment Guide (Private Test Mode)

Follow these steps to deploy Boliyan for private testing with password protection.

## 1. Push Code to GitHub
Ensure all your latest changes (including the new middleware) are committed and pushed to your GitHub repository.

```bash
git add .
git commit -m "chore: setup private deployment config"
git push origin master
```

## 2. Connect to Vercel
1.  Go to [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** > **"Project"**.
3.  Click **"Import"** next to your `Boliyan` repository.
4.  **Framework Preset:** It should auto-detect "Next.js".
5.  **Root Directory:** Click "Edit" and select `apps/web`. **(Important for Monorepos)**.

## 3. Configure Environment Variables
Expand the **"Environment Variables"** section and add the following:

| Key | Value | Notes |
|-----|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://wxdehgjadxlkhvfwjfxd.supabase.co` | Your Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `[YOUR_ANON_KEY]` | Your Supabase Anon Key |
| `SITE_PASSWORD` | `[YOUR_SECRET_PASSWORD]` | Secure password for private testing |

## 4. Deploy
Click **"Deploy"**. Vercel will build your site.

## 5. Post-Deployment Configuration
Once the site is live (e.g., `https://boliyan-xyz.vercel.app`):

### A. Update Supabase Auth
1.  Go to **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2.  Add your new Vercel URL to **Redirect URLs**:
    *   `https://boliyan-xyz.vercel.app/**`
3.  Click **Save**.

### B. Update Google Cloud (for OAuth)
1.  Go to **Google Cloud Console** > **APIs & Services** > **Credentials**.
2.  Edit your **Boliyan Web** client.
3.  Add the new callback URL to **Authorized redirect URIs**:
    *   `https://boliyan-xyz.vercel.app/auth/callback`
4.  Click **Save**.

## 6. Testing
Visit your Vercel URL.
1.  **Password Prompt:** You should see a browser popup asking for username/password.
    *   **User:** `admin` (or anything)
    *   **Password:** `[YOUR_SECRET_PASSWORD]`
2.  **OAuth:** Try logging in with Google. It should redirect properly.

## 7. Using Your Cloudflare Domain (Recommended)
Since you already own the domain on Cloudflare, you can point it to Vercel. This gives you the speed of Cloudflare DNS with the native Next.js hosting of Vercel.

1.  **Vercel Dashboard:** Go to **Settings** > **Domains**.
2.  **Add Domain:** Enter your domain (e.g., `boliyan.com`).
3.  **Vercel Instructions:** Vercel will give you a **CNAME** or **A Record** (usually `76.76.21.21`).
4.  **Cloudflare Dashboard:**
    *   Go to **DNS** > **Records**.
    *   Add the **A Record** or **CNAME** provided by Vercel.
    *   **Proxy Status:** Set to **DNS Only** (Grey Cloud) initially to ensure SSL generates correctly on Vercel. Once verified, you can switch to **Proxied** (Orange Cloud) if you want Cloudflare's WAF (requires setting SSL to "Full" in Cloudflare).
5.  **Update Callbacks:** Once your domain is connected:
    *   Update Supabase Redirect URL to `https://boliyan.com/**`
    *   Update Google Cloud Redirect URI to `https://boliyan.com/auth/callback`
