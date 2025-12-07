# Design Document - Multiple Categories System

## Overview

This design document outlines the implementation of a multiple categories system for services and products in the Laxmi Beauty Clinic management system. The current system supports only a single category per item, stored as a VARCHAR column. This design introduces a normalized many-to-many relationship structure that allows multiple category assignments while maintaining backward compatibility with existing code.

The solution uses junction tables (`service_categories` and `product_categories`) to store category associations, keeps the original `category` column as the "primary category" for backward compatibility, and extends the API responses to include both single category (legacy) and multiple categories (new) fields.

## Architecture

### Database Schema Changes

**New Tables:**

1. **service_categories** (Junction Table)
   - `id`: CHAR(36) PRIMARY KEY
   - `service_id`: CHAR(36) FOREIGN KEY → services.id
   - `category_name`: VARCHAR(100)
   - `is_primary`: BOOLEAN (indicates primary category)
   - `display_order`: INT (for ordering categories in UI)
   - `created_at`: TIMESTAMP

2. **product_categories** (Junction Table)
   - `id`: CHAR(36) PRIMARY KEY
   - `product_id`: CHAR(36) FOREIGN KEY → products.id
   - `category_name`: VARCHAR(100)
   - `is_primary`: BOOLEAN (indicates primary category)
   - `display_order`: INT (for ordering categories in UI)
   - `created_at`: TIMESTAMP

**Indexes:**
- `service_categories`: INDEX on (service_id, category_name), INDEX on (category_name)
- `product_categories`: INDEX on (product_id, category_name), INDEX on (category_name)

**Existing Tables Modified:**
- `services`: Keep `category` column (will store primary category for backward compatibility)
- `products`: Keep `category` column (will store primary category for backward compatibility)

### System Layers

```
┌─────────────────────────────────────────┐
│         Frontend / Dashboard            │
│  (React Components with Multi-Select)   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│           API Layer (Express)           │
│  - Extended endpoints with categories[] │
│  - Backward compatible responses        │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│        Business Logic (Models)          │
│  - ServiceModel with category methods   │
│  - ProductModel with category methods   │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Database (MySQL)                │
│  - services + service_categories        │
│  - products + product_categories        │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Models

#### ServiceModel Extensions

```typescript
class ServiceModel {
  // New methods
  static async addCategory(serviceId: string, categoryName: string, isPrimary: boolean = false): Promise<void>
  static async removeCategory(serviceId: string, categoryName: string): Promise<void>
  static async getCategories(serviceId: string): Promise<string[]>
  static async updateCategories(serviceId: string, categories: string[]): Promise<void>
  static async setPrimaryCategory(serviceId: string, categoryName: string): Promise<void>
  
  // Modified methods
  static async findAll(filters: ServiceFilters): Promise<{ services: Service[]; total: number }>
  // Now supports filtering by any assigned category, not just primary
  
  static async getServicesByCategory(category: string): Promise<Service[]>
  // Now returns services with category as primary OR secondary
}
```

#### ProductModel Extensions

```typescript
class ProductModel {
  // New methods
  static async addCategory(productId: string, categoryName: string, isPrimary: boolean = false): Promise<void>
  static async removeCategory(productId: string, categoryName: string): Promise<void>
  static async getCategories(productId: string): Promise<string[]>
  static async updateCategories(productId: string, categories: string[]): Promise<void>
  static async setPrimaryCategory(productId: string, categoryName: string): Promise<void>
  
  // Modified methods
  static async findAll(filters: ProductFilters): Promise<{ products: Product[]; total: number }>
  // Now supports filtering by any assigned category, not just primary
  
  static async getProductsByCategory(category: string): Promise<Product[]>
  // Now returns products with category as primary OR secondary
}
```

### 2. Type Definitions

#### Extended Service Interface

```typescript
export interface Service {
  id: string;
  name: string;
  category: string;  // Primary category (backward compatibility)
  categories: string[];  // NEW: All assigned categories
  price: number;
  duration: number;
  description?: string;
  benefits?: string;
  images: string[];
  requirements: string[];
  isActive: boolean;
  sessions?: number;
  tag?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateServiceRequest {
  name: string;
  category: string;  // Primary category
  categories?: string[];  // NEW: Additional categories
  price: number;
  duration: number;
  description?: string;
  benefits?: string;
  images?: string[];
  requirements?: string[];
  isActive?: boolean;
  sessions?: number;
  tag?: string;
}

export interface UpdateServiceRequest {
  name?: string;
  category?: string;  // Update primary category
  categories?: string[];  // NEW: Update all categories
  price?: number;
  duration?: number;
  description?: string;
  benefits?: string;
  images?: string[];
  requirements?: string[];
  isActive?: boolean;
  sessions?: number;
  tag?: string;
}
```

#### Extended Product Interface

```typescript
export interface Product {
  id: string;
  name: string;
  category: string;  // Primary category (backward compatibility)
  categories: string[];  // NEW: All assigned categories
  price: number;
  stock: number;
  minStock: number;
  description?: string;
  images: string[];
  ingredients: string[];
  compatibleServices: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductRequest {
  name: string;
  category: string;  // Primary category
  categories?: string[];  // NEW: Additional categories
  price: number;
  stock: number;
  minStock?: number;
  description?: string;
  images?: string[];
  ingredients?: string[];
  compatibleServices?: string[];
}

export interface UpdateProductRequest {
  name?: string;
  category?: string;  // Update primary category
  categories?: string[];  // NEW: Update all categories
  price?: number;
  stock?: number;
  minStock?: number;
  description?: string;
  images?: string[];
  ingredients?: string[];
  compatibleServices?: string[];
}
```

### 3. API Endpoints

All existing endpoints remain unchanged in their URL structure. Response format is extended to include `categories` array:

**Modified Response Format:**
```json
{
  "id": "uuid",
  "name": "Facial Anti-Edad",
  "category": "Facial",
  "categories": ["Facial", "Anti-Edad", "Tratamientos Especiales"],
  "price": 50000,
  ...
}
```

**New Query Parameters:**
- `GET /api/v1/services/public?category=X` - Now returns services with X as any assigned category
- `GET /api/v1/products/public?category=X` - Now returns products with X as any assigned category

### 4. Dashboard UI Components

**Category Selector Component:**
- Multi-select dropdown for category assignment
- Visual indicator for primary category
- Drag-and-drop reordering for display order
- Add/remove categories dynamically

**Service/Product Form Updates:**
- Replace single category dropdown with multi-select
- First selected category becomes primary
- Show category badges in list views
- Filter by any assigned category

## Data Models

### Service Categories Junction Table

```sql
CREATE TABLE service_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  service_id CHAR(36) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_service_category (service_id, category_name),
  INDEX idx_category_lookup (category_name),
  UNIQUE KEY unique_service_category (service_id, category_name)
);
```

### Product Categories Junction Table

```sql
CREATE TABLE product_categories (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  product_id CHAR(36) NOT NULL,
  category_name VARCHAR(100) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  INDEX idx_product_category (product_id, category_name),
  INDEX idx_category_lookup (category_name),
  UNIQUE KEY unique_product_category (product_id, category_name)
);
```

### Data Migration Strategy

1. Create new junction tables
2. Migrate existing category data:
   - For each service: INSERT INTO service_categories (service_id, category_name, is_primary) VALUES (id, category, TRUE)
   - For each product: INSERT INTO product_categories (product_id, category_name, is_primary) VALUES (id, category, TRUE)
3. Keep original `category` column for backward compatibility
4. Add trigger to sync primary category changes

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Primary category consistency

*For any* service or product with assigned categories, the value in the `category` column should always match the category marked as `is_primary=TRUE` in the junction table.

**Validates: Requirements 1.4, 2.4, 5.1**

### Property 2: At least one category required

*For any* service or product, there should always be at least one category assigned in the junction table.

**Validates: Requirements 1.3, 2.3, 8.5**

### Property 3: Exactly one primary category

*For any* service or product with assigned categories, exactly one category should be marked as `is_primary=TRUE` in the junction table.

**Validates: Requirements 1.4, 2.4**

### Property 4: Category filter completeness

*For any* category name, filtering services or products by that category should return all items that have that category assigned, regardless of whether it's primary or secondary.

**Validates: Requirements 3.1, 4.1**

### Property 5: No duplicate categories

*For any* service or product, the same category name should not appear more than once in the junction table for that item.

**Validates: Requirements 1.3, 2.3**

### Property 6: Category deletion cascade

*For any* service or product that is deleted, all associated category records in the junction table should also be deleted.

**Validates: Requirements 6.3**

### Property 7: Statistics counting accuracy

*For any* category, the count of services or products in that category should equal the number of distinct items that have that category assigned (primary or secondary).

**Validates: Requirements 7.1, 7.2, 7.3**

### Property 8: Backward compatibility preservation

*For any* existing API endpoint that returns service or product data, the response should include both the `category` field (string) and `categories` field (array), where `category` equals the first element of `categories`.

**Validates: Requirements 5.2**

### Property 9: Migration data preservation

*For any* service or product that exists before migration, after migration completes, the item should have at least one category assigned that matches its original category value.

**Validates: Requirements 8.2, 8.3, 8.5**

### Property 10: Category persistence completeness

*For any* service or product created or updated with multiple categories, retrieving that item from the database should return all assigned categories in the same order.

**Validates: Requirements 1.2, 1.3, 2.2, 2.3**

### Property 11: Filter result consistency

*For any* service or product that appears in a category filter result, the returned data should be identical regardless of which assigned category was used for filtering.

**Validates: Requirements 3.3, 4.3**

### Property 12: API response structure consistency

*For any* API response containing service or product data, both the `category` field and `categories` array field should be present, and the `category` value should equal the first element of the `categories` array.

**Validates: Requirements 5.2, 5.3**

## Error Handling

### Validation Errors

1. **Empty Categories Array**
   - Error: "At least one category must be assigned"
   - HTTP Status: 400 Bad Request
   - Occurs when: Creating/updating with empty categories array

2. **Duplicate Category Assignment**
   - Error: "Category '{name}' is already assigned to this item"
   - HTTP Status: 400 Bad Request
   - Occurs when: Attempting to add a category that already exists

3. **Invalid Primary Category**
   - Error: "Primary category must be in the assigned categories list"
   - HTTP Status: 400 Bad Request
   - Occurs when: Setting primary category to a non-assigned category

4. **Category Not Found**
   - Error: "Category '{name}' not found"
   - HTTP Status: 404 Not Found
   - Occurs when: Attempting to remove a category that doesn't exist

### Database Errors

1. **Foreign Key Constraint Violation**
   - Handle gracefully when service/product doesn't exist
   - Return 404 with appropriate message

2. **Unique Constraint Violation**
   - Prevent duplicate category assignments
   - Return 400 with clear error message

### Migration Errors

1. **Data Integrity Check Failures**
   - Rollback migration if any service/product ends up without categories
   - Log detailed error information
   - Provide recovery instructions

## Testing Strategy

### Unit Testing

**Service Model Tests:**
- Test `addCategory()` adds category correctly
- Test `removeCategory()` removes category correctly
- Test `updateCategories()` replaces all categories
- Test `setPrimaryCategory()` updates primary flag
- Test `getCategories()` returns all assigned categories
- Test error handling for invalid operations

**Product Model Tests:**
- Test `addCategory()` adds category correctly
- Test `removeCategory()` removes category correctly
- Test `updateCategories()` replaces all categories
- Test `setPrimaryCategory()` updates primary flag
- Test `getCategories()` returns all assigned categories
- Test error handling for invalid operations

**API Controller Tests:**
- Test create service/product with multiple categories
- Test update service/product categories
- Test filter by category returns correct results
- Test backward compatibility of responses

### Property-Based Testing

**Framework:** fast-check (for TypeScript/Node.js)

**Configuration:** Minimum 100 iterations per property test

**Property Tests:**

1. **Test Primary Category Consistency (Property 1)**
   - Generate random services/products with random category assignments
   - Verify `category` field matches the primary category in junction table
   - **Validates: Requirements 1.4, 2.4, 5.1**

2. **Test At Least One Category (Property 2)**
   - Generate random services/products
   - Attempt to create/update with various category configurations
   - Verify all items have at least one category assigned
   - **Validates: Requirements 1.3, 2.3, 8.5**

3. **Test Exactly One Primary (Property 3)**
   - Generate random services/products with multiple categories
   - Verify exactly one category has `is_primary=TRUE`
   - **Validates: Requirements 1.4, 2.4**

4. **Test Category Filter Completeness (Property 4)**
   - Generate random services/products with random category assignments
   - For each category, filter and verify all items with that category are returned
   - **Validates: Requirements 3.1, 4.1**

5. **Test No Duplicate Categories (Property 5)**
   - Generate random category assignment operations
   - Verify no service/product has duplicate category entries
   - **Validates: Requirements 1.3, 2.3**

6. **Test Category Deletion Cascade (Property 6)**
   - Generate random services/products with categories
   - Delete items and verify junction table entries are removed
   - **Validates: Requirements 6.3**

7. **Test Statistics Counting (Property 7)**
   - Generate random services/products with random category assignments
   - Calculate expected counts manually
   - Verify system statistics match expected counts
   - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

8. **Test Backward Compatibility (Property 8)**
   - Generate random services/products
   - Verify API responses include both `category` and `categories` fields
   - Verify `category` equals first element of `categories`
   - **Validates: Requirements 5.2**

### Integration Testing

- Test complete flow: create service with categories → filter by category → verify results
- Test complete flow: update product categories → verify changes reflected in all endpoints
- Test migration: run migration on test database → verify data integrity
- Test dashboard UI: create/edit items with multiple categories → verify persistence

### Edge Cases

- Service/product with maximum number of categories (test performance)
- Category names with special characters
- Very long category names
- Concurrent category updates to same item
- Migration with services/products that have NULL category values

## Implementation Notes

### Migration Sequence

1. Create junction tables with indexes
2. Migrate existing data (single category → junction table)
3. Add database triggers for primary category sync
4. Update backend models to support multiple categories
5. Update API controllers to return extended format
6. Update dashboard UI components
7. Update frontend display components

### Performance Considerations

- Use JOIN queries to fetch categories with services/products in single query
- Implement caching for category lists
- Use batch operations for bulk category updates
- Monitor query performance with EXPLAIN ANALYZE

### Backward Compatibility Strategy

- Keep `category` column in services/products tables
- Always populate `category` with primary category value
- Include both `category` (string) and `categories` (array) in API responses
- Existing code using `category` field continues to work
- New code can use `categories` array for full functionality
