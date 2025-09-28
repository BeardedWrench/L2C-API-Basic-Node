-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL CHECK (LENGTH(name) >= 2),
    email VARCHAR(255) NOT NULL UNIQUE,
    age INTEGER CHECK (age >= 0 AND age <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Created Indexes
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_age ON users(age);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it already exists before creating it
DROP TRIGGER IF EXISTS updated_users_updated_at ON users;

-- Trigger for updated_at
CREATE TRIGGER updated_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data
INSERT INTO users (name, email, age) VALUES
    ('John Doe', 'john@john.com', 30),
    ('Jane Smith', 'jane@jane.com', 25),
    ('Bob Bobertson', 'bob@bob.com', 35)
ON CONFLICT (email) DO NOTHING;