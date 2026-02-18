
# ReviewPasta - Implementation Plan

## Overview
A QR-code-powered Google review collection tool. Customers scan a QR code, get an AI-generated review draft, copy it, and paste it into Google Reviews — all in under 10 seconds.

## Core Pages & Features

### 1. Customer Review Page (`/review/:businessSlug`)
The main landing page customers see after scanning the QR code:
- **Business header** — Shows business name and location
- **Star rating selector** — Tap to choose 1–5 stars (defaults to 5)
- **AI-generated review draft** — A unique, friendly review generated via OpenRouter (GPT-4o-mini), displayed in an editable text area
- **Regenerate button** — Generate a new draft with one tap
- **Copy Review button** — Copies text to clipboard with "✓ Copied!" feedback
- **Open Google Reviews button** — Opens Google's review page using the business's Place ID
- **Helpful tip** — "Paste your review in Google, then tap Post"
- Branded footer: "Powered by ReviewPasta"

### 2. Add Business Page (`/add-business`)
A simple form to register a new business:
- Business name input
- Google Place ID input
- Optional: business location/description (used for AI context)
- Save button — stores the business in the database

### 3. Home / Landing Page (`/`)
A simple page with:
- Brief explanation of ReviewPasta
- Link/button to "Add a New Business"
- List of existing businesses (for easy access/testing)

## Backend (Supabase + Lovable Cloud)

### Database
- **businesses** table: `id`, `name`, `slug`, `place_id`, `location`, `description`, `created_at`

### Edge Function: `generate-review`
- Accepts business name, location, and star rating
- Calls OpenRouter API (GPT-4o-mini) to generate a natural, unique review draft
- Returns the generated text

### Secrets Needed
- **OPENROUTER_API_KEY** — for AI review generation via OpenRouter

## Test Data (Pre-loaded)
- **The Rock Gym Copou** — Place ID: `ChIJy5STiSj7ykAR4jKYiteg_NQ`
- **Scorpions Kick Boxing Iași** — Place ID: `ChIJ96NAZC77ykARP_uaR7eKjRs`

## Design
- Mobile-first (customers scan QR on their phones)
- Clean, friendly, minimal UI
- Large tap targets for Copy and Open Google buttons
- Warm color palette to feel inviting
