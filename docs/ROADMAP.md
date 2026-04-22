# 🗺 Merry Story Development Roadmap

This document outlines the current progress and the specific technical tasks remaining to reach full production readiness for the Merry Story Portal.

## ✅ Phase 1: Core Infrastructure & Dashboards (Completed)
- [x] **Universal UI Design System**: Premium aesthetics with glassmorphism and Apple-inspired layout.
- [x] **Firebase Authentication**: Integrated with Google/Email sign-in.
- [x] **Role-Based Guards**: Protecting Admin vs. Coordinator routes.
- [x] **MongoDB Integration**: Base setup for users and inquiries collections.
- [x] **Admin Dashboard**: Metrics for events, inquiries, and staff overview.
- [x] **Coordinator Header & Notifications**: Real-time awareness of system activity.
- [x] **Profile Self-Service**: Ability to update contact info and avatars (Supabase storage).

## 🚀 Phase 2: Functional Depth (In Progress)

### 1. Event & Project Lifecycle
- [ ] **Inquiry-to-Project Conversion**: 
    - Create a "Confirm Booking" action in the Inquiries page.
    - Generate a new entry in the `projects` collection based on inquiry details.
- [ ] **Live Project Dashboard**: 
    - Replace current mock cards with live data from MongoDB.
    - Implement status filters (Pre-Prod, Live, Completed).
- [ ] **Task Persistence**: 
    - Move tasks from local state to a `tasks` collection in MongoDB.
    - Add real-time updates when a task is checked off.

### 2. Vendor Management
- [x] **Task-Vendor Link**: Added the ability to assign vendors to specific tasks.
- [ ] **Vendor Directory CRUD**: 
    - Implement `GET /api/vendors` to fetch from DB.
    - Create the "Add Vendor" and "Edit Vendor" functionality in the `VendorsView`.
- [ ] **Vendor Performance Tracking**: Link vendors to event feedback ratings.

### 3. Staff & User Operations
- [x] **Staff Invitation System**: Send activation emails to new users.
- [ ] **Role Management**: Allow Admins to promote/demote users between Staff and Coordinator roles.
- [ ] **Audit Log UI**: Build a page for Admins to view the `audit-logs` collection (already implemented in backend).

## 🔮 Phase 3: Advanced Features (Planned)

### 1. Communication
- [ ] **Project Comments**: Add a "Discussion" thread to every task and event.
- [ ] **Email Automation**: Automated "Thank You" emails and "Proposal Received" confirmations to clients.

### 2. Financials & Reporting
- [ ] **Budget Tracker**: Track estimated vs. actual costs for every event.
- [ ] **Profitability Reports**: Calculate margins based on event coordination fees.

### 3. Client Experience
- [ ] **Public Inquiry Form**: A stylized, external-facing version of the inquiry form for the main landing page.
- [ ] **Client Access**: Limited portal view for clients to approve proposals and view timelines.

---

## 🛠 Required Technical Steps for USER
1. **Environment Config**: Ensure `MONGODB_URI`, `FIREBASE_PRIVATE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are added to Vercel.
2. **Supabase Bucket**: Create a public bucket named `user` in your Supabase storage for avatar uploads.
3. **Gmail App Password**: Generate an App Password for the `EMAIL_USER` account to enable activation emails.
