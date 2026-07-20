# Wiring manifest.json + sw.js into AssetTrackPro Field App

## 1. Where these files go
Deploy both files at the **root** of your Vercel project (same level as your other static files), so they're reachable at:
- `https://assettrackpro-web.vercel.app/manifest.json`
- `https://assettrackpro-web.vercel.app/sw.js`

## 2. Icons
Create an `/icons` folder at the root and add three PNGs generated from your logo:
- `icon-192.png` — 192x192
- `icon-512.png` — 512x512
- `icon-maskable-512.png` — 512x512, logo centered with safe padding (Android crops maskable icons into a circle/squircle, so keep the logo inside the middle ~80% of the canvas)

Once you upload your logo file in chat, I'll generate all three at the correct sizes/padding.

## 3. Add this to the `<head>` of your field-app HTML
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#0077cc">
<link rel="apple-touch-icon" href="/icons/icon-192.png">
```

## 4. Register the service worker
Add this just before your closing `</body>` tag (or in your main script block):
```html
<script>
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    });
  }
</script>
```

## 5. Deploy and verify
Push to Vercel, then check:
- `https://assettrackpro-web.vercel.app/manifest.json` loads as JSON
- Chrome DevTools → Application tab → Manifest (should show no errors) and Service Workers (should show "activated and running")

## 6. Build the app
Go to **pwabuilder.com**, enter `https://assettrackpro-web.vercel.app/field-app`, and it will detect the manifest + service worker automatically. From there:
1. Download the Android package (Bubblewrap-generated) — this gives you the signed keystore, `.apk`, and `.aab`.
2. Take the SHA-256 fingerprint it shows you and publish it as `/.well-known/assetlinks.json` on your Vercel domain (PWABuilder gives you the exact file content to paste — this is what removes the browser address bar and makes it look fully native).
3. Rebuild once after `assetlinks.json` is live so the app picks up the verified domain link.

That's the whole pipeline — no Median, no watermark, and the app auto-updates whenever you deploy to Vercel.
