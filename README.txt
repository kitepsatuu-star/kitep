DOSTA Android/PWA starter

WEB/PWA:
1) Upload public/ to GitHub/Cloudflare Pages or any HTTPS hosting.
2) Open the HTTPS URL on Android Chrome and choose Install app / Add to Home screen.

ANDROID APK/AAB (requires Node.js + Android Studio/SDK):
1) npm install
2) npx cap add android
3) npx cap sync android
4) npx cap open android
5) Build APK/AAB from Android Studio.

The existing Firebase and Cloudinary code is preserved in public/index.html.
Package id: com.dosta.social
App name: DOSTA
