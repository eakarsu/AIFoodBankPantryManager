const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Dropping existing tables...');
    await client.query(`
      DROP TABLE IF EXISTS financial_donations CASCADE;
      DROP TABLE IF EXISTS grants CASCADE;
      DROP TABLE IF EXISTS partners CASCADE;
      DROP TABLE IF EXISTS delivery_routes CASCADE;
      DROP TABLE IF EXISTS fleet CASCADE;
      DROP TABLE IF EXISTS volunteers CASCADE;
      DROP TABLE IF EXISTS food_drives CASCADE;
      DROP TABLE IF EXISTS distributions CASCADE;
      DROP TABLE IF EXISTS visits CASCADE;
      DROP TABLE IF EXISTS inventory CASCADE;
      DROP TABLE IF EXISTS donors CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS warehouses CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    console.log('Creating tables...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS warehouses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        type VARCHAR(50) DEFAULT 'main',
        capacity_sqft INTEGER,
        cooler_temp DECIMAL(5,2),
        freezer_temp DECIMAL(5,2),
        manager VARCHAR(255),
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip VARCHAR(10),
        household_size INTEGER DEFAULT 1,
        income_level VARCHAR(50),
        dietary_restrictions TEXT,
        notes TEXT,
        is_homebound BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS donors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50) DEFAULT 'individual',
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        contact_person VARCHAR(255),
        donation_frequency VARCHAR(50),
        total_donated_lbs DECIMAL(10,2) DEFAULT 0,
        total_donated_value DECIMAL(10,2) DEFAULT 0,
        tax_id VARCHAR(50),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inventory (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50),
        source VARCHAR(50) DEFAULT 'donated',
        quantity INTEGER DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'units',
        weight_lbs DECIMAL(10,2),
        expiration_date DATE,
        storage_type VARCHAR(50) DEFAULT 'shelf',
        warehouse_id INTEGER REFERENCES warehouses(id),
        barcode VARCHAR(100),
        min_stock_level INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'available',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
        visit_date TIMESTAMP DEFAULT NOW(),
        distribution_type VARCHAR(50) DEFAULT 'shopping',
        items_received TEXT,
        weight_lbs DECIMAL(10,2),
        notes TEXT,
        served_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS distributions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        date TIMESTAMP NOT NULL,
        type VARCHAR(50) DEFAULT 'shopping',
        location VARCHAR(255),
        max_clients INTEGER,
        registered_count INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS food_drives (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        organizer VARCHAR(255),
        start_date DATE,
        end_date DATE,
        goal_lbs DECIMAL(10,2),
        collected_lbs DECIMAL(10,2) DEFAULT 0,
        location VARCHAR(255),
        status VARCHAR(50) DEFAULT 'planned',
        donation_count INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS volunteers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(100),
        availability TEXT,
        skills TEXT,
        background_check BOOLEAN DEFAULT false,
        emergency_contact VARCHAR(255),
        total_hours DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        start_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS fleet (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        make VARCHAR(100),
        model VARCHAR(100),
        year INTEGER,
        license_plate VARCHAR(50),
        mileage INTEGER,
        status VARCHAR(50) DEFAULT 'available',
        insurance_expiry DATE,
        last_service DATE,
        next_service DATE,
        capacity_lbs INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS delivery_routes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        driver VARCHAR(255),
        vehicle_id INTEGER REFERENCES fleet(id),
        date DATE,
        status VARCHAR(50) DEFAULT 'planned',
        stops JSONB DEFAULT '[]',
        total_miles DECIMAL(10,2),
        estimated_time VARCHAR(50),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(50),
        address TEXT,
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        contact_phone VARCHAR(50),
        service_area VARCHAR(255),
        clients_served INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        agreement_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS grants (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        grantor VARCHAR(255),
        amount DECIMAL(12,2),
        start_date DATE,
        end_date DATE,
        status VARCHAR(50) DEFAULT 'applied',
        category VARCHAR(100),
        requirements TEXT,
        reporting_frequency VARCHAR(50),
        contact_name VARCHAR(255),
        contact_email VARCHAR(255),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS financial_donations (
        id SERIAL PRIMARY KEY,
        donor_id INTEGER REFERENCES donors(id),
        amount DECIMAL(12,2) NOT NULL,
        date DATE DEFAULT CURRENT_DATE,
        method VARCHAR(50) DEFAULT 'cash',
        designation VARCHAR(255),
        tax_receipt_number VARCHAR(100),
        tax_receipt_sent BOOLEAN DEFAULT false,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log('Seeding data...');

    // --- Users ---
    const hashedPassword = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (email, password, name, role) VALUES
        ('admin@foodbank.org', $1, 'Sarah Mitchell', 'admin'),
        ('manager@foodbank.org', $1, 'James Rodriguez', 'manager')
    `, [hashedPassword]);
    console.log('  Users seeded');

    // --- Warehouses ---
    await client.query(`
      INSERT INTO warehouses (name, address, type, capacity_sqft, cooler_temp, freezer_temp, manager, phone, status, notes) VALUES
        ('Main Distribution Center', '1200 Commerce Blvd, Springfield, IL 62704', 'main', 25000, 36.00, -10.00, 'Tom Bradley', '(217) 555-0101', 'active', 'Primary hub for all incoming donations and outgoing distributions'),
        ('North Side Annex', '450 N. Maple Ave, Springfield, IL 62702', 'annex', 8000, 38.00, NULL, 'Linda Chow', '(217) 555-0102', 'active', 'Serves north district neighborhoods'),
        ('South Community Hub', '3300 S. Grand Ave, Springfield, IL 62703', 'satellite', 6000, 37.50, -5.00, 'Marcus Johnson', '(217) 555-0103', 'active', 'Community center co-located pantry'),
        ('Downtown Storage', '88 E. Monroe St, Springfield, IL 62701', 'storage', 4000, NULL, NULL, 'Karen Weiss', '(217) 555-0104', 'active', 'Dry goods overflow storage'),
        ('Mobile Unit Alpha', 'N/A - Mobile', 'mobile', 500, 35.00, -8.00, 'Derek Simmons', '(217) 555-0105', 'active', 'Refrigerated box truck converted for mobile pantry'),
        ('West County Depot', '7800 W. Wabash Ave, Rochester, IL 62563', 'depot', 10000, 36.50, -12.00, 'Patricia Gomez', '(217) 555-0106', 'active', 'Serves rural western Sangamon County'),
        ('East District Center', '2100 E. Cook St, Springfield, IL 62703', 'satellite', 5500, 37.00, NULL, 'Robert Kim', '(217) 555-0107', 'active', 'Partnership with East Side Community Center'),
        ('Freezer Facility A', '1202 Commerce Blvd Unit B, Springfield, IL 62704', 'cold-storage', 3000, NULL, -20.00, 'Tom Bradley', '(217) 555-0108', 'active', 'Dedicated deep-freeze for USDA commodities'),
        ('Church Basement Storage', '600 Capitol Ave, Springfield, IL 62701', 'partner', 2000, NULL, NULL, 'Rev. David Okonkwo', '(217) 555-0109', 'active', 'First United Methodist Church partnership'),
        ('School District Hub', '1900 W. Monroe St, Springfield, IL 62704', 'satellite', 3500, 36.00, NULL, 'Angela Torres', '(217) 555-0110', 'active', 'Weekend backpack program staging area'),
        ('Senior Center Pantry', '2200 S. 11th St, Springfield, IL 62703', 'pantry', 1500, 38.00, NULL, 'Dorothy Franklin', '(217) 555-0111', 'active', 'Dedicated senior nutrition program'),
        ('Refugee Services Center', '415 N. 6th St, Springfield, IL 62702', 'pantry', 2500, 37.00, -6.00, 'Amina Hassan', '(217) 555-0112', 'active', 'Culturally appropriate foods for refugee families'),
        ('Veterans Hall Storage', '1120 S. 5th St, Springfield, IL 62703', 'partner', 3000, NULL, NULL, 'Sgt. Bill Murphy', '(217) 555-0113', 'active', 'VFW Post 755 storage for veteran food assistance'),
        ('Corporate Partner Dock', '500 Industrial Park Dr, Springfield, IL 62707', 'receiving', 7000, 35.00, -15.00, 'Steve Nakamura', '(217) 555-0114', 'active', 'Receiving dock for corporate and retail donations'),
        ('Emergency Reserve Unit', '1204 Commerce Blvd Unit C, Springfield, IL 62704', 'reserve', 4500, 36.00, -10.00, 'Tom Bradley', '(217) 555-0115', 'active', 'Disaster and emergency response stockpile')
    `);
    console.log('  Warehouses seeded');

    // --- Clients ---
    await client.query(`
      INSERT INTO clients (first_name, last_name, email, phone, address, city, state, zip, household_size, income_level, dietary_restrictions, notes, is_homebound) VALUES
        ('Maria', 'Garcia', 'maria.garcia@email.com', '(217) 555-1001', '1425 S. 4th St', 'Springfield', 'IL', '62703', 5, 'below-poverty', 'diabetic', 'Family with three school-age children', false),
        ('James', 'Williams', NULL, '(217) 555-1002', '302 N. Grand Ave Apt 4B', 'Springfield', 'IL', '62702', 1, 'below-poverty', NULL, 'Veteran, receives VA benefits', true),
        ('Fatima', 'Al-Rashid', 'fatima.alrashid@email.com', '(217) 555-1003', '812 E. Capitol Ave', 'Springfield', 'IL', '62701', 7, 'low', 'halal', 'Syrian refugee family resettled 2024', false),
        ('Dorothy', 'Henderson', NULL, '(217) 555-1004', '1600 S. 11th St Apt 2A', 'Springfield', 'IL', '62703', 1, 'low', 'low-sodium, diabetic', 'Senior on fixed income, mobility issues', true),
        ('Michael', 'Thompson', 'mthompson88@email.com', '(217) 555-1005', '2200 E. Cook St', 'Springfield', 'IL', '62703', 3, 'moderate', NULL, 'Recently laid off, temporary assistance', false),
        ('Linh', 'Nguyen', NULL, '(217) 555-1006', '905 W. Lawrence Ave', 'Springfield', 'IL', '62704', 4, 'below-poverty', 'gluten-free', 'Vietnamese-speaking household, interpreter needed', false),
        ('Robert', 'Jackson', 'rjackson@email.com', '(217) 555-1007', '3100 S. Grand Ave', 'Springfield', 'IL', '62703', 2, 'low', NULL, 'Disabled veteran, wheelchair accessible delivery needed', true),
        ('Sandra', 'Martinez', NULL, '(217) 555-1008', '708 N. Walnut St', 'Springfield', 'IL', '62702', 6, 'below-poverty', 'vegetarian', 'Single mother with five children', false),
        ('William', 'Davis', 'wdavis@email.com', '(217) 555-1009', '1100 E. Adams St', 'Springfield', 'IL', '62703', 1, 'low', 'diabetic, low-sodium', 'Senior, limited transportation', true),
        ('Amara', 'Osei', NULL, '(217) 555-1010', '420 S. College St', 'Springfield', 'IL', '62704', 3, 'below-poverty', NULL, 'Recent immigrant from Ghana, English language learner', false),
        ('Jennifer', 'Brown', 'jbrown22@email.com', '(217) 555-1011', '1800 W. Monroe St', 'Springfield', 'IL', '62704', 4, 'moderate', 'nut-free', 'Child has severe peanut allergy', false),
        ('Carlos', 'Ramirez', NULL, '(217) 555-1012', '500 E. Capitol Ave', 'Springfield', 'IL', '62701', 8, 'below-poverty', NULL, 'Multi-generational household, grandparents as caregivers', false),
        ('Betty', 'Wilson', NULL, '(217) 555-1013', '2400 S. MacArthur Blvd Apt 12', 'Springfield', 'IL', '62704', 1, 'low', 'soft foods only', 'Elderly, dental issues, prefers soft/canned items', true),
        ('Ahmad', 'Hassan', 'ahmad.h@email.com', '(217) 555-1014', '615 N. 5th St', 'Springfield', 'IL', '62702', 5, 'low', 'halal', 'Somali family, children enrolled in school lunch program', false),
        ('Teresa', 'Kowalski', NULL, '(217) 555-1015', '3300 Chatham Rd', 'Springfield', 'IL', '62704', 2, 'moderate', 'gluten-free, dairy-free', 'Celiac disease, needs certified gluten-free items', false),
        ('Deshawn', 'Robinson', 'drobinson@email.com', '(217) 555-1016', '1900 E. Cook St', 'Springfield', 'IL', '62703', 3, 'below-poverty', NULL, 'Single father, works night shift', false),
        ('Olga', 'Petrov', NULL, '(217) 555-1017', '750 W. Edwards St', 'Springfield', 'IL', '62704', 2, 'low', 'diabetic', 'Ukrainian refugee, limited English', false),
        ('Thomas', 'Anderson', 'tanderson@email.com', '(217) 555-1018', '1050 N. Grand Ave', 'Springfield', 'IL', '62702', 1, 'below-poverty', NULL, 'Homeless, uses shelter address', false),
        ('Rosa', 'Hernandez', NULL, '(217) 555-1019', '2600 S. 6th St', 'Springfield', 'IL', '62703', 4, 'low', 'vegetarian', 'Prefers Spanish-language services', false),
        ('Henry', 'Chen', 'hchen@email.com', '(217) 555-1020', '1300 W. Washington St', 'Springfield', 'IL', '62702', 3, 'moderate', NULL, 'Temporary assistance after medical emergency', false)
    `);
    console.log('  Clients seeded');

    // --- Donors ---
    await client.query(`
      INSERT INTO donors (name, type, email, phone, address, contact_person, donation_frequency, total_donated_lbs, total_donated_value, tax_id, notes, status) VALUES
        ('Walmart Distribution Center', 'corporation', 'giving@walmart.com', '(217) 555-2001', '3000 S. Dirksen Pkwy, Springfield, IL 62703', 'Mike Patterson', 'weekly', 45000.00, 125000.00, '71-0415188', 'Consistent weekly produce and dry goods donations', 'active'),
        ('Local Harvest Farm', 'farm', 'info@localharvestfarm.com', '(217) 555-2002', '8800 Old Jacksonville Rd, Springfield, IL 62711', 'Ellen Johansson', 'seasonal', 12000.00, 30000.00, '37-4521890', 'Seasonal produce donations May through October', 'active'),
        ('Giovanni''s Restaurant', 'restaurant', 'giovanni@giovannis.com', '(217) 555-2003', '220 S. 5th St, Springfield, IL 62701', 'Marco Giovanni', 'weekly', 3500.00, 8750.00, '37-6789012', 'Prepared meals and surplus ingredients', 'active'),
        ('Community Foundation of Greater Metro', 'foundation', 'grants@cfgm.org', '(217) 555-2004', '1 Old State Capitol Plaza, Springfield, IL 62701', 'Rebecca Thornton', 'quarterly', 0.00, 75000.00, '37-1234567', 'Financial donations and grant funding', 'active'),
        ('Schnucks Markets', 'grocery', 'community@schnucks.com', '(217) 555-2005', '2700 N. Dirksen Pkwy, Springfield, IL 62702', 'Lisa Brewer', 'daily', 38000.00, 95000.00, '43-0987654', 'Daily bakery and produce rescue program', 'active'),
        ('Prairie Farms Dairy', 'corporation', 'outreach@prairiefarms.com', '(217) 555-2006', '1100 N. Broadway, Carlinville, IL 62626', 'Dan Whitfield', 'biweekly', 22000.00, 44000.00, '37-0246810', 'Milk, yogurt, and cheese near-date donations', 'active'),
        ('Margaret Sullivan', 'individual', 'msullivan@email.com', '(217) 555-2007', '1500 S. Wiggins Ave, Springfield, IL 62704', 'Margaret Sullivan', 'monthly', 200.00, 1500.00, NULL, 'Monthly canned goods drive from her church group', 'active'),
        ('ALDI Store #47', 'grocery', 'store47@aldi.us', '(217) 555-2008', '3147 S. 6th St, Springfield, IL 62703', 'Karen Schmidt', 'weekly', 18000.00, 36000.00, '36-3456789', 'Weekly produce and bakery items', 'active'),
        ('Panera Bread - West Side', 'restaurant', 'manager.west@panera.com', '(217) 555-2009', '2501 Wabash Ave, Springfield, IL 62704', 'Tony Reeves', 'daily', 8500.00, 25500.00, '04-3479908', 'End-of-day bread and pastry donations', 'active'),
        ('Springfield Rotary Club', 'organization', 'president@springfieldrotary.org', '(217) 555-2010', 'PO Box 4221, Springfield, IL 62708', 'Harold Jennings', 'monthly', 5000.00, 15000.00, '37-1122334', 'Monthly food drives and annual holiday campaign', 'active'),
        ('Sysco Central Illinois', 'corporation', 'community@sysco.com', '(217) 555-2011', '4200 N. Peoria Rd, Springfield, IL 62702', 'Jim Callahan', 'monthly', 30000.00, 90000.00, '74-1648137', 'Surplus and short-dated warehouse inventory', 'active'),
        ('Green Acres Organic Farm', 'farm', 'hello@greenacresorganic.com', '(217) 555-2012', '12000 Cantrall Rd, Cantrall, IL 62625', 'Sarah Lindgren', 'seasonal', 6000.00, 18000.00, '37-5566778', 'Organic produce gleaning program', 'active'),
        ('First Presbyterian Church', 'organization', 'office@firstpres-springfield.org', '(217) 555-2013', '321 S. 7th St, Springfield, IL 62701', 'Rev. Nancy Palmer', 'monthly', 4000.00, 10000.00, '37-0011223', 'Monthly congregation food collection', 'active'),
        ('Robert & Linda Chen', 'individual', 'rchen@email.com', '(217) 555-2014', '2800 Lindbergh Blvd, Springfield, IL 62704', 'Robert Chen', 'annual', 0.00, 25000.00, NULL, 'Annual year-end financial gift', 'active'),
        ('Midwest Food Rescue Alliance', 'organization', 'info@mwfoodrescue.org', '(217) 555-2015', '500 E. Monroe St, Springfield, IL 62701', 'Diane Kowalski', 'weekly', 20000.00, 50000.00, '37-9988776', 'Coordinates surplus food from multiple restaurants', 'active')
    `);
    console.log('  Donors seeded');

    // --- Inventory ---
    await client.query(`
      INSERT INTO inventory (name, category, source, quantity, unit, weight_lbs, expiration_date, storage_type, warehouse_id, barcode, min_stock_level, status) VALUES
        ('Boneless Chicken Breast', 'protein', 'donated', 200, 'lbs', 200.00, '2026-04-15', 'freezer', 1, '0012345000011', 50, 'available'),
        ('Ground Beef 80/20', 'protein', 'purchased', 150, 'lbs', 150.00, '2026-04-10', 'freezer', 8, '0012345000022', 40, 'available'),
        ('Canned Tuna (12oz)', 'protein', 'donated', 500, 'cans', 375.00, '2027-06-01', 'shelf', 1, '0012345000033', 100, 'available'),
        ('Creamy Peanut Butter (16oz)', 'protein', 'purchased', 300, 'jars', 300.00, '2027-03-15', 'shelf', 1, '0012345000044', 75, 'available'),
        ('Large Eggs (dozen)', 'protein', 'donated', 80, 'dozen', 120.00, '2026-04-02', 'cooler', 1, '0012345000055', 30, 'available'),
        ('Whole Milk (gallon)', 'dairy', 'donated', 120, 'gallons', 1032.00, '2026-04-05', 'cooler', 1, '0012345000066', 40, 'available'),
        ('Cheddar Cheese Block (2lb)', 'dairy', 'donated', 90, 'blocks', 180.00, '2026-05-20', 'cooler', 6, '0012345000077', 25, 'available'),
        ('Vanilla Yogurt (32oz)', 'dairy', 'donated', 60, 'containers', 120.00, '2026-04-08', 'cooler', 1, '0012345000088', 20, 'available'),
        ('Butter (1lb)', 'dairy', 'purchased', 100, 'lbs', 100.00, '2026-07-01', 'cooler', 1, '0012345000099', 30, 'available'),
        ('Red Delicious Apples', 'produce', 'donated', 400, 'lbs', 400.00, '2026-04-01', 'cooler', 1, '0012345000110', 50, 'available'),
        ('Russet Potatoes (5lb bag)', 'produce', 'donated', 250, 'bags', 1250.00, '2026-04-20', 'shelf', 1, '0012345000121', 60, 'available'),
        ('Yellow Onions (3lb bag)', 'produce', 'donated', 180, 'bags', 540.00, '2026-04-18', 'shelf', 6, '0012345000132', 40, 'available'),
        ('Baby Carrots (2lb bag)', 'produce', 'donated', 150, 'bags', 300.00, '2026-04-12', 'cooler', 1, '0012345000143', 30, 'available'),
        ('Iceberg Lettuce', 'produce', 'donated', 75, 'heads', 112.50, '2026-03-28', 'cooler', 1, '0012345000154', 20, 'expiring-soon'),
        ('Bananas', 'produce', 'donated', 200, 'lbs', 200.00, '2026-03-30', 'shelf', 1, '0012345000165', 40, 'expiring-soon'),
        ('Long Grain White Rice (5lb)', 'grain', 'purchased', 350, 'bags', 1750.00, '2027-12-01', 'shelf', 4, '0012345000176', 80, 'available'),
        ('Spaghetti Pasta (16oz)', 'grain', 'donated', 400, 'boxes', 400.00, '2027-09-15', 'shelf', 1, '0012345000187', 100, 'available'),
        ('White Bread Loaf', 'grain', 'donated', 100, 'loaves', 150.00, '2026-03-29', 'shelf', 1, '0012345000198', 30, 'expiring-soon'),
        ('Cheerios Cereal (18oz)', 'grain', 'donated', 200, 'boxes', 225.00, '2027-01-10', 'shelf', 4, '0012345000209', 50, 'available'),
        ('All-Purpose Flour (5lb)', 'grain', 'purchased', 175, 'bags', 875.00, '2027-06-01', 'shelf', 4, '0012345000210', 40, 'available'),
        ('Chicken Noodle Soup (15oz)', 'canned', 'donated', 600, 'cans', 562.50, '2027-11-01', 'shelf', 1, '0012345000221', 120, 'available'),
        ('Black Beans (15oz)', 'canned', 'donated', 450, 'cans', 421.88, '2028-02-01', 'shelf', 1, '0012345000232', 100, 'available'),
        ('Canned Mixed Vegetables (15oz)', 'canned', 'purchased', 350, 'cans', 328.13, '2027-08-15', 'shelf', 4, '0012345000243', 80, 'available'),
        ('Canned Peaches in Juice (15oz)', 'canned', 'donated', 275, 'cans', 257.81, '2027-10-01', 'shelf', 1, '0012345000254', 60, 'available'),
        ('Expired Canned Corn (15oz)', 'canned', 'donated', 45, 'cans', 42.19, '2026-01-15', 'shelf', 4, '0012345000265', 0, 'expired')
    `);
    console.log('  Inventory seeded');

    // --- Visits ---
    await client.query(`
      INSERT INTO visits (client_id, visit_date, distribution_type, items_received, weight_lbs, notes, served_by) VALUES
        (1, '2026-01-10 09:30:00', 'shopping', 'Rice, beans, chicken, apples, milk, cereal', 28.50, 'Family of 5, full shopping', 'Maria Torres'),
        (3, '2026-01-10 10:15:00', 'shopping', 'Rice, lentils, halal chicken, yogurt, bread, bananas', 32.00, 'Large family, halal items provided', 'Sarah Mitchell'),
        (5, '2026-01-12 14:00:00', 'pre-packed', 'Standard family box - mixed items', 22.00, 'Pre-packed box, first visit', 'James Rodriguez'),
        (2, '2026-01-15 11:00:00', 'delivery', 'Canned soup, bread, milk, cheese, canned vegetables', 18.00, 'Homebound delivery, left at door', 'Derek Simmons'),
        (8, '2026-01-18 09:00:00', 'shopping', 'Beans, rice, tortillas, lettuce, tomatoes, yogurt', 35.00, 'Vegetarian selections for household of 6', 'Maria Torres'),
        (4, '2026-01-20 10:30:00', 'delivery', 'Soft canned goods, milk, yogurt, bananas, soup', 15.50, 'Senior delivery, all soft/easy-open items', 'Tom Bradley'),
        (10, '2026-01-22 13:45:00', 'shopping', 'Rice, chicken, onions, potatoes, cooking oil, bread', 26.00, NULL, 'Angela Torres'),
        (6, '2026-02-01 09:15:00', 'pre-packed', 'Gluten-free box - rice, beans, meat, produce', 24.00, 'Gluten-free accommodations made', 'Sarah Mitchell'),
        (12, '2026-02-03 10:00:00', 'shopping', 'Large family selection - full cart', 48.00, 'Household of 8, maximum allotment', 'Maria Torres'),
        (14, '2026-02-05 11:30:00', 'shopping', 'Halal chicken, rice, lentils, milk, cereal, apples', 30.00, 'Halal items, family of 5', 'James Rodriguez'),
        (7, '2026-02-08 14:00:00', 'delivery', 'Standard delivery box plus extra protein', 22.50, 'Wheelchair accessible delivery, extra protein per request', 'Derek Simmons'),
        (16, '2026-02-12 09:30:00', 'shopping', 'Chicken, rice, beans, bread, peanut butter, juice', 25.00, 'Single father, 3 kids, evening pickup arranged', 'Tom Bradley'),
        (9, '2026-02-15 10:00:00', 'delivery', 'Diabetic-friendly box: low-sugar, whole grain items', 16.00, 'Senior delivery, diabetic diet', 'Derek Simmons'),
        (11, '2026-02-20 13:00:00', 'shopping', 'Nut-free selections, milk, bread, chicken, vegetables', 27.00, 'Strict nut-free due to child allergy', 'Sarah Mitchell'),
        (15, '2026-03-01 09:45:00', 'pre-packed', 'GF/DF specialty box - rice milk, GF pasta, fresh produce', 20.00, 'Celiac-safe items double-checked', 'Maria Torres'),
        (18, '2026-03-05 11:00:00', 'shopping', 'Basic necessities - canned goods, bread, peanut butter', 14.00, 'Currently experiencing homelessness, shelter resident', 'James Rodriguez'),
        (19, '2026-03-08 10:30:00', 'shopping', 'Vegetarian: beans, rice, tortillas, cheese, produce', 29.00, 'Spanish-language service provided', 'Maria Torres'),
        (20, '2026-03-10 14:15:00', 'pre-packed', 'Recovery care package - high protein, easy prep items', 18.00, 'Post-surgery, needs easy-to-prepare meals', 'Angela Torres'),
        (13, '2026-03-15 10:00:00', 'delivery', 'Soft foods box - pudding, soup, canned fruit, milk', 12.00, 'All soft items per dietary needs', 'Derek Simmons'),
        (17, '2026-03-18 09:30:00', 'shopping', 'Diabetic-friendly: whole grains, lean protein, produce', 23.00, 'Ukrainian family, interpreter assisted', 'Sarah Mitchell')
    `);
    console.log('  Visits seeded');

    // --- Distributions ---
    await client.query(`
      INSERT INTO distributions (name, date, type, location, max_clients, registered_count, status, notes) VALUES
        ('Weekly Shopping - Jan Week 2', '2026-01-10 09:00:00', 'shopping', 'Main Distribution Center', 80, 72, 'completed', 'Smooth operation, good volunteer turnout'),
        ('Senior Box Delivery - January', '2026-01-15 08:00:00', 'delivery', 'Routes A through D', 40, 38, 'completed', 'Two clients not home, left at door'),
        ('MLK Day Community Distribution', '2026-01-19 10:00:00', 'pre-packed', 'Lincoln Park Community Center', 150, 148, 'completed', 'Record turnout, almost ran out of produce'),
        ('Weekly Shopping - Jan Week 4', '2026-01-24 09:00:00', 'shopping', 'Main Distribution Center', 80, 65, 'completed', 'Lower turnout due to snowstorm'),
        ('Mobile Pantry - East Side', '2026-02-01 11:00:00', 'mobile', 'East Side Community Center Parking Lot', 100, 95, 'completed', 'Served 95 families, great community response'),
        ('Weekly Shopping - Feb Week 2', '2026-02-14 09:00:00', 'shopping', 'Main Distribution Center', 80, 78, 'completed', 'Valentine''s Day, included dessert items'),
        ('Refugee Family Distribution', '2026-02-20 10:00:00', 'pre-packed', 'Refugee Services Center', 30, 28, 'completed', 'Culturally appropriate items, interpreters present'),
        ('Senior Box Delivery - March', '2026-03-15 08:00:00', 'delivery', 'Routes A through D', 40, 36, 'completed', 'Spring weather, all deliveries successful'),
        ('Weekly Shopping - Mar Week 3', '2026-03-21 09:00:00', 'shopping', 'Main Distribution Center', 80, 44, 'in-progress', 'Currently ongoing'),
        ('Mobile Pantry - West County', '2026-03-28 11:00:00', 'mobile', 'Rochester Community Park', 80, 52, 'scheduled', 'Targeting rural underserved area'),
        ('Easter Weekend Distribution', '2026-04-04 09:00:00', 'pre-packed', 'Main Distribution Center', 200, 120, 'scheduled', 'Holiday boxes with ham and fixings'),
        ('School Backpack Program Packing', '2026-04-10 15:00:00', 'pre-packed', 'School District Hub', 300, 0, 'scheduled', 'Weekend backpack packing for spring semester'),
        ('Veterans Appreciation Distribution', '2026-04-18 10:00:00', 'shopping', 'Veterans Hall Storage', 50, 15, 'scheduled', 'Special event for veteran families'),
        ('Mobile Pantry - North Side', '2026-04-25 11:00:00', 'mobile', 'North Side Annex Parking Lot', 100, 0, 'scheduled', 'Monthly north district mobile pantry'),
        ('Senior Box Delivery - April', '2026-04-15 08:00:00', 'delivery', 'Routes A through D', 40, 22, 'scheduled', 'Spring deliveries, check on garden program interest')
    `);
    console.log('  Distributions seeded');

    // --- Food Drives ---
    await client.query(`
      INSERT INTO food_drives (name, organizer, start_date, end_date, goal_lbs, collected_lbs, location, status, donation_count, notes) VALUES
        ('Holiday Hope Food Drive 2025', 'Springfield Rotary Club', '2025-11-15', '2025-12-31', 25000.00, 27500.00, 'City-wide collection points', 'completed', 342, 'Exceeded goal by 10%, best year yet'),
        ('Thanksgiving Turkey Drive', 'First Presbyterian Church', '2025-11-01', '2025-11-25', 5000.00, 4800.00, 'First Presbyterian Church', 'completed', 156, 'Collected 200 turkeys and sides for complete meals'),
        ('Souper Bowl Sunday', 'Springfield Interfaith Council', '2026-02-08', '2026-02-08', 3000.00, 3200.00, 'Multiple houses of worship', 'completed', 89, 'One-day collection, great participation across 15 congregations'),
        ('Spring Clean Your Pantry Drive', 'Springfield Junior League', '2026-03-01', '2026-03-31', 8000.00, 5200.00, 'Main Distribution Center', 'active', 134, 'On track for goal, social media campaign boosting donations'),
        ('Back to School Food Drive', 'Springfield School District', '2026-07-15', '2026-08-20', 15000.00, 0.00, 'All district schools', 'planned', 0, 'Backpack program stocking for fall semester'),
        ('Summer Meals Initiative', 'Parks & Recreation Dept', '2026-06-01', '2026-08-15', 20000.00, 0.00, 'City parks and recreation centers', 'planned', 0, 'Addresses summer hunger gap for school-age children'),
        ('Letter Carriers Food Drive', 'NALC Branch 80', '2026-05-10', '2026-05-10', 12000.00, 0.00, 'All Springfield postal routes', 'planned', 0, 'National Stamp Out Hunger day, second Saturday in May'),
        ('Corporate Challenge 2026', 'Chamber of Commerce', '2026-04-01', '2026-04-30', 30000.00, 0.00, 'Corporate Partner Dock', 'planned', 0, 'Competition among local businesses for most lbs donated'),
        ('Harvest Festival Drive', 'Local Harvest Farm', '2025-10-01', '2025-10-31', 10000.00, 11200.00, 'Local Harvest Farm', 'completed', 67, 'Farm-fresh produce gleaning event, community volunteers'),
        ('Canned Food Week', 'Springfield Public Library', '2026-03-10', '2026-03-17', 2000.00, 1850.00, 'All library branches', 'completed', 210, 'Fine forgiveness for canned food donations'),
        ('Marathon Food Mile', 'Springfield Road Runners', '2026-04-20', '2026-04-20', 5000.00, 0.00, 'Washington Park', 'planned', 0, 'Donate 1 lb per race mile, tied to Springfield Marathon'),
        ('Scouts Community Service Drive', 'Boy Scouts Troop 42', '2026-02-15', '2026-03-15', 3000.00, 2100.00, 'Neighborhood door-to-door', 'active', 78, 'Eagle Scout project, neighborhood canvassing'),
        ('Restaurant Week Plate Drive', 'Springfield Restaurant Association', '2026-05-01', '2026-05-07', 4000.00, 0.00, 'Participating restaurants', 'planned', 0, '$1 per plate donated to food bank'),
        ('University Move-Out Collection', 'UIS Student Government', '2026-05-15', '2026-05-20', 6000.00, 0.00, 'University of Illinois Springfield campus', 'planned', 0, 'Collect non-perishables from departing students'),
        ('Emergency Winter Weather Drive', 'Red Cross Springfield Chapter', '2026-01-05', '2026-01-20', 5000.00, 5500.00, 'Emergency shelters city-wide', 'completed', 98, 'Activated due to polar vortex, strong community response')
    `);
    console.log('  Food drives seeded');

    // --- Volunteers ---
    await client.query(`
      INSERT INTO volunteers (name, email, phone, role, availability, skills, background_check, emergency_contact, total_hours, status, start_date, notes) VALUES
        ('Maria Torres', 'mtorres@email.com', '(217) 555-3001', 'front desk', 'Mon/Wed/Fri 8am-12pm', 'Bilingual Spanish-English, customer service', true, 'Jorge Torres (217) 555-3101', 320.00, 'active', '2024-03-15', 'Lead bilingual volunteer, excellent with clients'),
        ('David Park', 'dpark@email.com', '(217) 555-3002', 'warehouse', 'Tue/Thu 9am-2pm', 'Forklift certified, inventory management', true, 'Susan Park (217) 555-3102', 280.00, 'active', '2024-05-01', 'Former logistics manager, great with organization'),
        ('Emily Watson', 'ewatson@email.com', '(217) 555-3003', 'sorter', 'Sat 8am-1pm', 'Food safety knowledge, attention to detail', true, 'Mark Watson (217) 555-3103', 150.00, 'active', '2024-09-10', 'Retired food inspector, checks quality carefully'),
        ('Ahmed Yusuf', 'ayusuf@email.com', '(217) 555-3004', 'driver', 'Mon-Fri 7am-3pm', 'CDL Class B, refrigerated vehicle experience', true, 'Halima Yusuf (217) 555-3104', 450.00, 'active', '2023-11-20', 'Full-time driver, handles homebound deliveries'),
        ('Rachel Green', 'rgreen@email.com', '(217) 555-3005', 'intake specialist', 'Mon/Wed 1pm-5pm', 'Social work background, empathetic listener', true, 'Ben Green (217) 555-3105', 200.00, 'active', '2024-06-01', 'BSW degree, does client intake and referrals'),
        ('Kevin O''Brien', 'kobrien@email.com', '(217) 555-3006', 'warehouse', 'Sat/Sun 7am-12pm', 'Heavy lifting, stocking, inventory', true, 'Molly O''Brien (217) 555-3106', 175.00, 'active', '2024-08-15', 'Weekend warrior, very reliable'),
        ('Priya Sharma', 'psharma@email.com', '(217) 555-3007', 'data entry', 'Tue/Thu 10am-2pm', 'Database management, Excel, typing 80 WPM', true, 'Raj Sharma (217) 555-3107', 220.00, 'active', '2024-04-20', 'Handles donation logging and client records'),
        ('Carlos Mendoza', 'cmendoza@email.com', '(217) 555-3008', 'driver', 'Wed/Fri 8am-4pm', 'Class C license, bilingual Spanish', true, 'Ana Mendoza (217) 555-3108', 310.00, 'active', '2024-01-10', 'Mobile pantry driver, great community rapport'),
        ('Lisa Chang', 'lchang@email.com', '(217) 555-3009', 'front desk', 'Mon-Thu 9am-1pm', 'Mandarin speaker, reception, phone skills', true, 'Wei Chang (217) 555-3109', 380.00, 'active', '2023-09-01', 'Trilingual: English, Mandarin, Cantonese'),
        ('Tyler Johnson', 'tjohnson@email.com', '(217) 555-3010', 'sorter', 'Fri 2pm-6pm', 'General volunteer, willing to learn', false, 'Mary Johnson (217) 555-3110', 40.00, 'active', '2025-12-01', 'College student, community service hours'),
        ('Nancy Mitchell', 'nmitchell@email.com', '(217) 555-3011', 'kitchen', 'Mon/Wed/Fri 6am-10am', 'ServSafe certified, meal prep, nutrition', true, 'Sarah Mitchell (217) 555-3111', 290.00, 'active', '2024-02-14', 'Prepares community meals and cooking demos'),
        ('James Lee', 'jlee@email.com', '(217) 555-3012', 'warehouse', 'Flexible weekdays', 'Retired, mechanical aptitude, equipment repair', true, 'Patricia Lee (217) 555-3112', 260.00, 'active', '2024-07-01', 'Retired mechanic, also maintains fleet vehicles'),
        ('Sophia Rodriguez', 'srodriguez@email.com', '(217) 555-3013', 'intake specialist', 'Tue/Thu 1pm-5pm', 'Bilingual, social services knowledge, case management', true, 'Miguel Rodriguez (217) 555-3113', 190.00, 'active', '2024-10-01', 'MSW student, practicum placement'),
        ('Bill Murphy', 'bmurphy@email.com', '(217) 555-3014', 'warehouse', 'Mon-Fri 8am-12pm', 'Veteran, leadership, logistics, team management', true, 'Karen Murphy (217) 555-3114', 400.00, 'active', '2023-06-15', 'Retired Army, manages veterans food assistance'),
        ('Aisha Williams', 'awilliams@email.com', '(217) 555-3015', 'front desk', 'Sat 9am-3pm', 'Customer service, data entry, phone skills', false, 'Jerome Williams (217) 555-3115', 25.00, 'active', '2026-01-15', 'New volunteer, weekend Saturday coverage')
    `);
    console.log('  Volunteers seeded');

    // --- Fleet ---
    await client.query(`
      INSERT INTO fleet (name, type, make, model, year, license_plate, mileage, status, insurance_expiry, last_service, next_service, capacity_lbs, notes) VALUES
        ('Big Blue', 'box-truck', 'Ford', 'E-450 Cutaway', 2022, 'IL FB-1001', 34500, 'available', '2026-09-30', '2026-02-15', '2026-05-15', 6000, 'Primary distribution truck, 16ft box'),
        ('The Chiller', 'refrigerated-truck', 'Isuzu', 'NPR-HD', 2021, 'IL FB-1002', 41200, 'available', '2026-09-30', '2026-03-01', '2026-06-01', 5000, 'Refrigerated/freezer combo unit, dual-temp'),
        ('North Star', 'cargo-van', 'Ford', 'Transit 250', 2023, 'IL FB-1003', 18900, 'available', '2026-12-31', '2026-01-20', '2026-04-20', 3000, 'High-roof cargo van for north district'),
        ('South Runner', 'cargo-van', 'Chevy', 'Express 2500', 2020, 'IL FB-1004', 52300, 'available', '2026-09-30', '2026-02-28', '2026-05-28', 2800, 'South side delivery and mobile pantry support'),
        ('Mobile Pantry Alpha', 'refrigerated-truck', 'Freightliner', 'M2 106', 2019, 'IL FB-1005', 68700, 'available', '2026-09-30', '2026-03-10', '2026-06-10', 8000, 'Mobile pantry unit with fold-out serving sides'),
        ('Little Helper', 'passenger-van', 'Dodge', 'Grand Caravan', 2021, 'IL FB-1006', 29400, 'available', '2026-12-31', '2026-02-01', '2026-05-01', 800, 'Client transport and small pickups'),
        ('The Beast', 'box-truck', 'International', 'MV607', 2020, 'IL FB-1007', 55100, 'in-maintenance', '2026-09-30', '2026-03-18', '2026-06-18', 10000, 'Largest truck, transmission repair in progress'),
        ('West Wind', 'cargo-van', 'Mercedes', 'Sprinter 2500', 2022, 'IL FB-1008', 22100, 'available', '2026-12-31', '2026-03-05', '2026-06-05', 3200, 'West county routes, excellent fuel efficiency'),
        ('Ice Queen', 'refrigerated-van', 'Ford', 'Transit 350 Reefer', 2023, 'IL FB-1009', 15600, 'available', '2026-12-31', '2026-02-10', '2026-05-10', 2500, 'Small refrigerated van for dairy/produce runs'),
        ('Old Faithful', 'box-truck', 'GMC', 'Savana 3500', 2017, 'IL FB-1010', 89200, 'available', '2026-06-30', '2026-01-15', '2026-04-15', 4000, 'Aging but reliable, scheduled for replacement 2027'),
        ('Rescue One', 'cargo-van', 'Ford', 'Transit Connect', 2024, 'IL FB-1011', 8300, 'available', '2027-03-31', '2026-03-01', '2026-09-01', 1500, 'Food rescue pickups from restaurants/grocers'),
        ('Admin Car', 'sedan', 'Toyota', 'Camry', 2022, 'IL FB-1012', 31000, 'available', '2026-09-30', '2026-02-20', '2026-08-20', 400, 'Staff travel, donor meetings, site visits'),
        ('Farm Hauler', 'pickup-truck', 'Ford', 'F-250 Super Duty', 2021, 'IL FB-1013', 38700, 'available', '2026-09-30', '2026-03-12', '2026-06-12', 2000, 'Farm pickup runs, tows flatbed trailer'),
        ('Emergency Unit', 'cargo-van', 'Chevy', 'Express 3500', 2020, 'IL FB-1014', 44800, 'reserved', '2026-09-30', '2026-01-30', '2026-04-30', 3500, 'Reserved for disaster/emergency response'),
        ('Courtesy Shuttle', 'passenger-van', 'Ford', 'Transit Passenger', 2023, 'IL FB-1015', 12400, 'available', '2026-12-31', '2026-02-25', '2026-08-25', 600, 'Client transportation to pantry for homebound/elderly')
    `);
    console.log('  Fleet seeded');

    // --- Delivery Routes ---
    await client.query(`
      INSERT INTO delivery_routes (name, driver, vehicle_id, date, status, stops, total_miles, estimated_time, notes) VALUES
        ('Senior Route A - Downtown', 'Ahmed Yusuf', 2, '2026-03-15', 'completed', '${JSON.stringify([
          { address: '1600 S. 11th St Apt 2A', client_name: 'Dorothy Henderson', items: 'Senior box, soft foods' },
          { address: '302 N. Grand Ave Apt 4B', client_name: 'James Williams', items: 'Standard box, extra protein' },
          { address: '1100 E. Adams St', client_name: 'William Davis', items: 'Diabetic-friendly box' },
          { address: '2400 S. MacArthur Blvd Apt 12', client_name: 'Betty Wilson', items: 'Soft foods box' }
        ])}', 18.50, '2 hours', 'All deliveries successful'),
        ('Senior Route B - South Side', 'Carlos Mendoza', 4, '2026-03-15', 'completed', '${JSON.stringify([
          { address: '3100 S. Grand Ave', client_name: 'Robert Jackson', items: 'Wheelchair accessible delivery, extra protein' },
          { address: '2600 S. 6th St', client_name: 'Rosa Hernandez', items: 'Vegetarian family box' }
        ])}', 12.30, '1.5 hours', 'Both clients home, smooth deliveries'),
        ('Mobile Pantry - East Side', 'Ahmed Yusuf', 5, '2026-02-01', 'completed', '${JSON.stringify([
          { address: '2100 E. Cook St (Community Center)', client_name: 'OPEN DISTRIBUTION', items: '95 family boxes distributed' }
        ])}', 8.00, '4 hours', 'Served 95 families at east side location'),
        ('Restaurant Rescue Run', 'Carlos Mendoza', 11, '2026-03-20', 'completed', '${JSON.stringify([
          { address: '220 S. 5th St', client_name: 'Giovanni Restaurant', items: 'Pickup: prepared meals, surplus pasta' },
          { address: '2501 Wabash Ave', client_name: 'Panera Bread', items: 'Pickup: end-of-day bread and pastries' },
          { address: '1200 Commerce Blvd', client_name: 'Main Distribution Center', items: 'Dropoff: all rescued food' }
        ])}', 14.20, '1.5 hours', 'Daily food rescue route'),
        ('Farm Pickup - Local Harvest', 'Ahmed Yusuf', 13, '2026-03-18', 'completed', '${JSON.stringify([
          { address: '8800 Old Jacksonville Rd', client_name: 'Local Harvest Farm', items: 'Pickup: 500 lbs seasonal produce' },
          { address: '1200 Commerce Blvd', client_name: 'Main Distribution Center', items: 'Dropoff: produce to cooler' }
        ])}', 32.00, '2 hours', 'Early spring greens and root vegetables'),
        ('Grocery Rescue - Daily', 'Carlos Mendoza', 9, '2026-03-22', 'completed', '${JSON.stringify([
          { address: '2700 N. Dirksen Pkwy', client_name: 'Schnucks Markets', items: 'Pickup: bakery, produce, dairy near-date' },
          { address: '3147 S. 6th St', client_name: 'ALDI Store #47', items: 'Pickup: produce and bakery items' },
          { address: '1200 Commerce Blvd', client_name: 'Main Distribution Center', items: 'Dropoff: all items to receiving' }
        ])}', 16.80, '2 hours', 'Daily grocery rescue circuit'),
        ('Senior Route A - April', 'Ahmed Yusuf', 2, '2026-04-15', 'scheduled', '${JSON.stringify([
          { address: '1600 S. 11th St Apt 2A', client_name: 'Dorothy Henderson', items: 'Senior box, soft foods' },
          { address: '302 N. Grand Ave Apt 4B', client_name: 'James Williams', items: 'Standard box' },
          { address: '1100 E. Adams St', client_name: 'William Davis', items: 'Diabetic-friendly box' },
          { address: '2400 S. MacArthur Blvd Apt 12', client_name: 'Betty Wilson', items: 'Soft foods box' }
        ])}', 18.50, '2 hours', 'Monthly senior delivery'),
        ('West County Rural Delivery', 'Carlos Mendoza', 8, '2026-03-28', 'scheduled', '${JSON.stringify([
          { address: '7800 W. Wabash Ave, Rochester', client_name: 'West County Depot', items: 'Load mobile pantry supplies' },
          { address: 'Rochester Community Park', client_name: 'OPEN DISTRIBUTION', items: 'Mobile pantry setup and serve' }
        ])}', 28.00, '4 hours', 'Monthly west county mobile pantry'),
        ('Corporate Dock Pickup', 'Ahmed Yusuf', 1, '2026-03-25', 'scheduled', '${JSON.stringify([
          { address: '3000 S. Dirksen Pkwy', client_name: 'Walmart Distribution', items: 'Pickup: weekly donation pallet' },
          { address: '500 Industrial Park Dr', client_name: 'Corporate Partner Dock', items: 'Pickup: Sysco surplus' },
          { address: '1200 Commerce Blvd', client_name: 'Main Distribution Center', items: 'Dropoff: warehouse receiving' }
        ])}', 22.00, '3 hours', 'Weekly corporate donation pickup'),
        ('Emergency Shelter Resupply', 'Ahmed Yusuf', 14, '2026-03-20', 'completed', '${JSON.stringify([
          { address: '200 N. 11th St', client_name: 'Salvation Army Shelter', items: 'Emergency food supplies, 500 lbs' },
          { address: '1015 E. Madison St', client_name: 'Helping Hands Mission', items: 'Emergency food supplies, 350 lbs' }
        ])}', 9.00, '1.5 hours', 'Emergency resupply after cold snap'),
        ('School Backpack Delivery', 'Carlos Mendoza', 3, '2026-03-21', 'in-progress', '${JSON.stringify([
          { address: '1900 W. Monroe St', client_name: 'School District Hub', items: 'Load 150 backpack boxes' },
          { address: '200 S. Lincoln Ave', client_name: 'Lincoln Elementary', items: 'Deliver 50 backpack boxes' },
          { address: '1500 N. 5th St', client_name: 'Jefferson Middle School', items: 'Deliver 50 backpack boxes' },
          { address: '2200 E. Ash St', client_name: 'Southeast High School', items: 'Deliver 50 backpack boxes' }
        ])}', 15.00, '3 hours', 'Friday backpack program delivery'),
        ('Refugee Center Resupply', 'Ahmed Yusuf', 9, '2026-03-24', 'scheduled', '${JSON.stringify([
          { address: '1200 Commerce Blvd', client_name: 'Main Distribution Center', items: 'Load culturally appropriate food boxes' },
          { address: '415 N. 6th St', client_name: 'Refugee Services Center', items: 'Deliver 30 family boxes' }
        ])}', 6.00, '1 hour', 'Biweekly refugee center resupply'),
        ('Veterans Outreach Delivery', 'Carlos Mendoza', 4, '2026-04-18', 'planned', '${JSON.stringify([
          { address: '1120 S. 5th St', client_name: 'Veterans Hall', items: 'Load special veterans distribution supplies' },
          { address: '3100 S. Grand Ave', client_name: 'Robert Jackson (veteran)', items: 'Home delivery, special event box' }
        ])}', 10.00, '1.5 hours', 'Veterans appreciation week deliveries'),
        ('North Side Mobile Pantry', 'Ahmed Yusuf', 5, '2026-04-25', 'planned', '${JSON.stringify([
          { address: '1200 Commerce Blvd', client_name: 'Main Distribution Center', items: 'Load mobile pantry: 100 family shares' },
          { address: '450 N. Maple Ave', client_name: 'North Side Annex', items: 'Mobile pantry distribution' }
        ])}', 12.00, '4 hours', 'Monthly north district mobile pantry'),
        ('Easter Distribution Prep', 'Carlos Mendoza', 1, '2026-04-03', 'planned', '${JSON.stringify([
          { address: '3000 S. Dirksen Pkwy', client_name: 'Walmart Distribution', items: 'Pickup: holiday donation (hams, sides)' },
          { address: '500 Industrial Park Dr', client_name: 'Corporate Partner Dock', items: 'Pickup: Sysco holiday surplus' },
          { address: '1200 Commerce Blvd', client_name: 'Main Distribution Center', items: 'Dropoff: Easter distribution staging' }
        ])}', 22.00, '3 hours', 'Easter weekend distribution preparation')
    `);
    console.log('  Delivery routes seeded');

    // --- Partners ---
    await client.query(`
      INSERT INTO partners (name, type, address, contact_name, contact_email, contact_phone, service_area, clients_served, status, agreement_date, notes) VALUES
        ('Hope Community Pantry', 'pantry', '900 S. 9th St, Springfield, IL 62703', 'Linda Marsh', 'lmarsh@hopepantry.org', '(217) 555-4001', 'South Springfield', 450, 'active', '2023-01-15', 'Weekly distribution partner, receives bulk deliveries'),
        ('Salvation Army Springfield', 'shelter', '200 N. 11th St, Springfield, IL 62703', 'Captain Mark Reynolds', 'mreynolds@salvationarmy.org', '(217) 555-4002', 'City-wide', 800, 'active', '2022-06-01', 'Emergency meals and shelter food service'),
        ('First United Methodist Church', 'church', '600 Capitol Ave, Springfield, IL 62701', 'Rev. David Okonkwo', 'dokonkwo@fumcspringfield.org', '(217) 555-4003', 'Downtown', 200, 'active', '2023-03-20', 'Monthly community dinner and weekly pantry'),
        ('Lincoln Elementary School', 'school', '200 S. Lincoln Ave, Springfield, IL 62704', 'Principal Amy Cho', 'acho@sps186.org', '(217) 555-4004', 'West Springfield', 120, 'active', '2024-08-15', 'Weekend backpack program, school pantry closet'),
        ('East Side Community Center', 'community-center', '2100 E. Cook St, Springfield, IL 62703', 'Director James Ford', 'jford@eastsidecc.org', '(217) 555-4005', 'East Springfield', 350, 'active', '2023-09-01', 'Mobile pantry host site, after-school meals'),
        ('Helping Hands Mission', 'shelter', '1015 E. Madison St, Springfield, IL 62702', 'Pastor Ruth Williams', 'rwilliams@helpinghands.org', '(217) 555-4006', 'Downtown', 600, 'active', '2022-11-01', 'Daily meals program, overnight shelter pantry'),
        ('Catholic Charities Springfield', 'social-services', '1625 W. Washington St, Springfield, IL 62702', 'Sister Agnes Park', 'apark@ccspringfield.org', '(217) 555-4007', 'County-wide', 550, 'active', '2022-03-15', 'Refugee resettlement food support, emergency assistance'),
        ('Rochester Community Food Shelf', 'pantry', '101 E. Main St, Rochester, IL 62563', 'Donna Peters', 'dpeters@rochesterfoodshelf.org', '(217) 555-4008', 'West Sangamon County', 180, 'active', '2024-01-10', 'Rural satellite pantry partner'),
        ('Springfield Urban League', 'social-services', '100 N. 11th St, Springfield, IL 62703', 'Director Michael Banks', 'mbanks@springfieldurbanleague.org', '(217) 555-4009', 'City-wide', 300, 'active', '2023-07-01', 'Job training program includes nutrition education'),
        ('Kumler Outreach Ministries', 'church', '501 E. Jackson St, Springfield, IL 62701', 'Director Ellen Price', 'eprice@kumleroutreach.org', '(217) 555-4010', 'Central Springfield', 400, 'active', '2022-01-01', 'Daily soup kitchen, weekly pantry, clothing closet'),
        ('VFW Post 755', 'veterans', '1120 S. 5th St, Springfield, IL 62703', 'Commander Bill Murphy', 'bmurphy@vfwpost755.org', '(217) 555-4011', 'County-wide veterans', 150, 'active', '2023-05-01', 'Veterans food assistance and referral program'),
        ('Senior Services of Illinois', 'senior-services', '2200 S. 11th St, Springfield, IL 62703', 'Director Dorothy Franklin', 'dfranklin@seniorservicesil.org', '(217) 555-4012', 'County-wide seniors', 280, 'active', '2022-09-01', 'Meals on Wheels partner, congregate meals'),
        ('Boys & Girls Club Springfield', 'youth', '300 N. 5th St, Springfield, IL 62701', 'Director Tony Reeves', 'treeves@bgcspringfield.org', '(217) 555-4013', 'City-wide youth', 220, 'active', '2024-02-01', 'After-school snacks and summer meals'),
        ('Sangamon County Health Dept', 'government', '2833 S. Grand Ave East, Springfield, IL 62703', 'Nutritionist Kim Lee', 'klee@sangamonhealth.org', '(217) 555-4014', 'County-wide', 0, 'active', '2023-04-15', 'WIC referrals, nutrition education co-programming'),
        ('Habitat for Humanity Springfield', 'nonprofit', '2744 S. 6th St, Springfield, IL 62703', 'Director Sam Cooper', 'scooper@habitatspringfield.org', '(217) 555-4015', 'City-wide', 100, 'active', '2024-06-01', 'New homeowner welcome boxes, build day meal support')
    `);
    console.log('  Partners seeded');

    // --- Grants ---
    await client.query(`
      INSERT INTO grants (name, grantor, amount, start_date, end_date, status, category, requirements, reporting_frequency, contact_name, contact_email, notes) VALUES
        ('TEFAP - The Emergency Food Assistance Program', 'USDA', 185000.00, '2025-10-01', '2026-09-30', 'active', 'federal', 'USDA commodity distribution, income-eligible clients, monthly reporting', 'monthly', 'Janet Morris', 'jmorris@usda.gov', 'Primary federal commodity program, covers storage and distribution costs'),
        ('FEMA Emergency Food and Shelter Program', 'FEMA', 75000.00, '2026-01-01', '2026-12-31', 'active', 'federal', 'Emergency food services, documentation of meals served', 'quarterly', 'Regional Coordinator', 'efsp@fema.gov', 'Phase 41 funding for emergency meal services'),
        ('Illinois State Food Bank Grant', 'Illinois Dept of Human Services', 120000.00, '2025-07-01', '2026-06-30', 'active', 'state', 'Quarterly reports, client data tracking, food safety compliance', 'quarterly', 'Robert Liu', 'rliu@illinois.gov', 'Core state funding for operations'),
        ('Community Foundation General Operating', 'Community Foundation of Greater Metro', 50000.00, '2026-01-01', '2026-12-31', 'active', 'private-foundation', 'Annual report, site visit, outcome metrics', 'annual', 'Rebecca Thornton', 'rthornton@cfgm.org', 'Unrestricted operating support'),
        ('Feeding America Network Grant', 'Feeding America', 95000.00, '2025-10-01', '2026-09-30', 'active', 'national-nonprofit', 'Network compliance, food sourcing targets, client survey', 'quarterly', 'Amanda Foster', 'afoster@feedingamerica.org', 'Network member capacity building grant'),
        ('Walmart Foundation Community Grant', 'Walmart Foundation', 35000.00, '2026-03-01', '2027-02-28', 'active', 'corporate', 'Hunger relief programming, volunteer engagement metrics', 'semi-annual', 'Grants Department', 'grants@walmart.org', 'Local facility improvement and refrigeration'),
        ('CDBG - Community Development Block Grant', 'City of Springfield', 40000.00, '2025-10-01', '2026-09-30', 'active', 'municipal', 'Serve low-income census tracts, quarterly outcome data', 'quarterly', 'Planning Dept', 'cdbg@springfield.il.us', 'Facility maintenance and mobile pantry operations'),
        ('USDA Farm to Food Bank Grant', 'USDA Agricultural Marketing Service', 60000.00, '2026-06-01', '2027-05-31', 'approved', 'federal', 'Purchase from local farmers, track farm partnerships, produce distribution data', 'quarterly', 'Farm Programs Office', 'farmtofoodbank@usda.gov', 'New grant for local produce purchasing program'),
        ('United Way Community Impact Grant', 'United Way of Central Illinois', 45000.00, '2026-01-01', '2026-12-31', 'active', 'nonprofit', 'Focus on childhood hunger, school program metrics', 'quarterly', 'Sarah Lawson', 'slawson@uwci.org', 'Funds backpack program and school pantries'),
        ('Blue Cross Blue Shield Health Equity Grant', 'BCBS of Illinois Foundation', 30000.00, '2026-04-01', '2027-03-31', 'approved', 'corporate', 'Health outcomes tracking, nutrition education component required', 'semi-annual', 'Health Programs', 'grants@bcbsil.com', 'Diabetic and heart-healthy food box program'),
        ('Sangamon County Human Services Fund', 'Sangamon County Board', 25000.00, '2025-12-01', '2026-11-30', 'active', 'county', 'County resident services, demographic reporting', 'quarterly', 'County Administrator', 'humanservices@sangamon.gov', 'General operations within county'),
        ('Anonymous Donor Endowment Income', 'Anonymous', 15000.00, '2026-01-01', '2026-12-31', 'active', 'endowment', 'Per endowment agreement, capacity building only', 'annual', 'Board Treasurer', 'treasurer@foodbank.org', 'Annual income from restricted endowment'),
        ('Capital Campaign - Cold Storage Expansion', 'Multiple Donors', 500000.00, '2025-06-01', '2026-12-31', 'active', 'capital', 'Construction milestones, donor recognition, progress updates', 'monthly', 'Capital Campaign Chair', 'campaign@foodbank.org', 'Expanding freezer/cooler capacity by 5000 sqft'),
        ('AmeriCorps VISTA Placement', 'Corporation for National and Community Service', 28000.00, '2025-09-01', '2026-08-31', 'active', 'federal', 'VISTA member supervision, capacity building focus, prohibited from direct service', 'quarterly', 'VISTA Program Office', 'vista@americorps.gov', 'One VISTA member for data systems and volunteer coordination'),
        ('Summer Meals Grant', 'Illinois State Board of Education', 42000.00, '2026-05-15', '2026-08-31', 'applied', 'state', 'SFSP compliance, meal pattern requirements, site eligibility documentation', 'monthly', 'Child Nutrition Dept', 'sfsp@isbe.net', 'Applied for 8 summer meal sites across Springfield')
    `);
    console.log('  Grants seeded');

    // --- Financial Donations ---
    await client.query(`
      INSERT INTO financial_donations (donor_id, amount, date, method, designation, tax_receipt_number, tax_receipt_sent, notes) VALUES
        (4, 25000.00, '2026-01-15', 'check', 'general operating', 'TR-2026-0001', true, 'Q1 disbursement from Community Foundation'),
        (14, 25000.00, '2025-12-28', 'wire', 'general operating', 'TR-2025-0412', true, 'Annual year-end gift from Chen family'),
        (1, 15000.00, '2026-02-01', 'check', 'capital campaign', 'TR-2026-0015', true, 'Walmart Foundation local community match'),
        (10, 5000.00, '2026-01-20', 'check', 'holiday program', 'TR-2026-0008', true, 'Rotary Club holiday drive proceeds'),
        (7, 250.00, '2026-01-10', 'cash', 'general operating', 'TR-2026-0003', true, 'Monthly donation from Margaret Sullivan'),
        (7, 250.00, '2026-02-10', 'cash', 'general operating', 'TR-2026-0020', true, 'Monthly donation from Margaret Sullivan'),
        (7, 250.00, '2026-03-10', 'cash', 'general operating', 'TR-2026-0035', true, 'Monthly donation from Margaret Sullivan'),
        (4, 50000.00, '2026-03-01', 'wire', 'capital campaign', 'TR-2026-0030', true, 'Capital campaign major gift - cold storage expansion'),
        (11, 10000.00, '2026-01-30', 'check', 'general operating', 'TR-2026-0012', true, 'Sysco community giving program'),
        (13, 2500.00, '2026-02-14', 'online', 'backpack program', 'TR-2026-0022', true, 'First Presbyterian Valentine''s giving campaign'),
        (10, 3000.00, '2026-03-15', 'check', 'summer meals', 'TR-2026-0033', true, 'Rotary Club quarterly contribution'),
        (15, 7500.00, '2026-01-25', 'check', 'general operating', 'TR-2026-0010', true, 'Midwest Food Rescue Alliance partnership support'),
        (6, 5000.00, '2026-02-28', 'check', 'dairy program', 'TR-2026-0025', true, 'Prairie Farms community giving - supports dairy distribution'),
        (14, 1000.00, '2026-03-05', 'online', 'refugee services', 'TR-2026-0031', true, 'Directed gift for refugee family food support'),
        (4, 10000.00, '2026-02-15', 'wire', 'childhood hunger', 'TR-2026-0021', false, 'Community Foundation special initiative'),
        (1, 2000.00, '2026-03-01', 'check', 'general operating', 'TR-2026-0029', false, 'Walmart store-level giving'),
        (10, 500.00, '2026-02-08', 'cash', 'souper bowl', 'TR-2026-0018', true, 'Souper Bowl Sunday special collection'),
        (5, 3500.00, '2026-01-05', 'check', 'general operating', 'TR-2026-0002', true, 'Schnucks quarterly community support'),
        (8, 1500.00, '2026-02-20', 'check', 'general operating', 'TR-2026-0023', true, 'ALDI corporate giving program'),
        (9, 500.00, '2026-03-18', 'online', 'general operating', 'TR-2026-0036', false, 'Panera Bread community fund')
    `);
    console.log('  Financial donations seeded');

    console.log('\nDatabase seeded successfully!');
    console.log('Tables created: users, warehouses, clients, donors, inventory, visits, distributions, food_drives, volunteers, fleet, delivery_routes, partners, grants, financial_donations');
    console.log('Login credentials:');
    console.log('  admin@foodbank.org / password123');
    console.log('  manager@foodbank.org / password123');
  } catch (err) {
    console.error('Seed error:', err);
    throw err;
  } finally {
    client.release();
    pool.end();
  }
}

seed();
