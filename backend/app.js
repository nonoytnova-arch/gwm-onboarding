const express = require('express');
const cors = require('cors');
require('dotenv').config();

const captchaRoutes = require('./routes/captchaRoutes');
const otpRoutes = require('./routes/otpRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const documentRoutes = require('./routes/documentRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

app.use(cors());
app.use(express.json());
// NOTE: uploaded documents (PAN, licences, cheques) are deliberately NOT
// served via express.static — see /api/admin/documents/:docId/file in
// adminRoutes.js, which requires an authenticated admin token instead.

app.get('/', (req, res) => {
  res.json({ message: 'Gale World Wide Movers — Onboarding API is running' });
});

app.use('/api/captcha', captchaRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/submissions', documentRoutes); // mounts /:id/documents and /documents/:docId
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Multer's file-too-large / file-type errors land here if they escape the
// inline handler in documentRoutes.js.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Gale World Wide Movers onboarding backend running on http://0.0.0.0:${PORT}`);
});
