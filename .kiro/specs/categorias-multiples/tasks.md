# Implementation Plan

- [x] 1. Create database migration for multiple categories support



  - Create migration file `025_add_multiple_categories_support.sql`
  - Create `service_categories` junction table with indexes
  - Create `product_categories` junction table with indexes
  - Migrate existing single category data to junction tables
  - Add database triggers to sync primary category with main table
  - _Requirements: 6.1, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 1.1 Write property test for migration data preservation


  - **Property 9: Migration data preservation**


  - **Validates: Requirements 8.2, 8.3, 8.5**

- [x] 2. Extend TypeScript type definitions


  - Update `Service` interface to include `categories: string[]` field
  - Update `Product` interface to include `categories: string[]` field
  - Update `CreateServiceRequest` to accept `categories?: string[]`
  - Update `CreateProductRequest` to accept `categories?: string[]`




  - Update `UpdateServiceRequest` to accept `categories?: string[]`
  - Update `UpdateProductRequest` to accept `categories?: string[]`
  - _Requirements: 1.1, 2.1_


- [ ] 3. Implement ServiceModel category management methods
  - [x] 3.1 Implement `addCategory(serviceId, categoryName, isPrimary)` method

    - Add category to service_categories junction table
    - Handle duplicate prevention
    - Update primary category if needed

    - _Requirements: 1.1, 1.2_


  - [x] 3.2 Implement `removeCategory(serviceId, categoryName)` method

    - Remove category from junction table


    - Prevent removing last category
    - Reassign primary if removing primary category
    - _Requirements: 1.2_





  - [ ] 3.3 Implement `getCategories(serviceId)` method
    - Fetch all categories for a service ordered by display_order

    - Return array of category names
    - _Requirements: 1.2, 1.5_




  - [x] 3.4 Implement `updateCategories(serviceId, categories)` method

    - Replace all categories for a service




    - Set first category as primary
    - Validate at least one category provided
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.5 Write property test for at least one category required

    - **Property 2: At least one category required**
    - **Validates: Requirements 1.3, 2.3, 8.5**

  - [ ] 3.6 Write property test for exactly one primary category
    - **Property 3: Exactly one primary category**

    - **Validates: Requirements 1.4, 2.4**

  - [ ] 3.7 Write property test for no duplicate categories
    - **Property 5: No duplicate categories**

    - **Validates: Requirements 1.3, 2.3**

- [x] 4. Implement ProductModel category management methods




  - [x] 4.1 Implement `addCategory(productId, categoryName, isPrimary)` method

    - Add category to product_categories junction table
    - Handle duplicate prevention
    - Update primary category if needed

    - _Requirements: 2.1, 2.2_


  - [ ] 4.2 Implement `removeCategory(productId, categoryName)` method
    - Remove category from junction table
    - Prevent removing last category

    - Reassign primary if removing primary category
    - _Requirements: 2.2_


  - [ ] 4.3 Implement `getCategories(productId)` method
    - Fetch all categories for a product ordered by display_order

    - Return array of category names

    - _Requirements: 2.2, 2.5_

  - [ ] 4.4 Implement `updateCategories(productId, categories)` method
    - Replace all categories for a product


    - Set first category as primary
    - Validate at least one category provided
    - _Requirements: 2.1, 2.2, 2.3, 2.4_


- [ ] 5. Update ServiceModel core methods to support multiple categories
  - [x] 5.1 Update `formatService()` to include categories array

    - Join with service_categories table
    - Populate both `category` and `categories` fields
    - Order categories by display_order

    - _Requirements: 1.5, 5.1, 5.2_





  - [x] 5.2 Update `create()` to handle categories array

    - Insert into services table with primary category
    - Insert all categories into service_categories junction table
    - Mark first category as primary
    - _Requirements: 1.1, 1.3, 1.4_



  - [ ] 5.3 Update `update()` to handle categories array
    - Update primary category in services table
    - Update categories in junction table if provided
    - Maintain primary category consistency

    - _Requirements: 1.2, 1.4_

  - [x] 5.4 Update `findAll()` to support multi-category filtering

    - Modify WHERE clause to check junction table
    - Return services with category as primary OR secondary

    - Maintain pagination and other filters
    - _Requirements: 3.1_


  - [ ] 5.5 Update `getServicesByCategory()` to check all assigned categories
    - Query junction table instead of services.category

    - Return services with category in any position
    - _Requirements: 3.1_





  - [ ] 5.6 Write property test for primary category consistency
    - **Property 1: Primary category consistency**


    - **Validates: Requirements 1.4, 2.4, 5.1**

  - [x] 5.7 Write property test for category filter completeness


    - **Property 4: Category filter completeness**



    - **Validates: Requirements 3.1, 4.1**

  - [ ] 5.8 Write property test for category persistence completeness
    - **Property 10: Category persistence completeness**
    - **Validates: Requirements 1.2, 1.3, 2.2, 2.3**


- [ ] 6. Update ProductModel core methods to support multiple categories
  - [x] 6.1 Update `formatProduct()` to include categories array

    - Join with product_categories table
    - Populate both `category` and `categories` fields


    - Order categories by display_order
    - _Requirements: 2.5, 5.1, 5.2_


  - [x] 6.2 Update `create()` to handle categories array

    - Insert into products table with primary category
    - Insert all categories into product_categories junction table
    - Mark first category as primary
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 6.3 Update `update()` to handle categories array

    - Update primary category in products table
    - Update categories in junction table if provided







    - Maintain primary category consistency
    - _Requirements: 2.2, 2.4_


  - [ ] 6.4 Update `findAll()` to support multi-category filtering
    - Modify WHERE clause to check junction table
    - Return products with category as primary OR secondary
    - Maintain pagination and other filters

    - _Requirements: 4.1_

  - [ ] 6.5 Update `getProductsByCategory()` to check all assigned categories
    - Query junction table instead of products.category
    - Return products with category in any position
    - _Requirements: 4.1_

- [ ] 7. Update statistics methods for multi-category counting
  - [x] 7.1 Update `ServiceModel.getCategories()` statistics method

    - Count services in each category from junction table
    - Include services where category is primary or secondary
    - _Requirements: 7.1, 7.3_

  - [x] 7.2 Update `ProductModel.getProductCategories()` statistics method

    - Count products in each category from junction table
    - Include products where category is primary or secondary
    - _Requirements: 7.2, 7.3_

  - [ ] 7.3 Write property test for statistics counting accuracy
    - **Property 7: Statistics counting accuracy**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 8. Update API controllers to handle multiple categories
  - [x] 8.1 Update ServiceController create/update methods

    - Accept `categories` array in request body
    - Validate categories array (at least one category)
    - Call model methods with categories
    - _Requirements: 1.1, 1.2_


  - [ ] 8.2 Update ProductController create/update methods
    - Accept `categories` array in request body
    - Validate categories array (at least one category)
    - Call model methods with categories
    - _Requirements: 2.1, 2.2_

  - [ ] 8.3 Write property test for backward compatibility preservation
    - **Property 8: Backward compatibility preservation**
    - **Validates: Requirements 5.2**

  - [ ] 8.4 Write property test for API response structure consistency
    - **Property 12: API response structure consistency**
    - **Validates: Requirements 5.2, 5.3**

- [x] 9. Update validation schemas

  - Update `createServiceSchema` to accept optional `categories` array
  - Update `updateServiceSchema` to accept optional `categories` array
  - Update `createProductSchema` to accept optional `categories` array
  - Update `updateProductSchema` to accept optional `categories` array
  - Add validation: categories array must have at least one element if provided
  - Add validation: category names must be non-empty strings
  - _Requirements: 1.1, 2.1_

- [ ] 10. Checkpoint - Ensure all backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Update Dashboard UI - Service form component





  - [x] 11.1 Replace single category dropdown with multi-select component


    - Use a multi-select library (e.g., react-select)
    - Allow selecting multiple categories
    - Show selected categories as badges/chips
    - _Requirements: 1.1, 1.2_

  - [x] 11.2 Add visual indicator for primary category

    - Mark first selected category as primary
    - Show "Primary" badge or icon
    - Allow reordering categories (drag-and-drop or up/down buttons)
    - _Requirements: 1.5_

  - [x] 11.3 Update form submission to send categories array

    - Send `categories` array in create/update requests
    - Handle validation errors for empty categories
    - _Requirements: 1.1, 1.2_

- [x] 12. Update Dashboard UI - Product form component





  - [x] 12.1 Replace single category dropdown with multi-select component


    - Use a multi-select library (e.g., react-select)
    - Allow selecting multiple categories
    - Show selected categories as badges/chips
    - _Requirements: 2.1, 2.2_

  - [x] 12.2 Add visual indicator for primary category

    - Mark first selected category as primary
    - Show "Primary" badge or icon
    - Allow reordering categories (drag-and-drop or up/down buttons)
    - _Requirements: 2.5_

  - [x] 12.3 Update form submission to send categories array

    - Send `categories` array in create/update requests
    - Handle validation errors for empty categories
    - _Requirements: 2.1, 2.2_

- [x] 13. Update Dashboard UI - List views





  - [x] 13.1 Update service list to display multiple categories


    - Show all categories as badges/chips
    - Highlight primary category
    - Truncate if too many categories (show "+N more")
    - _Requirements: 1.5_

  - [x] 13.2 Update product list to display multiple categories


    - Show all categories as badges/chips
    - Highlight primary category
    - Truncate if too many categories (show "+N more")
    - _Requirements: 2.5_

  - [x] 13.3 Update category filter to work with multiple categories


    - Filter should show items with category as primary OR secondary
    - Update filter UI to indicate multi-category support
    - _Requirements: 3.1, 4.1_

- [x] 14. Update Frontend public website - Service display





  - [x] 14.1 Update service card component to show multiple categories


    - Display all categories as badges
    - Style primary category differently
    - _Requirements: 3.2_

  - [x] 14.2 Update service detail page to show all categories


    - List all assigned categories
    - Make categories clickable to filter
    - _Requirements: 3.2_

  - [x] 14.3 Update category filter page


    - Ensure services appear in all relevant category pages
    - Show consistent data across category filters
    - _Requirements: 3.1, 3.3_

  - [x] 14.4 Write property test for filter result consistency


    - **Property 11: Filter result consistency**
    - **Validates: Requirements 3.3, 4.3**

- [x] 15. Update Frontend public website - Product display





  - [x] 15.1 Update product card component to show multiple categories


    - Display all categories as badges
    - Style primary category differently
    - _Requirements: 4.2_

  - [x] 15.2 Update product detail page to show all categories


    - List all assigned categories
    - Make categories clickable to filter
    - _Requirements: 4.2_

  - [x] 15.3 Update category filter page


    - Ensure products appear in all relevant category pages
    - Show consistent data across category filters
    - _Requirements: 4.1, 4.3_

- [ ] 16. Add error handling for edge cases
  - Handle empty categories array (validation error)
  - Handle duplicate category in array (filter duplicates)
  - Handle removing last category (prevent with error)
  - Handle invalid category names (validation error)
  - Handle category filter with no results (empty state)
  - _Requirements: 3.4, 4.4_

- [ ] 17. Update API documentation
  - Document new `categories` array field in request/response
  - Document backward compatibility with `category` field
  - Add examples of multi-category requests
  - Document filtering behavior with multiple categories
  - _Requirements: 5.2_

- [ ] 18. Write property test for category deletion cascade
  - **Property 6: Category deletion cascade**
  - **Validates: Requirements 6.3**

- [ ] 19. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
