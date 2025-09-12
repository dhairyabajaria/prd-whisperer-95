# Overview

This is an AI-powered ERP & CRM system specifically designed for pharmaceutical distribution companies. The platform integrates multiple business modules including Sales, Purchases, Inventory, Finance, HR, POS, Marketing, and AI automation into a unified role-based system. Built with a modern full-stack architecture, it features comprehensive pharmaceutical-specific functionality like expiry tracking, batch management, regulatory compliance, and multi-currency support with initial focus on Angola and international expansion capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client is built using React with TypeScript, implementing a modern component-based architecture. The UI uses Shadcn/UI components built on Radix UI primitives with Tailwind CSS for styling. State management is handled through TanStack Query for server state and React hooks for local state. The application follows a page-based routing structure with Wouter for client-side navigation.

**Key Design Decisions:**
- **Component Library Choice**: Shadcn/UI provides pre-built, accessible components that reduce development time while maintaining design consistency
- **State Management**: TanStack Query eliminates the need for complex global state management by handling server state caching and synchronization
- **Styling Approach**: Tailwind CSS enables rapid UI development with utility-first classes and CSS variables for theming

## Backend Architecture
The server is built with Express.js and TypeScript, providing RESTful API endpoints. Database operations use Drizzle ORM with PostgreSQL for type-safe database interactions. The architecture implements role-based access control with session-based authentication through Replit Auth integration.

**Key Design Decisions:**
- **ORM Selection**: Drizzle provides excellent TypeScript integration and performance while maintaining SQL-like syntax familiarity
- **API Design**: RESTful endpoints with consistent error handling and response formatting for predictable client-server communication
- **Authentication Strategy**: Replit Auth handles OAuth flow while sessions provide stateful authentication for the application

## Database Schema
The database uses PostgreSQL with a comprehensive schema covering all pharmaceutical distribution needs:

- **Core Entities**: Users, Customers, Suppliers, Products, Warehouses
- **Operations**: Sales Orders, Purchase Orders, Invoices, Stock Movements
- **Inventory Management**: Batch tracking, expiry dates, multi-location stock
- **Role-Based Access**: User roles (admin, sales, inventory, finance, hr, pos, marketing) with appropriate permissions

**Key Design Decisions:**
- **Pharmaceutical-Specific Fields**: Expiry dates, batch numbers, and regulatory tracking built into the core schema
- **Multi-Currency Support**: Decimal fields for pricing with currency tracking for international operations
- **Audit Trail**: Comprehensive tracking of stock movements and financial transactions

## AI Integration
The system integrates OpenAI's GPT models for intelligent automation and insights:

- **Inventory Recommendations**: AI analyzes sales patterns and stock levels to suggest reorder quantities
- **Price Optimization**: Market analysis and competitive pricing suggestions
- **Customer Sentiment Analysis**: Email and communication analysis for customer relationship insights
- **Interactive Chat**: Real-time AI assistant for business queries and data analysis

**Key Design Decisions:**
- **AI Service Architecture**: Centralized AI service class handles all OpenAI interactions with proper error handling
- **Data Integration**: AI functions receive structured data from the database for context-aware recommendations
- **User Experience**: AI features are integrated into the main workflow rather than separate tools

## Authentication & Authorization
The system implements Replit Auth for OAuth-based authentication with session management:

- **Session Storage**: PostgreSQL-based session storage for scalability
- **Role-Based Access**: Middleware enforces role-based permissions on API endpoints
- **Security Features**: HTTPS enforcement, secure cookies, and CSRF protection

**Key Design Decisions:**
- **OAuth Integration**: Replit Auth provides enterprise-grade authentication without custom implementation
- **Session Management**: Database-backed sessions enable horizontal scaling and persistent login state
- **Permission Model**: Role-based system aligns with typical pharmaceutical distribution organizational structure

# External Dependencies

## Database & ORM
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL for scalability and managed hosting
- **Drizzle ORM**: Type-safe database operations with excellent TypeScript integration
- **Connection Pooling**: Neon serverless handles connection management automatically

## Authentication & Sessions
- **Replit Auth**: OAuth-based authentication service providing secure user management
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **OpenID Connect**: Standard protocol for authentication flow

## AI & Machine Learning
- **OpenAI API**: GPT models for intelligent business insights and automation
- **Natural Language Processing**: Customer sentiment analysis and business query processing

## Frontend Framework & UI
- **React**: Component-based UI framework with hooks and modern patterns
- **TanStack Query**: Server state management and caching with automatic refetching
- **Shadcn/UI + Radix UI**: Accessible component library with customizable styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Wouter**: Lightweight client-side routing

## Development & Build Tools
- **Vite**: Fast build tool with hot module replacement for development
- **TypeScript**: Type safety across the entire application stack
- **ESBuild**: Fast JavaScript bundler for production builds
- **Replit Development Tools**: Integrated development environment with debugging support

## Data Validation & Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Form state management with validation integration
- **Drizzle-Zod**: Automatic schema generation from database models

## Utility Libraries
- **date-fns**: Date manipulation and formatting for international localization
- **class-variance-authority**: Type-safe CSS class management for component variants
- **Lucide React**: Consistent icon library with tree-shaking support