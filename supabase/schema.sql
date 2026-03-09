-- 智能错题簿数据库 Schema
-- 在 Supabase SQL Editor 中执行此脚本

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('student', 'teacher', 'parent')) DEFAULT 'student',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 知识点表
CREATE TABLE IF NOT EXISTS knowledge_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT CHECK (subject IN ('chinese', 'math', 'english', 'physics', 'chemistry')) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  mastery_level TEXT CHECK (mastery_level IN ('unfamiliar', 'normal', 'mastered')) DEFAULT 'unfamiliar',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 错题表
CREATE TABLE IF NOT EXISTS wrong_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT CHECK (subject IN ('chinese', 'math', 'english', 'physics', 'chemistry')) NOT NULL,
  content TEXT NOT NULL,
  content_image_url TEXT,
  correct_answer TEXT NOT NULL,
  wrong_answer TEXT,
  error_reason TEXT,
  analysis TEXT,
  chapter TEXT,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  mastery_level TEXT CHECK (mastery_level IN ('unfamiliar', 'normal', 'mastered')) DEFAULT 'unfamiliar',
  knowledge_point_id UUID REFERENCES knowledge_points(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 题目标签关联表
CREATE TABLE IF NOT EXISTS question_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES wrong_questions(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES knowledge_points(id) ON DELETE CASCADE
);

-- 评测记录表（智能评测功能）
CREATE TABLE IF NOT EXISTS assessment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  knowledge_point_id UUID REFERENCES knowledge_points(id) ON DELETE CASCADE,
  question_id UUID REFERENCES wrong_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_wrong_questions_user_id ON wrong_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_subject ON wrong_questions(subject);
CREATE INDEX IF NOT EXISTS idx_wrong_questions_mastery ON wrong_questions(mastery_level);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_user_id ON knowledge_points(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_points_subject ON knowledge_points(subject);
CREATE INDEX IF NOT EXISTS idx_assessment_records_user_id ON assessment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_records_knowledge_point ON assessment_records(knowledge_point_id);

-- 开启 RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE wrong_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_records ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能访问自己的数据
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Knowledge points are viewable by authenticated users" ON knowledge_points
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Knowledge points are insertable by authenticated users" ON knowledge_points
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Knowledge points are updatable by authenticated users" ON knowledge_points
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Knowledge points are deletable by authenticated users" ON knowledge_points
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Wrong questions are viewable by authenticated users" ON wrong_questions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Wrong questions are insertable by authenticated users" ON wrong_questions
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Wrong questions are updatable by authenticated users" ON wrong_questions
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Wrong questions are deletable by authenticated users" ON wrong_questions
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Question tags are viewable by authenticated users" ON question_tags
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Question tags are insertable by authenticated users" ON question_tags
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Question tags are deletable by authenticated users" ON question_tags
  FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Assessment records are viewable by authenticated users" ON assessment_records
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Assessment records are insertable by authenticated users" ON assessment_records
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 创建自动更新 updated_at 的触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 users 表创建 updated_at 自动更新触发器
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 wrong_questions 表创建 updated_at 自动更新触发器
CREATE TRIGGER update_wrong_questions_updated_at
  BEFORE UPDATE ON wrong_questions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入示例知识点数据（可选）
INSERT INTO knowledge_points (id, user_id, subject, name, description, mastery_level) VALUES
  (uuid_generate_v4(), NULL, 'math', '二次函数', '二次函数的图像与性质', 'normal'),
  (uuid_generate_v4(), NULL, 'math', '一元二次方程', '一元二次方程的解法', 'mastered'),
  (uuid_generate_v4(), NULL, 'physics', '动能定理', '动能定理的应用', 'unfamiliar'),
  (uuid_generate_v4(), NULL, 'physics', '自由落体', '自由落体运动规律', 'normal'),
  (uuid_generate_v4(), NULL, 'english', '从句语法', '定语从句与名词性从句', 'unfamiliar'),
  (uuid_generate_v4(), NULL, 'english', '时态', '英语时态综合', 'normal'),
  (uuid_generate_v4(), NULL, 'chemistry', '化学方程式', '化学方程式配平', 'mastered'),
  (uuid_generate_v4(), NULL, 'chinese', '文言文', '文言文阅读理解', 'unfamiliar')
ON CONFLICT DO NOTHING;

-- 插入示例错题数据（可选）
INSERT INTO wrong_questions (id, user_id, subject, content, correct_answer, wrong_answer, error_reason, analysis, chapter, difficulty, mastery_level) VALUES
  (uuid_generate_v4(), NULL, 'math', '已知二次函数 y = x² - 4x + 3，求顶点坐标', '(2, -1)', '(2, 1)', '计算错误', '顶点坐标公式：x = -b/2a = 4/2 = 2，代入得 y = 4 - 8 + 3 = -1', '二次函数', 'medium', 'normal'),
  (uuid_generate_v4(), NULL, 'physics', '质量为 2kg 的物体以 3m/s 的速度运动，求动能', '9J', '6J', '公式记忆错误', '动能公式：E_k = ½mv² = ½×2×3² = 9J', '动能定理', 'easy', 'unfamiliar'),
  (uuid_generate_v4(), NULL, 'english', 'This is the book ___ I bought yesterday.', 'which', 'who', '关系代词选择错误', '先行词是 book（物），用 which 引导定语从句', '从句语法', 'easy', 'unfamiliar')
ON CONFLICT DO NOTHING;

SELECT '数据库 Schema 创建完成！' AS message;
