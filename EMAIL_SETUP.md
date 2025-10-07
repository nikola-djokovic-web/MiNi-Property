# Email Configuration for Tenant Invitations

## Quick Setup with Resend (Recommended)

1. **Get a Resend API Key:**
   - Sign up at [resend.com](https://resend.com)
   - Go to [API Keys](https://resend.com/api-keys) 
   - Create a new API key

2. **Add to your `.env.local` file:**
   ```bash
   RESEND_API_KEY="re_your_actual_api_key_here"
   EMAIL_FROM="MiNi Property <noreply@yourdomain.com>"
   NEXT_PUBLIC_APP_URL="http://localhost:9002"
   ```

3. **Domain Verification (Optional for testing):**
   - For production, verify your domain in Resend dashboard
   - For testing, you can use the default Resend domain

## Alternative: SMTP Configuration

If you prefer to use SMTP (Gmail, Outlook, etc.):

```bash
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="MiNi Property <your-email@gmail.com>"
NEXT_PUBLIC_APP_URL="http://localhost:9002"
```

## Testing Email Delivery

1. Add a tenant with your email address
2. Check your email for the invitation
3. Check the server logs for any email errors

## Current Features

✅ **Toast Notifications:** Success and error messages when inviting tenants
✅ **Property Assignment:** Tenants are assigned to properties in invitations  
✅ **Database Integration:** Property assignments are stored and displayed
✅ **Email Templates:** Professional invitation emails with registration links

## Troubleshooting

- **No emails received:** Check your API key and email configuration
- **Property not showing:** The tenant table now displays assigned properties
- **Toast messages:** Success/error notifications appear when inviting tenants