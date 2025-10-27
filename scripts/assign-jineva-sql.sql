-- First, find Nora's company ID
SELECT 
  su.id as staff_id,
  su.name as staff_name,
  su.email,
  su."companyId",
  c."companyName",
  c."accountManagerId" as current_account_manager
FROM staff_users su
LEFT JOIN company c ON c.id = su."companyId"
WHERE su.email = 'nora4@nora.com';

-- Then, assign Jineva Rosal as account manager to Nora's company
-- Replace '<nora-company-id>' with the companyId from the query above
UPDATE company 
SET "accountManagerId" = 'e79455a3-d2a8-4f82-8e49-716e10bc362d',
    "updatedAt" = NOW()
WHERE id = (
  SELECT "companyId" 
  FROM staff_users 
  WHERE email = 'nora4@nora.com'
);

-- Verify the assignment
SELECT 
  c.id,
  c."companyName",
  c."accountManagerId",
  m.name as account_manager_name,
  m.email as account_manager_email,
  m.department
FROM company c
LEFT JOIN management_users m ON m.id = c."accountManagerId"
WHERE c.id = (
  SELECT "companyId" 
  FROM staff_users 
  WHERE email = 'nora4@nora.com'
);

