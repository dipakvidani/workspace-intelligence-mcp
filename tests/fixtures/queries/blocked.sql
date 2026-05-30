-- Blocked queries for testing QueryGuard
INSERT INTO users (name) VALUES ('test');
UPDATE users SET name = 'hacked';
DELETE FROM users;
DROP TABLE users;
ALTER TABLE users ADD COLUMN hack TEXT;
TRUNCATE TABLE users;
CREATE TABLE evil (id INT);
SELECT 1; DROP TABLE users;
SELECT * FROM users -- comment injection
