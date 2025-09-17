# RoomLedger

A simple, mobile-first web app that helps hostel roommates track shared bills, split expenses, and record repayments.

## Features

- **User & Room Management**: Sign up/in with email + password, create or join rooms with invite codes
- **Dashboard**: Overview of net balance, recent bills, and activity feed
- **Bill Management**: Add bills, automatic equal splits, track status
- **Settlements**: Record partial or full repayments per bill
- **History**: Timeline of all bills and payments
- **Analytics** (Future): Spending breakdown and insights

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui + Radix Primitives
- **Animations**: Framer Motion
- **Data Fetching**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **Charts**: Recharts
- **Database**: Supabase (PostgreSQL)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Fill in your Supabase credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # Dashboard page
│   └── ...
├── components/         # Reusable components
│   ├── dashboard/      # Dashboard-specific components
│   ├── shared/        # Shared UI components
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks
├── lib/               # Utility functions and configurations
├── stores/            # State management (future)
└── types/             # TypeScript type definitions
```

## Database Schema

The database schema is defined in `../schema.sql` and includes:
- User profiles
- Rooms and room members
- Bills with participants and payers
- Bill settlements
- Views for calculating user positions and balances

## Deployment

This app is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## License

MIT License
