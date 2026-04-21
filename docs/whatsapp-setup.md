# Connecting WhatsApp to ReviewPilot

This guide walks you through connecting your WhatsApp Business number so ReviewPilot can respond to incoming customer messages with AI replies.

## What is a WABA?

A **WhatsApp Business Account (WABA)** is an account inside your Meta Business Manager that owns your WhatsApp Business phone numbers. One WABA can have multiple phone numbers; ReviewPilot manages one number at a time.

## Before you begin

You'll need:

1. A **Meta Business Manager** account (free) — [business.facebook.com](https://business.facebook.com)
2. A **Meta App** with the WhatsApp product enabled — [developers.facebook.com/apps](https://developers.facebook.com/apps)
3. A **WABA** with at least one verified phone number
4. A **permanent System User access token** (not a temporary 24-hour token)

## Step 1 — Create a System User token

1. Go to Meta Business Manager → **Business Settings** → **Users** → **System Users**
2. Click **Add** and create a System User (Admin role recommended for your own business)
3. Click **Generate New Token**
4. Pick your Meta App
5. Under **Permissions**, enable:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
6. Set the expiration to **Never** (that's why we need a System User, not a regular user token)
7. **Copy the token** — you can't view it again after closing the dialog

> _[TODO: screenshot of Meta Business Manager System User token dialog]_

## Step 2 — Find your WABA ID

1. In Meta Business Manager → **WhatsApp Accounts**
2. Click your WABA
3. Copy the numeric **WhatsApp Business Account ID** at the top

> _[TODO: screenshot of WABA ID location]_

## Step 3 — Add the connection in ReviewPilot

1. Open ReviewPilot → **Settings** → **Connections** → **Add Connection**
2. Choose **WhatsApp Business**
3. Paste your **WABA ID** and **System User token**
4. Click **Verify connection** — ReviewPilot will list all phone numbers on your WABA
5. Select the number you want to manage → **Connect**

## Step 4 — Configure the webhook in Meta

After connecting, ReviewPilot shows the webhook URL. To receive incoming messages:

1. Open Meta App Dashboard → your app → **WhatsApp** → **Configuration**
2. Under **Webhook**, click **Edit**
3. Paste the **Callback URL** shown in ReviewPilot (e.g. `https://your-domain.com/api/webhooks/whatsapp`)
4. Enter a **Verify token** — any random string you choose. Paste the SAME value in your `WHATSAPP_WEBHOOK_VERIFY_TOKEN` env var in Vercel and redeploy.
5. Click **Verify and save**
6. Under **Webhook fields**, subscribe to **messages**

> _[TODO: screenshot of Meta webhook configuration]_

## Pricing expectations

- **Inbound customer messages are always free** to receive.
- **Outbound replies sent within 24 hours** of the customer's message are free (this is the WhatsApp "customer service window").
- **Outbound messages after 24 hours** require a paid **message template** — ReviewPilot v1 **does not support** outbound marketing templates. We only reply inside the 24-hour service window.
- Pricing for the service window is set by Meta and depends on your country; check the [WhatsApp pricing page](https://developers.facebook.com/docs/whatsapp/pricing) for current rates.

## Troubleshooting

- **"Invalid access token"** — your token may have expired, or you used a temporary token instead of a permanent System User token. Regenerate and paste again.
- **Webhook verification fails** — the verify token in Meta must match `WHATSAPP_WEBHOOK_VERIFY_TOKEN` exactly (no whitespace).
- **No messages arriving** — confirm you subscribed to the `messages` webhook field, and that the phone number is connected to your WABA.
- **"WhatsApp connection missing credentials"** when replying — the connection row in our DB is missing the encrypted token. Disconnect and reconnect.

## Data & security

- Your System User token is encrypted (AES-256-GCM) before being stored.
- ReviewPilot only sends replies — we never read message threads outside what the webhook delivers.
- You can disconnect anytime from **Settings → Connections**; this removes the stored token.
