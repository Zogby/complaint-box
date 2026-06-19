INSERT INTO `statistics` (`id`, `totalComplaints`) VALUES (1, 0)
ON DUPLICATE KEY UPDATE `id` = `id`;
