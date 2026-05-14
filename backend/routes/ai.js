const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { callOpenRouter } = require('../openrouter');
const { aiRateLimiter } = require('../middleware/rateLimiter');

// ─── Apply pass 4 helper: 503 when OPENROUTER_API_KEY is missing ─────────────
class AIKeyMissingError extends Error {
  constructor() { super('AI not configured: OPENROUTER_API_KEY is missing'); this.code = 'AI_KEY_MISSING'; }
}
async function callOpenRouterStrict(messages, opts = {}) {
  if (!process.env.OPENROUTER_API_KEY) throw new AIKeyMissingError();
  return callOpenRouter(messages, opts);
}
function aiErrToStatus(err) { return err && err.code === 'AI_KEY_MISSING' ? 503 : 500; }

// ─── Helper: persist AI result to ai_results table ───────────────────────────
async function persistAIResult(db, { userId, endpoint, inputData, result }) {
  try {
    await db.query(
      `INSERT INTO ai_results (user_id, endpoint, input_data, result, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [userId || null, endpoint, JSON.stringify(inputData || {}), result]
    );
  } catch (err) {
    console.error('[AI] Failed to persist ai_result:', err.message);
  }
}

// ─── Explicit auth middleware for AI routes ───────────────────────────────────
// The global app.use('/api', authMiddleware) in server.js covers /api/ai/*,
// but we add explicit per-route verification here as defense-in-depth so the
// routes are protected even if the file is mounted differently in the future.
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── Validation error handler helper ─────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
};

// ─── POST /donation-appeal ────────────────────────────────────────────────────
router.post(
  '/donation-appeal',
  requireAuth,
  aiRateLimiter,
  [
    body('campaign_name').notEmpty().withMessage('campaign_name is required').trim().escape(),
    body('target_audience').notEmpty().withMessage('target_audience is required').trim().escape(),
    body('goal').notEmpty().withMessage('goal is required'),
    body('tone').optional().isString().trim().escape(),
  ],
  validate,
  async (req, res) => {
    try {
      const { campaign_name, target_audience, goal, tone } = req.body;

      const statsResult = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM clients) as total_clients,
          (SELECT COALESCE(SUM(weight_lbs), 0) FROM inventory WHERE status = 'available') as inventory_lbs,
          (SELECT COUNT(*) FROM visits WHERE visit_date >= date_trunc('month', CURRENT_DATE)) as monthly_visits
      `);
      const stats = statsResult.rows[0];

      const messages = [
        {
          role: 'system',
          content: `You are a professional fundraising copywriter for a food bank. You create compelling, emotionally resonant donation appeals that drive action. Always include specific statistics when available and a clear call to action.`
        },
        {
          role: 'user',
          content: `Write a donation appeal with the following details:

Campaign Name: ${campaign_name}
Target Audience: ${target_audience}
Fundraising Goal: ${goal}
Tone: ${tone || 'compassionate and urgent'}

Current Food Bank Statistics:
- We currently serve ${stats.total_clients} registered clients
- ${stats.monthly_visits} visits this month
- ${stats.inventory_lbs} lbs of food currently in inventory

Please generate:
1. A compelling subject line / headline
2. The main appeal letter (3-4 paragraphs)
3. Three key talking points for social media
4. A suggested email subject line

Format the output with clear section headers.`
        }
      ];

      const result = await callOpenRouter(messages, { maxTokens: 1500 });
      await persistAIResult(db, { userId: req.user?.id, endpoint: 'donation-appeal', inputData: { campaign_name, target_audience, goal }, result });
      res.json({ result, generated_at: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /volunteer-optimization ────────────────────────────────────────────
router.post(
  '/volunteer-optimization',
  requireAuth,
  aiRateLimiter,
  [
    body('date').optional().isISO8601().withMessage('date must be a valid ISO 8601 date'),
    body('tasks').optional().isArray().withMessage('tasks must be an array'),
    body('tasks.*').optional().isString().trim().escape(),
  ],
  validate,
  async (req, res) => {
    try {
      const { date, tasks } = req.body;

      const volunteersResult = await db.query(
        `SELECT id, name, role, availability, skills, total_hours FROM volunteers WHERE status = 'active' ORDER BY name`
      );
      const distResult = await db.query(
        `SELECT name, date, type, location, max_clients FROM distributions WHERE date >= CURRENT_DATE AND status = 'scheduled' ORDER BY date LIMIT 5`
      );

      const messages = [
        {
          role: 'system',
          content: `You are a volunteer coordination specialist for a food bank. You optimize shift assignments based on volunteer skills, availability, and workload balance.`
        },
        {
          role: 'user',
          content: `Optimize volunteer assignments for ${date || 'the upcoming week'}.

Available Volunteers (${volunteersResult.rows.length} total):
${volunteersResult.rows.map(v => `- ${v.name} | Role: ${v.role || 'General'} | Availability: ${v.availability || 'Flexible'} | Skills: ${v.skills || 'General'} | Total Hours: ${v.total_hours}`).join('\n')}

Tasks to Cover:
${tasks ? tasks.map(t => `- ${t}`).join('\n') : '- Sorting and stocking\n- Client intake and registration\n- Distribution assistance\n- Warehouse organization\n- Delivery driving\n- Administrative support'}

Upcoming Distributions:
${distResult.rows.map(d => `- ${d.name} on ${d.date} (${d.type}) at ${d.location}, max ${d.max_clients} clients`).join('\n') || 'No upcoming distributions scheduled'}

Please provide:
1. Recommended shift assignments with specific time slots
2. Task-to-volunteer matching based on skills
3. Backup assignments in case of no-shows
4. Any gaps or concerns in coverage
5. Suggestions for improving volunteer utilization`
        }
      ];

      const result = await callOpenRouter(messages, { maxTokens: 2000 });
      await persistAIResult(db, { userId: req.user?.id, endpoint: 'volunteer-optimization', inputData: { date, tasks }, result });
      res.json({ result, generated_at: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /nutritional-analysis ───────────────────────────────────────────────
router.post(
  '/nutritional-analysis',
  requireAuth,
  aiRateLimiter,
  [
    body('distribution_id').optional().isInt({ min: 1 }).withMessage('distribution_id must be a positive integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { distribution_id } = req.body;

      let inventoryQuery = `SELECT category, COUNT(*) as item_count, COALESCE(SUM(weight_lbs), 0) as total_weight, COALESCE(SUM(quantity), 0) as total_quantity FROM inventory WHERE status = 'available'`;
      const params = [];
      if (distribution_id) {
        inventoryQuery += ` AND warehouse_id IN (SELECT id FROM warehouses WHERE status = 'active')`;
      }
      inventoryQuery += ` GROUP BY category ORDER BY category`;

      const inventoryResult = await db.query(inventoryQuery, params);
      const detailResult = await db.query(
        `SELECT name, category, quantity, unit, weight_lbs, expiration_date FROM inventory WHERE status = 'available' ORDER BY category, name LIMIT 100`
      );

      const messages = [
        {
          role: 'system',
          content: `You are a nutrition specialist advising a food bank. You analyze food inventory to ensure balanced nutrition for clients. Consider USDA MyPlate guidelines and common nutritional deficiencies in food-insecure populations.`
        },
        {
          role: 'user',
          content: `Analyze the nutritional balance of our current inventory${distribution_id ? ' for distribution #' + distribution_id : ''}:

Inventory by Category:
${inventoryResult.rows.map(c => `- ${c.category}: ${c.item_count} items, ${c.total_weight} lbs`).join('\n') || 'No inventory data available'}

Detailed Inventory Items:
${detailResult.rows.map(i => `- ${i.name} (${i.category}): ${i.quantity} ${i.unit || 'units'}, ${i.weight_lbs} lbs, expires: ${i.expiration_date || 'N/A'}`).join('\n') || 'No items found'}

Please provide:
1. Overall nutritional balance assessment (protein, grains, produce, dairy ratios)
2. Identified nutritional gaps compared to USDA recommendations
3. Specific food items to prioritize for acquisition
4. Suggestions for creating balanced food packages for families
5. Special considerations for common dietary restrictions (diabetic, gluten-free, etc.)
6. A recommended distribution mix per household`
        }
      ];

      const result = await callOpenRouter(messages, { maxTokens: 2000 });
      await persistAIResult(db, { userId: req.user?.id, endpoint: 'nutritional-analysis', inputData: { distribution_id }, result });
      res.json({ result, generated_at: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /expiration-risk ────────────────────────────────────────────────────
router.post(
  '/expiration-risk',
  requireAuth,
  aiRateLimiter,
  async (req, res) => {
    try {
      const inventoryResult = await db.query(
        `SELECT name, category, quantity, unit, weight_lbs, expiration_date, storage_type, warehouse_id,
                CASE
                  WHEN expiration_date <= CURRENT_DATE THEN 'EXPIRED'
                  WHEN expiration_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'CRITICAL'
                  WHEN expiration_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'HIGH'
                  WHEN expiration_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'MEDIUM'
                  WHEN expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'LOW'
                  ELSE 'OK'
                END as risk_level
         FROM inventory
         WHERE status = 'available' AND expiration_date IS NOT NULL
         ORDER BY expiration_date ASC
         LIMIT 100`
      );

      const distResult = await db.query(
        `SELECT name, date, type, location FROM distributions WHERE date >= CURRENT_DATE AND status = 'scheduled' ORDER BY date LIMIT 5`
      );

      const messages = [
        {
          role: 'system',
          content: `You are a food safety and inventory management specialist for a food bank. You help minimize food waste by identifying expiration risks and suggesting redistribution strategies. Be specific and actionable.`
        },
        {
          role: 'user',
          content: `Analyze expiration risks in our inventory and provide recommendations:

Inventory Items with Expiration Dates:
${inventoryResult.rows.map(i => `- [${i.risk_level}] ${i.name} (${i.category}): ${i.quantity} ${i.unit || 'units'}, ${i.weight_lbs} lbs, expires: ${i.expiration_date}, storage: ${i.storage_type}`).join('\n') || 'No items with expiration dates found'}

Upcoming Distributions for Redistribution:
${distResult.rows.map(d => `- ${d.name} on ${d.date} (${d.type}) at ${d.location}`).join('\n') || 'No upcoming distributions'}

Please provide:
1. Priority action list for items at highest risk
2. Recommended redistribution plan (which items to move to which distributions)
3. Items that should be removed from inventory immediately
4. Estimated food waste if no action is taken (in lbs and estimated value)
5. Preventive recommendations to reduce future expiration waste
6. Suggestions for partnerships (soup kitchens, composting) for nearly-expired items`
        }
      ];

      const result = await callOpenRouter(messages, { maxTokens: 2000 });
      await persistAIResult(db, { userId: req.user?.id, endpoint: 'expiration-risk', inputData: {}, result });
      res.json({ result, generated_at: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /grant-assistant  (with persistence) ────────────────────────────────
// Saves the AI-generated draft to the grants table with status 'draft'.
router.post(
  '/grant-assistant',
  requireAuth,
  aiRateLimiter,
  [
    body('grant_name').notEmpty().withMessage('grant_name is required').trim().escape(),
    body('amount_requested').notEmpty().withMessage('amount_requested is required'),
    body('purpose').notEmpty().withMessage('purpose is required').trim(),
    body('organization_info').optional().isString().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { grant_name, organization_info, amount_requested, purpose } = req.body;

      const statsResult = await db.query(`
        SELECT
          (SELECT COUNT(*) FROM clients) as total_clients,
          (SELECT COUNT(*) FROM visits WHERE visit_date >= date_trunc('year', CURRENT_DATE)) as yearly_visits,
          (SELECT COALESCE(SUM(weight_lbs), 0) FROM visits WHERE visit_date >= date_trunc('year', CURRENT_DATE)) as yearly_distributed_lbs,
          (SELECT COUNT(*) FROM volunteers WHERE status = 'active') as active_volunteers,
          (SELECT COUNT(*) FROM partners WHERE status = 'active') as active_partners,
          (SELECT COUNT(*) FROM distributions WHERE date >= date_trunc('year', CURRENT_DATE)) as yearly_distributions
      `);
      const stats = statsResult.rows[0];

      const messages = [
        {
          role: 'system',
          content: `You are a professional grant writer specializing in nonprofit food assistance organizations. You write compelling, data-driven grant applications that demonstrate impact and need. Use specific metrics, follow standard grant application formats, and emphasize measurable outcomes.`
        },
        {
          role: 'user',
          content: `Help draft a grant application with the following details:

Grant Name: ${grant_name}
Amount Requested: $${amount_requested}
Purpose: ${purpose}
Organization Info: ${organization_info || 'AI Food Bank & Pantry - a community food assistance organization'}

Organization Statistics (current year):
- Total registered clients: ${stats.total_clients}
- Visits served this year: ${stats.yearly_visits}
- Food distributed this year: ${stats.yearly_distributed_lbs} lbs
- Active volunteers: ${stats.active_volunteers}
- Community partners: ${stats.active_partners}
- Distribution events this year: ${stats.yearly_distributions}

Please generate:
1. Executive Summary (1 paragraph)
2. Statement of Need (2 paragraphs with statistics)
3. Program Description and Goals
4. Measurable Objectives and Outcomes (at least 4)
5. Budget Justification Narrative
6. Sustainability Plan
7. Evaluation Methods

Format the output professionally with clear section headers.`
        }
      ];

      const result = await callOpenRouter(messages, { maxTokens: 3000 });

      // ── Persist the AI-generated draft to the grants table ──────────────────
      // The grants table uses the existing schema (name, grantor, amount,
      // status, notes). We store the AI draft text in notes and set status to
      // 'draft' so staff can later promote it to 'submitted' / 'approved' /
      // 'rejected' via PUT /api/grants/:id.
      const parseAmount = (val) => {
        const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
        return isNaN(n) ? null : n;
      };

      const { rows: savedRows } = await db.query(
        `INSERT INTO grants (name, grantor, amount, status, category, notes)
         VALUES ($1, $2, $3, 'draft', 'AI Generated', $4)
         RETURNING *`,
        [
          grant_name,
          organization_info || 'AI Food Bank & Pantry',
          parseAmount(amount_requested),
          result
        ]
      );

      await persistAIResult(db, { userId: req.user?.id, endpoint: 'grant-assistant', inputData: { grant_name, amount_requested, purpose }, result });
      res.json({
        result,
        grant_draft: savedRows[0],
        generated_at: new Date().toISOString()
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /community-assessment ───────────────────────────────────────────────
router.post(
  '/community-assessment',
  requireAuth,
  aiRateLimiter,
  async (req, res) => {
    try {
      const clientResult = await db.query(`
        SELECT
          COUNT(*) as total_clients,
          AVG(household_size) as avg_household_size,
          COUNT(CASE WHEN is_homebound THEN 1 END) as homebound_count,
          COUNT(CASE WHEN dietary_restrictions IS NOT NULL AND dietary_restrictions != '' THEN 1 END) as dietary_restrictions_count
        FROM clients
      `);
      const clientStats = clientResult.rows[0];

      const cityResult = await db.query(
        `SELECT city, COUNT(*) as count FROM clients WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 10`
      );
      const incomeResult = await db.query(
        `SELECT income_level, COUNT(*) as count FROM clients WHERE income_level IS NOT NULL GROUP BY income_level ORDER BY count DESC`
      );
      const visitResult = await db.query(`
        SELECT
          to_char(visit_date, 'YYYY-MM') as month,
          COUNT(*) as visit_count,
          COUNT(DISTINCT client_id) as unique_clients,
          COALESCE(SUM(weight_lbs), 0) as total_weight
        FROM visits
        WHERE visit_date >= CURRENT_DATE - INTERVAL '6 months'
        GROUP BY to_char(visit_date, 'YYYY-MM')
        ORDER BY month DESC
      `);
      const dietaryResult = await db.query(
        `SELECT dietary_restrictions, COUNT(*) as count FROM clients WHERE dietary_restrictions IS NOT NULL AND dietary_restrictions != '' GROUP BY dietary_restrictions ORDER BY count DESC LIMIT 10`
      );

      const messages = [
        {
          role: 'system',
          content: `You are a community needs assessment specialist for food assistance programs. You analyze client data, visit patterns, and demographic information to identify trends, gaps in service, and opportunities for improvement. Provide actionable insights backed by data.`
        },
        {
          role: 'user',
          content: `Conduct a community needs assessment based on our data:

Client Demographics:
- Total registered clients: ${clientStats.total_clients}
- Average household size: ${parseFloat(clientStats.avg_household_size || 0).toFixed(1)}
- Homebound clients: ${clientStats.homebound_count}
- Clients with dietary restrictions: ${clientStats.dietary_restrictions_count}

Geographic Distribution:
${cityResult.rows.map(c => `- ${c.city}: ${c.count} clients`).join('\n') || 'No geographic data available'}

Income Levels:
${incomeResult.rows.map(i => `- ${i.income_level}: ${i.count} clients`).join('\n') || 'No income data available'}

Visit Trends (Last 6 Months):
${visitResult.rows.map(v => `- ${v.month}: ${v.visit_count} visits, ${v.unique_clients} unique clients, ${v.total_weight} lbs distributed`).join('\n') || 'No visit data available'}

Dietary Restrictions:
${dietaryResult.rows.map(d => `- ${d.dietary_restrictions}: ${d.count} clients`).join('\n') || 'No dietary restriction data available'}

Please provide:
1. Executive Summary of Community Needs
2. Key Demographic Insights and Trends
3. Service Gap Analysis (underserved populations, areas, or needs)
4. Demand Forecasting for next 3-6 months
5. Recommendations for Program Expansion or Modification
6. Priority Areas for Resource Allocation
7. Suggested Community Partnerships to Address Gaps`
        }
      ];

      const result = await callOpenRouter(messages, { maxTokens: 2500 });
      await persistAIResult(db, { userId: req.user?.id, endpoint: 'community-assessment', inputData: {}, result });
      res.json({ result, generated_at: new Date().toISOString() });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /food-package-builder ───────────────────────────────────────────────
router.post(
  '/food-package-builder',
  requireAuth,
  aiRateLimiter,
  [
    body('client_id').notEmpty().withMessage('client_id is required').isInt({ min: 1 }),
    body('household_size').notEmpty().withMessage('household_size is required').isInt({ min: 1 }),
    body('dietary_restrictions').optional().isString().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { client_id, household_size, dietary_restrictions } = req.body;

      const clientResult = await db.query('SELECT * FROM clients WHERE id = $1', [client_id]);
      if (clientResult.rows.length === 0) return res.status(404).json({ error: 'Client not found' });
      const client = clientResult.rows[0];

      const inventoryResult = await db.query(
        `SELECT id, name, category, quantity, unit, weight_lbs, expiration_date, storage_type
         FROM inventory
         WHERE status = 'available'
           AND (expiration_date IS NULL OR expiration_date > CURRENT_DATE)
         ORDER BY expiration_date ASC NULLS LAST
         LIMIT 60`
      );

      const messages = [
        {
          role: 'system',
          content: `You are a nutrition specialist and food bank coordinator. Given a household's dietary needs and available inventory sorted by expiration priority, generate a personalized food box recommendation that maximizes nutritional balance and minimizes food waste. Return a JSON object with fields: "package_name", "items" (array of {name, quantity, unit, reason}), "nutritional_summary" (object with protein, grains, produce, dairy, other counts), and "notes" (string).`
        },
        {
          role: 'user',
          content: `Build a personalized food package for this household:

Client: ${client.first_name} ${client.last_name}
Household Size: ${household_size}
Dietary Restrictions: ${dietary_restrictions || client.dietary_restrictions || 'None'}
Income Level: ${client.income_level || 'Unknown'}

Available Inventory (sorted by expiration priority - use items expiring soonest first to minimize waste):
${inventoryResult.rows.map(i => `- ${i.name} (${i.category}): ${i.quantity} ${i.unit}, expires: ${i.expiration_date || 'N/A'}`).join('\n')}

Generate a complete food package recommendation as JSON.`
        }
      ];

      const rawResult = await callOpenRouter(messages, { maxTokens: 2000 });

      let parsed = null;
      try {
        const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      await persistAIResult(db, { userId: req.user?.id, endpoint: 'food-package-builder', inputData: { client_id, household_size, dietary_restrictions }, result: rawResult });
      res.json({
        client: { id: client.id, name: `${client.first_name} ${client.last_name}`, household_size },
        package: parsed || rawResult,
        raw_response: rawResult,
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /donor-retention ────────────────────────────────────────────────────
router.post(
  '/donor-retention',
  requireAuth,
  aiRateLimiter,
  async (req, res) => {
    try {
      const donorsResult = await db.query(
        `SELECT
           d.id, d.name, d.email, d.type, d.donation_frequency, d.status,
           COALESCE(SUM(CASE WHEN fd.date >= CURRENT_DATE - INTERVAL '12 months' THEN fd.amount ELSE 0 END), 0) AS last_12mo_total,
           COUNT(CASE WHEN fd.date >= CURRENT_DATE - INTERVAL '12 months' THEN 1 END) AS last_12mo_count,
           MAX(fd.date) AS last_gift_date
         FROM donors d
         LEFT JOIN financial_donations fd ON fd.donor_id = d.id
         WHERE d.status = 'active'
         GROUP BY d.id
         ORDER BY last_gift_date ASC NULLS FIRST`
      );

      const messages = [
        {
          role: 'system',
          content: `You are a nonprofit donor retention analyst. Classify each donor's churn risk (high/medium/low) based on giving frequency, recency, and amount. For high-risk donors, generate a personalized re-engagement message. Return a JSON array where each element has: "donor_id", "donor_name", "churn_risk" (high|medium|low), "risk_reason", and "re_engagement_message" (only for high-risk donors, otherwise null).`
        },
        {
          role: 'user',
          content: `Analyze churn risk for these donors (last 12 months data):

${donorsResult.rows.map(d =>
  `- ID:${d.id} | ${d.name} | Type:${d.type} | Frequency:${d.donation_frequency || 'unknown'} | Last 12mo total:$${parseFloat(d.last_12mo_total).toFixed(2)} | Gift count:${d.last_12mo_count} | Last gift:${d.last_gift_date ? new Date(d.last_gift_date).toISOString().split('T')[0] : 'never'}`
).join('\n')}

Return a JSON array with churn analysis for each donor.`
        }
      ];

      const rawResult = await callOpenRouter(messages, { maxTokens: 3000 });

      let parsed = null;
      try {
        const jsonMatch = rawResult.match(/\[[\s\S]*\]/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      await persistAIResult(db, { userId: req.user?.id, endpoint: 'donor-retention', inputData: { donors_analyzed: donorsResult.rows.length }, result: rawResult });
      res.json({
        total_donors_analyzed: donorsResult.rows.length,
        analysis: parsed || rawResult,
        raw_response: rawResult,
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /delivery-route ─────────────────────────────────────────────────────
router.post(
  '/delivery-route',
  requireAuth,
  aiRateLimiter,
  [
    body('vehicle_id').notEmpty().withMessage('vehicle_id is required').isInt({ min: 1 }),
    body('client_ids').notEmpty().withMessage('client_ids is required').isArray({ min: 1 }).withMessage('client_ids must be a non-empty array'),
    body('client_ids.*').isInt({ min: 1 }).withMessage('Each client_id must be a positive integer'),
  ],
  validate,
  async (req, res) => {
    try {
      const { vehicle_id, client_ids } = req.body;

      const vehicleResult = await db.query('SELECT * FROM fleet WHERE id = $1', [vehicle_id]);
      if (vehicleResult.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found' });
      const vehicle = vehicleResult.rows[0];

      const placeholders = client_ids.map((_, i) => `$${i + 1}`).join(', ');
      const clientsResult = await db.query(
        `SELECT id, first_name, last_name, address, city, state, zip, is_homebound, dietary_restrictions, notes
         FROM clients WHERE id IN (${placeholders})`,
        client_ids
      );

      const messages = [
        {
          role: 'system',
          content: `You are a logistics route optimizer for a food bank delivery operation. Given a list of homebound client addresses and vehicle details, suggest the most efficient multi-stop delivery route minimizing total drive time. Return a JSON object with: "optimized_route" (array of stops in order, each with {stop_number, client_id, client_name, address, estimated_arrival_minutes, notes}), "total_estimated_minutes", "total_stops", and "route_notes".`
        },
        {
          role: 'user',
          content: `Optimize the delivery route for this vehicle and client list:

Vehicle: ${vehicle.name} (${vehicle.make} ${vehicle.model} ${vehicle.year}) | Capacity: ${vehicle.capacity_lbs} lbs | Status: ${vehicle.status}

Clients to deliver to:
${clientsResult.rows.map(c =>
  `- ID:${c.id} | ${c.first_name} ${c.last_name} | ${c.address}, ${c.city}, ${c.state} ${c.zip} | Homebound: ${c.is_homebound} | Notes: ${c.notes || 'None'}`
).join('\n')}

Suggest an optimized route order that minimizes total drive time. Assume starting and ending at the main distribution center at 1200 Commerce Blvd, Springfield, IL. Return JSON.`
        }
      ];

      const rawResult = await callOpenRouter(messages, { maxTokens: 2000 });

      let parsed = null;
      try {
        const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch (_) {}

      await persistAIResult(db, { userId: req.user?.id, endpoint: 'delivery-route', inputData: { vehicle_id, client_ids }, result: rawResult });
      res.json({
        vehicle: { id: vehicle.id, name: vehicle.name },
        total_clients: clientsResult.rows.length,
        route: parsed || rawResult,
        raw_response: rawResult,
        generated_at: new Date().toISOString(),
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

// ─── POST /inventory-forecast — predict 30/60/90-day food needs ─────────────
router.post('/inventory-forecast', aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { horizon_days = 90 } = req.body || {};

    const inv = await db.query(
      `SELECT id, name, category, quantity_units, unit, expiration_date
       FROM inventory
       ORDER BY expiration_date NULLS LAST
       LIMIT 200`
    ).catch(() => ({ rows: [] }));

    const dist = await db.query(
      `SELECT category, SUM(quantity_units) AS qty, COUNT(*) AS visits
       FROM distributions
       WHERE distributed_at >= CURRENT_DATE - ($1::int * INTERVAL '1 day')
       GROUP BY category`,
      [Math.max(30, Number(horizon_days))]
    ).catch(() => ({ rows: [] }));

    const clientsCount = await db.query(`SELECT COUNT(*) AS cnt FROM clients`).catch(() => ({ rows: [{ cnt: 0 }] }));

    const messages = [
      {
        role: 'system',
        content: 'You are a food bank inventory planner. Forecast demand and recommend procurement. Return strict JSON only.'
      },
      {
        role: 'user',
        content: `Forecast inventory needs for the next ${horizon_days} days.

CLIENTS: ${clientsCount.rows[0]?.cnt || 0}
RECENT DISTRIBUTIONS BY CATEGORY:
${dist.rows.map(r => `- ${r.category}: ${r.qty} units across ${r.visits} visits`).join('\n') || '(none)'}

CURRENT INVENTORY (sample):
${inv.rows.slice(0, 50).map(i => `- ${i.name} (${i.category}): ${i.quantity_units} ${i.unit}, expires ${i.expiration_date || 'n/a'}`).join('\n') || '(none)'}

Return STRICT JSON:
{
  "summary": "...",
  "by_category": [
    { "category": "string", "current_units": 0, "predicted_demand_units": 0, "shortfall_units": 0, "recommended_action": "string" }
  ],
  "expiring_soon": [{ "name": "string", "expires_in_days": 0, "suggested_distribution": "string" }],
  "procurement_priorities": [{ "category": "string", "priority": "high|med|low", "rationale": "string" }],
  "disclaimer": "Estimates only; verify against historical seasonality."
}`
      }
    ];

    const raw = await callOpenRouter(messages, { maxTokens: 2000 });
    await persistAIResult(db, { userId: req.user?.id, endpoint: 'inventory-forecast', inputData: { horizon_days }, result: raw });

    let parsed = null;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch (_) {}

    res.json({ horizon_days, forecast: parsed || raw, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /distribution-optimize — allocate scarce inventory across clients ─
router.post('/distribution-optimize', aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { event_id, client_ids = [], priority_rules = [] } = req.body || {};

    const inv = await db.query(
      `SELECT id, name, category, quantity_units, unit
       FROM inventory
       WHERE quantity_units > 0
       LIMIT 100`
    ).catch(() => ({ rows: [] }));

    let clientsResult = { rows: [] };
    if (client_ids.length > 0) {
      clientsResult = await db.query(
        `SELECT id, first_name, last_name, household_size, dietary_restrictions, is_homebound
         FROM clients WHERE id = ANY($1::int[])`,
        [client_ids]
      ).catch(() => ({ rows: [] }));
    } else {
      clientsResult = await db.query(
        `SELECT id, first_name, last_name, household_size, dietary_restrictions, is_homebound
         FROM clients ORDER BY household_size DESC NULLS LAST LIMIT 100`
      ).catch(() => ({ rows: [] }));
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a food-bank distribution planner. Allocate scarce inventory fairly across clients honoring household size, dietary needs, homebound status, and supplied priority rules. Return STRICT JSON only.'
      },
      {
        role: 'user',
        content: `Allocate inventory for ${event_id ? `event #${event_id}` : 'next distribution'}.

INVENTORY:
${inv.rows.map(i => `- [${i.id}] ${i.name} (${i.category}): ${i.quantity_units} ${i.unit}`).join('\n') || '(none)'}

CLIENTS:
${clientsResult.rows.map(c => `- [${c.id}] ${c.first_name} ${c.last_name} | household=${c.household_size || 1} | dietary=${c.dietary_restrictions || 'none'} | homebound=${c.is_homebound}`).join('\n') || '(none)'}

PRIORITY RULES: ${JSON.stringify(priority_rules)}

Return JSON:
{
  "summary": "...",
  "allocations": [
    { "client_id": 0, "items": [{ "inventory_id": 0, "name": "string", "quantity": 0 }], "rationale": "string" }
  ],
  "leftover_inventory": [{ "inventory_id": 0, "name": "string", "remaining": 0 }],
  "fairness_score": 0,
  "warnings": ["..."],
  "disclaimer": "string"
}`
      }
    ];

    const raw = await callOpenRouter(messages, { maxTokens: 3000 });
    await persistAIResult(db, { userId: req.user?.id, endpoint: 'distribution-optimize', inputData: { event_id, client_count: clientsResult.rows.length }, result: raw });

    let parsed = null;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch (_) {}

    res.json({ event_id, allocations: parsed || raw, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /fraud-detect — flag duplicate clients / ineligible recipients ────
router.post('/fraud-detect', aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const clients = await db.query(
      `SELECT id, first_name, last_name, address, city, state, zip, phone, email, household_size, registered_at
       FROM clients
       ORDER BY registered_at DESC NULLS LAST
       LIMIT 500`
    ).catch(() => ({ rows: [] }));

    const visitsAgg = await db.query(
      `SELECT client_id, COUNT(*) AS visit_count, MAX(visited_at) AS last_visit
       FROM visits
       WHERE visited_at >= CURRENT_DATE - INTERVAL '90 days'
       GROUP BY client_id`
    ).catch(() => ({ rows: [] }));

    // Simple local heuristic: same phone OR same address+last_name combo flagged
    const phoneIndex = new Map();
    const addressNameIndex = new Map();
    const localFlags = [];
    for (const c of clients.rows) {
      if (c.phone) {
        const list = phoneIndex.get(c.phone) || [];
        list.push(c.id);
        phoneIndex.set(c.phone, list);
      }
      const key = `${(c.address || '').toLowerCase()}|${(c.last_name || '').toLowerCase()}`;
      const list = addressNameIndex.get(key) || [];
      list.push(c.id);
      addressNameIndex.set(key, list);
    }
    for (const [phone, ids] of phoneIndex.entries()) {
      if (ids.length > 1) localFlags.push({ kind: 'shared_phone', phone, client_ids: ids });
    }
    for (const [key, ids] of addressNameIndex.entries()) {
      if (ids.length > 1 && key !== '|') localFlags.push({ kind: 'shared_address_lastname', key, client_ids: ids });
    }

    const messages = [
      {
        role: 'system',
        content: 'You are a fraud-detection analyst for a food bank. Identify likely duplicates and ineligible patterns. Be sensitive (clients in shared housing are common). Return STRICT JSON.'
      },
      {
        role: 'user',
        content: `Review for fraud risk. Use the supplied local flags as a starting point and judge each.

LOCAL FLAGS (${localFlags.length}):
${JSON.stringify(localFlags.slice(0, 30))}

VISIT FREQUENCY (last 90 days, top 30):
${visitsAgg.rows.slice(0, 30).map(v => `- client_id=${v.client_id}: ${v.visit_count} visits, last ${v.last_visit}`).join('\n') || '(none)'}

Return JSON:
{
  "summary": "...",
  "flags": [
    { "client_ids": [0], "risk_level": "low|medium|high", "reason": "string", "recommended_review": "string" }
  ],
  "false_positive_warnings": ["..."],
  "process_recommendations": ["..."],
  "disclaimer": "Investigate sensitively; many flags are benign (shared housing, family units)."
}`
      }
    ];

    const raw = await callOpenRouter(messages, { maxTokens: 2000 });
    await persistAIResult(db, {
      userId: req.user?.id,
      endpoint: 'fraud-detect',
      inputData: { clients_evaluated: clients.rows.length, local_flag_count: localFlags.length },
      result: raw,
    });

    let parsed = null;
    try {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    } catch (_) {}

    res.json({
      clients_evaluated: clients.rows.length,
      local_flags: localFlags.slice(0, 50),
      ai_review: parsed || raw,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /need-predict — proactive outreach for clients likely to need help ─
// Apply pass 4 (mechanical backlog). Pulls clients + recent visits + household
// context, asks AI to predict who is most at-risk in the coming weeks and what
// outreach action is appropriate. 503 when OPENROUTER_API_KEY is unset.
router.post('/need-predict', aiRateLimiter, requireAuth, async (req, res) => {
  try {
    const { horizon_days = 30, focus_segment = '', notes = '' } = req.body || {};
    const horizon = Math.min(180, Math.max(7, Number(horizon_days) || 30));

    const clients = await db.query(
      `SELECT id, first_name, last_name, household_size, registered_at, address, city, state, zip
       FROM clients
       ORDER BY registered_at DESC NULLS LAST
       LIMIT 200`
    ).catch(() => ({ rows: [] }));

    const recentVisits = await db.query(
      `SELECT client_id, COUNT(*) AS visit_count, MAX(visited_at) AS last_visit
       FROM visits
       WHERE visited_at >= CURRENT_DATE - INTERVAL '120 days'
       GROUP BY client_id`
    ).catch(() => ({ rows: [] }));

    const visitMap = new Map();
    for (const v of recentVisits.rows) visitMap.set(v.client_id, v);

    const enriched = clients.rows.map((c) => {
      const v = visitMap.get(c.id) || {};
      const lastVisit = v.last_visit ? new Date(v.last_visit) : null;
      const daysSince = lastVisit ? Math.floor((Date.now() - lastVisit.getTime()) / 86400000) : null;
      return {
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        household_size: c.household_size,
        zip: c.zip,
        last_visit_days_ago: daysSince,
        visits_last_120d: Number(v.visit_count || 0),
      };
    });

    const messages = [
      {
        role: 'system',
        content: 'You are a food bank case worker analyst. Predict which clients are most likely to need outreach in the coming weeks based on visit patterns, household size, and tenure. Be empathetic; flagging is to *help*, not to gatekeep. Return STRICT JSON.'
      },
      {
        role: 'user',
        content: `Predict need over the next ${horizon} days.

FOCUS SEGMENT: ${focus_segment || '(any)'}
NOTES: ${notes || '(none)'}

CLIENT SAMPLE (${enriched.length}):
${enriched.slice(0, 80).map(c => `- id=${c.id} ${c.name} hh=${c.household_size} zip=${c.zip} last_visit=${c.last_visit_days_ago ?? 'never'}d ago visits120d=${c.visits_last_120d}`).join('\n') || '(none)'}

Return STRICT JSON:
{
  "summary": "...",
  "high_priority": [
    { "client_id": 0, "name": "...", "predicted_need": "string", "outreach_channel": "phone|sms|email|in-person", "outreach_message": "string", "rationale": "string" }
  ],
  "medium_priority": [
    { "client_id": 0, "name": "...", "predicted_need": "string", "outreach_channel": "phone|sms|email|in-person", "rationale": "string" }
  ],
  "lapsed_reactivation": [
    { "client_id": 0, "name": "...", "days_since_last_visit": 0, "suggested_message": "string" }
  ],
  "process_recommendations": ["..."],
  "disclaimer": "Predictions are heuristic — verify before outreach; respect privacy."
}`
      }
    ];

    const raw = await callOpenRouterStrict(messages, { maxTokens: 2000 });
    await persistAIResult(db, {
      userId: req.user?.id,
      endpoint: 'need-predict',
      inputData: { horizon_days: horizon, focus_segment, notes, clients_evaluated: enriched.length },
      result: raw,
    });

    let parsed = null;
    try { const m = raw.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch (_) {}

    res.json({
      horizon_days: horizon,
      clients_evaluated: enriched.length,
      prediction: parsed || raw,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    res.status(aiErrToStatus(err)).json({ error: err.message });
  }
});

module.exports = router;
