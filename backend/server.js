const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// ─── Env validation ───────────────────────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET', 'OPENROUTER_API_KEY'];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length > 0) {
  console.error(`[FATAL] Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const db = require('./db');

// ─── DB auto-init: create tables if they don't exist ─────────────────────────
async function initDb() {
  try {
    await db.query(`
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

      CREATE TABLE IF NOT EXISTS ai_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        endpoint VARCHAR(100),
        input_data JSONB,
        result TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Warn if DB is completely empty
    const { rows } = await db.query('SELECT COUNT(*) as cnt FROM users');
    if (parseInt(rows[0].cnt, 10) === 0) {
      console.warn('[WARN] Database tables are empty. Run "npm run seed" to populate with demo data.');
    }

    console.log('[DB] Schema verified / tables ready.');
  } catch (err) {
    console.error('[FATAL] DB init failed:', err.message);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.BACKEND_PORT || 4000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || `http://localhost:${process.env.FRONTEND_PORT || 3000}`,
  credentials: true,
}));
app.use(express.json());

// Auth middleware
const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/auth')) return next();
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.use('/api', authMiddleware);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/distributions', require('./routes/distributions'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/food-drives', require('./routes/foodDrives'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/delivery-routes', require('./routes/deliveryRoutes'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/grants', require('./routes/grants'));
app.use('/api/donations', require('./routes/donations'));
app.use('/api/fleet', require('./routes/fleet'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/ai-results', require('./routes/aiResults'));
// Apply pass 5 — additive route registrations.
app.use('/api/eligibility', require('./routes/eligibility'));
app.use('/api/sensors', require('./routes/sensors'));
app.use('/api/mobile-portal', require('./routes/mobilePortal'));
app.use('/api/training', require('./routes/training'));
app.use('/api/impact-reports', require('./routes/impactReports'));
app.use('/api/realtime-dashboard', require('./routes/realtimeDashboard'));
app.use('/api/agentic-director', require('./routes/agenticDirector'));
app.use('/api/realtime-inventory', require('./routes/realtimeInventory'));
app.use('/api/donor-experience', require('./routes/donorExperience'));
app.use('/api/needs-assessment', require('./routes/needsAssessment'));
app.use('/api/volunteer-training', require('./routes/volunteerTraining'));
app.use('/api/supply-transparency', require('./routes/supplyTransparency'));
app.use('/api/client-mobile', require('./routes/clientMobileApp'));
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/pantry-allocation', require('./routes/pantryAllocation'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

initDb().then(() => {
  
// === Batch 03 Gaps & Frontend Mounts ===
try {
  const _batch03 = require('./routes/batch03Gaps');
  if (typeof authenticateToken === 'function') app.use('/api', authenticateToken, _batch03);
  else app.use('/api', _batch03);
} catch (_e) { /* batch03 gap routes optional */ }

app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});
