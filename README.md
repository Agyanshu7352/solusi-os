# Solusi OS — Production Starter

This repository contains the first production-oriented codebase for Solusi Design's business operating system.

## Included

- Next.js + React + TypeScript application
- Responsive desktop/mobile UI
- Role-oriented navigation structure
- Command Center
- Sales & CRM
- Quotations
- Design Studio
- Material Library
- Moodboards
- Client Approvals
- Projects
- Tasks & SOP
- Site Control
- Labour
- Issues & Snags
- Inventory
- Procurement
- BOQ & Variations
- Finance & P&L
- Client Portal
- Supabase/PostgreSQL schema covering the core operating model

## Run locally

1. Install Node.js 20+.
2. Copy `.env.example` to `.env.local`.
3. Create a Supabase project.
4. Run `supabase/schema.sql` in Supabase SQL Editor.
5. Add the Supabase URL and anonymous key to `.env.local`.
6. Install dependencies:
   `npm install`
7. Start:
   `npm run dev`

Then open the local Next.js address shown in the terminal.

## Architecture

Frontend: Next.js / React / TypeScript
Database/Auth/Storage: Supabase
Recommended production storage: Supabase Storage for drawings, site photos, invoices and material images.

## Next production integration

The UI currently demonstrates the complete workflow and local state. The next engineering step is replacing demo state with Supabase queries/mutations and adding:
- real authentication + role-based access control
- storage uploads
- realtime project/task updates
- WhatsApp/email notifications
- client share links
- PDF quotation and BOQ generation
- accounting integration
- audit log
- backups
- deployment

Do not expose service-role keys in the browser. Use server-side actions/API routes for privileged operations.
