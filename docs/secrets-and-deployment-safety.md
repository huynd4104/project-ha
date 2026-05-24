# Secrets And Deployment Safety

Date: 2026-05-24  
Scope: Phase 1 security/stability.

## Current Finding

`firebase-service-account.json` exists in the workspace root. It is already listed in `.gitignore`, so it should not be committed, but it still should not live inside the project folder.

## Required Action

- Move `firebase-service-account.json` outside `project_ha`, for example to a private local secrets folder.
- Update local scripts or environment variables to point to the new location.
- Rotate the service account key in Google Cloud IAM if the workspace has been shared, zipped, uploaded, or exposed.
- Do not copy service account JSON into `mobile-flutter`, `admin-web`, public hosting, or committed docs.

## Deployment Safety

- Deploy Cloud Functions before or together with tightened Firestore rules.
- Required callable functions after Phase 1:
  - `sendOtpVerificationCode`
  - `verifyOtpCode`
  - `redeemActivationCode`
  - `submitLessonCompletion`
  - `submitActivityAttempt`
  - `claimDailyMissionReward`
- Run `npm run build` in `functions` before deploying because Firebase deploy uses the compiled `functions/lib` output.
- Keep SMTP credentials in Firebase Secret Manager as `SMTP_EMAIL` and `SMTP_PASSWORD`.
- Do not put payment provider keys, AI provider keys, or service account private keys in Flutter or React client env files.

## Client Key Note

Firebase web/mobile API keys in generated Firebase config are not treated as private credentials by themselves. Security depends on Firestore/Storage rules, Firebase Auth, App Check, and server-side verification for sensitive operations.

