/**
 * SSOT ALERT NOTIFICATION SERVICE
 * ================================
 * 
 * Sends email/SMS alerts when SSOT validation fails critically.
 * 
 * Supports:
 * - Email via Resend API (recommended)
 * - SMS via Twilio
 * - Slack webhooks
 * - Generic webhooks (Zapier, IFTTT, etc.)
 * 
 * Setup:
 * 1. Add API keys to .env file
 * 2. Configure alert recipients
 * 3. Alerts auto-trigger when SSOT score drops below threshold
 */

import { supabase } from '@/services/supabaseClient';

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

export const ALERT_CONFIG = {
  // Score thresholds that trigger alerts
  criticalThreshold: 50,   // Immediate alert (email + SMS)
  warningThreshold: 70,    // Warning alert (email only)
  
  // Cooldown to prevent alert spam (minutes)
  alertCooldownMinutes: 15,
  
  // Recipients
  alertEmail: import.meta.env.VITE_ALERT_EMAIL || 'admin@merlinenergy.net',
  alertPhone: import.meta.env.VITE_ALERT_PHONE || '', // +1234567890 format
  slackWebhook: import.meta.env.VITE_SLACK_WEBHOOK || '',
  
  // API Keys (from environment)
  resendApiKey: import.meta.env.VITE_RESEND_API_KEY || '',
  twilioAccountSid: import.meta.env.VITE_TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: import.meta.env.VITE_TWILIO_AUTH_TOKEN || '',
  twilioFromNumber: import.meta.env.VITE_TWILIO_FROM_NUMBER || '',
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AlertPayload {
  score: number;
  useCase: string;
  location: string;
  errors: string[];
  timestamp: string;
  sessionId?: string;
}

interface AlertRecord {
  id?: string;
  created_at?: string;
  alert_type: 'critical' | 'warning';
  score: number;
  payload: AlertPayload;
  email_sent: boolean;
  sms_sent: boolean;
  slack_sent: boolean;
}

// Track last alert time to prevent spam
let lastAlertTime: number = 0;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN ALERT FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check score and send appropriate alerts
 * Call this from the validation service when score is calculated
 */
export async function checkAndAlert(payload: AlertPayload): Promise<{
  alertSent: boolean;
  channels: string[];
}> {
  const { score } = payload;
  const channels: string[] = [];
  
  // Check if we should alert based on score
  if (score >= ALERT_CONFIG.warningThreshold) {
    return { alertSent: false, channels: [] };
  }
  
  // Check cooldown to prevent spam
  const now = Date.now();
  const cooldownMs = ALERT_CONFIG.alertCooldownMinutes * 60 * 1000;
  if (now - lastAlertTime < cooldownMs) {
    console.log('⏳ Alert cooldown active, skipping notification');
    return { alertSent: false, channels: ['cooldown'] };
  }
  
  lastAlertTime = now;
  const isCritical = score < ALERT_CONFIG.criticalThreshold;
  const alertType = isCritical ? 'critical' : 'warning';
  
  // Log alert to database first
  await logAlertToDatabase(alertType, payload);
  
  // Send notifications based on severity
  if (isCritical) {
    // CRITICAL: Send all channels
    if (ALERT_CONFIG.resendApiKey && ALERT_CONFIG.alertEmail) {
      const emailSent = await sendEmailAlert(payload);
      if (emailSent) channels.push('email');
    }
    
    if (ALERT_CONFIG.twilioAccountSid && ALERT_CONFIG.alertPhone) {
      const smsSent = await sendSMSAlert(payload);
      if (smsSent) channels.push('sms');
    }
    
    if (ALERT_CONFIG.slackWebhook) {
      const slackSent = await sendSlackAlert(payload);
      if (slackSent) channels.push('slack');
    }
  } else {
    // WARNING: Email + Slack only
    if (ALERT_CONFIG.resendApiKey && ALERT_CONFIG.alertEmail) {
      const emailSent = await sendEmailAlert(payload);
      if (emailSent) channels.push('email');
    }
    
    if (ALERT_CONFIG.slackWebhook) {
      const slackSent = await sendSlackAlert(payload);
      if (slackSent) channels.push('slack');
    }
  }
  
  console.log(`🚨 SSOT Alert sent via: ${channels.join(', ') || 'none (no channels configured)'}`);
  
  return { alertSent: channels.length > 0, channels };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EMAIL ALERT (via Resend)
// ═══════════════════════════════════════════════════════════════════════════════

async function sendEmailAlert(payload: AlertPayload): Promise<boolean> {
  try {
    const isCritical = payload.score < ALERT_CONFIG.criticalThreshold;
    const subject = isCritical 
      ? `🚨 CRITICAL: Merlin SSOT Validation Failed (${payload.score}%)`
      : `⚠️ WARNING: Merlin SSOT Score Low (${payload.score}%)`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: ${isCritical ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">
            ${isCritical ? '🚨 CRITICAL SSOT FAILURE' : '⚠️ SSOT Warning'}
          </h1>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Score:</td>
              <td style="padding: 8px 0; color: ${isCritical ? '#dc2626' : '#f59e0b'}; font-size: 24px; font-weight: bold;">
                ${payload.score}%
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Use Case:</td>
              <td style="padding: 8px 0;">${payload.useCase}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Location:</td>
              <td style="padding: 8px 0;">${payload.location}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Time:</td>
              <td style="padding: 8px 0;">${new Date(payload.timestamp).toLocaleString()}</td>
            </tr>
          </table>
          
          <h3 style="margin-top: 20px; color: #374151;">Errors Detected:</h3>
          <ul style="background: #fee2e2; padding: 15px 15px 15px 35px; border-radius: 4px; margin: 0;">
            ${payload.errors.map(e => `<li style="margin: 5px 0;">${e}</li>`).join('')}
          </ul>
          
          <div style="margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 4px;">
            <strong>Action Required:</strong> Check the SSOT calculation services:
            <ul style="margin: 10px 0 0 0; padding-left: 20px;">
              <li>unifiedQuoteCalculator.ts</li>
              <li>equipmentCalculations.ts</li>
              <li>centralizedCalculations.ts</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #1e293b; color: #94a3b8; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px;">
          Session: ${payload.sessionId || 'N/A'}<br>
          Merlin BESS Quote Builder - SSOT Monitoring
        </div>
      </div>
    `;
    
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ALERT_CONFIG.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Merlin Alerts <alerts@merlinenergy.net>',
        to: ALERT_CONFIG.alertEmail,
        subject,
        html,
      }),
    });
    
    if (!response.ok) {
      console.error('Email alert failed:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Email alert error:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMS ALERT (via Twilio)
// ═══════════════════════════════════════════════════════════════════════════════

async function sendSMSAlert(payload: AlertPayload): Promise<boolean> {
  try {
    const message = `🚨 MERLIN SSOT ALERT\nScore: ${payload.score}%\nUse Case: ${payload.useCase}\nErrors: ${payload.errors.length}\nCheck logs immediately!`;
    
    const auth = btoa(`${ALERT_CONFIG.twilioAccountSid}:${ALERT_CONFIG.twilioAuthToken}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${ALERT_CONFIG.twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: ALERT_CONFIG.twilioFromNumber,
          To: ALERT_CONFIG.alertPhone,
          Body: message,
        }),
      }
    );
    
    if (!response.ok) {
      console.error('SMS alert failed:', await response.text());
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('SMS alert error:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SLACK ALERT
// ═══════════════════════════════════════════════════════════════════════════════

async function sendSlackAlert(payload: AlertPayload): Promise<boolean> {
  try {
    const isCritical = payload.score < ALERT_CONFIG.criticalThreshold;
    
    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: isCritical ? '🚨 CRITICAL: SSOT Validation Failed' : '⚠️ SSOT Warning',
            emoji: true,
          },
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Score:*\n${payload.score}%` },
            { type: 'mrkdwn', text: `*Use Case:*\n${payload.useCase}` },
            { type: 'mrkdwn', text: `*Location:*\n${payload.location}` },
            { type: 'mrkdwn', text: `*Time:*\n${new Date(payload.timestamp).toLocaleString()}` },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Errors:*\n${payload.errors.map(e => `• ${e}`).join('\n')}`,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Session: ${payload.sessionId || 'N/A'}`,
            },
          ],
        },
      ],
    };
    
    const response = await fetch(ALERT_CONFIG.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Slack alert error:', error);
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DATABASE LOGGING
// ═══════════════════════════════════════════════════════════════════════════════

async function logAlertToDatabase(
  alertType: 'critical' | 'warning',
  payload: AlertPayload
): Promise<void> {
  try {
    const { error } = await supabase
      .from('ssot_alerts')
      .insert({
        alert_type: alertType,
        score: payload.score,
        use_case: payload.useCase,
        location: payload.location,
        errors: payload.errors,
        session_id: payload.sessionId,
      });
    
    if (error) {
      console.error('Failed to log alert to database:', error);
    }
  } catch (err) {
    console.error('Database alert logging error:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT FOR USE IN VALIDATOR
// ═══════════════════════════════════════════════════════════════════════════════

export default {
  checkAndAlert,
  ALERT_CONFIG,
};
