'use strict';
require('dotenv').config();
const express   = require('express');
const session   = require('express-session');
const bcrypt    = require('bcryptjs');
const cors      = require('cors');
const mysql     = require('mysql2/promise');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// ── Mailer ─────────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const STATUS_COLORS = {
  Approved: '#2563eb',
  Released: '#16a34a',
  Rejected: '#dc2626',
};

const STATUS_MESSAGES = {
  Approved: 'Your document request has been <strong>approved</strong>. Please proceed with payment to have it released.',
  Released: 'Your document is now <strong>ready for release</strong>. You may visit the barangay hall or download your document from your account.',
  Rejected: 'Unfortunately, your document request has been <strong>rejected</strong>.',
};

function buildEmailHtml({ fullName, docType, refNumber, status, rejectionReason, orNumber }) {
  const color   = STATUS_COLORS[status]  || '#374151';
  const message = STATUS_MESSAGES[status] || `Your document status has been updated to <strong>${status}</strong>.`;
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:10px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:${color};padding:28px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;letter-spacing:0.5px;">
              Barangay Sto. Tomas
            </h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">
              Document Management System
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            <p style="margin:0 0 16px;color:#374151;font-size:15px;">Dear <strong>${fullName}</strong>,</p>
            <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
              ${message}
            </p>

            <!-- Details card -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;">
                  <table width="100%" cellpadding="6" cellspacing="0">
                    <tr>
                      <td style="color:#6b7280;font-size:13px;width:140px;">Document Type</td>
                      <td style="color:#111827;font-size:13px;font-weight:bold;">${docType}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;">Reference No.</td>
                      <td style="color:#111827;font-size:13px;font-weight:bold;">${refNumber}</td>
                    </tr>
                    <tr>
                      <td style="color:#6b7280;font-size:13px;">Status</td>
                      <td>
                        <span style="background:${color};color:#fff;font-size:12px;font-weight:bold;
                          padding:3px 10px;border-radius:999px;">${status}</span>
                      </td>
                    </tr>
                    ${orNumber ? `
                    <tr>
                      <td style="color:#6b7280;font-size:13px;">OR Number</td>
                      <td style="color:#111827;font-size:13px;font-weight:bold;">${orNumber}</td>
                    </tr>` : ''}
                    ${rejectionReason ? `
                    <tr>
                      <td style="color:#6b7280;font-size:13px;vertical-align:top;">Reason</td>
                      <td style="color:#dc2626;font-size:13px;">${rejectionReason}</td>
                    </tr>` : ''}
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
              If you have questions, please visit the barangay hall or contact us directly.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              This is an automated message from Barangay Sto. Tomas MIS. Please do not reply to this email.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendDocStatusEmail({ toEmail, fullName, docType, refNumber, status, rejectionReason, orNumber }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  if (!toEmail) return;
  const subjectMap = {
    Approved: `Your ${docType} Request Has Been Approved`,
    Released: `Your ${docType} is Ready for Release`,
    Rejected: `Update on Your ${docType} Request`,
  };
  try {
    await transporter.sendMail({
      from: `"Barangay Sto. Tomas" <${process.env.GMAIL_USER}>`,
      to:   toEmail,
      subject: subjectMap[status] || `Document Status Update — ${refNumber}`,
      html: buildEmailHtml({ fullName, docType, refNumber, status, rejectionReason, orNumber }),
    });
  } catch (err) {
    // Log but never crash the request if email fails
    console.error(`[Email] Failed to send to ${toEmail}:`, err.message);
  }
}

// ── DB Pool ────────────────────────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'brgy_sto_tomas',
  waitForConnections: true,
  connectionLimit: 10,
});

const db = {
  q:   (sql, params) => pool.execute(sql, params),
  one: async (sql, params) => { const [rows] = await pool.execute(sql, params); return rows[0] || null; },
  all: async (sql, params) => { const [rows] = await pool.execute(sql, params); return rows; },
  run: async (sql, params) => { const [result] = await pool.execute(sql, params); return result; },
};

// ── Helpers ────────────────────────────────────────────────────────────────
const REF_PREFIXES = { clearance:'CLR', indigency:'IND', residency:'RES', permits:'BPR' };

async function makeRefNumber(table) {
  const prefix = REF_PREFIXES[table] || table.toUpperCase().slice(0,3);
  const year   = new Date().getFullYear();
  // Use MAX on the numeric suffix to avoid duplicate refs after deletions
  const [rows] = await pool.execute(
    `SELECT MAX(CAST(SUBSTRING_INDEX(ref_number, '-', -1) AS UNSIGNED)) as maxSeq
     FROM \`${table}\` WHERE ref_number LIKE ?`,
    [`${prefix}-${year}-%`]
  );
  const seq = String((rows[0].maxSeq || 0) + 1).padStart(5, '0');
  return `${prefix}-${year}-${seq}`;
}

// Shared OR number counter across ALL document tables
async function makeOrNumber() {
  const year = new Date().getFullYear();
  const tables = ['clearance', 'indigency', 'residency', 'permits'];
  let maxSeq = 0;
  for (const t of tables) {
    const [rows] = await pool.execute(
      `SELECT MAX(CAST(SUBSTRING_INDEX(or_number, '-', -1) AS UNSIGNED)) as maxSeq
       FROM \`${t}\` WHERE or_number LIKE ?`,
      [`OR-${year}-%`]
    );
    if (rows[0].maxSeq > maxSeq) maxSeq = rows[0].maxSeq;
  }
  return `OR-${year}-${String(maxSeq + 1).padStart(4, '0')}`;
}

async function logHistory(action, details, userId) {
  await db.run(
    'INSERT INTO history (action, details, performed_by) VALUES (?,?,?)',
    [action, details, userId || null]
  );
}

function validationGuard(req, res) {
  const errs = validationResult(req);
  if (!errs.isEmpty()) { res.status(422).json({ errors: errs.array() }); return true; }
  return false;
}

// ── App ────────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL  || 'http://localhost:5173',
  process.env.LANDING_URL || 'http://localhost:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, mobile apps) or from whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'brgy-sto-tomas-secret-2025',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 },
}));

// ── Auth Middleware ────────────────────────────────────────────────────────
const requireAuth = (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  next();
};
const requireAdmin = async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await db.one('SELECT role FROM users WHERE id=?', [req.session.userId]);
  if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  next();
};

// Ensures the resident is logged in AND their account is verified
const requireVerified = async (req, res, next) => {
  if (!req.session?.userId) return res.status(401).json({ message: 'Not authenticated' });
  const user = await db.one('SELECT role, status FROM users WHERE id=?', [req.session.userId]);
  if (!user) return res.status(401).json({ message: 'Not authenticated' });
  if (user.status !== 'verified')
    return res.status(403).json({ message: 'Your account must be verified before submitting requests.' });
  next();
};

// ════════════════════════════════════════════════════════════════════════════
// AUTH
// ════════════════════════════════════════════════════════════════════════════
const auth = express.Router();

auth.post('/login',
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
  async (req, res) => {
    if (validationGuard(req, res)) return;
    try {
      const user = await db.one('SELECT * FROM users WHERE username=?', [req.body.username]);
      if (!user || !bcrypt.compareSync(req.body.password, user.password))
        return res.status(401).json({ message: 'Invalid username or password.' });
      if (user.status !== 'verified')
        return res.status(403).json({ message: user.status === 'deactivated' ? 'Your account has been deactivated. Please contact the barangay admin.' : 'Your account is pending verification by the admin.' });
      if (req.body.role && req.body.role !== user.role) {
        const msg = req.body.role === 'admin'
          ? 'Access denied. This account is not an admin account.'
          : 'Access denied. This account is an admin account. Please use the Admin login.';
        return res.status(403).json({ message: msg });
      }
      req.session.userId = user.id;
      req.session.role   = user.role;
      const { password, security_answer, ...safe } = user;
      res.json({ user: safe });
    } catch(e) { res.status(500).json({ message: e.message }); }
  }
);

auth.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

auth.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.one('SELECT * FROM users WHERE id=?', [req.session.userId]);
    if (!user) return res.status(401).json({ message: 'Session expired' });
    const { password, security_answer, ...safe } = user;
    res.json({ user: safe });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

auth.post('/register',
  body('username').trim().isLength({ min:4 }),
  body('password').isLength({ min:8 }),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('gender').trim().notEmpty().withMessage('Gender is required.'),
  body('age').isInt({ min:1, max:120 }).withMessage('Valid age is required.'),
  body('purok').trim().notEmpty().withMessage('Zone is required.'),
  body('contact_number').trim().notEmpty().withMessage('Contact number is required.'),
  async (req, res) => {
    if (validationGuard(req, res)) return;
    try {
      const existing = await db.one('SELECT id FROM users WHERE username=?', [req.body.username]);
      if (existing) return res.status(409).json({ message: 'Username already taken.' });
      const {
        username, password, first_name, last_name, middle_name='', suffix='',
        gender='', age=null, purok='', contact_number='', address='',
        is_voter=0, is_pwd=0, is_senior=0, is_minor=0,
        security_question='', security_answer='',
      } = req.body;
      const hashedPw  = bcrypt.hashSync(password, 10);
      const hashedAns = bcrypt.hashSync((security_answer||'').toLowerCase(), 10);
      await db.run(
        `INSERT INTO users
         (username,password,role,status,first_name,last_name,middle_name,suffix,
          gender,age,purok,contact_number,address,is_voter,is_pwd,is_senior,is_minor,
          security_question,security_answer)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [username,hashedPw,'resident','pending',first_name,last_name,middle_name,suffix,
         gender,age,purok,contact_number,address,
         is_voter?1:0, is_pwd?1:0, is_senior?1:0, is_minor?1:0,
         security_question, hashedAns]
      );
      res.status(201).json({ message: 'Account created. Awaiting admin verification.' });
    } catch(e) { res.status(500).json({ message: e.message }); }
  }
);

auth.post('/forgot-password/verify', async (req, res) => {
  try {
    const { username, security_question, security_answer } = req.body;
    const user = await db.one('SELECT * FROM users WHERE username=? AND security_question=?', [username, security_question]);
    if (!user) return res.status(404).json({ message: 'User not found or question mismatch.' });
    if (!bcrypt.compareSync((security_answer||'').toLowerCase(), user.security_answer))
      return res.status(401).json({ message: 'Incorrect security answer.' });
    req.session.resetUserId = user.id;
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

auth.post('/forgot-password/reset', async (req, res) => {
  if (!req.session.resetUserId) return res.status(401).json({ message: 'Session expired.' });
  const { new_password } = req.body;
  if (!new_password || new_password.length < 8)
    return res.status(422).json({ message: 'Password must be at least 8 characters.' });
  try {
    await db.run('UPDATE users SET password=? WHERE id=?',
      [bcrypt.hashSync(new_password, 10), req.session.resetUserId]);
    delete req.session.resetUserId;
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

auth.put('/profile', requireAuth,
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  async (req, res) => {
    if (validationGuard(req, res)) return;
    try {
      const { first_name, last_name, middle_name='', suffix='', email='', phone='', address='', contact_number='' } = req.body;
      await db.run(
        'UPDATE users SET first_name=?,last_name=?,middle_name=?,suffix=?,email=?,phone=?,address=?,contact_number=? WHERE id=?',
        [first_name, last_name, middle_name, suffix, email, phone, address, contact_number || phone, req.session.userId]
      );
      const user = await db.one('SELECT * FROM users WHERE id=?', [req.session.userId]);
      const { password, security_answer, ...safe } = user;
      res.json({ user: safe });
    } catch(e) { res.status(500).json({ message: e.message }); }
  }
);

auth.put('/change-password', requireAuth,
  body('current_password').notEmpty(),
  body('new_password').isLength({ min:8 }),
  async (req, res) => {
    if (validationGuard(req, res)) return;
    try {
      const user = await db.one('SELECT * FROM users WHERE id=?', [req.session.userId]);
      if (!bcrypt.compareSync(req.body.current_password, user.password))
        return res.status(401).json({ message: 'Current password is incorrect.' });
      await db.run('UPDATE users SET password=? WHERE id=?',
        [bcrypt.hashSync(req.body.new_password, 10), req.session.userId]);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ message: e.message }); }
  }
);

app.use('/api/auth', auth);

// ════════════════════════════════════════════════════════════════════════════
// RESIDENTS
// ════════════════════════════════════════════════════════════════════════════
const residents = express.Router();

residents.get('/', requireAdmin, async (req, res) => {
  try {
    const { q, search, purok } = req.query;
    const term = q || search || '';
    let sql = 'SELECT * FROM residents WHERE 1=1';
    const params = [];
    if (term) {
      sql += ' AND (first_name LIKE ? OR last_name LIKE ? OR purok LIKE ? OR contact LIKE ?)';
      const lk = `%${term}%`;
      params.push(lk, lk, lk, lk);
    }
    if (purok) { sql += ' AND purok LIKE ?'; params.push(`%${purok}%`); }
    sql += ' ORDER BY last_name, first_name';
    const rows = await db.all(sql, params);
    const all  = await db.all('SELECT * FROM residents', []);
    const stats = {
      total:  all.length,
      male:   all.filter(r => r.gender === 'Male').length,
      female: all.filter(r => r.gender === 'Female').length,
      minor:  all.filter(r => r.is_minor).length,
      senior: all.filter(r => r.is_senior).length,
      pwd:    all.filter(r => r.is_pwd).length,
    };
    res.json({ data: rows, stats });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

residents.get('/:id', requireAdmin, async (req, res) => {
  try {
    const row = await db.one('SELECT * FROM residents WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

residents.post('/', requireAdmin, async (req, res) => {
  try {
    const { first_name,last_name,middle_name='',suffix='',gender='',age=null,birthdate=null,
      civil_status='',purok='',contact='',address='',is_voter=0,is_pwd=0,is_senior=0,is_minor=0 } = req.body;
    const result = await db.run(
      `INSERT INTO residents (first_name,last_name,middle_name,suffix,gender,age,birthdate,
       civil_status,purok,contact,address,is_voter,is_pwd,is_senior,is_minor)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [first_name,last_name,middle_name,suffix,gender,age,birthdate||null,
       civil_status,purok,contact,address,is_voter?1:0,is_pwd?1:0,is_senior?1:0,is_minor?1:0]
    );
    await logHistory('Resident Added', `${first_name} ${last_name}`, req.session.userId);
    const row = await db.one('SELECT * FROM residents WHERE id=?', [result.insertId]);
    res.status(201).json(row);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

residents.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { first_name,last_name,middle_name='',suffix='',gender='',age=null,birthdate=null,
      civil_status='',purok='',contact='',address='',is_voter=0,is_pwd=0,is_senior=0,is_minor=0 } = req.body;
    await db.run(
      `UPDATE residents SET first_name=?,last_name=?,middle_name=?,suffix=?,gender=?,age=?,
       birthdate=?,civil_status=?,purok=?,contact=?,address=?,is_voter=?,is_pwd=?,is_senior=?,is_minor=?
       WHERE id=?`,
      [first_name,last_name,middle_name,suffix,gender,age,birthdate||null,
       civil_status,purok,contact,address,is_voter?1:0,is_pwd?1:0,is_senior?1:0,is_minor?1:0,req.params.id]
    );
    await logHistory('Resident Updated', `${first_name} ${last_name}`, req.session.userId);
    const row = await db.one('SELECT * FROM residents WHERE id=?', [req.params.id]);
    res.json(row);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

residents.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const row = await db.one('SELECT * FROM residents WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });
    await db.run('DELETE FROM residents WHERE id=?', [req.params.id]);
    await logHistory('Resident Deleted', `${row.first_name} ${row.last_name}`, req.session.userId);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.use('/api/residents', residents);

// ════════════════════════════════════════════════════════════════════════════
// OFFICIALS
// ════════════════════════════════════════════════════════════════════════════
const officials = express.Router();

officials.get('/', async (req, res) => {
  try { res.json({ data: await db.all('SELECT * FROM officials ORDER BY id', []) }); }
  catch(e) { res.status(500).json({ message: e.message }); }
});
officials.post('/', requireAdmin, async (req, res) => {
  try {
    const { first_name,last_name,position='',committee='',term_start=null,term_end=null,status='active' } = req.body;
    const toDate = v => v ? (String(v).match(/^\d{4}$/) ? `${v}-01-01` : v) : null;
    const r = await db.run(
      'INSERT INTO officials (first_name,last_name,position,committee,term_start,term_end,status) VALUES (?,?,?,?,?,?,?)',
      [first_name,last_name,position,committee,toDate(term_start),toDate(term_end),status]
    );
    res.status(201).json(await db.one('SELECT * FROM officials WHERE id=?', [r.insertId]));
  } catch(e) { res.status(500).json({ message: e.message }); }
});
officials.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { first_name,last_name,position='',committee='',term_start=null,term_end=null,status='active' } = req.body;
    const toDate = v => v ? (String(v).match(/^\d{4}$/) ? `${v}-01-01` : v) : null;
    await db.run(
      'UPDATE officials SET first_name=?,last_name=?,position=?,committee=?,term_start=?,term_end=?,status=? WHERE id=?',
      [first_name,last_name,position,committee,toDate(term_start),toDate(term_end),status,req.params.id]
    );
    res.json(await db.one('SELECT * FROM officials WHERE id=?', [req.params.id]));
  } catch(e) { res.status(500).json({ message: e.message }); }
});
officials.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM officials WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.use('/api/officials', officials);

// ════════════════════════════════════════════════════════════════════════════
// BLOTTER
// ════════════════════════════════════════════════════════════════════════════
const blotter = express.Router();

blotter.get('/', requireAdmin, async (req, res) => {
  try {
    const { q, status } = req.query;
    let sql = 'SELECT * FROM blotter WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status=?'; params.push(status); }
    if (q) {
      sql += ' AND (complainant LIKE ? OR respondent LIKE ? OR incident_type LIKE ? OR case_number LIKE ?)';
      const lk = `%${q}%`;
      params.push(lk,lk,lk,lk);
    }
    sql += ' ORDER BY created_at DESC';
    const rows = await db.all(sql, params);
    const all  = await db.all('SELECT status FROM blotter', []);
    const stats = {
      total:    all.length,
      open:     all.filter(r => r.status==='Open').length,
      ongoing:  all.filter(r => r.status==='Ongoing').length,
      settled:  all.filter(r => r.status==='Settled').length,
      dismissed:all.filter(r => r.status==='Dismissed').length,
    };
    res.json({ data: rows, stats });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

blotter.post('/', requireAdmin, async (req, res) => {
  try {
    const all = await db.all('SELECT id FROM blotter', []);
    const id  = all.length + 1;
    const year = new Date().getFullYear();
    const case_number = `BLT-${year}-${String(id).padStart(5,'0')}`;
    const { complainant,respondent,incident_type='',description='',status='Open' } = req.body;
    const r = await db.run(
      'INSERT INTO blotter (case_number,complainant,respondent,incident_type,description,status) VALUES (?,?,?,?,?,?)',
      [case_number,complainant,respondent,incident_type,description,status]
    );
    await logHistory('Blotter Filed', `${complainant} vs ${respondent}`, req.session.userId);
    res.status(201).json(await db.one('SELECT * FROM blotter WHERE id=?', [r.insertId]));
  } catch(e) { res.status(500).json({ message: e.message }); }
});

blotter.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { complainant,respondent,incident_type='',description='',status='Open' } = req.body;
    await db.run(
      'UPDATE blotter SET complainant=?,respondent=?,incident_type=?,description=?,status=?,updated_at=NOW() WHERE id=?',
      [complainant,respondent,incident_type,description,status,req.params.id]
    );
    res.json(await db.one('SELECT * FROM blotter WHERE id=?', [req.params.id]));
  } catch(e) { res.status(500).json({ message: e.message }); }
});

blotter.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await db.run('DELETE FROM blotter WHERE id=?', [req.params.id]);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.use('/api/blotter', blotter);

// ════════════════════════════════════════════════════════════════════════════
// DOCUMENT FACTORY
// ════════════════════════════════════════════════════════════════════════════
const FEES = { clearance:50, indigency:0, residency:50, permits:200 };
const DOC_LABELS = { clearance:'Clearance', indigency:'Indigency', residency:'Residency', permits:'Permit' };

function makeDocRouter(table, label) {
  const r = express.Router();

  // Admin: get all
  r.get('/admin', requireAdmin, async (req, res) => {
    try {
      const { status, q, search } = req.query;
      const term = q || search || '';
      let sql = `SELECT * FROM \`${table}\` WHERE (deleted IS NULL OR deleted=0)`;
      const params = [];
      if (status) { sql += ' AND status=?'; params.push(status); }
      if (term) {
        sql += ' AND (full_name LIKE ? OR purpose LIKE ? OR ref_number LIKE ?)';
        const lk = `%${term}%`;
        params.push(lk,lk,lk);
      }
      sql += ' ORDER BY created_at DESC';
      const rows = await db.all(sql, params);
      const all  = await db.all(`SELECT status FROM \`${table}\` WHERE (deleted IS NULL OR deleted=0)`, []);
      const stats = {
        total:    all.length,
        pending:  all.filter(x => x.status==='Pending').length,
        released: all.filter(x => x.status==='Released').length,
        rejected: all.filter(x => x.status==='Rejected').length,
      };
      res.json({ data: rows, stats });
    } catch(e) { res.status(500).json({ message: e.message }); }
  });

  // Resident: get own
  r.get('/my', requireAuth, async (req, res) => {
    try {
      const rows = await db.all(`SELECT * FROM \`${table}\` WHERE requested_by=? ORDER BY created_at DESC`, [req.session.userId]);
      res.json({ data: rows });
    } catch(e) { res.status(500).json({ message: e.message }); }
  });

  // Create (resident — must be verified)
  r.post('/', requireVerified, async (req, res) => {
    try {
      const user = await db.one('SELECT * FROM users WHERE id=?', [req.session.userId]);
      const fullName = user
        ? [user.first_name, user.middle_name||'', user.last_name, user.suffix||''].filter(p => p && String(p).trim()).join(' ')
        : '';
      const ref = await makeRefNumber(table);
      const result = await db.run(
        `INSERT INTO \`${table}\` (ref_number,full_name,purpose,address,requested_by,status) VALUES (?,?,?,?,?,?)`,
        [ref, fullName, req.body.purpose||'', req.body.address||'', req.session.userId, 'Pending']
      );
      await logHistory(`${label} Requested`, `Ref: ${ref}`, req.session.userId);
      const row = await db.one(`SELECT * FROM \`${table}\` WHERE id=?`, [result.insertId]);
      res.status(201).json(row);
    } catch(e) { res.status(500).json({ message: e.message }); }
  });

  // Update status (admin)
  r.patch('/:id/status', requireAdmin, async (req, res) => {
    try {
      const doc = await db.one(`SELECT * FROM \`${table}\` WHERE id=?`, [req.params.id]);
      if (!doc) return res.status(404).json({ message: 'Not found' });

      let { status, rejection_reason='', issued_by='' } = req.body;
      let or_number  = doc.or_number;
      let date_issued = doc.date_issued;

      // Auto-create payment on Approve
      if (status === 'Approved') {
        const existing = await db.one(
          "SELECT id FROM payments WHERE doc_ref_number=? AND payment_status != 'Rejected'",
          [doc.ref_number]
        );
        if (!existing) {
          const payer = doc.requested_by
            ? await db.one('SELECT * FROM users WHERE id=?', [doc.requested_by])
            : null;
          await db.run(
            `INSERT INTO payments (doc_ref_number,doc_table,doc_type,full_name,first_name,last_name,
             paid_by,amount,payment_status) VALUES (?,?,?,?,?,?,?,?,?)`,
            [doc.ref_number, table, label,
             doc.full_name, payer?.first_name||'', payer?.last_name||'',
             doc.requested_by||null, FEES[table]??50, 'Awaiting Payment']
          );
          await logHistory(`${label} Payment Created`, `Ref: ${doc.ref_number}`, req.session.userId);
        }
      }

      // Auto-generate OR number on Release (shared counter across all doc tables)
      if (status === 'Released') {
        if (!or_number) {
          or_number = await makeOrNumber();
        }
        if (!date_issued) date_issued = new Date();
      }

      await db.run(
        `UPDATE \`${table}\` SET status=?,rejection_reason=?,issued_by=?,or_number=?,date_issued=?,updated_at=NOW() WHERE id=?`,
        [status, rejection_reason, issued_by, or_number||null, date_issued||null, req.params.id]
      );
      await logHistory(`${label} ${status}`, `Ref: ${doc.ref_number}`, req.session.userId);
      const updated = await db.one(`SELECT * FROM \`${table}\` WHERE id=?`, [req.params.id]);
      res.json(updated);
    } catch(e) { res.status(500).json({ message: e.message }); }
  });

  // Walk-in
  r.post('/walkin', requireAdmin, async (req, res) => {
    try {
      const ref = await makeRefNumber(table);
      const or_number = await makeOrNumber();
      const now = new Date();
      const result = await db.run(
        `INSERT INTO \`${table}\` (ref_number,full_name,purpose,address,requested_by,status,or_number,issued_by,date_issued,walkin,updated_at)
         VALUES (?,?,?,?,NULL,'Released',?,?,?,1,NOW())`,
        [ref, req.body.full_name, req.body.purpose||'', req.body.address||'', or_number, req.body.issued_by||'', now]
      );
      const amount  = req.body.amount ?? FEES[table] ?? 50;
      const txn     = `TXN-${Date.now()}`;
      const method  = req.body.payment_method || 'Cash';
      const gcashNo = method === 'GCash' ? (req.body.gcash_number || null) : null;
      const mayaNo  = method === 'Maya'  ? (req.body.maya_number  || null) : null;
      // Prefer explicit first/last name fields; fall back to splitting full_name
      const walkinFirst = req.body.first_name || req.body.full_name.split(' ')[0] || '';
      const walkinLast  = req.body.last_name  || req.body.full_name.split(' ').slice(1).join(' ') || '';
      await db.run(
        `INSERT INTO payments (doc_ref_number,doc_table,doc_type,full_name,first_name,last_name,
         paid_by,amount,payment_method,gcash_number,maya_number,payment_status,transaction_ref,submitted_at,paid_at)
         VALUES (?,?,?,?,?,?,NULL,?,?,?,?,'Paid',?,NOW(),NOW())`,
        [ref, table, label, req.body.full_name,
         walkinFirst, walkinLast,
         amount, method, gcashNo, mayaNo, txn]
      );
      await logHistory(`${label} Walk-in Released`, `Ref: ${ref} — ${req.body.full_name} (${method})`, req.session.userId);
      const doc = await db.one(`SELECT * FROM \`${table}\` WHERE id=?`, [result.insertId]);
      res.status(201).json({ doc, payment: { transaction_ref: txn } });
    } catch(e) { res.status(500).json({ message: e.message }); }
  });

  // Delete (soft-delete: marks as deleted so doc history is preserved)
  r.delete('/:id', requireAdmin, async (req, res) => {
    try {
      const doc = await db.one(`SELECT * FROM \`${table}\` WHERE id=?`, [req.params.id]);
      if (!doc) return res.status(404).json({ message: 'Not found' });
      await db.run(`UPDATE \`${table}\` SET deleted=1, updated_at=NOW() WHERE id=?`, [req.params.id]);
      await logHistory(`${label} Deleted`, `Ref: ${doc.ref_number} — ${doc.full_name}`, req.session.userId);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ message: e.message }); }
  });

  return r;
}

app.use('/api/clearance', makeDocRouter('clearance','Clearance'));
app.use('/api/indigency', makeDocRouter('indigency','Indigency'));
app.use('/api/residency', makeDocRouter('residency','Residency'));
app.use('/api/permits',   makeDocRouter('permits',  'Permit'));

// ════════════════════════════════════════════════════════════════════════════
// HISTORY
// ════════════════════════════════════════════════════════════════════════════
app.get('/api/history', requireAdmin, async (req, res) => {
  try {
    const rows = await db.all(
      `SELECT h.*, u.first_name, u.last_name FROM history h
       LEFT JOIN users u ON h.performed_by = u.id
       ORDER BY h.created_at DESC`, []
    );
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// VERIFY ACCOUNTS
// ════════════════════════════════════════════════════════════════════════════
const verify = express.Router();

// GET — list all resident accounts with search support
verify.get('/', requireAdmin, async (req, res) => {
  try {
    const { q = '' } = req.query;
    const all   = await db.all("SELECT * FROM users WHERE role='resident'", []);
    const strip = ({ password, security_answer, ...u }) => u;
    const term  = q.toLowerCase();
    const match = u =>
      !term ||
      u.first_name.toLowerCase().includes(term) ||
      u.last_name.toLowerCase().includes(term)  ||
      u.username.toLowerCase().includes(term)    ||
      (u.email || '').toLowerCase().includes(term);

    const pending     = all.filter(u => u.status === 'pending'      && match(u)).map(strip);
    const verified    = all.filter(u => u.status === 'verified'     && match(u)).map(strip);
    const deactivated = all.filter(u => u.status === 'deactivated'  && match(u)).map(strip);
    const rejected    = all.filter(u => u.status === 'rejected'     && match(u)).map(strip);

    res.json({
      pending,
      verified,
      deactivated,
      rejected,
      stats: {
        pending:     all.filter(u => u.status === 'pending').length,
        verified:    all.filter(u => u.status === 'verified').length,
        deactivated: all.filter(u => u.status === 'deactivated').length,
        rejected:    all.filter(u => u.status === 'rejected').length,
      },
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// APPROVE — verify account and sync to residents table
verify.patch('/:id/approve', requireAdmin, async (req, res) => {
  try {
    const user = await db.one('SELECT * FROM users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ message: 'Not found' });
    await db.run("UPDATE users SET status='verified' WHERE id=?", [user.id]);
    const existing = await db.one('SELECT id FROM residents WHERE user_id=?', [user.id]);
    if (!existing) {
      await db.run(
        `INSERT INTO residents (user_id,first_name,last_name,middle_name,suffix,gender,age,
         purok,contact,address,is_voter,is_pwd,is_senior,is_minor)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [user.id, user.first_name, user.last_name, user.middle_name||'', user.suffix||'',
         user.gender||'', user.age||null, user.purok||'',
         user.contact_number||user.contact||'', user.address||user.purok||'',
         user.is_voter?1:0, user.is_pwd?1:0, user.is_senior?1:0, user.is_minor?1:0]
      );
    }
    await logHistory('Account Approved', `${user.first_name} ${user.last_name}`, req.session.userId);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// REJECT — soft-reject: keeps the row with status='rejected' and stores the reason
verify.delete('/:id/reject', requireAdmin, async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const user = await db.one('SELECT * FROM users WHERE id=?', [req.params.id]);
    if (!user) return res.status(404).json({ message: 'Not found' });
    await db.run(
      "UPDATE users SET status='rejected', rejection_reason=? WHERE id=?",
      [reason, req.params.id]
    );
    await logHistory(
      'Account Rejected',
      `${user.first_name} ${user.last_name}${reason ? ` — Reason: ${reason}` : ''}`,
      req.session.userId
    );
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// RE-EVALUATE — move a rejected account back to pending
verify.patch('/:id/reevaluate', requireAdmin, async (req, res) => {
  try {
    const user = await db.one("SELECT * FROM users WHERE id=? AND status='rejected'", [req.params.id]);
    if (!user) return res.status(404).json({ message: 'Not found' });
    await db.run("UPDATE users SET status='pending', rejection_reason='' WHERE id=?", [req.params.id]);
    await logHistory('Account Re-evaluated', `${user.first_name} ${user.last_name}`, req.session.userId);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// DEACTIVATE / REACTIVATE toggle for verified accounts
verify.patch('/:id/toggle-status', requireAdmin, async (req, res) => {
  try {
    const user = await db.one("SELECT * FROM users WHERE id=? AND role='resident'", [req.params.id]);
    if (!user) return res.status(404).json({ message: 'Not found' });
    const newStatus = user.status === 'deactivated' ? 'verified' : 'deactivated';
    await db.run('UPDATE users SET status=? WHERE id=?', [newStatus, user.id]);
    await logHistory(
      newStatus === 'deactivated' ? 'Account Deactivated' : 'Account Reactivated',
      `${user.first_name} ${user.last_name}`,
      req.session.userId
    );
    res.json({ ok: true, newStatus });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// RESET PASSWORD
verify.patch('/:id/reset-password', requireAdmin,
  body('new_password').isLength({ min:8 }),
  async (req, res) => {
    if (validationGuard(req, res)) return;
    try {
      const user = await db.one('SELECT * FROM users WHERE id=?', [req.params.id]);
      if (!user) return res.status(404).json({ message: 'Not found' });
      await db.run('UPDATE users SET password=? WHERE id=?',
        [bcrypt.hashSync(req.body.new_password, 10), req.params.id]);
      await logHistory('Password Reset by Admin', `${user.first_name} ${user.last_name}`, req.session.userId);
      res.json({ ok: true });
    } catch(e) { res.status(500).json({ message: e.message }); }
  }
);

// PERMANENT DELETE (verified accounts only)
verify.delete('/:id/delete', requireAdmin, async (req, res) => {
  try {
    const user = await db.one("SELECT * FROM users WHERE id=? AND role='resident'", [req.params.id]);
    if (!user) return res.status(404).json({ message: 'Not found' });
    await db.run('DELETE FROM users WHERE id=?', [req.params.id]);
    await logHistory('Account Deleted by Admin', `${user.first_name} ${user.last_name}`, req.session.userId);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.use('/api/verify', verify);

// ════════════════════════════════════════════════════════════════════════════
// PAYMENTS
// ════════════════════════════════════════════════════════════════════════════
const payments = express.Router();

payments.post('/pay', requireAuth, async (req, res) => {
  try {
    // Find payment by doc_ref_number — match by paid_by OR paid_by is null (walk-in approved)
    const existing = await db.one(
      `SELECT * FROM payments 
       WHERE doc_ref_number=? 
         AND (paid_by=? OR paid_by IS NULL)
         AND payment_status IN ('Awaiting Payment','Pending')`,
      [req.body.doc_ref_number, req.session.userId]
    );
    if (!existing) return res.status(404).json({ message: 'No pending payment found.' });
    if (existing.payment_status === 'Pending')
      return res.status(409).json({ message: 'Payment already submitted.' });
    const txn = `TXN-${Date.now()}`;
    await db.run(
      `UPDATE payments SET 
         payment_method=?, gcash_number=?, maya_number=?,
         transaction_ref=?, payment_status='Pending',
         paid_by=?, submitted_at=NOW()
       WHERE id=?`,
      [req.body.payment_method, req.body.gcash_number||null, req.body.maya_number||null,
       txn, req.session.userId, existing.id]
    );
    await logHistory('Payment Submitted', `Ref: ${req.body.doc_ref_number} via ${req.body.payment_method}`, req.session.userId);
    res.json({ ...existing, transaction_ref:txn, payment_status:'Pending', message:'Payment submitted.' });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

payments.get('/my', requireAuth, async (req, res) => {
  try {
    // Only return payments the resident has actually submitted (not just Awaiting Payment)
    const rows = await db.all(
      "SELECT * FROM payments WHERE paid_by=? AND payment_status != 'Awaiting Payment' ORDER BY created_at DESC",
      [req.session.userId]
    );
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

payments.get('/doc/:ref', requireAuth, async (req, res) => {
  try {
    const rows = await db.all(
      "SELECT * FROM payments WHERE doc_ref_number=? AND payment_status != 'Rejected' ORDER BY id DESC",
      [req.params.ref]
    );
    // Return the most recent non-rejected payment for this document
    res.json({ data: rows[0] || null });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

payments.get('/admin', requireAdmin, async (req, res) => {
  try {
    const { status, method } = req.query;
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND payment_status=?'; params.push(status); }
    if (method) { sql += ' AND payment_method=?'; params.push(method); }
    sql += ' ORDER BY created_at DESC';
    const rows = await db.all(sql, params);
    const all  = await db.all('SELECT payment_status, amount FROM payments', []);
    const stats = {
      total:           all.length,
      pending:         all.filter(p => p.payment_status==='Pending').length,
      paid:            all.filter(p => p.payment_status==='Paid').length,
      total_collected: all.filter(p => p.payment_status==='Paid').reduce((s,p) => s+Number(p.amount),0),
    };
    res.json({ data: rows, stats });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// Accept cash payment for an online request (resident came to the hall instead of paying online)
payments.patch('/:id/accept-cash', requireAdmin, async (req, res) => {
  try {
    const payment = await db.one('SELECT * FROM payments WHERE id=?', [req.params.id]);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.payment_status !== 'Awaiting Payment')
      return res.status(409).json({ message: 'Only payments with status "Awaiting Payment" can be accepted as cash.' });

    const txn = `TXN-${Date.now()}`;
    await db.run(
      `UPDATE payments SET payment_method='Cash', payment_status='Paid',
       transaction_ref=?, paid_by=paid_by, submitted_at=NOW(), paid_at=NOW()
       WHERE id=?`,
      [txn, payment.id]
    );

    // Auto-release the linked document
    if (payment.doc_table && payment.doc_ref_number) {
      const doc = await db.one(
        `SELECT * FROM \`${payment.doc_table}\` WHERE ref_number=?`,
        [payment.doc_ref_number]
      );
      if (doc && doc.status === 'Approved') {
        const orNumber = await makeOrNumber();
        await db.run(
          `UPDATE \`${payment.doc_table}\` SET status='Released', or_number=?, date_issued=NOW(), updated_at=NOW() WHERE ref_number=?`,
          [orNumber, payment.doc_ref_number]
        );
        await logHistory(
          `${payment.doc_type} Released (Cash Payment at Hall)`,
          `Ref: ${payment.doc_ref_number} — ${payment.full_name}`,
          req.session.userId
        );
      }
    }

    await logHistory(
      'Cash Payment Accepted',
      `Ref: ${payment.doc_ref_number} — ${payment.full_name} | TXN: ${txn}`,
      req.session.userId
    );

    const updated = await db.one('SELECT * FROM payments WHERE id=?', [payment.id]);
    res.json({ ...updated, transaction_ref: txn });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

payments.patch('/:id/confirm', requireAdmin, async (req, res) => {
  try {
    await db.run("UPDATE payments SET payment_status='Paid', paid_at=NOW() WHERE id=?", [req.params.id]);
    const payment = await db.one('SELECT * FROM payments WHERE id=?', [req.params.id]);

    // Auto-release the linked document when payment is confirmed
    if (payment && payment.doc_table && payment.doc_ref_number) {
      const doc = await db.one(
        `SELECT * FROM \`${payment.doc_table}\` WHERE ref_number=?`,
        [payment.doc_ref_number]
      );
      if (doc && doc.status === 'Approved') {
        const orNumber = await makeOrNumber();
        await db.run(
          `UPDATE \`${payment.doc_table}\` SET status='Released', or_number=?, date_issued=NOW(), updated_at=NOW() WHERE ref_number=?`,
          [orNumber, payment.doc_ref_number]
        );
        await logHistory(
          `${payment.doc_type} Released (Payment Confirmed)`,
          `Ref: ${payment.doc_ref_number}`,
          req.session.userId
        );
      }
    }

    res.json(payment);
  } catch(e) { res.status(500).json({ message: e.message }); }
});

payments.patch('/:id/reject', requireAdmin, async (req, res) => {
  try {
    await db.run("UPDATE payments SET payment_status='Rejected' WHERE id=?", [req.params.id]);
    res.json(await db.one('SELECT * FROM payments WHERE id=?', [req.params.id]));
  } catch(e) { res.status(500).json({ message: e.message }); }
});

app.use('/api/payments', payments);

// ════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
app.get('/api/dashboard', requireAdmin, async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const [pending]  = await pool.execute(
      "SELECT COUNT(*) as c FROM (SELECT id FROM clearance WHERE status='Pending' UNION ALL SELECT id FROM indigency WHERE status='Pending' UNION ALL SELECT id FROM residency WHERE status='Pending' UNION ALL SELECT id FROM permits WHERE status='Pending') t"
    );
    const [toVerify] = await pool.execute("SELECT COUNT(*) as c FROM users WHERE status='pending' AND role='resident'");
    const [residents]= await pool.execute("SELECT COUNT(*) as c FROM residents");
    const [totalDocs]= await pool.execute(
      "SELECT COUNT(*) as c FROM (SELECT id FROM clearance UNION ALL SELECT id FROM indigency UNION ALL SELECT id FROM residency UNION ALL SELECT id FROM permits) t"
    );

    // Monthly counts
    const [monthly] = await pool.execute(
      `SELECT MONTH(created_at) as month, COUNT(*) as count
       FROM (SELECT created_at FROM clearance WHERE YEAR(created_at)=?
             UNION ALL SELECT created_at FROM indigency WHERE YEAR(created_at)=?
             UNION ALL SELECT created_at FROM residency WHERE YEAR(created_at)=?
             UNION ALL SELECT created_at FROM permits WHERE YEAR(created_at)=?) t
       GROUP BY MONTH(created_at)`, [year,year,year,year]
    );

    const [blotterStats] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM blotter GROUP BY status'
    );
    const [zoneStats] = await pool.execute(
      'SELECT purok, COUNT(*) as count FROM residents WHERE purok != "" GROUP BY purok ORDER BY purok'
    );

    res.json({
      stats: {
        pending:   pending[0].c,
        toVerify:  toVerify[0].c,
        residents: residents[0].c,
        totalDocs: totalDocs[0].c,
      },
      monthly,
      blotterStats,
      zoneStats,
    });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ════════════════════════════════════════════════════════════════════════════
// DOC HISTORY
// ════════════════════════════════════════════════════════════════════════════
app.get('/api/doc-history', requireAdmin, async (req, res) => {
  try {
    const { search, status, type } = req.query;
    const DOC_LABELS = {
      clearance:'Barangay Clearance', indigency:'Cert. of Indigency',
      residency:'Cert. of Residency', permits:'Business Permit',
    };
    let rows = [];
    for (const [table, docLabel] of Object.entries(DOC_LABELS)) {
      let sql = `SELECT *, '${docLabel}' as doc_type FROM \`${table}\` WHERE status IN ('Released','Rejected')`;
      const params = [];
      if (status) { sql += ' AND status=?'; params.push(status); }
      if (search) {
        sql += ' AND (full_name LIKE ? OR ref_number LIKE ? OR purpose LIKE ?)';
        const lk = `%${search}%`;
        params.push(lk,lk,lk);
      }
      if (type && type !== docLabel) continue;
      const r = await db.all(sql, params);
      rows = rows.concat(r);
    }
    rows.sort((a,b) => new Date(b.updated_at||b.created_at) - new Date(a.updated_at||a.created_at));
    res.json({ data: rows });
  } catch(e) { res.status(500).json({ message: e.message }); }
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`✅  Brgy backend running → http://localhost:${PORT}`);
  // Auto-create admin if none exists
  try {
    const admin = await db.one("SELECT id FROM users WHERE role='admin' LIMIT 1", []);
    if (!admin) {
      const pw  = bcrypt.hashSync('Admin@1234', 10);
      const ans = bcrypt.hashSync('admin', 10);
      await db.run(
        `INSERT INTO users (username,password,role,status,first_name,last_name,security_question,security_answer)
         VALUES (?,?,'admin','verified','Admin','User',?,?)`,
        ['admin', pw, 'What is your favorite childhood nickname?', ans]
      );
      console.log('   ✅ Default admin created → username: admin  password: Admin@1234');
    } else {
      console.log('   Admin account found. Default password (if unchanged): Admin@1234');
    }
  } catch(e) {
    console.error('   ⚠️  Could not check/create admin:', e.message);
  }
});
