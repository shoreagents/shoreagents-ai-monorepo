-- 1. First, check Stephen's company details
SELECT 
  cu.id as client_user_id,
  cu.name as client_name,
  cu.email,
  cu."companyId",
  c."companyName",
  c."accountManagerId",
  m.name as account_manager_name
FROM client_users cu
LEFT JOIN company c ON c.id = cu."companyId"
LEFT JOIN management_users m ON m.id = c."accountManagerId"
WHERE cu.email = 'stephen@stepten.io';

-- 2. Find Stephen's company ID from the UUID provided
SELECT * FROM company WHERE id = '7f12a47b-87b2-4c71-a988-f09949286561';

-- 3. Assign Jineva as account manager to Stephen's company (if not already assigned)
UPDATE company 
SET "accountManagerId" = 'e79455a3-d2a8-4f82-8e49-716e10bc362d',
    "updatedAt" = NOW()
WHERE id = '7f12a47b-87b2-4c71-a988-f09949286561'
  AND "accountManagerId" IS NULL;

-- 4. Assign Nora (test staff) to Stephen's company
UPDATE staff_users 
SET "companyId" = '7f12a47b-87b2-4c71-a988-f09949286561',
    "updatedAt" = NOW()
WHERE email = 'nora4@nora.com';

-- 5. Verify the assignment
SELECT 
  su.id as staff_id,
  su.name as staff_name,
  su.email,
  su."companyId",
  c."companyName",
  c."accountManagerId",
  m.name as account_manager_name,
  m.email as account_manager_email
FROM staff_users su
LEFT JOIN company c ON c.id = su."companyId"
LEFT JOIN management_users m ON m.id = c."accountManagerId"
WHERE su.email = 'nora4@nora.com';

