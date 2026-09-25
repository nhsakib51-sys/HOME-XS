Messenger Pro V10.2 - Password Reset OTP

The Forgot password flow now has the requested 3-step UI:
1. Forgot password -> enter Gmail -> Next
2. 6-digit code -> code is sent to Gmail -> enter code -> Next
3. New password + Confirm password -> Next -> password is changed -> Login

IMPORTANT:
Firebase Web Auth does not itself send a custom numeric OTP for password resets.
This build includes a trusted Firebase Cloud Functions backend for the numeric-code flow.
The backend sends the code through SMTP and uses Firebase Admin SDK to update the password.

ONE-TIME BACKEND SETUP
1. Install Firebase CLI and log in:
   npm install -g firebase-tools
   firebase login

2. In the functions folder:
   cd functions
   npm install

3. Copy functions/.env.example to functions/.env and fill in SMTP settings.
   For Gmail SMTP, use a Gmail App Password (not your normal Gmail password).

4. From the project root deploy:
   firebase deploy --only functions

5. The frontend currently expects the default us-central1 URL:
   https://us-central1-ms-fix-4e05f.cloudfunctions.net
   If you deploy in another region, change PASSWORD_OTP_API_BASE near the top of script.js.

Security notes:
- OTPs expire after 10 minutes.
- Resend is rate-limited to roughly once per minute per email.
- Wrong codes are limited to 5 attempts.
- The code is stored hashed in Realtime Database, not plaintext.
- The final reset token is also stored hashed and expires after 10 minutes.
- The password is updated with Firebase Admin SDK; plaintext passwords are not stored in Realtime Database.
