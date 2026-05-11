# 🎬 Merry Story Productions — Production Management Portal

**Your Story, Spectacularly Told.**

Merry Story Productions is a premium event coordination and production management platform designed to streamline the lifecycle of high-end events, from initial inquiry to final execution.

## 🚀 Project Overview

This portal serves as the central nervous system for Merry Story coordinators and administrators. It provides a sleek, high-performance interface for managing client leads, coordinating production tasks, assigning staff, and managing vendor partnerships.

## 🛠 Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Next.js API Routes (Serverless).
- **Database**: MongoDB (Client & Inquiry Data).
- **Authentication**: Firebase Authentication (Role-based access).
- **Storage**: Supabase Storage (Profile pictures & Event assets).
- **Email**: Nodemailer / Gmail (Account activation & Notifications).
- **Deployment**: Vercel.

## ✨ Key Features Implemented

### 👔 Admin Portal
- **Dashboard Metrics**: Real-time tracking of active events, inquiries, and pending tasks.
- **Inquiry Management**: A "Live Registry" to review, approve, or archive incoming client leads.
- **Event Coordination**: High-level view of projects in production with budget and timeline tracking.
- **User Management**: Creation and management of Coordinator and Staff accounts with automated email invitations.
- **Audit Logs**: Backend tracking of critical actions for security and transparency.

### 📋 Coordinator Portal
- **Dashboard**: Focused view of tasks and assigned events.
- **Inquiry Pipeline**: Integrated access to manage client leads assigned to the coordination team.
- **Production Tasks**: Detailed task management with priority levels, due dates, and vendor assignments.
- **Profile Integration**: Full self-service profile management, including phone contact updates and avatar uploads.

### 🔗 Backend & Integrations
- **Role-Based Access Control (RBAC)**: Secure routes using Firebase ID tokens and MongoDB role verification.
- **Vendor System**: Integrated vendor lookup and assignment within the task management workflow.
- **Real-time Notifications**: Backend-connected notification system for new leads and task updates.

## 🔑 Environment Variables

To run this project locally or on Vercel, the following environment variables are **REQUIRED**:

### Database & Auth
- `MONGODB_URI`: MongoDB connection string.
- `FIREBASE_PROJECT_ID`: Your Firebase project ID.
- `FIREBASE_CLIENT_EMAIL`: Service account email.
- `FIREBASE_PRIVATE_KEY`: Service account private key.

### Storage (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for server-side storage operations).

### Email (Nodemailer)
- `EMAIL_USER`: Gmail address for sending automated emails.
- `EMAIL_PASS`: Gmail App Password.

### GitHub Actions
The `Auto Archive and Retention` workflow in `.github/workflows/auto-archive.yml` requires the same values to be added as repository secrets:
- `MONGODB_URI`
- `EMAIL_USER`
- `EMAIL_PASS`

If any of those secrets are missing, the workflow will fail before the archive scripts run.

## 🛣 Roadmap: What's Left To Do

- [ ] **Event Creation Workflow**: Implement the multi-step form to convert an approved inquiry into a live project.
- [ ] **Financial Module**: Add budget tracking and expense management for individual events.
- [ ] **Client Portal**: Create a simplified view for clients to track their event progress and upload documents.
- [ ] **Calendar Integration**: Sync event dates and task deadlines with Google Calendar/iCal.
- [ ] **Messaging System**: Internal chat for coordinators and staff to communicate on specific projects.
- [ ] **Vendor Database Expansion**: Full CRUD operations for the vendor directory (currently using partial mock data).

## 💻 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/veth14/MerryStory.git
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment**:
   Create a `.env.local` file and add the required variables listed above.

4. **Run Development Server**:
   ```bash
   npm run dev
   ```

---

&copy; 2026 Merry Story Inc. All rights reserved.
