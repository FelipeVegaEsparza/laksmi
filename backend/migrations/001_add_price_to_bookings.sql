-- Agregar columna price a bookings
-- Esta columna almacena el precio del servicio al momento de la reserva

ALTER TABLE bookings 
ADD COLUMN price DECIMAL(10,2) DEFAULT 0.00 AFTER service_id;

-- Actualizar precios existentes desde la tabla services
UPDATE bookings b
INNER JOIN services s ON b.service_id = s.id
SET b.price = s.price
WHERE b.price = 0 OR b.price IS NULL;
