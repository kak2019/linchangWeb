-- CreateTable
CREATE TABLE `teacher_profiles` (
    `user_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `is_seed` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teacher_works` (
    `id` VARCHAR(191) NOT NULL,
    `job_id` VARCHAR(32) NOT NULL,
    `author_id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(160) NOT NULL,
    `summary` TEXT NULL,
    `cover_url` VARCHAR(1024) NULL,
    `play_url` VARCHAR(1024) NOT NULL,
    `quiz_url` VARCHAR(1024) NULL,
    `subject` VARCHAR(80) NULL,
    `grade` VARCHAR(80) NULL,
    `tags` JSON NULL,
    `status` ENUM('PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'PUBLISHED',
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `published_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `unpublished_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `teacher_works_job_id_key`(`job_id`),
    INDEX `teacher_works_status_published_at_idx`(`status`, `published_at`),
    INDEX `teacher_works_author_id_status_idx`(`author_id`, `status`),
    INDEX `teacher_works_title_idx`(`title`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `teacher_profiles` ADD CONSTRAINT `teacher_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teacher_works` ADD CONSTRAINT `teacher_works_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
