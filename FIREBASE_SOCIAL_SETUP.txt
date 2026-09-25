Messenger Pro V10.2 - Firebase Social Login Setup

Database URL:
https://ms-fix-4e05f-default-rtdb.asia-southeast1.firebasedatabase.app

This build includes Google, Facebook and Apple sign-in buttons. The buttons are wired to Firebase Authentication using popup sign-in.

IMPORTANT: The web code cannot create the provider credentials for you. Enable each provider in Firebase Console first:

1) Firebase Console -> Authentication -> Sign-in method
2) Enable Google.
3) Enable Facebook and add the Facebook App ID + App Secret from Meta for Developers.
4) Enable Apple and configure Apple Sign In (Apple Service ID / key settings required by Firebase).
5) In Authentication -> Settings -> Authorized domains, make sure the domain where you run this app is listed. For local development, use the domain/host shown by your local server.

Realtime Database:
- Use the database URL above in script.js.
- Publish database.rules.json in Realtime Database -> Rules.

Password:
- Minimum 8 characters.
- The eye button beside the password field toggles show/hide.

Social profiles:
- On first Google/Facebook/Apple login, a Messenger profile is created automatically.
- The profile stores Firebase UID, display name, email, provider ID and public profile photo URL when supplied by the provider.
- Provider tokens/passwords are not stored in Realtime Database.

If Facebook or Apple still shows "operation-not-allowed", that provider is not enabled/configured in Firebase yet.


Troubleshooting this build:
- Google: the Firebase provider page should show Enabled and a Web client ID. No Google secret needs to be copied into the HTML/JS.
- The included script uses Firebase Auth popup login and automatically falls back to redirect login if the browser blocks the popup.
- Run the app through the included start.bat (http://localhost:5500/), not by double-clicking index.html.
- If you see auth/unauthorized-domain, add the exact host shown in the browser address bar under Firebase Console -> Authentication -> Settings -> Authorized domains.
- The error dialog now includes the Firebase auth error code to make provider configuration problems easier to identify.
