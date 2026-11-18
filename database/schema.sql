CREATE DATABASE IF NOT EXISTS noteflow_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE noteflow_db;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. users
CREATE TABLE users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  is_email_verified TINYINT(1) NOT NULL DEFAULT 0,
  email_verification_token VARCHAR(255),
  password_reset_token VARCHAR(255),
  password_reset_expires DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
);

-- 2. folders (self-referencing parent)
CREATE TABLE folders (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_folder_id BIGINT NULL,
  owner_id BIGINT NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  icon VARCHAR(50) NOT NULL DEFAULT 'folder',
  is_starred TINYINT(1) NOT NULL DEFAULT 0,
  is_trashed TINYINT(1) NOT NULL DEFAULT 0,
  trashed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_folders_parent FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  CONSTRAINT fk_folders_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_folders_owner (owner_id),
  INDEX idx_folders_parent (parent_folder_id),
  INDEX idx_folders_trashed (is_trashed),
  FULLTEXT INDEX ft_folders_name (name)
);

-- 3. documents
CREATE TABLE documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL DEFAULT 'Untitled',
  content LONGTEXT,
  folder_id BIGINT NULL,
  owner_id BIGINT NOT NULL,
  is_starred TINYINT(1) NOT NULL DEFAULT 0,
  is_trashed TINYINT(1) NOT NULL DEFAULT 0,
  trashed_at DATETIME,
  word_count INT NOT NULL DEFAULT 0,
  last_opened_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_documents_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
  CONSTRAINT fk_documents_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_documents_owner (owner_id),
  INDEX idx_documents_folder (folder_id),
  INDEX idx_documents_trashed (is_trashed),
  INDEX idx_documents_last_opened (last_opened_at),
  FULLTEXT INDEX ft_documents_search (title, content)
);

-- 4. document_permissions
CREATE TABLE document_permissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  permission ENUM('VIEWER','COMMENTER','EDITOR') NOT NULL,
  granted_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dp_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_dp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_dp_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_doc_user (document_id, user_id),
  INDEX idx_dp_user (user_id)
);

-- 5. folder_permissions
CREATE TABLE folder_permissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  folder_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  permission ENUM('VIEWER','COMMENTER','EDITOR') NOT NULL,
  granted_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_fp_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  CONSTRAINT fk_fp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fp_granted_by FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_folder_user (folder_id, user_id),
  INDEX idx_fp_user (user_id)
);

-- 6. comments (self-referencing parent)
CREATE TABLE comments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT NOT NULL,
  author_id BIGINT NOT NULL,
  parent_comment_id BIGINT NULL,
  content TEXT NOT NULL,
  is_resolved TINYINT(1) NOT NULL DEFAULT 0,
  resolved_by BIGINT NULL,
  resolved_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_comments_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_parent FOREIGN KEY (parent_comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  CONSTRAINT fk_comments_resolved_by FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_comments_document (document_id),
  INDEX idx_comments_author (author_id)
);

-- 7. document_versions
CREATE TABLE document_versions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT NOT NULL,
  title VARCHAR(500),
  content LONGTEXT,
  version_number INT NOT NULL,
  word_count INT NOT NULL DEFAULT 0,
  created_by BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_dv_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_dv_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_dv_document (document_id),
  INDEX idx_dv_version (document_id, version_number)
);

-- 8. notifications
CREATE TABLE notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipient_id BIGINT NOT NULL,
  sender_id BIGINT NULL,
  type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  resource_type VARCHAR(50),
  resource_id BIGINT,
  is_read TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notif_recipient (recipient_id, is_read),
  INDEX idx_notif_created (created_at)
);

-- 9. activity_logs
CREATE TABLE activity_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id BIGINT,
  metadata JSON,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_al_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_al_user (user_id, created_at)
);

-- 10. document_attachments
CREATE TABLE document_attachments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  document_id BIGINT NOT NULL,
  uploaded_by BIGINT NOT NULL,
  file_name VARCHAR(500) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  s3_key VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_da_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_da_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_da_document (document_id)
);

-- 11. document_stars (composite PK)
CREATE TABLE document_stars (
  user_id BIGINT NOT NULL,
  document_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, document_id),
  CONSTRAINT fk_ds_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ds_document FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- 12. folder_stars (composite PK)
CREATE TABLE folder_stars (
  user_id BIGINT NOT NULL,
  folder_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, folder_id),
  CONSTRAINT fk_fs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fs_folder FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE
);

-- 13. invitations
CREATE TABLE invitations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  inviter_id BIGINT NOT NULL,
  invitee_email VARCHAR(255) NOT NULL,
  resource_type ENUM('DOCUMENT','FOLDER') NOT NULL,
  resource_id BIGINT NOT NULL,
  permission ENUM('VIEWER','COMMENTER','EDITOR') NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  status ENUM('PENDING','ACCEPTED','REJECTED','EXPIRED') NOT NULL DEFAULT 'PENDING',
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inv_inviter FOREIGN KEY (inviter_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_inv_token (token),
  INDEX idx_inv_email_status (invitee_email, status),
  INDEX idx_inv_resource (resource_type, resource_id)
);

SET FOREIGN_KEY_CHECKS = 1;
