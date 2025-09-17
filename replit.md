# Overview

This project is an AI-powered ERP & CRM system designed for pharmaceutical distribution companies. It integrates Sales, Purchases, Inventory, Finance, HR, POS, Marketing, and AI automation into a unified, role-based platform. The system features pharmaceutical-specific functionalities like expiry tracking, batch management, regulatory compliance, and multi-currency support, initially focusing on Angola with capabilities for international expansion. The core ambition is to provide a comprehensive, intelligent solution to streamline operations and enhance decision-making in the pharmaceutical distribution sector.

# User Preferences

Preferred communication style: Simple, everyday language.

# Current Status - Performance Optimization Project

**Last Updated:** September 17, 2025 - 1:47 PM  
**Project Phase:** Phase 2 Implementation (Medium-Term Optimizations)  

## Performance Optimization Progress

### ✅ Phase 1 (COMPLETE - September 17, 2025)
- **Memory Leak Fixes**: Resolved - 100% CPU usage alerts eliminated
- **Dashboard Metrics Caching**: Implemented - 58% improvement (586ms → 246ms)  
- **Database Connection Pool**: Optimized - healthy operation with max=25, min=8
- **System Stability**: Production-ready with robust database connectivity

### 🚧 Phase 2 (IN PROGRESS - Target: September 19, 2025)
- **Query Optimization**: Quotations (1065ms → <200ms target), Authentication (608ms → <200ms target)
- **API Response Optimization**: Compression, pagination, payload optimization
- **Status**: Implementation starting

### 📅 Phase 3 (PLANNED - Target: September 24, 2025)  
- **Advanced Caching**: Multi-layer L1+L2 caching strategy
- **Database Infrastructure**: Read replicas, advanced query optimization
- **Infrastructure Scaling**: Load balancing, monitoring, CDN integration

## Current System Issues Requiring Resolution

### Critical Issues Found (September 17, 2025 - 1:47 PM):
1. **Secret Loading Mechanism**: Database and OpenAI secrets exist but are not being loaded properly by the application
2. **Memory Storage Fallback**: System using memory storage instead of PostgreSQL due to secret loading failures
3. **Memory Usage Warnings**: High memory usage alerts still appearing in logs despite Phase 1 completion

### Next Immediate Actions:
1. Fix secret loading mechanism to properly access DATABASE_URL and OPENAI_API_KEY
2. Restore PostgreSQL database connectivity  
3. Begin Phase 2 query optimization implementation
4. Conduct performance testing to validate improvements

## Implementation Tracking System Created

**🕐 September 17, 2025 - 2:30 PM**: **IMPLEMENTATION TRACKING SYSTEM ESTABLISHED**
- **Files Created:** 
  - `implementation-plan.md` - Master 5-session roadmap
  - `session-log-template.md` - Standardized session tracking template
  - `progress-dashboard.md` - Real-time project status dashboard
  - `implementation-log-2025-09-17.md` - Phase 1 completion documentation
- **Purpose:** Enable systematic cross-session tracking and agent continuity
- **Next Session:** Follow implementation-plan.md priorities (secret loading fix)

# System Architecture

## UI/UX Decisions
The frontend is built with React and TypeScript, leveraging Shadcn/UI (based on Radix UI primitives) and Tailwind CSS for a modern, accessible, and responsive user interface.

## Technical Implementations
### Frontend
- **Framework**: React with TypeScript.
- **State Management**: TanStack Query for server state caching, React hooks for local state.
- **Routing**: Wouter for client-side navigation.

### Backend
- **Framework**: Express.js with TypeScript for RESTful API endpoints.
- **ORM**: Drizzle ORM for type-safe database interactions with PostgreSQL.
- **Authentication**: Replit Auth integration for OAuth-based authentication with session management.
- **Authorization**: Role-Based Access Control (RBAC) enforced via middleware.

### Database
- **Database**: PostgreSQL, with a comprehensive schema covering core entities, operations, inventory management (batch tracking, expiry dates), and multi-currency support.

### AI Integration
- **Capabilities**: Utilizes OpenAI's GPT models for intelligent automation, including inventory recommendations, price optimization, customer sentiment analysis, and an interactive AI assistant.
- **Architecture**: Centralized AI service class handles interactions, integrating structured data from the database for context-aware insights.

## Feature Specifications
The system is designed to be comprehensive, with modules for:
- **Sales & CRM**: Sales Orders, Quotations, Commission Tracking, Customer Sentiment Analysis, Lead Pipeline Management, Multi-currency, Invoice Management.
- **Purchase**: Purchase Orders, Purchase Requests, Supplier Management, Goods Receipt, Vendor Bills, Approval Workflows.
- **Inventory**: Product Management (batch tracking), Stock Management (expiry dates, multi-location), Warehouse Management, Stock Movements.
- **POS**: POS Sessions, Terminal Management, Receipt Generation, Payment Processing, Cash Management.
- **Finance**: Accounts Receivable/Payable, General Ledger, Financial Reporting, Multi-currency Accounting, Credit Management.
- **HR**: Employee Management, Time Tracking, Payroll, Performance Reviews, User Management (RBAC).
- **Marketing**: Campaign Management, Customer Segmentation, Lead Generation, Performance Analytics.
- **AI Module**: AI Assistant, Sentiment Analysis, Inventory Predictions, Price Optimization, Model Metrics, Fallback Handling.

## System Design Choices
- **Full-stack Architecture**: React frontend, Express.js backend.
- **Scalability**: PostgreSQL-backed session storage, serverless PostgreSQL.
- **Security**: Replit Auth, RBAC, HTTPS, secure cookies, CSRF protection.
- **Error Handling**: Robust error handling, circuit breaker patterns, resilient database connections.
- **Internationalization**: Multi-currency support with real-time FX rates.

# External Dependencies

## Database & ORM
- **PostgreSQL**: Primary database (Neon serverless PostgreSQL).
- **Drizzle ORM**: For type-safe database operations.

## Authentication & Sessions
- **Replit Auth**: OAuth-based authentication service.
- **connect-pg-simple**: PostgreSQL session store for Express.js.

## AI & Machine Learning
- **OpenAI API**: For GPT models and NLP capabilities.

## Frontend Framework & UI Libraries
- **React**: UI framework.
- **TanStack Query**: Server state management.
- **Shadcn/UI + Radix UI**: Accessible component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Wouter**: Lightweight client-side routing.

## Development & Build Tools
- **Vite**: Fast build tool.
- **TypeScript**: For type safety.

## Data Validation & Forms
- **Zod**: Runtime type validation.
- **React Hook Form**: Form state management.

## Utility Libraries
- **date-fns**: Date manipulation.
- **class-variance-authority**: CSS class management.
- **Lucide React**: Icon library.

