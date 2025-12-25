# Email Alerts Setup Guide

**Last Updated:** January 3, 2025

---

## Overview

The system supports email alerts for validation failures, pricing issues, and critical system events. Alerts are sent via the Resend API.

---

## Email Alert Configuration

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Alert Recipients
VITE_ALERT_EMAIL=viewer@merlinenergy.net  # Email address to receive alerts
VITE_ALERT_PHONE=+1234567890              # Optional: Phone for SMS alerts

# Resend API Configuration (for email)
VITE_RESEND_API_KEY=your_resend_api_key_here

# Twilio Configuration (optional, for SMS)
VITE_TWILIO_ACCOUNT_SID=your_account_sid
VITE_TWILIO_AUTH_TOKEN=your_auth_token
VITE_TWILIO_FROM_NUMBER=+1234567890

# Slack Integration (optional)
VITE_SLACK_WEBHOOK=https://hooks.slack.com/services/your/webhook/url
```

---

## Setting Up Email Alerts for Limited Admin Account

### Default Alert Email

The default alert email is set to `admin@merlinenergy.net`. To send alerts to the limited admin account (`viewer@merlinenergy.net`), update your `.env` file:

```bash
VITE_ALERT_EMAIL=viewer@merlinenergy.net
```

### Multiple Recipients

Currently, the system supports one primary alert email address. To send to multiple recipients, you can:

1. **Use a mailing list/group email** (recommended):
   ```bash
   VITE_ALERT_EMAIL=alerts@merlinenergy.net
   ```
   Then configure `alerts@merlinenergy.net` to forward to multiple recipients in your email provider.

2. **Modify the service** to support multiple emails (code change required).

---

## Alert Types

### Critical Alerts (Score < 50%)
- **Triggers:** Email + SMS + Slack
- **When:** SSOT validation fails critically
- **Frequency:** Once per cooldown period (default: 15 minutes)

### Warning Alerts (Score 50-70%)
- **Triggers:** Email + Slack (no SMS)
- **When:** SSOT score is below warning threshold
- **Frequency:** Once per cooldown period (default: 15 minutes)

---

## Resend API Setup

1. **Sign up for Resend:**
   - Go to https://resend.com
   - Create an account
   - Verify your domain (`merlinenergy.net`)

2. **Get API Key:**
   - Go to API Keys section
   - Create a new API key
   - Copy the key to your `.env` file as `VITE_RESEND_API_KEY`

3. **Verify Domain:**
   - Add DNS records for `merlinenergy.net`
   - This allows you to send emails from `alerts@merlinenergy.net`

---

## Alert Content

Alerts include:
- **SSOT Score** (percentage)
- **Use Case** being validated
- **Location** (ZIP code/state)
- **Timestamp**
- **List of Errors** detected
- **Session ID** (for debugging)

---

## Cooldown Period

Alerts have a cooldown period (default: 15 minutes) to prevent spam. If multiple validation failures occur within the cooldown window, only one alert is sent.

To change the cooldown, edit `src/services/alertNotificationService.ts`:

```typescript
alertCooldownMinutes: 30, // Change to 30 minutes
```

---

## Testing Alerts

### Manual Test

1. Set `VITE_ALERT_EMAIL` to your test email
2. Temporarily lower the threshold in code to trigger an alert
3. Run a validation that will fail
4. Check your email inbox

### In Development

Alerts will only send if:
- `VITE_RESEND_API_KEY` is set
- `VITE_ALERT_EMAIL` is set
- The validation score falls below the threshold

---

## Current Configuration

**Default Alert Email:** `admin@merlinenergy.net`

**To Change:**
1. Update `.env` file with `VITE_ALERT_EMAIL=viewer@merlinenergy.net`
2. Restart the development server
3. Alerts will now be sent to the new address

---

## Troubleshooting

### Alerts Not Sending

1. **Check environment variables:**
   ```bash
   echo $VITE_ALERT_EMAIL
   echo $VITE_RESEND_API_KEY
   ```

2. **Check browser console:**
   - Look for error messages related to email sending
   - Check for API key validation errors

3. **Verify Resend API Key:**
   - Test the key in Resend dashboard
   - Ensure domain is verified

4. **Check cooldown period:**
   - Wait 15 minutes between tests
   - Or temporarily disable cooldown for testing

### Email Not Received

1. Check spam/junk folder
2. Verify email address is correct
3. Check Resend dashboard for delivery status
4. Verify domain DNS records are correct

---

## Security Notes

- **Never commit API keys to git**
- Use environment variables for all sensitive data
- Rotate API keys regularly
- Use separate keys for development and production

---

## Future Enhancements

- [ ] Support multiple email recipients
- [ ] Email templates customization
- [ ] Alert preferences per admin account
- [ ] Webhook support for custom integrations
- [ ] Alert history dashboard

