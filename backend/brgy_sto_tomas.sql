-- ============================================================
-- Barangay Sto. Tomas MIS — MySQL Database Setup
-- Run this in phpMyAdmin SQL tab
-- ============================================================

CREATE DATABASE IF NOT EXISTS brgy_sto_tomas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE brgy_sto_tomas;

-- ── USERS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  username         VARCHAR(100) NOT NULL UNIQUE,
  password         VARCHAR(255) NOT NULL,
  role             ENUM('admin','resident') NOT NULL DEFAULT 'resident',
  status           ENUM('pending','verified','deactivated','rejected') NOT NULL DEFAULT 'pending',
  rejection_reason VARCHAR(500) DEFAULT '',
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  middle_name      VARCHAR(100) DEFAULT '',
  suffix           VARCHAR(20)  DEFAULT '',
  gender           VARCHAR(20)  DEFAULT '',
  age              INT          DEFAULT NULL,
  purok            VARCHAR(50)  DEFAULT '',
  contact_number   VARCHAR(30)  DEFAULT '',
  address          VARCHAR(255) DEFAULT '',
  email            VARCHAR(150) DEFAULT '',
  phone            VARCHAR(30)  DEFAULT '',
  is_voter         TINYINT(1)   DEFAULT 0,
  is_pwd           TINYINT(1)   DEFAULT 0,
  is_senior        TINYINT(1)   DEFAULT 0,
  is_minor         TINYINT(1)   DEFAULT 0,
  security_question VARCHAR(255) DEFAULT '',
  security_answer  VARCHAR(255) DEFAULT '',
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default admin account (username: admin | password: Admin@1234 | security answer: admin)
INSERT IGNORE INTO users (id, username, password, role, status, first_name, last_name, security_question, security_answer, created_at)
VALUES (1, 'admin', '$2b$10$3lk.Ns7MG1PabQA64umo4e2NzW1z15DzruY/VykLh6VN.lS7Zl5nW', 'admin', 'verified', 'Admin', 'User', 'What is your favorite childhood nickname?', '$2b$10$OohWzF906QB9jCYuHlEVLujwR4cl1JnDBKWRqHqLAo1exYHaI1BBW', NOW());

-- ── RESIDENTS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS residents (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  user_id      INT          DEFAULT NULL,
  first_name   VARCHAR(100) NOT NULL,
  last_name    VARCHAR(100) NOT NULL,
  middle_name  VARCHAR(100) DEFAULT '',
  suffix       VARCHAR(20)  DEFAULT '',
  gender       VARCHAR(20)  DEFAULT '',
  age          INT          DEFAULT NULL,
  birthdate    DATE         DEFAULT NULL,
  civil_status VARCHAR(50)  DEFAULT '',
  purok        VARCHAR(50)  DEFAULT '',
  contact      VARCHAR(30)  DEFAULT '',
  address      VARCHAR(255) DEFAULT '',
  is_voter     TINYINT(1)   DEFAULT 0,
  is_pwd       TINYINT(1)   DEFAULT 0,
  is_senior    TINYINT(1)   DEFAULT 0,
  is_minor     TINYINT(1)   DEFAULT 0,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── OFFICIALS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS officials (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name  VARCHAR(100) NOT NULL,
  position   VARCHAR(150) DEFAULT '',
  committee  VARCHAR(150) DEFAULT '',
  term_start DATE         DEFAULT NULL,
  term_end   DATE         DEFAULT NULL,
  status     ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── BLOTTER ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blotter (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  case_number   VARCHAR(30)  DEFAULT '',
  complainant   VARCHAR(150) NOT NULL,
  respondent    VARCHAR(150) NOT NULL,
  incident_type VARCHAR(100) DEFAULT '',
  description   TEXT         DEFAULT NULL,
  status        ENUM('Open','Ongoing','Under Investigation','Settled','Dismissed') DEFAULT 'Open',
  created_at    DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ── CLEARANCE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clearance (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  ref_number       VARCHAR(30)  NOT NULL UNIQUE,
  full_name        VARCHAR(200) NOT NULL,
  purpose          VARCHAR(255) DEFAULT '',
  address          VARCHAR(255) DEFAULT '',
  requested_by     INT          DEFAULT NULL,
  status           ENUM('Pending','Approved','Released','Rejected') DEFAULT 'Pending',
  or_number        VARCHAR(30)  DEFAULT NULL,
  issued_by        VARCHAR(150) DEFAULT '',
  date_issued      DATETIME     DEFAULT NULL,
  rejection_reason TEXT         DEFAULT NULL,
  walkin           TINYINT(1)   DEFAULT 0,
  deleted          TINYINT(1)   DEFAULT 0,
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     DEFAULT NULL,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── INDIGENCY ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS indigency (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  ref_number       VARCHAR(30)  NOT NULL UNIQUE,
  full_name        VARCHAR(200) NOT NULL,
  purpose          VARCHAR(255) DEFAULT '',
  address          VARCHAR(255) DEFAULT '',
  requested_by     INT          DEFAULT NULL,
  status           ENUM('Pending','Approved','Released','Rejected') DEFAULT 'Pending',
  or_number        VARCHAR(30)  DEFAULT NULL,
  issued_by        VARCHAR(150) DEFAULT '',
  date_issued      DATETIME     DEFAULT NULL,
  rejection_reason TEXT         DEFAULT NULL,
  walkin           TINYINT(1)   DEFAULT 0,
  deleted          TINYINT(1)   DEFAULT 0,
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     DEFAULT NULL,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── RESIDENCY ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS residency (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  ref_number       VARCHAR(30)  NOT NULL UNIQUE,
  full_name        VARCHAR(200) NOT NULL,
  purpose          VARCHAR(255) DEFAULT '',
  address          VARCHAR(255) DEFAULT '',
  requested_by     INT          DEFAULT NULL,
  status           ENUM('Pending','Approved','Released','Rejected') DEFAULT 'Pending',
  or_number        VARCHAR(30)  DEFAULT NULL,
  issued_by        VARCHAR(150) DEFAULT '',
  date_issued      DATETIME     DEFAULT NULL,
  rejection_reason TEXT         DEFAULT NULL,
  walkin           TINYINT(1)   DEFAULT 0,
  deleted          TINYINT(1)   DEFAULT 0,
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     DEFAULT NULL,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── PERMITS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permits (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  ref_number       VARCHAR(30)  NOT NULL UNIQUE,
  full_name        VARCHAR(200) NOT NULL,
  purpose          VARCHAR(255) DEFAULT '',
  address          VARCHAR(255) DEFAULT '',
  business_name    VARCHAR(200) DEFAULT '',
  requested_by     INT          DEFAULT NULL,
  status           ENUM('Pending','Approved','Released','Rejected') DEFAULT 'Pending',
  or_number        VARCHAR(30)  DEFAULT NULL,
  issued_by        VARCHAR(150) DEFAULT '',
  date_issued      DATETIME     DEFAULT NULL,
  rejection_reason TEXT         DEFAULT NULL,
  walkin           TINYINT(1)   DEFAULT 0,
  deleted          TINYINT(1)   DEFAULT 0,
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     DEFAULT NULL,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── PAYMENTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  doc_ref_number   VARCHAR(30)  NOT NULL,
  doc_table        VARCHAR(50)  DEFAULT '',
  doc_type         VARCHAR(100) DEFAULT '',
  full_name        VARCHAR(200) DEFAULT '',
  first_name       VARCHAR(100) DEFAULT '',
  last_name        VARCHAR(100) DEFAULT '',
  paid_by          INT          DEFAULT NULL,
  amount           DECIMAL(10,2) DEFAULT 0.00,
  payment_method   VARCHAR(30)  DEFAULT NULL,
  payment_status   ENUM('Awaiting Payment','Pending','Paid','Rejected','Failed') DEFAULT 'Awaiting Payment',
  transaction_ref  VARCHAR(50)  DEFAULT NULL,
  gcash_number     VARCHAR(20)  DEFAULT NULL,
  maya_number      VARCHAR(20)  DEFAULT NULL,
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  submitted_at     DATETIME     DEFAULT NULL,
  paid_at          DATETIME     DEFAULT NULL,
  FOREIGN KEY (paid_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ── HISTORY ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS history (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  action       VARCHAR(200) NOT NULL,
  details      TEXT         DEFAULT NULL,
  performed_by INT          DEFAULT NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

SELECT 'Database setup complete!' AS message;
