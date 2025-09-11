# Walletgyde AI Landing Page

## Overview

This is a full-stack web application for Walletgyde AI, a financial coaching platform that provides AI-powered personalized financial education. The application features Google OAuth authentication, AI-generated or uploaded avatars, and a comprehensive chatbot interface for financial coaching with persistent conversation history and transaction analysis capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Animations**: Framer Motion for smooth animations
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Session Management**: In-memory storage with fallback to database
- **API Design**: RESTful endpoints with proper error handling
- **Development**: Hot reload with Vite integration

## Key Components

### Frontend Components
- **Navigation**: Fixed header with smooth scrolling navigation
- **Hero Section**: Main landing area with CTA buttons and hero visuals
- **Features Section**: Showcases key financial coaching modules
- **Comparison Section**: Differentiates from generic AI chatbots
- **Security Section**: Highlights data privacy and educational guardrails
- **CTA Section**: Beta signup form with real-time validation
- **Footer**: Contact information and social links

### Backend Components
- **Route Handlers**: API endpoints for beta signup and user management
- **Storage Layer**: Abstracted storage interface supporting both memory and database
- **Database Schema**: User and beta signup tables with proper relationships
- **Middleware**: Request logging, error handling, and JSON parsing

## Data Flow

1. **User Interaction**: Users interact with the landing page components
2. **Form Submission**: Beta signup form sends data to `/api/beta-signup` endpoint
3. **Data Validation**: Server validates email format using Zod schemas
4. **Database Storage**: Valid signups are stored in PostgreSQL via Drizzle ORM
5. **Response Handling**: Success/error responses trigger toast notifications
6. **State Updates**: React Query manages cache invalidation and UI updates

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Icons**: Lucide React and React Icons
- **Forms**: React Hook Form with Hookform Resolvers
- **Validation**: Zod for schema validation
- **HTTP Client**: Fetch API with TanStack Query wrapper

### Backend Dependencies
- **Database**: Neon Database (PostgreSQL serverless)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Store**: connect-pg-simple for PostgreSQL session storage
- **Development**: tsx for TypeScript execution

### Build Dependencies
- **Bundling**: Vite for frontend, esbuild for backend
- **Styling**: PostCSS with Tailwind CSS and Autoprefixer
- **Development**: Replit-specific plugins for error overlay and cartographer

## Deployment Strategy

### Development Environment
- **Frontend**: Vite dev server with HMR and error overlay
- **Backend**: tsx with hot reload and request logging
- **Database**: Drizzle Kit for schema migrations and database push

### Production Build
- **Frontend**: Vite build to `dist/public` with optimized assets
- **Backend**: esbuild bundle to `dist/index.js` with external packages
- **Database**: Drizzle migrations applied automatically
- **Serving**: Express serves both API and static frontend files

### Environment Configuration
- **Database**: `DATABASE_URL` environment variable required
- **Development**: `NODE_ENV=development` for dev-specific features
- **Production**: `NODE_ENV=production` for optimized builds

## Changelog

```
Changelog:
- August 25, 2025. Transformed landing page into Budget Builder focused experience:
  * Updated hero section with "Take control of your budget & debt" messaging
  * Streamlined header to only "See Demo" CTA with "Budget Builder Agent" branding
  * Removed trust chips and old sections, focused only on Budget Builder Agent
  * Created realistic mobile phone mockup for chat interface demo
  * Added messaging about being superior to generic chatbots (trained on financial APIs vs internet)
  * Fixed email input contrast issues and removed beta signup/reviews messaging
  * Updated footer branding to "Budget Builder Agent" with chatbot icon
  * Connected "See Demo" button to actual chatbot functionality (/chatbot route)
  * Made chatbot accessible for demo without authentication requirement
  * Added educational disclaimer: "For educational use only. Not financial advice"
- August 20, 2025. Enhanced chatbot with direct bank connection functionality:
  * Added "Connect Bank" button directly in the AI chat interface
  * Button functions identically to the Connect Bank Account feature in settings
  * Smart button behavior: shows "Connect bank account" if no accounts linked
  * Automatically triggers Plaid Link popup for seamless bank connection
  * Integrated with existing transaction analysis workflow
  * Fixed Plaid API integration issue with unsupported phone verification field
  * Deployed with proper environment variable configuration for production
- July 23, 2025. Implemented complete Plaid banking integration:
  * Added comprehensive Plaid API service with account management
  * Created bank account connection interface in settings page
  * Integrated real-time transaction syncing and categorization
  * Updated AI chatbot to use connected bank data instead of manual input
  * Added transaction analysis button in chatbot for instant insights
  * Implemented secure token exchange and account balance retrieval
  * Enhanced financial coaching with authentic banking data
- July 12, 2025. Fixed avatar generation and API key consolidation:
  * Consolidated duplicate Gemini API keys to use single GOOGLE_AI_API_KEY
  * Fixed avatar generation functionality in both account creation and settings
  * Resolved authentication issues by creating missing database tables
  * All AI features now use the same Google AI API key for consistency
- July 11, 2025. Implemented comprehensive mobile and desktop responsiveness:
  * Fixed navigation buttons to always be visible with consistent styling
  * Improved mobile chatbot interface with responsive sidebar overlay
  * Enhanced message bubbles and input area for mobile screens
  * Updated avatar setup and settings pages with mobile-friendly layouts
  * Added mobile-responsive utilities and safe area support
  * Made Join Beta and Sign in buttons use the same styling class
- July 08, 2025. Implemented complete financial coaching platform with:
  * Google OAuth authentication with Replit Auth
  * Avatar setup page with AI-generated avatars and photo upload
  * Financial chatbot powered by Google Gemini AI
  * Persistent chat conversations with sidebar navigation
  * Transaction analysis and categorization
  * Financial data analysis capabilities
  * User onboarding flow with avatar selection
  * Database schema for users, conversations, and messages
  * Fixed avatar management to delete old avatars when uploading new ones
  * Fixed chatbot messaging system to properly display messages
  * Added proper conversation isolation between different chats
  * Added navigation back to landing page from chatbot header
- July 01, 2025. Initial setup with landing page and beta signup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```