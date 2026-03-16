# Schedule Demo Feature - Setup Guide

## Overview

The Schedule Demo feature allows users to request a product demonstration through a popup modal form. When submitted, the form sends an email notification to `info@merlinenergy.net`.

## Components

### Frontend

- **ScheduleDemoModal** (`src/components/modals/ScheduleDemoModal.tsx`)
  - Popup form with fields for: name, email, company, phone, preferred date/time, message
  - Validates required fields (name, email, company)
  - Saves to Supabase `demo_requests` table
  - Sends email via backend API
  - Fallback: Opens mailto link if API fails

### Backend

- **Demo Route** (`server/routes/demo.js`)
  - Endpoint: `POST /api/send-demo-request`
  - Uses nodemailer to send formatted HTML emails
  - Email recipient: info@merlinenergy.net

## Email Configuration

### Required Environment Variables

Add these to `server/.env`:

```bash
# Email Service Configuration
EMAIL_SERVICE=gmail              # or: outlook, yahoo, etc.
EMAIL_USER=your-email@gmail.com  # Sending email address
EMAIL_PASSWORD=your-app-password # App-specific password (NOT regular password)
```

### Setting up Gmail App Password (Recommended)

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to Security → 2-Step Verification (enable if not already)
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Copy the 16-character password
6. Add to `server/.env` as `EMAIL_PASSWORD`

### Alternative: Other Email Services

**Outlook/Hotmail:**

```bash
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
```

**Custom SMTP:**

```javascript
// In server/routes/demo.js, replace the transporter with:
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});
```

## Supabase Table Setup

Create the `demo_requests` table in Supabase:

```sql
CREATE TABLE demo_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  preferred_date DATE,
  preferred_time TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX idx_demo_requests_created_at ON demo_requests(created_at DESC);
CREATE INDEX idx_demo_requests_status ON demo_requests(status);
```

## Usage

### In Any Component

```tsx
import ScheduleDemoModal from "@/components/modals/ScheduleDemoModal";

function MyComponent() {
  const [showDemoModal, setShowDemoModal] = useState(false);

  return (
    <>
      <button onClick={() => setShowDemoModal(true)}>Schedule a Demo</button>

      <ScheduleDemoModal isOpen={showDemoModal} onClose={() => setShowDemoModal(false)} />
    </>
  );
}
```

### Already Integrated In

- **CarWashCampaign** component (both hero section and navbar)
- Can be added to any other landing page or component

## Email Template

The email sent to info@merlinenergy.net includes:

- Contact Name
- Email (clickable mailto link)
- Company
- Phone (clickable tel link if provided)
- Preferred Date (formatted)
- Preferred Time
- Additional Message
- Submission Timestamp

## Testing

### Local Development

1. Start the backend server:

   ```bash
   cd server
   npm run dev
   ```

2. Start the frontend:

   ```bash
   npm run dev
   ```

3. Navigate to any page with the Schedule Demo button
4. Fill out and submit the form
5. Check your email (EMAIL_USER) for the notification

### Production Deployment

- Ensure environment variables are set in Fly.io secrets:
  ```bash
  cd /Users/robertchristopher/merlin3
  fly secrets set EMAIL_SERVICE=gmail
  fly secrets set EMAIL_USER=your-email@gmail.com
  fly secrets set EMAIL_PASSWORD=your-app-password
  ```

## Troubleshooting

### Email Not Sending

1. Check server logs for errors
2. Verify EMAIL_USER and EMAIL_PASSWORD are correct
3. For Gmail: Ensure 2FA is enabled and you're using an App Password
4. Check if the email service is blocking less secure apps

### Form Not Submitting

1. Check browser console for errors
2. Verify backend server is running
3. Check CORS settings in server/index.js
4. Ensure Supabase credentials are configured

### Supabase Errors

- Verify the demo_requests table exists
- Check Supabase row-level security (RLS) policies
- Ensure service role key has write permissions

## Future Enhancements

- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Automated follow-up emails
- [ ] Admin dashboard to view/manage demo requests
- [ ] SMS notifications
- [ ] CRM integration (Salesforce, HubSpot)
- [ ] Timezone selection for meetings
- [ ] Video call link generation (Zoom, Teams)
