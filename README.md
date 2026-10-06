# POV Task Logger

A small demo inspired by first-person data capture — record a session on your own camera, name it, and log steps as you go, with a REC overlay and live checklist.

Not an official ZenO product. Built as a personal contribution/demo exploring the idea of structured first-person activity logging.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Vercel

1. Push this repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. Vercel auto-detects Next.js — no extra config needed. Click Deploy.

## Notes

- Camera access requires the page to be opened in a real browser tab (not an embedded in-app webview, which often blocks `getUserMedia`). If the camera is blocked, use the built-in "Demo mode" fallback.
- Checklist state is saved to `localStorage` in your own browser only — nothing is sent anywhere.
