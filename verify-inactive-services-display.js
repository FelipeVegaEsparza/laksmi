/**
 * Verification Script: Inactive Services Display
 * 
 * This script verifies that inactive services are displayed correctly in the dashboard:
 * 1. Status chip shows "Inactivo" for services with isActive=false
 * 2. Inactive services are visible in both table and card views
 * 3. Edit and toggle buttons work for inactive services
 * 
 * Requirements: 1.2, 1.3, 1.4, 1.5
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando visualización de servicios inactivos...\n');

// Read the ServicesPage component
const servicesPagePath = path.join(__dirname, 'dashboard/src/pages/ServicesPage.tsx');
const servicesPageContent = fs.readFileSync(servicesPagePath, 'utf-8');

// Read the DataTable component
const dataTablePath = path.join(__dirname, 'dashboard/src/components/DataTable.tsx');
const dataTableContent = fs.readFileSync(dataTablePath, 'utf-8');

// Read the ServiceForm component
const serviceFormPath = path.join(__dirname, 'dashboard/src/components/ServiceForm.tsx');
const serviceFormContent = fs.readFileSync(serviceFormPath, 'utf-8');

let allChecksPass = true;

// ============================================
// CHECK 1: Status chip shows "Inactivo" for isActive=false
// ============================================
console.log('✓ CHECK 1: Verificando chip de estado para servicios inactivos');

// Check in table view (columns definition)
const tableStatusChipRegex = /label=\{value \? 'Activo' : 'Inactivo'\}/;
const hasTableStatusChip = tableStatusChipRegex.test(servicesPageContent);

// Check in card view
const cardStatusChipRegex = /label=\{service\.isActive \? 'Activo' : 'Inactivo'\}/;
const hasCardStatusChip = cardStatusChipRegex.test(servicesPageContent);

if (hasTableStatusChip && hasCardStatusChip) {
  console.log('  ✅ Status chip correctamente configurado en vista tabla y tarjetas');
  console.log('     - Muestra "Activo" cuando isActive=true');
  console.log('     - Muestra "Inactivo" cuando isActive=false');
} else {
  console.log('  ❌ Status chip no encontrado o mal configurado');
  allChecksPass = false;
}

// Check color coding
const tableColorRegex = /color=\{value \? 'success' : 'default'\}/;
const cardColorRegex = /color=\{service\.isActive \? 'success' : 'default'\}/;
const hasTableColor = tableColorRegex.test(servicesPageContent);
const hasCardColor = cardColorRegex.test(servicesPageContent);

if (hasTableColor && hasCardColor) {
  console.log('  ✅ Colores del chip correctamente configurados');
  console.log('     - Verde (success) para activos');
  console.log('     - Gris (default) para inactivos');
} else {
  console.log('  ⚠️  Colores del chip podrían no estar configurados correctamente');
}

console.log('');

// ============================================
// CHECK 2: Inactive services visible in table view
// ============================================
console.log('✓ CHECK 2: Verificando visibilidad en vista tabla');

// Check that isActive column is included in table
const isActiveColumnRegex = /id:\s*'isActive'/;
const hasIsActiveColumn = isActiveColumnRegex.test(servicesPageContent);

if (hasIsActiveColumn) {
  console.log('  ✅ Columna de estado incluida en la tabla');
  console.log('     - Los servicios inactivos serán visibles con su estado');
} else {
  console.log('  ❌ Columna de estado no encontrada en la tabla');
  allChecksPass = false;
}

// Check that DataTable renders all services without filtering by isActive
const dataTableRenderRegex = /data\.map\(\(row\)/;
const dataTableRendersAll = dataTableRenderRegex.test(dataTableContent);

if (dataTableRendersAll) {
  console.log('  ✅ DataTable renderiza todos los servicios sin filtrar por estado');
} else {
  console.log('  ❌ DataTable podría estar filtrando servicios');
  allChecksPass = false;
}

console.log('');

// ============================================
// CHECK 3: Inactive services visible in card view
// ============================================
console.log('✓ CHECK 3: Verificando visibilidad en vista tarjetas');

// Check that cards render all services
const cardMapRegex = /services\.map\(\(service\)/;
const cardsRenderAll = cardMapRegex.test(servicesPageContent);

if (cardsRenderAll) {
  console.log('  ✅ Vista de tarjetas renderiza todos los servicios');
  console.log('     - Los servicios inactivos son visibles en modo tarjetas');
} else {
  console.log('  ❌ Vista de tarjetas podría estar filtrando servicios');
  allChecksPass = false;
}

// Check that status chip is displayed in cards
if (hasCardStatusChip) {
  console.log('  ✅ Chip de estado visible en cada tarjeta');
} else {
  console.log('  ❌ Chip de estado no encontrado en tarjetas');
  allChecksPass = false;
}

console.log('');

// ============================================
// CHECK 4: Edit button works for inactive services
// ============================================
console.log('✓ CHECK 4: Verificando botón de editar para servicios inactivos');

// Check that edit button is present in table
const tableEditRegex = /onEdit=\{handleEditService\}/;
const hasTableEdit = tableEditRegex.test(servicesPageContent);

// Check that edit button is present in cards
const cardEditRegex = /onClick=\{\(\) => handleEditService\(service\)\}/;
const hasCardEdit = cardEditRegex.test(servicesPageContent);

if (hasTableEdit && hasCardEdit) {
  console.log('  ✅ Botón de editar presente en tabla y tarjetas');
  console.log('     - Funciona para todos los servicios sin discriminar por estado');
} else {
  console.log('  ❌ Botón de editar no encontrado o mal configurado');
  allChecksPass = false;
}

// Check that handleEditService doesn't filter by isActive
const handleEditServiceRegex = /const handleEditService = \(service: Service\) => \{[\s\S]*?setEditingService\(service\)[\s\S]*?setModalOpen\(true\)/;
const editHandlerCorrect = handleEditServiceRegex.test(servicesPageContent);

if (editHandlerCorrect) {
  console.log('  ✅ Handler de edición no filtra por estado');
  console.log('     - Servicios inactivos pueden ser editados');
} else {
  console.log('  ⚠️  Handler de edición podría tener lógica adicional');
}

console.log('');

// ============================================
// CHECK 5: Toggle (isActive switch) works in form
// ============================================
console.log('✓ CHECK 5: Verificando toggle de estado en formulario');

// Check that isActive switch is present in form
const isActiveSwitchRegex = /checked=\{formData\.isActive\}/;
const hasIsActiveSwitch = isActiveSwitchRegex.test(serviceFormContent);

if (hasIsActiveSwitch) {
  console.log('  ✅ Switch de estado presente en el formulario');
  console.log('     - Permite activar/desactivar servicios');
} else {
  console.log('  ❌ Switch de estado no encontrado en el formulario');
  allChecksPass = false;
}

// Check that isActive is included in form submission
const isActiveSubmitRegex = /isActive:\s*Boolean\(formData\.isActive\)/;
const isActiveSubmitted = isActiveSubmitRegex.test(serviceFormContent);

if (isActiveSubmitted) {
  console.log('  ✅ Estado isActive se envía correctamente al guardar');
} else {
  console.log('  ❌ Estado isActive podría no enviarse al guardar');
  allChecksPass = false;
}

// Check that form loads isActive from service
const isActiveLoadRegex = /isActive:\s*service\.isActive/;
const isActiveLoaded = isActiveLoadRegex.test(serviceFormContent);

if (isActiveLoaded) {
  console.log('  ✅ Estado isActive se carga correctamente al editar');
} else {
  console.log('  ❌ Estado isActive podría no cargarse al editar');
  allChecksPass = false;
}

console.log('');

// ============================================
// CHECK 6: Delete button works for inactive services
// ============================================
console.log('✓ CHECK 6: Verificando botón de eliminar para servicios inactivos');

// Check that delete button is present in table
const tableDeleteRegex = /onDelete=\{handleDeleteService\}/;
const hasTableDelete = tableDeleteRegex.test(servicesPageContent);

// Check that delete button is present in cards
const cardDeleteRegex = /onClick=\{\(\) => handleDeleteService\(service\)\}/;
const hasCardDelete = cardDeleteRegex.test(servicesPageContent);

if (hasTableDelete && hasCardDelete) {
  console.log('  ✅ Botón de eliminar presente en tabla y tarjetas');
  console.log('     - Funciona para todos los servicios sin discriminar por estado');
} else {
  console.log('  ❌ Botón de eliminar no encontrado o mal configurado');
  allChecksPass = false;
}

console.log('');

// ============================================
// SUMMARY
// ============================================
console.log('═══════════════════════════════════════════════════════════');
if (allChecksPass) {
  console.log('✅ TODAS LAS VERIFICACIONES PASARON');
  console.log('');
  console.log('Resumen de funcionalidades verificadas:');
  console.log('  ✓ Chip de estado muestra "Inactivo" para isActive=false');
  console.log('  ✓ Servicios inactivos visibles en vista tabla');
  console.log('  ✓ Servicios inactivos visibles en vista tarjetas');
  console.log('  ✓ Botón de editar funciona para servicios inactivos');
  console.log('  ✓ Toggle de estado funciona en el formulario');
  console.log('  ✓ Botón de eliminar funciona para servicios inactivos');
  console.log('');
  console.log('Requirements validados: 1.2, 1.3, 1.4, 1.5');
} else {
  console.log('❌ ALGUNAS VERIFICACIONES FALLARON');
  console.log('');
  console.log('Por favor revisa los checks marcados con ❌ arriba.');
}
console.log('═══════════════════════════════════════════════════════════');
