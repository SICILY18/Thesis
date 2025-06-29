# Frontend Troubleshooting Guide

## TypeScript Import Error Fix

If you're seeing the error:
```
Type error: Cannot find module '@/utils/api' or its corresponding type declarations.
```

Follow these steps to resolve it:

### Step 1: Install Dependencies
Make sure all dependencies are installed:
```bash
cd frontend
npm install
```

### Step 2: Restart TypeScript Server
In VS Code:
1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "TypeScript: Restart TS Server"
3. Select it and wait for restart

### Step 3: Clear Next.js Cache
```bash
cd frontend
rm -rf .next
npm run dev
```

### Step 4: Verify File Structure
Make sure your files are in the correct locations:
```
frontend/
├── src/
│   ├── utils/
│   │   └── api.ts          # ✅ Should exist
│   ├── components/
│   │   └── PaymentHistory.jsx
│   └── app/
│       └── dashboard/
│           └── page.tsx
├── tsconfig.json           # ✅ Should have path aliases
└── package.json           # ✅ Should have dependencies
```

### Step 5: Verify TypeScript Configuration
Your `tsconfig.json` should include:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/utils/*": ["./src/utils/*"]
    }
  }
}
```

### Step 6: Alternative Import (If Above Doesn't Work)
If the path alias still doesn't work, you can use relative imports temporarily:

In `src/app/dashboard/page.tsx`:
```typescript
// Instead of: import { authAPI, dashboardAPI } from '@/utils/api';
import { authAPI, dashboardAPI } from '../../utils/api';
```

## Common Solutions

### Solution 1: Force TypeScript Check
```bash
cd frontend
npx tsc --noEmit
```

### Solution 2: Restart Development Server
```bash
cd frontend
# Stop the server (Ctrl+C)
npm run dev
```

### Solution 3: Check Environment Variables
Create `.env.local` in the frontend directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Solution 4: IDE Restart
Sometimes the IDE needs a complete restart:
1. Close VS Code/your IDE completely
2. Reopen the project
3. Wait for TypeScript to initialize

## Payment History Integration

The `PaymentHistory` component has been updated to use the new API utilities:

```jsx
import { paymentHistoryAPI } from '@/utils/api';

// Usage in a component:
<PaymentHistory accountNumber="56-456245" />
```

## API Endpoints Available

### For Admin Use:
- `paymentHistoryAPI.getPaymentHistory(filters)` - Get all payments with filters
- `paymentHistoryAPI.getPaymentStats()` - Get payment statistics
- `paymentHistoryAPI.validatePayment(id, action, notes)` - Approve/reject payments

### For Customer Use:
- `paymentHistoryAPI.getCustomerPaymentHistory(accountNumber)` - Get customer payments

## Testing the Setup

1. **Start the backend**:
   ```bash
   cd backend/admin
   php artisan serve
   ```

2. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test API connectivity**:
   ```bash
   curl http://localhost:8000/api/payment-history/stats
   ```

## Still Having Issues?

If you're still experiencing problems:

1. **Check browser console** for network errors
2. **Verify backend is running** on `http://localhost:8000`
3. **Check API responses** in Network tab
4. **Ensure database connection** is working

## Quick Reset Script

Create this script to quickly reset everything:

```bash
#!/bin/bash
# save as reset-frontend.sh

echo "Stopping any running processes..."
pkill -f "next"

echo "Cleaning Next.js cache..."
rm -rf .next

echo "Reinstalling node_modules..."
rm -rf node_modules package-lock.json
npm install

echo "Starting development server..."
npm run dev
```

Run with:
```bash
chmod +x reset-frontend.sh
./reset-frontend.sh
``` 