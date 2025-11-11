CREATE TABLE IF NOT EXISTS `featured_images` (
  `id` CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `slot` INT NOT NULL UNIQUE COMMENT '1 or 2 for the two featured image positions',
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `image_url` VARCHAR(500),
  `active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_slot` (`slot`),
  INDEX `idx_active` (`active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default records for slot 1 and 2
INSERT INTO `featured_images` (`slot`, `title`, `description`, `active`) 
VALUES 
  (1, 'Imagen Destacada 1', 'Descripción de la primera imagen destacada', false),
  (2, 'Imagen Destacada 2', 'Descripción de la segunda imagen destacada', false)
ON DUPLICATE KEY UPDATE `slot` = `slot`;
