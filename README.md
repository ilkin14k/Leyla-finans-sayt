# FinansX – Leyla Ümid Şəxsi Maliyyə Paneli

## Vercel-də Deploy

1. Bu repo-nu GitHub-a yüklə
2. [vercel.com](https://vercel.com) → "New Project" → GitHub repo-nu seç
3. **Environment Variables** bölməsində əlavə et:
   - `REACT_APP_SB_URL` → `https://xtgadrdyirnowhmdmnxo.supabase.co`
   - `REACT_APP_SB_KEY` → Supabase anon key-in
4. Deploy et

## Lokal İşlətmək

```bash
npm install
cp .env.example .env
npm start
```
