Messenger Pro V10.2 - Security Upgrade

Security changes:
- Firebase Authentication is used for login/signup instead of storing plaintext passwords in Realtime Database.
- Gmail-only validation.
- Strong password policy: minimum 8 characters, uppercase, lowercase, number and special character.
- Email verification is required before login.
- Firebase Auth state is checked on startup; localStorage alone can no longer create a logged-in session.
- Firebase Auth UID is linked to the Messenger profile.
- Old plaintext "pass" fields are no longer written by the application.
- Login uses Firebase Auth instead of comparing passwords from the database.
- Uses the supplied ms-fix-4e05f Firebase project and Realtime Database URL.
- database.rules.json is included as a starting point for authenticated-only database access.

Important:
1. In Firebase Console, enable Authentication -> Sign-in method -> Email/Password.
2. Publish database.rules.json in Realtime Database -> Rules if you want unauthenticated users blocked.
3. The rules file makes the database authenticated-only, but the existing chat schema does not contain explicit room membership metadata. For production-grade private chat authorization, the data model should be upgraded to store room members and rules should enforce membership per room.
4. Firebase web config/API keys are identifiers, not passwords. Do not put service-account/private keys in this project.
5. Existing accounts created by the old plaintext-password version may need to be recreated through the secure signup flow, because their database "pass" value is intentionally ignored.

Run:
- Extract the ZIP.
- Open the folder in VS Code.
- Do not run script.js with the debugger.
- Serve index.html through a local web server (for example start.bat if included).
