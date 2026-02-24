# Project Design Report: Campus Connect Kenya 🎓🇰🇪

## Project Team: Group 5 (The Masterminds)
- **Agnes Wairimu__https://github.com/Aggie00**
- **Lewis Gitau__https://github.com/vertigo0628**
- **Randy Gakuu__https://github.com/mainoorandy-dot**
- **Juliet Wanjiku__https://github.com/jullie-code**
- **Bildad Shikutwa__https://github.com/Aluta857**
- **Sharom Atieno__https://github.com/imali254**
- **Rachel Murugi__https://github.com/raelkitonga015-art**
- **Joel Okwaro__https://github.com/joelokwaro4-collab**
- **Victor Kimutai__https://github.com/viktakimutai-hue**



## 1. Executive Summary
Campus Connect Kenya is a mobile-first social and utility platform designed exclusively for university students in Kenya. It bridges the gap between academic life and campus commerce by providing a streamlined, high-trust environment for students to network, trade services, and access essential campus resources. Using a hybrid cloud architecture, the platform offers real-time connectivity and high-performance media sharing.

## 2. Product Overview

### Problem Statement
Kenyan university students often lack a centralized, high-trust platform for:
- Finding student-vetted services (e.g., laptop repair, tutoring).
- Trading textbooks and campus essentials safely.
- Discovering and networking with peers across different departments.
- Accessing campus-specific information and emergency tools.

### Target Users
- **Primary:** Students at Meru University of Science and Technology (MUST) and other Kenyan universities.
- **Secondary:** Student service providers and entrepreneurs.
- **Stakeholders:** University student leaders and safety officers.

### Goals & Success Metrics
- **Goal:** Create the #1 trusted campus network in Kenya.
- **Metrics:** 
    - User growth within the `@students.must.ac.ke` domain and future expansion to other Kenyan universities.
    - Number of verified service reviews submitted.
    - Average session duration on the "Discover" hub.

## 3. Features & Requirements

### MVP Features
- **University Restricted Auth**: Secure login/signup restricted to university email domains.
- **Dynamic Profile Hub**: Customizable profiles with bios, service tags, and a 3-column media gallery.
- **Discover Hub**: Real-time searchable directory of campus comrades.
- **Maximized Media**: Full-screen viewing for photos and videos.
- **Peer Review System**: 5-star rating and review system for campus service providers.

### Future Features
- **M-Pesa Integration**: Seamless campus trade payments.
- **Emergency SOS**: One-tap emergency alerts for campus security.
- **Hostel Finder**: Vetted student housing directory.
- **Study Group Matcher**: AI-powered study group recommendations.

### User Stories
- *As a student,* I want to find a comrade who can fix my laptop so I don't have to leave campus.
- *As a service provider,* I want to showcase my work via a gallery and get reviews to build my reputation.
- *As a new user,* I want to quickly join the network using my school email.

## 4. Technical Architecture

### Tech Stack
- **Frontend**: Next.js (React), Vanilla CSS (Custom tokens).
- **Backend (Operations)**: Firebase Firestore & Authentication.
- **Media Storage**: Supabase Storage (High-performance bucket).
- **Deployment**: Vercel (CI/CD).

### System Design
A hybrid cloud approach where Firebase handles rapid metadata and auth, while Supabase provides a powerful, public-bucket system for handling large media files (images/videos) efficiently.

### Database Schema (Firestore)
- **`profiles/{userId}`**:
    - `displayName` (string)
    - `bio` (string)
    - `photoURL` (string)
    - `gallery` (array of strings)
    - `services` (array of strings)
    - `rating` (number)
    - `reviewCount` (number)
- **`reviews/{reviewId}`**:
    - `targetId` (string)
    - `authorId` (string)
    - `authorName` (string)
    - `rating` (number)
    - `text` (string)
    - `timestamp` (serverTimestamp)

## 5. UI/UX Requirements

### Screens List
1. **Landing Page**: Cinematic hero section with high-res campus background.
2. **Auth Pages**: Minimalist, high-contrast login and signup.
3. **Profile**: Instagram-style layout with stats, bio, and media grid.
4. **Discover**: Search-focused hub with comrade cards.
5. **Public Profile**: Visitor view with review submission.

### Design System
- **Aesthetic**: Modern Dark Mode with Green/Gold accents (MUST colors).
- **Typography**: Inter / System UI.
- **Components**: Glassmorphism cards, blurred navbars, and ergonomic touch targets (44px min).

## 6. Development Plan

### Phases/Sprints
1. **Phase 1-2**: Infrastructure & Auth (Firebase/Supabase).
2. **Phase 3-4**: Community Hub (Discover, Profiles, Reviews).
3. **Phase 5-6**: Navigation & Mobile Ergonomics.
4. **Phase 7**: Auth Flow Polish & Landing Page Optimization.

### Timeline
- **Build Duration**: ~4-8 Weeks to stable MVP.

## 7. Testing & Deployment
- **Testing**: Managed via Browser Subagents for automated UI validation.
- **Deployment**: Standardized Vercel deployment with environment variable sandboxing.

## 8. Risks & Mitigation
- **Risk**: High-volume media storage costs.
- **Mitigation**: Implement image compression and Supabase storage quotas.
- **Risk**: Malicious reviews.
- **Mitigation**: Restrict reviews to logged-in students with unique account verification.
