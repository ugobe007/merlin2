# 📧 AI Agent Email Notifications - Setup Complete

**Your Email:** ugobe07@gmail.com  
**Status:** ✅ Configured  
**Date:** February 4, 2026

---

## What Was Configured

Your email has been added to the AI Agent notification system. You'll receive alerts when:

- 🔴 **Database failures** - Supabase connection issues
- 🔴 **API failures** - Backend service unreachable
- 🟡 **Network timeouts** - Server overload
- 🚨 **Critical infrastructure issues**

---

## Notification Methods

### 1. **Console Logs** (Always On)
All alerts logged to browser console with action steps:
```
🚨 [ADMIN ALERT] CRITICAL: Database Connection Failed
   Category: database
   ⚡ ACTION REQUIRED: Check Supabase dashboard
   👥 Affected Users: ~3
```

### 2. **Email Alerts** (Configured)

**Development Mode:**
- Click-to-send mailto links in console
- Opens your email client with pre-filled alert

**Production Mode:**
- Automatic emails via API endpoint
- Requires backend email service (SendGrid/Mailgun/SES)

**Example Email:**
```
Subject: 🚨 MERLIN ALERT: API Endpoints Failing

ADMIN ALERT
===========

Severity: CRITICAL
Category: api
Timestamp: Feb 4, 2026 3:45 PM

Description:
5 API failures. Affected: /api/location, /api/places

ACTION REQUIRED:
Check backend health: curl https://merlin2.fly.dev/health
Check Fly.io logs: flyctl logs

Affected Users: ~3
```

### 3. **Slack Alerts** (Optional - Not Yet Configured)

To enable Slack notifications:
1. Create Slack webhook: https://api.slack.com/messaging/webhooks
2. Update config in `wizardAIAgentV2.ts`:
   ```typescript
   const ADMIN_CONFIG = {
     slackWebhook: 'https://hooks.slack.com/services/YOUR_WEBHOOK',
     enableSlackAlerts: true,
   };
   ```

---

## Configuration File

Location: `/src/services/wizardAIAgentV2.ts`

```typescript
const ADMIN_CONFIG = {
  email: 'ugobe07@gmail.com',           // ✅ Your email
  slackWebhook: null,                    // Add Slack webhook here
  enableEmailAlerts: true,               // ✅ Enabled
  enableSlackAlerts: false,              // Set to true after adding webhook
  enableConsoleAlerts: true,             // ✅ Always on
};
```

---

## Testing Email Notifications

### In Development (Local)

```bash
# 1. Start wizard
cd /Users/robertchristopher/merlin3
npm run dev

# 2. Open dashboard
# Visit: http://localhost:5178/wizard?health=1

# 3. Trigger an alert
# - Simulate database error (3+ db errors)
# - OR simulate API failure (3+ API errors)

# 4. Check browser console
📧 [Email Alert] Ready to send to ugobe07@gmail.com
   Click here to send: mailto:ugobe07@gmail.com?subject=...

# 5. Click the mailto link
# Your email client will open with pre-filled alert
```

### In Production

After deploying, create backend endpoint:

**File:** `server/routes/admin.js`
```javascript
// Using SendGrid example
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/admin/send-alert', async (req, res) => {
  const { to, subject, body, alert } = req.body;
  
  try {
    await sgMail.send({
      to,
      from: 'alerts@merlinbess.com', // Your verified sender
      subject,
      text: body,
      html: `
        <h2>🚨 ${alert.title}</h2>
        <p><strong>Severity:</strong> ${alert.severity}</p>
        <p><strong>Category:</strong> ${alert.category}</p>
        <p>${alert.description}</p>
        <h3>Action Required:</h3>
        <pre>${alert.actionRequired}</pre>
        <p><strong>Affected Users:</strong> ~${alert.affectedUsers}</p>
      `,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Email send failed:', error);
    res.status(500).json({ error: error.message });
  }
});
```

---

## Email Service Options

### SendGrid (Recommended)
- Free: 100 emails/day
- Setup: https://sendgrid.com/
- API key needed: `SENDGRID_API_KEY`

### Mailgun
- Free: 5,000 emails/month
- Setup: https://www.mailgun.com/
- API key + domain verification

### AWS SES
- $0.10 per 1,000 emails
- Setup: AWS Console → SES
- Requires AWS credentials

### Resend (Modern choice)
- Free: 100 emails/day
- Setup: https://resend.com/
- Simple API, good docs

---

## Current Alert Types

| Alert Type | Severity | Trigger | Email Sent? |
|------------|----------|---------|-------------|
| Database Connection Failed | Critical | 2+ db errors | ✅ Yes |
| API Endpoints Failing | Critical | 3+ API errors | ✅ Yes |
| Network Timeouts | High | 5+ timeout errors | ✅ Yes |

---

## Customizing Alerts

### Change Alert Thresholds

Edit `wizardAIAgentV2.ts`:

```typescript
// Current: 3+ API errors triggers alert
if (apiErrors.length > 3) {
  // Send alert
}

// Change to 5+ errors:
if (apiErrors.length > 5) {
  // Send alert
}
```

### Disable Email Alerts Temporarily

```typescript
const ADMIN_CONFIG = {
  email: 'ugobe07@gmail.com',
  enableEmailAlerts: false,  // Toggle off
};
```

### Add Additional Recipients

```typescript
const ADMIN_CONFIG = {
  email: 'ugobe07@gmail.com',
  ccEmails: ['dev@merlinbess.com', 'ops@merlinbess.com'], // Add array
};

// Update notifyAdmin():
await sgMail.send({
  to: ADMIN_CONFIG.email,
  cc: ADMIN_CONFIG.ccEmails,
  // ...
});
```

---

## Alert History

View all alerts in dashboard:

```
http://localhost:5178/wizard?health=1
```

**Admin Alerts Section** shows:
- Active alerts (last 1 hour)
- Severity and category
- Affected user count
- Action steps
- "Resolved" button to clear

---

## Console Commands

```javascript
// View admin configuration
console.log(ADMIN_CONFIG);

// Get all admin alerts
wizardAIAgent.getAdminAlerts();

// Clear specific alert
wizardAIAgent.clearAdminAlert('database-1738670400000');

// Check if email would be sent
console.log('Email alerts enabled:', ADMIN_CONFIG.enableEmailAlerts);
```

---

## Troubleshooting

### Email not sending in dev?

**Solution:** Check browser console for mailto link and click it manually.

### Email not sending in production?

1. Check API endpoint exists: `/api/admin/send-alert`
2. Verify email service credentials (SendGrid API key, etc.)
3. Check server logs for errors
4. Ensure `ADMIN_CONFIG.enableEmailAlerts = true`

### Getting too many emails?

**Solution:** Increase alert thresholds or add rate limiting:
```typescript
// Only send if no alert in last 15 minutes
const recentAlert = this.adminAlerts.find(
  a => a.category === alert.category && 
       Date.now() - a.timestamp < 900000
);
if (!recentAlert) {
  this.notifyAdmin(alert);
}
```

---

## Next Steps

1. ✅ **Email configured** - Your email is ready
2. ⏳ **Test locally** - Trigger an alert and check console
3. ⏳ **Deploy** - Deploy to production when ready
4. ⏳ **Setup email API** - Add SendGrid/Mailgun for production
5. 🔜 **Add Slack** - Optional Slack webhook integration

---

**Questions?** Check the main documentation:
- `/WIZARD_AI_AGENT_V2_AUTOFIX.md` - Full V2 guide
- `/AI_AGENT_V2_UPGRADE_SUMMARY.md` - Quick summary

**Your alerts are now monitored! 🎉**
