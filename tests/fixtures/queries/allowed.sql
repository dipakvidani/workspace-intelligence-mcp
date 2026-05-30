-- Allowed queries for testing QueryGuard
SELECT * FROM users;
SELECT id, name FROM products WHERE price > 10;
EXPLAIN SELECT * FROM orders;
SELECT COUNT(*) FROM users;
WITH active AS (SELECT * FROM users WHERE active = 1) SELECT * FROM active;
