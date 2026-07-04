-- Create database (run manually if it doesn't exist)
CREATE DATABASE IF NOT EXISTS github_analyzer;
USE github_analyzer;

-- Main table storing analyzed GitHub profiles
CREATE TABLE IF NOT EXISTS profiles (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  username            VARCHAR(255) NOT NULL UNIQUE,
  name                VARCHAR(255),
  bio                 TEXT,
  avatar_url          VARCHAR(512),
  profile_url         VARCHAR(512),
  company             VARCHAR(255),
  location            VARCHAR(255),
  blog                VARCHAR(512),
  email               VARCHAR(255),
  public_repos        INT DEFAULT 0,
  public_gists        INT DEFAULT 0,
  followers           INT DEFAULT 0,
  following           INT DEFAULT 0,
  total_stars         INT DEFAULT 0,
  total_forks         INT DEFAULT 0,
  most_used_language  VARCHAR(100),
  top_languages       JSON,
  account_created_at  DATETIME,
  account_age_days    INT,
  last_analyzed_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_username (username),
  INDEX idx_followers (followers)
);
