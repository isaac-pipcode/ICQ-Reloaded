<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1r0NDgh-ZWN18Ym2vdFVHN6H_-n5pNrnh

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

3. Set your `GEMINI_API_KEY` in the `.env` file:
   - Get your API key at: https://ai.google.dev/
   - Replace `your-api-key-here` with your actual API key

4. Run the app:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Push your code to GitHub

2. Import your repository in Vercel

3. **IMPORTANT:** Add Environment Variables in Vercel:
   - Go to your project settings in Vercel
   - Navigate to "Settings" > "Environment Variables"
   - Add the following variable:
     - **Name:** `GEMINI_API_KEY`
     - **Value:** Your Gemini API key from https://ai.google.dev/
   - Click "Save"

4. Redeploy your application (or it will deploy automatically)

### Troubleshooting Vercel Deployment

If you see the error "API_KEY missing in Vercel Settings":
- Make sure you added `GEMINI_API_KEY` as an environment variable in Vercel
- Redeploy after adding the environment variable
- The variable name must be exactly `GEMINI_API_KEY` (case-sensitive)
