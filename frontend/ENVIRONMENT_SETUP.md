# Environment Setup

This Angular application now uses environment variables for API endpoints instead of hardcoded URLs.

## Setup Instructions

1. **Copy the environment template:**
   ```bash
   cp src/environments/environment.template.ts src/environments/environment.local.ts
   ```

2. **Update the base URL:**
   Edit `src/environments/environment.local.ts` and replace `{{baseurl}}` with your actual backend URL:
   ```typescript
   export const environment = {
     production: false,
     baseUrl: 'http://localhost:5000'
   };
   ```

3. **Update angular.json (if needed):**
   Add the local environment to your build configurations in `angular.json`:
   ```json
   "fileReplacements": [
     {
       "replace": "src/environments/environment.ts",
       "with": "src/environments/environment.local.ts"
     }
   ]
   ```

## Current API Endpoints

The application uses the following API structure:
- **Assets**: `{{baseurl}}/assets`
- **Assignments**: `{{baseurl}}/assignments`
- **Employees**: `{{baseurl}}/employees`

## Environment Files

- `environment.ts` - Default development environment
- `environment.prod.ts` - Production environment
- `environment.template.ts` - Template for local development
- `environment.local.ts` - Your local environment (create this)

## Usage

All service files now use the environment variable:
```typescript
import { environment } from '../../environments/environment';
private baseUrl = `${environment.baseUrl}/assets`;
