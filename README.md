# TrabaHost

On-demand staffing platform for the Philippines. Businesses post short-term shifts; workers nearby apply, check in via QR code, and get paid instantly through GCash or Maya.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 51), Expo Router, TypeScript |
| Styling | NativeWind v4 (Tailwind CSS) |
| State | Zustand |
| Admin Dashboard | React + Vite, TypeScript, Tailwind CSS |
| Database | Supabase (PostgreSQL + PostGIS) |
| Auth | Supabase Auth |
| Edge Functions | Supabase Edge Functions (Deno / TypeScript) |
| Push Notifications | Firebase FCM HTTP v1 |
| Payments | Maya (PayMaya), GCash via PayMongo |
| Maps | Google Maps SDK, Google Geocoding API |

---

## Project Structure

```
trabahost/
├── mobile/                   Expo React Native app
│   ├── app/
│   │   ├── (auth)/           Login & Register screens
│   │   ├── (worker)/         Worker tabs (Feed, My Shifts, Earnings, Profile)
│   │   ├── (business)/       Business tabs (Dashboard, Post Shift, Payments, Profile)
│   │   └── qr-scan.tsx       QR check-in/out modal
│   ├── lib/                  Supabase, Firebase, Maps, Payments clients
│   ├── hooks/                useShifts, etc.
│   ├── store/                Zustand auth store
│   └── types/                TypeScript types
│
├── admin/                    React + Vite admin dashboard
│   └── src/pages/            Dashboard, Users, Shifts, Disputes, Analytics
│
├── supabase/
│   ├── migrations/           SQL schema & seed data
│   └── functions/
│       ├── payment-webhook/  Maya + GCash payment handling
│       ├── matching-engine/  Geo-matching + push notifications
│       └── reliability-score/ Worker score recalculation
│
└── scripts/
    └── generate-assets.js    Generates placeholder app icons/splash
```

---

## Features

**Workers**
- Browse and apply for nearby shifts on a map feed
- QR code check-in and check-out at the workplace
- Track earnings and payment history
- Reliability score based on attendance and ratings

**Businesses**
- Post shifts with location, hourly rate, required skills, and slot count
- Review and approve worker applications
- Generate QR codes for shift check-in
- Pay workers via GCash or Maya after shift completion

**Admin Dashboard**
- User management (workers, businesses)
- Shift oversight and dispute resolution
- Analytics and platform metrics

---

## Getting Started

See [`how-to-run.example.txt`](how-to-run.example.txt) for the full setup guide covering:

1. Supabase project setup and migrations
2. Firebase push notification configuration
3. Google Maps API setup
4. Maya and PayMongo payment integration
5. Environment variable configuration
6. Running the mobile app and admin dashboard

---

## Prerequisites

- Node.js 18+
- Yarn 1.x
- Expo Go app (for mobile testing)
- Supabase account
- Firebase project (for push notifications)

---

## Quick Start

```bash
# Install dependencies
yarn install

# Generate placeholder app assets
node scripts/generate-assets.js

# Mobile app
cd mobile
cp .env.example .env   # fill in your keys
yarn start

# Admin dashboard (separate terminal)
cd admin
cp .env.example .env.local   # fill in your keys
yarn dev
```

---

## Database

Migrations are in `supabase/migrations/` and must be run in order:

| File | Description |
|---|---|
| `001_initial_schema.sql` | Tables, RLS policies, indexes, triggers |
| `002_helpers.sql` | Geo-matching helper functions |
| `003_seed_business.sql` | Optional sample data for development |

Run them via the Supabase SQL Editor or with the Supabase CLI.

---

## Environment Variables

| File | Used by |
|---|---|
| `.env` | Supabase Edge Functions |
| `mobile/.env` | Expo mobile app |
| `admin/.env.local` | Vite admin dashboard |

Copy the `.example` versions and fill in your own keys. None of the `.env` files are committed.
