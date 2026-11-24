# Polymer Stock Portal & Inventory Manager

A mobile-first, high-performance stock management Progressive Web App (PWA) tailored for plastic/polymer godowns and recycling plants. Pre-loaded with your complete stock data across all **6 godowns and plants** totaling **₹48,63,000** valuation.

---

## 🚀 Key Features

1. **Secure Admin Authentication**:
   - Protected behind Login ID & Password so only you can access or modify inventory.
   - **Default Login ID**: `admin`
   - **Default Password**: `stock@admin2026`
   - *Can be changed anytime directly in the App Settings (`⚙️`).*

2. **Mobile-First `+` / `−` Stock Controls**:
   - Big, touch-friendly `+1` and `−1` buttons on every item card.
   - Quick increment/decrement pills (`+5`, `-5`, `+10`, `+25` bags).
   - Custom `±Qty` modal supporting both **Bags** and **KG** with automatic dual-sync ($25\text{ kg/bag}$ standard, or custom weight ratios).

3. **Low Stock Alert Engine**:
   - Visual glowing alerts on critical items.
   - Dedicated "Low Stock" filter toggle in the header showing exact count of items needing replenishment.
   - Configurable per-item low stock threshold.

4. **Price Tracking & History**:
   - Updates current price while preserving previous price.
   - Live differential badges: e.g. `Prev: ₹90 (+₹5 / +5.5% 🟢)` or `Prev: ₹100 (-₹5 / -5% 🔵)`.
   - Real-time impact on total lot valuation.
   - Price audit log tracking all past revisions.

5. **Multi-Location Godown Support**:
   - Filter seamlessly by:
     - **All Locations**
     - **Godown 1** (₹13,94,550)
     - **Godown 2** (₹6,51,650)
     - **Godown 3** (₹12,28,500)
     - **Bhayabhai Godown** (₹8,37,175)
     - **Ramu Plant** (₹5,38,375)
     - **Single Plant** (₹12,750)
     - **Yard / Other** (₹2,00,000)
   - **Inter-Godown Transfer**: Move stock from one location to another with automatic deduction and addition.

6. **Audit & Activity Trail**:
   - Every inward (`+`), dispatch (`−`), price edit, and transfer is permanently logged with timestamps, reasons, and user identity.

7. **Export & Backup**:
   - **1-Click Excel/CSV Export**: Download complete inventory sheet with valuation at any time.
   - **JSON Database Backup & Restore**: Download full snapshot or restore anytime.

---

## 📱 How to Run & Use on Mobile

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your computer or connect your phone to the same Wi-Fi and open `http://<your-computer-ip>:3000`.

### Installing as a Mobile App (PWA)
1. Open the URL in Safari (iPhone) or Chrome (Android).
2. Tap the **Share** button (iOS) or **Three Dots** (Android).
3. Tap **"Add to Home Screen"**.
4. The app icon will appear on your phone home screen and open in full-screen mode like a native app!

---

## ☁️ Deploying to Vercel (Free & Instant)

### Option A: Via GitHub (Recommended)
1. Create a new repository on GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Polymer Stock Portal"
   git remote add origin https://github.com/<your-username>/stock-portal.git
   git push -u origin main
   ```
2. Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Select your GitHub repository and click **Deploy**.
4. Your stock portal will be live on `https://your-app.vercel.app` in under 1 minute!

### Option B: Via Vercel CLI
```bash
npx vercel
```
Follow the prompts to deploy directly from your terminal.
