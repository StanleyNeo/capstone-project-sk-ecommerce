# NeoMart Live Demo

## URLs
- **Primary**: https://neomart-theta.vercel.app
- **Branch alias**: https://neomart-git-main-neo-see-kwees-projects.vercel.app

## Infrastructure
- **Frontend**: Vercel (auto-deploys from `main` branch)
- **Backend API**: Render (neomart-api service)
- **Database**: MongoDB Atlas

## Environment Variables

### Render (neomart-api)
- `MONGODB_URI`: [your Atlas connection string]
- `PORT`: 5000
- `CLIENT_URLS`: http://localhost:3000,https://neomart-theta.vercel.app,https://neomart-git-main-neo-see-kwees-projects.vercel.app

### Vercel (neomart frontend)
- `REACT_APP_API_URL`: https://neomart-api.onrender.com

## CORS Behavior
- API only responds to allowlisted domains in `CLIENT_URLS`
- Vercel preview URLs (hash domains like `neomart-ge7bcy3fm-...`) are NOT allowlisted — this is intentional security
- To add a new domain: Render → neomart-api → Environment → edit `CLIENT_URLS`

## Quick Start for Future Demos
1. Ensure Render service is awake (visit API URL once if sleeping)
2. Open https://neomart-theta.vercel.app
3. Products load from live MongoDB via Express API