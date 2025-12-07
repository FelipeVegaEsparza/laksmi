# Requirements Document

## Introduction

Este documento define los requisitos para implementar un sistema de categorías múltiples en servicios y productos de la Clínica de Belleza Laxmi. Actualmente, cada servicio y producto puede tener solo una categoría asignada. Esta limitación impide una clasificación más flexible y precisa de los items, especialmente cuando un servicio o producto puede pertenecer a múltiples categorías simultáneamente (por ejemplo, un "Tratamiento Facial Anti-Edad" podría estar en "Facial" y "Anti-Edad").

El sistema debe permitir asignar múltiples categorías a servicios y productos, manteniendo la compatibilidad con el código existente y mejorando las capacidades de filtrado y búsqueda.

## Glossary

- **Service**: Servicio ofrecido por la clínica (tratamientos, procedimientos)
- **Product**: Producto vendido por la clínica (cosméticos, suplementos)
- **Category**: Clasificación temática para agrupar servicios o productos
- **Primary Category**: Categoría principal de un item (la primera asignada o la más relevante)
- **Backend**: Servidor Node.js + TypeScript + Express que maneja la lógica de negocio
- **Dashboard**: Interfaz administrativa React para gestionar servicios y productos
- **Frontend**: Sitio web público React donde los clientes ven servicios y productos
- **Migration**: Archivo SQL que modifica el esquema de la base de datos MySQL

## Requirements

### Requirement 1

**User Story:** As a clinic administrator, I want to assign multiple categories to a service, so that I can classify services that belong to multiple treatment areas.

#### Acceptance Criteria

1. WHEN an administrator creates a new service THEN the system SHALL allow selecting one or more categories from the available category list
2. WHEN an administrator edits an existing service THEN the system SHALL display all currently assigned categories and allow adding or removing categories
3. WHEN a service has multiple categories assigned THEN the system SHALL store all category associations in the database
4. WHEN a service has at least one category assigned THEN the system SHALL designate the first category as the primary category for backward compatibility
5. WHEN displaying a service in the dashboard THEN the system SHALL show all assigned categories with visual distinction for the primary category

### Requirement 2

**User Story:** As a clinic administrator, I want to assign multiple categories to a product, so that I can classify products that serve multiple purposes or treatment areas.

#### Acceptance Criteria

1. WHEN an administrator creates a new product THEN the system SHALL allow selecting one or more categories from the available category list
2. WHEN an administrator edits an existing product THEN the system SHALL display all currently assigned categories and allow adding or removing categories
3. WHEN a product has multiple categories assigned THEN the system SHALL store all category associations in the database
4. WHEN a product has at least one category assigned THEN the system SHALL designate the first category as the primary category for backward compatibility
5. WHEN displaying a product in the dashboard THEN the system SHALL show all assigned categories with visual distinction for the primary category

### Requirement 3

**User Story:** As a website visitor, I want to filter services by category and see all services that belong to that category, so that I can find relevant treatments regardless of whether it's their primary category.

#### Acceptance Criteria

1. WHEN a visitor filters services by a specific category THEN the system SHALL return all services that have that category assigned (primary or secondary)
2. WHEN displaying filtered services THEN the system SHALL show all assigned categories for each service
3. WHEN a service appears in multiple category filters THEN the system SHALL display the service consistently across all relevant category pages
4. WHEN no services match a category filter THEN the system SHALL display an appropriate empty state message

### Requirement 4

**User Story:** As a website visitor, I want to filter products by category and see all products that belong to that category, so that I can find relevant products regardless of whether it's their primary category.

#### Acceptance Criteria

1. WHEN a visitor filters products by a specific category THEN the system SHALL return all products that have that category assigned (primary or secondary)
2. WHEN displaying filtered products THEN the system SHALL show all assigned categories for each product
3. WHEN a product appears in multiple category filters THEN the system SHALL display the product consistently across all relevant category pages
4. WHEN no products match a category filter THEN the system SHALL display an appropriate empty state message

### Requirement 5

**User Story:** As a system, I want to maintain backward compatibility with existing code, so that the migration to multiple categories does not break existing functionality.

#### Acceptance Criteria

1. WHEN existing code accesses the category field THEN the system SHALL return the primary category as a string
2. WHEN existing API endpoints return service or product data THEN the system SHALL include both the primary category field and a categories array field
3. WHEN existing database queries filter by category THEN the system SHALL continue to work without modification by using the primary category
4. WHEN migrating existing data THEN the system SHALL convert single category values to the new multi-category structure without data loss

### Requirement 6

**User Story:** As a developer, I want the database schema to efficiently support multiple categories, so that queries remain performant as the data grows.

#### Acceptance Criteria

1. WHEN storing category associations THEN the system SHALL use a normalized many-to-many relationship structure with junction tables
2. WHEN querying services or products by category THEN the system SHALL use indexed columns for optimal query performance
3. WHEN a category is deleted THEN the system SHALL handle the cascade deletion of category associations appropriately
4. WHEN retrieving services or products with categories THEN the system SHALL minimize database queries using efficient joins or eager loading

### Requirement 7

**User Story:** As a clinic administrator, I want to see statistics grouped by category, so that I can understand the distribution of services and products across categories.

#### Acceptance Criteria

1. WHEN viewing service statistics THEN the system SHALL count each service in all categories it belongs to
2. WHEN viewing product statistics THEN the system SHALL count each product in all categories it belongs to
3. WHEN displaying category counts THEN the system SHALL show the total number of items associated with each category
4. WHEN a service or product has multiple categories THEN the system SHALL increment the count for each assigned category

### Requirement 8

**User Story:** As a system administrator, I want to migrate existing single-category data to the new multi-category structure, so that no data is lost during the upgrade.

#### Acceptance Criteria

1. WHEN the migration runs THEN the system SHALL create the necessary junction tables for service-category and product-category relationships
2. WHEN the migration runs THEN the system SHALL copy existing category values from services to the new service_categories junction table
3. WHEN the migration runs THEN the system SHALL copy existing category values from products to the new product_categories junction table
4. WHEN the migration completes THEN the system SHALL preserve the original category column for backward compatibility
5. WHEN the migration completes THEN the system SHALL verify that all existing services and products have at least one category assigned
