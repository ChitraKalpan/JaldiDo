# Build a Production-Ready MVP: JaldiDo

## 1. Project Objective

Build **JaldiDo**, a modern, responsive, web-based file and content sharing application inspired by the simplicity of Quick Share and AirDrop-style experiences.

JaldiDo allows a user to create a temporary sharing session from one device and allows another device to join that session using either:

1. A short **6-character hexadecimal access code**
2. A **QR code** generated for the sharing session

The core product principle is:

> **Open → Create → Scan/Enter Code → Share**

The primary goal of this MVP is:

> **Share files, text, links, and media between devices with almost zero friction.**

The application must work across:

* Mobile phones
* Tablets
* Laptops
* Desktop computers

Do not copy the visual design, branding, or proprietary implementation of Google Quick Share or Apple AirDrop. JaldiDo must have its own original identity and interface.

---

# 2. Core User Flow

## Flow A: Phone → Laptop

### Device A

User opens JaldiDo.

Click:

```text
Create Share Session
```

The system creates a temporary session.

Example:

```text
7F3A9C
```

Display:

```text
Share Code

7F3A9C
```

Also display a QR code containing the session join URL.

Example:

```text
https://DOMAIN/join/7F3A9C
```

### Device B

User opens JaldiDo.

They can either enter:

```text
Enter Share Code

[ 7F3A9C ]

[ Connect ]
```

or scan/open the QR code URL.

After successful validation, Device B joins the same sharing session.

---

# 3. Flow B: Laptop → Phone

Device A creates a session.

JaldiDo displays:

```text
7F3A9C

[ QR CODE ]

Waiting for another device...
```

The user scans the QR code using their phone.

The phone opens the JaldiDo join URL and automatically connects to the session.

No manual code entry should be required after QR scanning.

---

# 4. Sharing Capabilities

The MVP must support:

### Files

* Images
* Videos
* Audio
* PDF
* ZIP
* Documents
* Arbitrary file types

### Text

Users should be able to send:

* Plain text
* Notes
* URLs
* Small code snippets
* Clipboard content

Example:

```text
Send Text

┌─────────────────────────────┐
│ Paste something here...     │
│                             │
│                             │
└─────────────────────────────┘

[ Send ]
```

### File interaction

Users should be able to:

* Upload
* Send
* Download
* Remove
* View file name
* View file size
* View file type
* View transfer progress

---

# 5. Session Architecture

Every sharing operation creates a temporary session.

Example:

```text
Session
├── sessionId
├── accessCode
├── creator
├── connectedDevices
├── sharedFiles
├── sharedText
├── createdAt
├── expiresAt
└── status
```

Example session:

```json
{
  "sessionId": "uuid",
  "accessCode": "7F3A9C",
  "createdAt": "...",
  "expiresAt": "...",
  "status": "active"
}
```

The access code must contain exactly:

```text
6 hexadecimal characters
```

Allowed characters:

```text
0-9
A-F
```

Examples:

```text
A91F03
7F3A9C
D4B821
```

Use uppercase characters for display.

---

# 6. Security Requirement

Do NOT treat the 6-character code as a permanent authentication credential.

It is only a temporary session discovery/join mechanism.

Implement:

* Session expiration
* Cryptographically secure random session generation
* Server-side validation
* Rate limiting on join attempts
* Rate limiting on code generation
* File upload validation
* File size limits
* Session cleanup
* Input sanitization
* Basic abuse protection

The MVP should use temporary sessions.

When a session expires, associated temporary data must be removed.

Do not require permanent user accounts or passwords for the MVP.

---

# 7. Session Expiration

Default MVP session lifetime:

```text
15 minutes
```

Show the remaining time in the UI.

Example:

```text
Session expires in 12:43
```

When the timer reaches zero:

```text
Session Expired

This sharing session is no longer available.

[ Create New Session ]
```

The backend must enforce expiration. Do not rely only on the frontend timer.

---

# 8. Device Identification

When a device joins a session, generate a temporary device identifier.

Examples:

```text
Device 1
Device 2
```

or friendly names:

```text
Sneha's Phone
Chrome Laptop
Android Device
Desktop
```

Do not require account creation.

The creator should be able to see:

```text
Connected Devices

● Chrome Laptop
● Android Phone
```

---

# 9. Real-Time Communication

Use WebSockets for real-time session communication.

The backend should support events such as:

```text
SESSION_CREATED
DEVICE_JOINED
DEVICE_LEFT
FILE_STARTED
FILE_PROGRESS
FILE_COMPLETED
TEXT_SHARED
FILE_REMOVED
SESSION_EXPIRED
```

Create a clean event-based architecture.

Do not tightly couple frontend components directly to the WebSocket implementation.

Create a dedicated client-side WebSocket/service layer.

---

# 10. File Transfer

For the MVP, implement a reliable server-mediated transfer architecture.

Initial architecture:

```text
Device A
   │
   │ Upload
   ▼
Backend
   │
   │ Session
   ▼
Device B
   │
   │ Download
```

The architecture must be modular enough to replace this later with WebRTC peer-to-peer transfer.

Create an abstraction such as:

```text
TransferService
```

so future implementations can support:

```text
ServerTransferService
WebRTCTransferService
```

Do not implement complicated WebRTC unless it can be done cleanly without destabilizing the MVP.

---

# 11. QR Code

Generate a QR code for every active sharing session.

The QR code should encode:

```text
https://DOMAIN/join/{ACCESS_CODE}
```

Example:

```text
https://example.com/join/7F3A9C
```

When scanned:

1. Open JaldiDo
2. Detect the access code
3. Validate the session
4. Show the session
5. Ask for confirmation if necessary
6. Join the session

Do not put private file data directly inside the QR code.

---

# 12. URL Structure

Use clean URLs:

```text
/
/create
/join/:code
/session/:sessionId
```

The public join URL should use the access code:

```text
/join/7F3A9C
```

Do not expose internal database IDs unnecessarily.

---

# 13. Landing Page

Create a polished modern landing page for **JaldiDo**.

Main content:

```text
JaldiDo

Share Without The Friction.

Send files, text, links, and media
between your devices using one simple code.

[ Create Share ]

[ Join With Code ]
```

Secondary explanation:

```text
No complicated setup.
No account required.
Just create, scan, and share.
```

The design should feel:

* Modern
* Minimal
* Premium
* Fast
* Technical
* Trustworthy

Avoid excessive gradients, excessive glassmorphism, unnecessary animations, or generic AI landing-page aesthetics.

The JaldiDo brand should be visually distinctive.

---

# 14. Main Dashboard

After creating a session:

```text
┌───────────────────────────────────────────────┐
│ JALDIDO                              [⋮]      │
├───────────────────────────────────────────────┤
│                                               │
│              YOUR SHARE CODE                  │
│                                               │
│                  7F3A9C                       │
│                                               │
│             [ Copy Code ]                     │
│                                               │
│              [ QR CODE ]                       │
│                                               │
│        Waiting for another device...          │
│                                               │
├───────────────────────────────────────────────┤
│ Connected Devices                             │
│                                               │
│ ● Chrome Laptop                               │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│ Drop files here                               │
│                                               │
│              or                               │
│                                               │
│          [ Add Files ]                        │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│ Send Text                                     │
│                                               │
│ [ Write or paste something... ]               │
│                                               │
│                         [ Send ]               │
└───────────────────────────────────────────────┘
```

Make the UI responsive rather than simply shrinking the desktop interface.

---

# 15. Join Page

The join page should be extremely simple.

```text
Join JaldiDo Session

Enter your 6-character code

[ _ _ _ _ _ _ ]

[ Connect ]
```

Validate:

* Exactly 6 characters
* Hexadecimal characters only
* Session exists
* Session is active
* Session has not expired

Invalid code:

```text
Invalid or expired share code.
```

---

# 16. File Cards

Each shared file should appear as a card.

Example:

```text
┌──────────────────────────────────────┐
│ 🎬  project-demo.mp4                 │
│     24.8 MB                          │
│                                      │
│     Transfer complete                │
│                                      │
│               [ Download ]            │
└──────────────────────────────────────┘
```

During transfer:

```text
Uploading...

██████████████░░░░░░  68%

12.4 MB / 18.2 MB
```

---

# 17. Drag and Drop

Desktop users should be able to drag files directly into JaldiDo.

Support:

```text
Drag files here
```

Highlight the drop area while dragging.

Mobile users should get:

```text
[ Select Files ]
```

---

# 18. Clipboard Support

Where browser permissions allow it, provide:

```text
[ Paste From Clipboard ]
```

Also allow normal manual text entry.

Do not assume clipboard permission is always available.

Handle permission denial gracefully.

---

# 19. Responsive Design

JaldiDo must be designed mobile-first.

Required breakpoints:

```text
Mobile
Tablet
Laptop
Desktop
```

Test layouts around:

```text
360px
390px
768px
1024px
1280px
1440px+
```

Do not create horizontal overflow.

Touch targets must be large enough for mobile interaction.

---

# 20. Recommended Technology Stack

## Frontend

```text
React
TypeScript
Vite
Tailwind CSS
```

## Backend

```text
Node.js
TypeScript
Express
WebSocket
```

Use a lightweight WebSocket implementation such as:

```text
ws
```

## Database / Temporary State

For the MVP, choose the simplest reliable approach.

Possible:

```text
Redis
```

or:

```text
PostgreSQL
```

or an in-memory store for local development.

The architecture must allow replacement of the storage layer.

Create:

```text
SessionRepository
```

rather than accessing the database directly from route handlers.

## File Storage

For development:

```text
Local temporary storage
```

For production architecture:

```text
S3-compatible object storage
```

Keep the storage implementation abstract.

---

# 21. Recommended Project Structure

Use a clean monorepo-style structure:

```text
jaldido/
│
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── stores/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   └── ...
│   │
│   └── server/
│       ├── src/
│       │   ├── routes/
│       │   ├── websocket/
│       │   ├── services/
│       │   ├── repositories/
│       │   ├── middleware/
│       │   ├── storage/
│       │   ├── types/
│       │   └── utils/
│       └── ...
│
├── packages/
│   └── shared/
│       ├── types/
│       ├── constants/
│       └── events/
│
├── README.md
├── package.json
└── ...
```

---

# 22. API Design

Create clean APIs.

### Create session

```http
POST /api/sessions
```

Response:

```json
{
  "sessionId": "...",
  "accessCode": "7F3A9C",
  "expiresAt": "..."
}
```

### Join session

```http
POST /api/sessions/join
```

Request:

```json
{
  "accessCode": "7F3A9C"
}
```

Response:

```json
{
  "sessionId": "...",
  "expiresAt": "...",
  "status": "active"
}
```

### Files

```http
POST /api/sessions/:sessionId/files
GET /api/sessions/:sessionId/files
DELETE /api/sessions/:sessionId/files/:fileId
```

### Text

```http
POST /api/sessions/:sessionId/messages
```

---

# 23. Error Handling

Never expose raw backend errors to users.

Create user-friendly states:

```text
Session not found.

Session expired.

Invalid share code.

Unable to connect.

Connection lost.

File upload failed.

File too large.

Unsupported file type.

Something went wrong. Please try again.
```

Add retry mechanisms where appropriate.

---

# 24. Loading States

Every asynchronous operation must have a loading state.

Examples:

```text
Creating session...
Connecting...
Uploading...
Preparing download...
Joining session...
```

Never leave the user staring at an unresponsive button.

Disable buttons while appropriate operations are processing.

---

# 25. Accessibility

Implement:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Accessible buttons
* ARIA labels where necessary
* Proper color contrast
* Screen-reader-friendly status messages

Do not use icons as the only indication of an action.

---

# 26. Browser Compatibility

Target modern:

* Chrome
* Edge
* Firefox
* Safari
* Android Chrome
* iOS Safari

Gracefully handle unsupported browser APIs.

---

# 27. Security

Implement basic production-minded security.

### Backend

* CORS configuration
* Security headers
* Rate limiting
* Request validation
* File type validation
* File size limits
* Sanitized filenames
* Session expiration
* Temporary storage cleanup
* WebSocket authentication through session membership
* Protection against arbitrary path traversal
* Protection against malformed requests

Never trust:

```text
filename
MIME type
session ID
access code
client device name
```

Validate everything server-side.

---

# 28. File Upload Limits

Define a configurable maximum file size.

For example:

```text
MAX_FILE_SIZE=104857600
```

Do not hardcode the value throughout the application.

Use environment variables.

Example:

```env
MAX_FILE_SIZE=104857600
SESSION_TTL=900
```

---

# 29. Environment Configuration

Create:

```text
.env.example
```

Example:

```env
PORT=3000
WEB_URL=http://localhost:5173
SESSION_TTL=900
MAX_FILE_SIZE=104857600
STORAGE_PATH=./tmp/uploads
```

Never commit secrets.

Create a proper:

```text
.gitignore
```

---

# 30. Development Experience

The project must run with:

```bash
npm install
npm run dev
```

Prefer a root-level development command that starts both:

```text
Web
Server
```

If using workspaces, configure them properly.

---

# 31. Testing

Implement at minimum:

### Unit Tests

Test:

* Hex code generation
* Code validation
* Session expiration
* Session creation
* Session joining

### API Tests

Test:

* Create session
* Join valid session
* Reject invalid session
* Reject expired session

### Frontend Tests

Test critical flows:

```text
Create session
Join session
Upload file
Display shared file
Send text
```

---

# 32. Logging

Implement structured development-friendly logging.

Log:

```text
Session created
Device joined
Device disconnected
File uploaded
File deleted
Session expired
```

Never log:

* File contents
* Passwords
* Private tokens
* Sensitive user data

---

# 33. UX Details

Use subtle animations for:

* Session creation
* QR appearance
* Device joining
* File upload
* File transfer completion
* Session expiration

Animations must remain fast and purposeful.

Support reduced-motion preferences.

---

# 34. JaldiDo Brand

The application name is:

```text
JaldiDo
```

Use **JaldiDo** consistently throughout the UI, metadata, documentation, and project configuration.

Suggested positioning:

```text
JaldiDo
Share it. Send it. Done.
```

The brand should communicate:

* Speed
* Simplicity
* Convenience
* Device-to-device sharing
* Zero-friction interaction

Do not use Google, Android, AirDrop, Apple, or other third-party branding.

Create an original visual identity.

Keep branding isolated in reusable components/configuration so the product identity can be changed easily later.

---

# 35. MVP Scope Restrictions

DO NOT build these features in the first MVP:

* User accounts
* Social profiles
* Chat system
* Contact lists
* Permanent cloud storage
* Complex permissions
* Subscription system
* Payments
* Admin dashboard
* AI features
* Native mobile applications
* Desktop applications
* Enterprise management

The objective is a **working cross-device sharing experience**, not a large SaaS platform.

---

# 36. Future Architecture Considerations

Keep the architecture extensible for:

```text
WebRTC P2P transfer
End-to-end encryption
Permanent accounts
Authenticated users
Large file transfers
Resumable uploads
Transfer history
Native mobile apps
Desktop applications
Nearby device discovery
LAN discovery
Cloud storage
Password-protected sessions
Session sharing permissions
Multi-device rooms
```

Do not implement these now unless required for the MVP.

---

# 37. Definition of Done

The MVP is considered complete only when the following works end-to-end.

### Test 1: Phone → Laptop

Open JaldiDo on a phone.

Create a session.

Receive:

```text
6-character hexadecimal code
QR code
```

### Test 2: Join

Open JaldiDo on a laptop.

Enter the code.

Laptop successfully joins the phone's session.

### Test 3: Image

Upload an image from the phone.

Laptop sees the image.

Laptop can download it.

### Test 4: Video

Upload a video.

Transfer progress is visible.

### Test 5: Text

Send text.

Text appears on the other device in real time.

### Test 6: QR

Laptop creates a session.

Phone scans the QR code.

Phone joins automatically.

### Test 7: Expiration

Allow the session to expire.

Both devices receive:

```text
Session expired
```

Access is revoked.

### Test 8: Invalid Code

Attempt an invalid code.

JaldiDo rejects it gracefully.

---

# 38. Agent Execution Instructions

You are acting as a senior full-stack engineer.

Do not merely generate mock UI.

Build the actual working JaldiDo MVP.

Before writing code:

1. Inspect the existing repository.
2. Identify the current framework and package manager.
3. Reuse existing infrastructure where appropriate.
4. Do not unnecessarily rewrite existing working code.
5. Create a clear implementation plan.
6. Implement the backend and frontend.
7. Connect the frontend to the backend.
8. Implement real WebSocket communication.
9. Implement real file upload/download.
10. Implement real QR generation.
11. Implement session expiration.
12. Implement validation and error handling.
13. Run tests.
14. Run the production build.
15. Fix all TypeScript, build, and runtime errors.
16. Verify the complete phone-to-laptop and laptop-to-phone flows.

Do not stop after creating the UI.

The final application must be functional.

---

# 39. Final Deliverables

Provide:

```text
Working JaldiDo frontend
Working JaldiDo backend
WebSocket layer
Session management
6-character hexadecimal codes
QR-code joining
File upload/download
Text sharing
Transfer progress
Session expiration
Responsive UI
Security validation
Tests
README
.env.example
```

The README must explain:

```text
Project overview
Architecture
Tech stack
Folder structure
Local setup
Environment variables
Development commands
Production build
API endpoints
WebSocket events
Security considerations
Future improvements
```

---

# Final Product Principle

JaldiDo should feel like:

```text
Open
  ↓
Create
  ↓
Scan / Enter Code
  ↓
Share
  ↓
Done
```

There should be almost zero friction.

Prioritize:

1. Reliability
2. Simplicity
3. Speed
4. Responsive UX
5. Security
6. Clean architecture

Do not over-engineer the MVP.

Build a genuinely working JaldiDo product that can be tested immediately across two real devices.
