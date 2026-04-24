const router = require('express').Router();
const db = require('../db');
const { callOpenRouter } = require('../openrouter');

// POST /donation-appeal - Generate donation appeal content
router.post('/donation-appeal', async (req, res) => {
  try {
    const { campaign_name, target_audience, goal, tone } = req.body;

    // Fetch recent stats for context
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
    res.json({ result, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /volunteer-optimization - Optimize volunteer shifts
router.post('/volunteer-optimization', async (req, res) => {
  try {
    const { date, tasks } = req.body;

    // Fetch active volunteers from DB
    const volunteersResult = await db.query(
      `SELECT id, name, role, availability, skills, total_hours FROM volunteers WHERE status = 'active' ORDER BY name`
    );
    const volunteers = volunteersResult.rows;

    // Fetch upcoming distributions for context
    const distResult = await db.query(
      `SELECT name, date, type, location, max_clients FROM distributions WHERE date >= CURRENT_DATE AND status = 'scheduled' ORDER BY date LIMIT 5`
    );

    const messages = [
      {
        role: 'system',
        content: `You are a volunteer coordination specialist for a food bank. You optimize shift assignments based on volunteer skills, availability, and workload balance. Ensure fair distribution of hours and match skills to tasks.`
      },
      {
        role: 'user',
        content: `Optimize volunteer assignments for ${date || 'the upcoming week'}.

Available Volunteers (${volunteers.length} total):
${volunteers.map(v => `- ${v.name} | Role: ${v.role || 'General'} | Availability: ${v.availability || 'Flexible'} | Skills: ${v.skills || 'General'} | Total Hours: ${v.total_hours}`).join('\n')}

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
    res.json({ result, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /nutritional-analysis - Analyze nutritional balance
router.post('/nutritional-analysis', async (req, res) => {
  try {
    const { distribution_id } = req.body;

    // Fetch inventory data grouped by category
    let inventoryQuery = `SELECT category, COUNT(*) as item_count, COALESCE(SUM(weight_lbs), 0) as total_weight, COALESCE(SUM(quantity), 0) as total_quantity FROM inventory WHERE status = 'available'`;
    const params = [];

    if (distribution_id) {
      inventoryQuery += ` AND warehouse_id IN (SELECT id FROM warehouses WHERE status = 'active')`;
    }
    inventoryQuery += ` GROUP BY category ORDER BY category`;

    const inventoryResult = await db.query(inventoryQuery, params);
    const categories = inventoryResult.rows;

    // Fetch detailed inventory list
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
${categories.map(c => `- ${c.category}: ${c.item_count} items, ${c.total_weight} lbs`).join('\n') || 'No inventory data available'}

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
    res.json({ result, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /expiration-risk - Predict expiration risks
router.post('/expiration-risk', async (req, res) => {
  try {
    // Fetch inventory with expiration dates
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

    // Fetch upcoming distributions for redistribution suggestions
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
    res.json({ result, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /grant-assistant - Help write grant applications
router.post('/grant-assistant', async (req, res) => {
  try {
    const { grant_name, organization_info, amount_requested, purpose } = req.body;

    // Fetch organizational stats for the application
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
    res.json({ result, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /community-assessment - Assess community needs
router.post('/community-assessment', async (req, res) => {
  try {
    // Fetch client demographic data
    const clientResult = await db.query(`
      SELECT
        COUNT(*) as total_clients,
        AVG(household_size) as avg_household_size,
        COUNT(CASE WHEN is_homebound THEN 1 END) as homebound_count,
        COUNT(CASE WHEN dietary_restrictions IS NOT NULL AND dietary_restrictions != '' THEN 1 END) as dietary_restrictions_count
      FROM clients
    `);
    const clientStats = clientResult.rows[0];

    // Fetch city distribution
    const cityResult = await db.query(
      `SELECT city, COUNT(*) as count FROM clients WHERE city IS NOT NULL GROUP BY city ORDER BY count DESC LIMIT 10`
    );

    // Fetch income levels
    const incomeResult = await db.query(
      `SELECT income_level, COUNT(*) as count FROM clients WHERE income_level IS NOT NULL GROUP BY income_level ORDER BY count DESC`
    );

    // Fetch visit trends
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

    // Fetch dietary restrictions breakdown
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
    res.json({ result, generated_at: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
