# Firebase Setup Guide

Follow this guide to initialize and configure Firebase Authentication, Cloud Firestore, and Firebase Storage for the parent mobile app and the admin dashboard.

---

## 1. Firebase Project Creation
1. Go to the [Firebase Console](https://console.firebase.google.com/) and click **Add Project**.
2. Name your project (e.g., `project-ha`) and complete the wizard.
3. Add a **Web App** to copy the configuration parameters.
4. Populate the parameters in:
   - `admin-web/.env` (using prefix `VITE_`)
   - `mobile-app/.env` (using prefix `EXPO_PUBLIC_`)

---

## 2. Enable Authentication & Templates
1. Navigate to **Authentication** → **Sign-in method**.
2. Click **Add new provider** and enable **Email/Password**.
3. Under the **Templates** tab:
   - Customize the **Email verification** template to instruct parents to click the link to verify their email.
   - Customize the **Password reset** template to assist users who forget their password.
4. Under the **Settings** tab → **Authorized domains**:
   - Ensure `localhost` is present (for local testing).
   - Add your custom domain or Firebase Hosting domain (e.g., `your-app.web.app`) after deploying the admin dashboard to prevent OAuth/auth handler errors.

---

## 3. Cloud Firestore Database Setup
1. Navigate to **Cloud Firestore** and click **Create Database** (choose production or test mode).
2. Create the collections:
   - `users`: Stores parent profiles and admin records.
   - `children`: Stores child profile details linked to parents.
   - `npcs`: Mascot characters.
   - `qrCodes`: QR codes linked to Mascot unlockings.
   - `progress`: Child learning path progression logs.
   - `xpLogs`: XP points earned from lesson completions.
   - `streaks`: Streaks logged per child profile.
3. **Configure Admin Accounts**:
   - Create the administrator credential under the Firebase Authentication tab.
   - Navigate to the `users` Firestore collection and create a matching document where `document_id === uid` of the admin.
   - Add the fields:
     ```json
     {
       "uid": "[ADMIN_UID]",
       "email": "[ADMIN_EMAIL]",
       "fullName": "Administrator",
       "role": "ADMIN",
       "isActive": true,
       "emailVerified": true,
       "createdAt": "serverTimestamp()",
       "updatedAt": "serverTimestamp()"
     }
     ```
   - *Note*: Parent accounts are created automatically via the registration page, with the default role `PARENT`. Admin users must be created manually.

---

## 4. Deploying Security Rules & Indexes
Deploy Firestore rules, index templates, and Storage rules using the Firebase CLI:

```bash
# Login to Firebase
npx firebase-tools login

# Select your active project
npx firebase-tools use --add

# Deploy indexes, firestore and storage rules
npx firebase-tools deploy --only firestore:rules,firestore:indexes,storage
```

---

## 5. Web Hosting Deployment
To build and deploy the React/Vite admin dashboard to Firebase Hosting:

```bash
# 1. Navigate to admin web and build bundle
cd admin-web
npm run build
cd ..

# 2. Deploy to Firebase Hosting
npx firebase-tools deploy --only hosting
```
Use `admin-web/dist` as the public directory when initializing. Answer **Yes** to single-page application URL rewrites.
