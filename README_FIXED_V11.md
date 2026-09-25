# Messenger Pro V11 — Firebase Security / Auth / OTP / Call Fix

This build is updated for Firebase project `ms-fix-4e05f`.

## 1) Firebase Authentication

In Firebase Console → Authentication → Sign-in method:

- Enable **Email/Password**.
- Keep email verification enabled in the app flow.
- Only enable Google/Facebook/Apple if you actually configured those providers.
- Add your deployed website domain under Authentication → Settings → Authorized domains.

Registration now creates the Firebase Auth user, atomically claims the username, sends the verification email, and signs out until the email is verified.

## 2) Realtime Database

Deploy the included rules:

```bash
firebase use ms-fix-4e05f
firebase deploy --only database
```

The old root-level `auth != null` read/write access has been removed. Access is scoped to the authenticated user's profile, friends, requests, blocks, presence, chat membership, messages, calls, and FCM token.

## 3) Firebase Storage

The app now stores chat media under:

`chat-media/<uidA>/<uidB>/<fileName>`

and Storage Rules only allow either participant to access that room.

Deploy:

```bash
firebase use ms-fix-4e05f
firebase deploy --only storage
```

Enable Storage in Firebase Console first.

## 4) Password-reset OTP

The three Functions are:

- `sendPasswordOtp`
- `verifyPasswordOtp`
- `resetPasswordWithOtp`

Copy `functions/.env.example` to `functions/.env` and set a Gmail App Password (or compatible SMTP credentials):

```text
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=yourgmail@gmail.com
SMTP_PASS=your-16-character-app-password
SMTP_FROM=yourgmail@gmail.com
```

Then deploy:

```bash
cd functions
npm install
cd ..
firebase use ms-fix-4e05f
firebase deploy --only functions
```

The reset token is short-lived and single-use. Successful password reset also revokes existing refresh tokens.

## 5) Voice / Video calls

The call signaling is hardened and ICE candidates are queued until a remote description exists. Call records are scoped to the caller/callee, and reconnect/ICE-restart handling remains enabled.

For reliable calls across restrictive mobile networks, configure a TURN server in `turn-config.js`:

```js
window.MESSENGER_TURN_CONFIG = {
  url: 'turn:your-turn-server:3478',
  username: 'short-lived-username',
  credential: 'short-lived-credential'
};
```

Do not publish permanent TURN credentials. Use short-lived credentials from your TURN provider.

Without TURN, the included Google STUN servers are still used and calls can work on networks where direct peer connectivity is available.

## 6) Hosting

Serve the website over HTTPS. Browser camera/microphone access is blocked on insecure origins except localhost.

## Important

The ZIP contains code and rules; it cannot create/enable Firebase services or SMTP credentials inside your Firebase account automatically. Those are account-level settings and must be deployed/enabled in the Firebase Console/CLI.


## V11.1 AI + Free Media Mode

- Gemini AI assistant is available from the floating AI button on the main screen.
- Put your Gemini API key in **Settings → Privacy & Chat → X AI**. It is stored in this browser's localStorage and is not hard-coded into `script.js`.
- The AI chat history is stored in browser `localStorage`.
- Firebase Storage is not used for chat media.
- Small photos/videos are sent as compressed data URLs through Realtime Database and cached in localStorage. This avoids Firebase Storage, but it has strict size limits and is not a replacement for object storage.
- For Gemini keys, restrict the key to the Gemini API and do not treat a browser-exposed key as a secret.
