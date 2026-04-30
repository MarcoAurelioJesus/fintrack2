# FinTrack - Financial Management Application

## Project Overview
Modern Angular financial management application with Dashboard, Transactions, and Categories management. Built with Angular 20+, PrimeNG 20+, and Tailwind CSS following SOLID principles and clean architecture.

## Architecture
- **Pattern**: Feature-based module architecture with smart/dumb components
- **State Management**: RxJS observables with service-based state
- **Design Principles**: SOLID, DRY, separation of concerns
- **Code Organization**: 
  - `core/`: Singleton services, guards, interceptors
  - `shared/`: Reusable components, directives, pipes, utilities
  - `features/`: Feature modules (dashboard, transactions, categories)

## Key Requirements
- Dashboard with balance cards (color-coded), monthly stats, and refresh button
- Transactions list with filters, add/edit/delete, scheduling support
- Categories management with CRUD operations
- Color-coded categories for visual identification
- Responsive design with Tailwind CSS
- Integration ready with backend APIs

## Development Guidelines
- Use Angular best practices and conventions
- Implement proper error handling and validation
- Create reusable, testable components
- Follow TypeScript strict mode
- Use signals and effect API when applicable
