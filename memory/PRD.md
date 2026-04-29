# عراقچي ستور (Iraqchi Store) — PRD

## Overview
Bilingual (Arabic/English) e-commerce dropshipping mobile app built on Expo + FastAPI + MongoDB, focused on the Iraqi market with worldwide shipping.

## Target Users
- Iraqi customers seeking local & imported (Alibaba dropshipped) products
- Store admin (`ghhh8326@gmail.com`) managing inventory & orders

## Core Features
### Customer
- Browse home (hero, COD badge, shipping banner, featured products)
- 6 categories: Clothing, Electronics, Appliances, Home Goods, Kitchenware, Children's Toys
- Product detail: size/color/qty selection, COD badge, dropship indicator
- Cart with quantity control, discount code (e.g. `WELCOME10` 10%)
- Checkout: name, phone, address, city, country, notes
- Cash on Delivery (the only payment method)
- WhatsApp confirmation auto-launches `wa.me/9647747742908` after order with formatted message
- Order history in profile
- Bilingual toggle (ع/EN) switches all content live
- Privacy policy + support email (`ejjkio3@gmail.com`)

### Auth
- Email/Password JWT (register/login)
- Emergent-managed Google Auth (web + native via `WebBrowser.openAuthSessionAsync`)
- `ghhh8326@gmail.com` is auto-promoted to admin

### Admin
- Dashboard: revenue, total orders, pending orders, total products, low-stock alerts
- Products CRUD with Alibaba dropship link field, sizes, colors, low-stock threshold
- Orders management with status pipeline (pending → confirmed → shipped → delivered / cancelled)
- Discount code CRUD (percent, active toggle, usage tracking)

## Tech Stack
- **Frontend**: Expo Router (file-based routing, fade screen animation), React Native, AsyncStorage, expo-web-browser, @expo/vector-icons
- **Backend**: FastAPI, Motor (async MongoDB), bcrypt + PyJWT, httpx for Emergent Auth
- **Design**: Deep teal (#0F4C5C) + Gold (#E3B23C) + Terracotta accents, obtuse-angle border-radius motifs, Iraqi-inspired diamond decor

## Key Configuration
- Admin email: `ghhh8326@gmail.com`
- Support email: `ejjkio3@gmail.com`
- WhatsApp: `9647747742908` (Iraq +964 prefix)
- Seeded discount: `WELCOME10` (10%)
- Default low-stock threshold: 5

## Future Enhancements
- Push notifications for admin on new orders (vs. WhatsApp only)
- Twilio WhatsApp Business API for two-way alerts
- Advanced Alibaba auto-import (web scraping)
- Multi-image gallery per product
- Product reviews & ratings
- Saved addresses for repeat customers
- Order tracking timeline UI for customers
