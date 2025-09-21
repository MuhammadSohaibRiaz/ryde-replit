# Ryde5 Ride Booking Application

## Overview
A Next.js-based ride booking application called "Ryde5" that allows users to book rides as passengers or register as drivers. The application features a modern UI with booking interfaces, payment systems, admin dashboards, and tracking capabilities.

## Project Architecture
- **Framework**: Next.js 14.2 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Custom components with Lucide React icons
- **Forms**: React Hook Form with Zod validation
- **Charts**: Chart.js for analytics
- **Maps**: Google Maps integration (@googlemaps/js-api-loader)
- **Animations**: Framer Motion

## Current State
- ✅ Dependencies installed and configured
- ✅ Next.js configured for Replit environment (port 5000, 0.0.0.0 host)
- ✅ Workflow configured and running
- ✅ Deployment configuration set up for production
- ✅ Cross-origin and proxy issues resolved

## Key Features
- Landing page with passenger/driver selection
- Authentication flows for both passengers and drivers
- Booking interface with location selection
- Driver tracking and ride confirmation
- Payment processing
- Admin dashboard with analytics
- User profiles and driver profiles
- Rating and review system

## Recent Changes (September 21, 2025)
- ✅ Fresh GitHub import setup completed
- ✅ Installed all project dependencies via npm install
- ✅ Configured Next.js for Replit environment (host 0.0.0.0, port 5000)
- ✅ Updated package.json dev script for proper host binding
- ✅ Fixed Next.js configuration for image optimization and cross-origin issues
- ✅ Set up workflow for frontend server running on port 5000
- ✅ Configured deployment for autoscale with npm build/start
- ✅ Added Supabase integration with graceful fallback for missing credentials
- ✅ Fixed middleware to handle missing Supabase environment variables
- ✅ Added cache-control headers for Replit iframe compatibility

## Development
- Server runs on port 5000 with host 0.0.0.0 for Replit compatibility
- Hot reload enabled for development
- TypeScript with strict mode enabled

## Deployment
- Configured for autoscale deployment
- Build: `npm run build`
- Start: `npm start`
- Optimized for static export capabilities

## Known Issues
- Minor image aspect ratio warnings (cosmetic)
- Some deprecated @next/font package warnings (non-critical)
- Supabase authentication disabled due to missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables

## Environment Setup Required
To enable full functionality, the following Supabase environment variables need to be configured:
- NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY: Your Supabase anonymous key

Without these variables, the app runs with authentication middleware disabled.