# Messenger Pro V45.7

Full duplicate-message/call-history stability pass based on the V45.6 source.

## Fixes
- Prevents rapid double-send from creating duplicate text messages.
- Prevents both call participants from creating duplicate call-history chat entries for one call.
- Suppresses legacy duplicate call-history cards by `callId`.
- Prevents duplicate incoming-call listeners after app reinitialization/reconnect.
- Prevents duplicate message-notification listener setup.
- TURN credentials are not committed to this public repository.

## Important
The public frontend uses direct WebRTC/STUN only. TURN is disabled. Some restrictive networks may still require TURN for reliable calls.

See `V45_7_ALL_FIXES.txt` for the audit notes.