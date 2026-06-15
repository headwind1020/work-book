-- 智能错题簿数据库 - 腾讯云 CloudBase SQL
-- 在 CloudBase 数据库控制台执行此脚本

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(32) NOT NULL,
  openid VARCHAR(64),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'student',
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 知识点表
CREATE TABLE IF NOT EXISTS knowledge_points (
  id VARCHAR(32) NOT NULL,
  openid VARCHAR(64),
  subject VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  mastery_level VARCHAR(20) DEFAULT 'unfamiliar',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 错题表
CREATE TABLE IF NOT EXISTS wrong_questions (
  id VARCHAR(32) NOT NULL,
  openid VARCHAR(64),
  subject VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  content_image_url VARCHAR(500),
  correct_answer TEXT NOT NULL,
  wrong_answer TEXT,
  error_reason TEXT,
  analysis TEXT,
  chapter VARCHAR(100),
  difficulty VARCHAR(20) DEFAULT 'medium',
  mastery_level VARCHAR(20) DEFAULT 'unfamiliar',
  knowledge_point_id VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 评测记录表
CREATE TABLE IF NOT EXISTS assessment_records (
  id VARCHAR(32) NOT NULL,
  openid VARCHAR(64),
  knowledge_point_id VARCHAR(32),
  question_id VARCHAR(32),
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 练习册表
CREATE TABLE IF NOT EXISTS workbooks (
  id VARCHAR(32) NOT NULL,
  openid VARCHAR(64),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  subject VARCHAR(20),
  question_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 练习册题目关联表
CREATE TABLE IF NOT EXISTS workbook_questions (
  id VARCHAR(32) NOT NULL,
  workbook_id VARCHAR(32),
  question_id VARCHAR(32),
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- 题目标签关联表
CREATE TABLE IF NOT EXISTS question_tags (
  id VARCHAR(32) NOT NULL,
  question_id VARCHAR(32),
  tag_id VARCHAR(32),
  PRIMARY KEY (id)
);

-- 插入示例知识点数据
INSERT INTO knowledge_points (id, openid, subject, name, description, mastery_level) VALUES
  (REPLACE(UUID(), '-', ''), NULL, 'math', '二次函数', '二次函数的图像与性质', 'normal'),
  (REPLACE(UUID(), '-', ''), NULL, 'math', '一元二次方程', '一元二次方程的解法', 'mastered'),
  (REPLACE(UUID(), '-', ''), NULL, 'physics', '动能定理', '动能定理的应用', 'unfamiliar'),
  (REPLACE(UUID(), '-', ''), NULL, 'physics', '自由落体', '自由落体运动规律', 'normal'),
  (REPLACE(UUID(), '-', ''), NULL, 'english', '从句语法', '定语从句与名词性从句', 'unfamiliar'),
  (REPLACE(UUID(), '-', ''), NULL, 'english', '时态', '英语时态综合', 'normal'),
  (REPLACE(UUID(), '-', ''), NULL, 'chemistry', '化学方程式', '化学方程式配平', 'mastered'),
  (REPLACE(UUID(), '-', ''), NULL, 'chinese', '文言文', '文言文阅读理解', 'unfamiliar')
ON DUPLICATE KEY UPDATE id = id;

SELECT '数据库表创建完成！' AS message;