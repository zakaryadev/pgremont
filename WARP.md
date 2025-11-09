# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

PrintPro Calculator is a professional polygraphy calculator application for printing cost calculations. It's a React-based Progressive Web App (PWA) that helps calculate costs for various printing services including polygraphy, tablets, letters, and other custom services.

**Tech Stack:**
- React 18 + TypeScript
- Vite (build tool)
- shadcn-ui components
- Tailwind CSS
- Supabase (backend/database)
- React Query for data fetching
- React Router v6 for routing

## Development Commands

### Core Commands
```powershell
# Install dependencies
npm i

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build for development (with dev mode)
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

### Development Notes
- The dev server runs on port **8080** (not the default Vite port)
- The server binds to `::` (all interfaces) for network access
- No test commands are configured in this project

## High-Level Architecture

### Application Structure

This is a **multi-calculator application** with three main calculator types:
1. **Polygraphy Calculator** (`/polygraphy`) - Banner, oracal, holst printing
2. **Tablets Calculator** (`/tablets`) - Signboard/tablet manufacturing
3. **Letters Calculator** (`/letters`) - Volumetric letters and LED installations

Each calculator:
- Has its own **persistent state** stored in localStorage with key `calculator_{type}`
- Maintains separate pricing data for materials and services
- Calculates costs including material usage, waste, services, and discounts
- Can save orders to Supabase with full calculation context

### Authentication System

**Custom Authentication (not Supabase Auth):**
- Uses `AuthContext` with localStorage-based sessions
- Two predefined users:
  - **Admin**: Username: `Togo Group PRO`, Password: `togo0800`, Role: `admin`
  - **Manager**: Username: `Manager`, Password: `togo0000`, Role: `manager`
- All routes are protected via `ProtectedRoute` component
- No registration - only predefined credentials work

### State Management Architecture

**Calculator Persistence Pattern:**
```
useCalculatorPersistence(calculatorType) 
  └─> localStorage: calculator_{type}
      └─> Stores: { state, materials, services }
```

Each calculator component:
1. Loads saved data from `useCalculatorPersistence`
2. Maintains local state with `useState`
3. Updates both local state AND persistent storage on changes
4. Syncs material/service price changes with existing items

**Key Hooks:**
- `useCalculatorPersistence` - Manages calculator state persistence
- `useOrders` - Handles Supabase CRUD for orders
- `useCustomerOrders` - Manages customer orders (other services)
- `usePaymentRecords` - Tracks payment records

### Data Flow

```
User Input 
  → Calculator Component State
  → useCalculatorPersistence (localStorage)
  → Order Save
  → Supabase (via useOrders hook)
```

**Critical Pattern:** When material/service prices update:
1. Update the materials/services object
2. Update ALL existing items that use that material (by matching material name)
3. Persist both updated materials AND updated state.items array

### Database Schema (Supabase)

**Tables:**
- `orders` - Stores calculator results with full state (JSONB)
  - Fields: id, name, phone, state, results, materials, services, calculator_type, created_at
- `customer_orders` - Customer order management for other services
  - Fields: id, customer_name, phone_number, total_amount, payment_type, advance_payment, remaining_balance
- `payment_records` - Payment tracking
- All tables have RLS enabled with permissive policies (`FOR ALL USING (true)`)

### Component Organization

```
src/
├── components/
│   ├── calculator/       # Calculator UI components (shared across types)
│   │   ├── MaterialSelector, ServiceSelector, ItemForm, etc.
│   │   └── {Type}Calculator.tsx (main calculator components)
│   ├── admin/           # Admin panel components
│   ├── auth/            # Login/auth components
│   ├── cart/            # Cart functionality
│   └── ui/              # shadcn-ui components
├── contexts/
│   └── AuthContext.tsx  # Custom auth context (localStorage-based)
├── data/
│   ├── calculatorData.ts  # Polygraphy materials/services
│   ├── letterData.ts      # Letter calculator data
│   └── tableData.ts       # Tablet calculator data
├── hooks/
│   ├── useCalculatorPersistence.ts  # Calculator state persistence
│   ├── useOrders.ts                 # Order CRUD operations
│   └── useCustomerOrders.ts         # Customer order management
├── integrations/supabase/
│   └── client.ts        # Supabase client configuration
├── pages/               # Route pages
└── types/
    └── calculator.ts    # TypeScript interfaces
```

## Key Patterns & Conventions

### Calculator Implementation Pattern

When working with calculators, follow this structure:
```typescript
// 1. Import persistence hook and initial data
import { useCalculatorPersistence } from '@/hooks/useCalculatorPersistence';
import { materials as initialMaterials, services as initialServices } from '@/data/...';

// 2. Initialize with persistent data
const { data, updateState, updateMaterials, updateServices } = useCalculatorPersistence('type');
const [materials, setMaterials] = useState(initialMaterials);
const [state, setState] = useState(data.state);

// 3. Sync local state with persistent data
useEffect(() => {
  if (data.materials && Object.keys(data.materials).length > 0) {
    setMaterials(data.materials);
  }
  if (data.state.items.length > 0) {
    setState(data.state);
  }
}, [data]);

// 4. Update pattern: always update both local and persistent
const updateSomething = (newValue) => {
  const newState = { ...state, field: newValue };
  setState(newState);        // Update local
  updateState(newState);     // Persist
};
```

### Price Update Pattern

When updating material prices, MUST update existing items:
```typescript
const handleUpdateMaterialPrice = (materialKey: string, value: number) => {
  // 1. Update materials object
  const newMaterials = {
    ...materials,
    [materialKey]: { ...materials[materialKey], price: value }
  };
  
  // 2. Update existing items that use this material
  const updatedItems = state.items.map(item => {
    const materialName = materials[materialKey].name;
    if (item.name.includes(materialName)) {
      return { ...item, materialPrice: value };
    }
    return item;
  });
  
  // 3. Update state with modified items
  const newState = { ...state, items: updatedItems };
  
  // 4. Persist everything
  setMaterials(newMaterials);
  setState(newState);
  updateMaterials(newMaterials);
  updateState(newState);
};
```

### Path Aliases

Use `@/` alias for imports from `src/`:
```typescript
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
```

### Routing Convention

All routes are protected:
```typescript
<Route path="/path" element={
  <ProtectedRoute>
    <PageComponent />
  </ProtectedRoute>
} />
```

## Common Tasks

### Adding a New Material

1. Add to `src/data/calculatorData.ts`:
```typescript
export const materials: Record<string, Material> = {
  newMaterial: { 
    name: 'New Material', 
    widths: [1.5, 1.2], 
    price: 50000,
    wastePrice: 20000
  },
  // ... other materials
};
```

2. Add corresponding services if needed in the same file

### Adding a New Service

```typescript
export const services: Record<string, Service> = {
  new_service: {
    name: 'New Service Name',
    price: 30000,
    type: 'per_sqm', // or 'fixed'
    materials: ['material_key'] // optional: restrict to specific materials
  }
};
```

### Working with Supabase

**Connection:** Supabase client is pre-configured in `src/integrations/supabase/client.ts`

**Migrations:** Located in `supabase/migrations/` - apply via Supabase Dashboard SQL Editor

**RLS Policies:** All tables use permissive policies (`FOR ALL USING (true)`). To restrict access, modify policies in Supabase Dashboard.

### PWA Configuration

PWA is configured via `vite-plugin-pwa`:
- Manifest name: "Professional Poligrafiya Kalkulyatori"
- Short name: "PrintPro Calculator"
- Icons: `public/icon.png` (192x192, 512x512)
- Auto-update registration type

## Environment Setup

Create `.env` file with:
```
# Supabase credentials are hardcoded in src/integrations/supabase/client.ts
# For production, move these to environment variables
```

## Cursor Rule Context

The existing Cursor rule (`.cursor/rules/qoida.mdc`) specifies:
> When asked to add or modify a function, only change that specific part

**Apply this principle:** Make surgical changes - don't refactor unrelated code when fixing a specific issue.

## Important Constraints

1. **Never remove calculator persistence** - All calculator state must persist to localStorage
2. **Always update existing items** when material/service prices change
3. **Maintain backward compatibility** with saved calculator data in localStorage
4. **Keep auth system custom** - Don't switch to Supabase Auth without explicit request
5. **Console logging is intentional** - Many components have Uzbek console logs for debugging
6. **Price calculations are critical** - Verify all calculations when modifying calculator logic

## Deployment

Deployment via Lovable platform:
- Push changes to Git → automatically reflected in Lovable
- Deploy via Lovable dashboard: Share → Publish
- Vercel configuration present (`vercel.json`)
