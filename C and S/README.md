# Food Link — Good food deserves another chance

> A modern, responsive, full-stack community food rescue and food waste reduction platform connecting surplus food donors (restaurants, supermarkets, households) with receivers (NGOs, orphanages, shelters, and individuals).

---

## 🛠️ Technology Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS 3, Motion for React 12, Lucide React, Sileo, SweetAlert2, Leaflet & OpenStreetMap, Axios, React Router 7.
- **Backend:** Node.js, Express.js, MongoDB Atlas with Mongoose, JWT (HTTP-only cookies), bcryptjs, Google OAuth.
- **External Services:** Twilio SMS OTP, Gmail SMTP transactional email (verification, password reset, donation handover codes), Cloudinary image storage, Leaflet OpenStreetMap.
- **Design System:** 85% Solid Modern UI + 15% Subtle Claymorphism.
  - Primary Background: Cream (`#F8F4E7`)
  - Secondary: Chocolate Brown (`#4E342E`)
  - Highlight / Primary CTA: Burnt Orange (`#CC5500`)
  - Typography: Poppins (Headings) & Nunito Sans (Body)

---

## 🌟 Signature Hero Animation: From Surplus Food to Someone's Hands

The flagship hero section tells an emotional, visual story of community solidarity across 4 continuous scenes:

1. **Scene 1 (Surplus Harvest from Corners):**
   - Fresh surplus items (Tomatoes, Apples, Carrots, Oranges, Bread Loaves, and Packaged Meals) enter from all 4 screen corners and travel along smooth curved trajectories toward a prominent woven donation basket.
2. **Scene 2 (The Basket Fills):**
   - Items land in the basket with subtle bouncing and squash-and-stretch reactions. The basket transitions from empty to overflowing with fresh produce, radiating an amber celebratory ripple.
3. **Scene 3 (Two People Share Food — Human Handover):**
   - Illustrated **Donor Hand** (Person 1) enters from the left and lifts fresh nourishment.
   - Illustrated **Receiver Hand** (Person 2) enters from the right with an open, cupped palm.
   - The food visibly transfers between the two hands, accompanied by a glowing heart of human connection.
4. **Scene 4 (Impact Story & Call to Action):**
   - "Good food deserves another chance."
   - "One small act. One more meal. A stronger community."
   - CTA: "Be part of the change".

---

## 📁 Project Architecture

```
food-link/
├── client/                     # Frontend React + Vite
│   ├── public/                 # Static assets & SVG icons
│   ├── src/
│   │   ├── assets/             # Food illustrations & SVG assets
│   │   ├── components/
│   │   │   ├── animations/     # FloatingFoodHero, DonorHand, ReceiverHand, DonationBasket, FoodItem, FoodIcons, FoodLoader
│   │   │   ├── common/         # Button, Logo, Container, SectionHeading, StatCard, LoadingSpinner, ScrollToTop
│   │   │   ├── food/           # FoodCard, FoodDetailModal
│   │   │   └── layout/         # Navbar, Footer, Layout
│   │   ├── pages/
│   │   │   ├── public/         # HomePage, AboutPage, ExplorePage, HowItWorksPage, NotFoundPage
│   │   │   └── auth/           # LoginPage, RegisterPage
│   │   ├── routes/             # AppRoutes (React Router 7)
│   │   ├── services/           # sampleFoodData, API services
│   │   ├── styles/             # Tailwind & claymorphic utilities (index.css)
│   │   ├── App.jsx             # App root with Sileo Toaster & BrowserRouter
│   │   └── main.jsx            # Entry point
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend Node + Express
│   ├── config/                 # DB, Cloudinary, OAuth config
│   ├── controllers/            # Auth, Food, Request, Admin controllers
│   ├── middleware/             # Role guards, JWT verification, Rate-limiting
│   ├── models/                 # Mongoose schemas (User, FoodListing, Request, Impact, OTP)
│   ├── routes/                 # REST endpoints (/api/health, /api/auth, /api/food, etc.)
│   ├── services/               # Twilio SMS + OTP services, Gmail SMTP email service, Cloudinary, Notification service
│   ├── app.js                  # Express application setup
│   ├── server.js               # Server entry point & DB connection
│   └── package.json
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start Guide

### 1. Run Development Servers
Open two terminal windows:

**Terminal 1 — Backend API:**
```bash
cd server
npm run dev
# http://localhost:5001
```

**Terminal 2 — Frontend Application:**
```bash
cd client
npm run dev
# http://localhost:5173
```

### 2. Production Build
```bash
cd client
npm run build
```

---

## 🗺️ Implementation Roadmap

- [x] **Phase 1: Project Foundation** (Folder structure, dependencies, Express, Vite, Tailwind, DB config, health check)
- [x] **Phase 2: Complete Design System & Frontend** (85% solid + 15% clay UI, Navbar, Footer, Signature Handover Hero Animation, FoodLoader, Landing Page, Explore, About, How It Works, Login & Register UIs)
- [ ] **Phase 3: Database and Authentication** (User models, JWT in HTTP-only cookies, Google OAuth, Role-based route guards)
- [ ] **Phase 4: Donor and OTP System** (Donor dashboard, listing forms, Cloudinary image upload, Twilio SMS OTP publication verification, unique donation handover codes)
- [ ] **Phase 5: Receiver Module** (Explore food, filters, detail modals, Leaflet map, request flow)
- [ ] **Phase 6: Request Management** (Approval/rejection, atomic quantity updates, ready for collection, completion confirmation)
- [ ] **Phase 7: Admin Module** (Admin dashboard, user management, listing moderation, audit logs, analytics)
- [ ] **Phase 8: Notifications and Impact** (Sileo toast system, SweetAlert2 critical dialogs, impact records & live statistics)
- [ ] **Phase 9: Testing and Deployment** (End-to-end audit, role permission tests, mobile responsiveness, deployment guides)
