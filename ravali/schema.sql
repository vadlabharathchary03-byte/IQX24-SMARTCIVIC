-- =========================================================
-- Ravali Phone OTP Authentication Database Schema
-- Compatible with MySQL 5.7+ / MySQL 8.0+ / MariaDB 10.3+
-- =========================================================

CREATE DATABASE IF NOT EXISTS ravali_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ravali_db;

-- ---------------------------------------------------------
-- 1. Users Table
-- Stores unique registered citizen/user phone accounts
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    INDEX idx_phone (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 2. OTP Verifications Table
-- Stores cryptographically hashed OTP codes with 5-min expiry
-- and limits verification to max 3 invalid attempts.
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    is_used TINYINT(1) DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone_lookup (phone_number, is_used, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------
-- 3. OTP Rate Limiting Table
-- Tracks cooldown between OTP requests and max hourly limits
-- ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_rate_limits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL UNIQUE,
    request_count INT DEFAULT 1,
    window_start DATETIME NOT NULL,
    last_request_at DATETIME NOT NULL,
    INDEX idx_rate_phone (phone_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
