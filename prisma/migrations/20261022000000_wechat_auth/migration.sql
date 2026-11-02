ALTER TABLE `users` MODIFY COLUMN `avatar_url` TEXT NULL;

ALTER TABLE `verification_codes`
  ADD COLUMN `purpose` VARCHAR(32) NOT NULL DEFAULT 'auth',
  ADD COLUMN `user_id` VARCHAR(191) NULL;

CREATE TABLE `oauth_attempts` (
  `id` VARCHAR(191) NOT NULL,
  `browser_hash` VARCHAR(191) NOT NULL,
  `user_id` VARCHAR(191) NULL,
  `next_url` TEXT NOT NULL,
  `expires_at` DATETIME(3) NOT NULL,
  `consumed_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  INDEX `oauth_attempts_expires_at_idx` (`expires_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
