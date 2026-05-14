const router = require('express').Router();
const db = require('../db');

// GET /api/ai-results — paginated AI result history for the current user
router.get('/', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const userId = req.user?.id;

    const { rows: countRows } = await db.query(
      'SELECT COUNT(*) AS total FROM ai_results WHERE user_id = $1 OR $1 IS NULL',
      [userId]
    );
    const total = parseInt(countRows[0].total, 10);

    const { rows } = await db.query(
      `SELECT * FROM ai_results
       WHERE user_id = $1 OR $1 IS NULL
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ data: rows, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
