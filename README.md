<div align="center">
  <img src="https://img.shields.io/badge/CAMPUS_CONNECT-KENYA-006633?style=for-the-badge&logo=university&logoColor=white" alt="Campus Connect Header" />
  <h1> Campus Connect</h1>
  <p><i>A Centralized Digital Ecosystem for Kenyan University Students</i></p>
</div>

### 📑 [View Full Project Design Report (PDR)](./PDR.md)

---

## 📖 1. Project Mission & Value Proposition
Campus Connect is the one platform for everything in campus — trade textbooks, find hostels, join study groups, access M-Pesa payments, and stay safe with emergency SOS. Built by students, for students.

---

## 🏛 2. System Architecture
The platform utilizes a **Modular Service-Oriented Architecture** designed for high availability and low-latency performance in mobile-first environments.



* **Frontend:** React.js / Next.js (Optimized for PWA performance).
* **Backend:** Node.js & Express (Scalable API Gateway).
* **Authentication:** Firebase Authentication (Email/Password, Google, and Phone sign-in).
* **Database & Storage:** Supabase (PostgreSQL database + Cloud Storage for file uploads and media).
* **Payments:** M-Pesa Daraja API Integration (Lipa na M-Pesa).
* **Safety:** Real-time WebSocket signaling for emergency triggers.

---

## 📋 3. High-Impact Feature Roadmap

### **A. The "Comrade Market" & Commerce**
| Feature | Description | Implementation |
| :--- | :--- | :--- |
| **Book Swap/Resale** | A dedicated hub to buy and sell textbooks and revision materials. | CRUD + Supabase Storage |
| **Hostel Finder** | Peer-reviewed directory of private hostels with pricing and security ratings. | Ratings + Maps API |
| **Side-Hustle Hub** | A portal for student services like coding, laundry, and photography. | Service Profiles |
| **Dining Guide** | Instant access to information on Mess, STC, and other dining areas. | Location Services |

### **B. Academic & Career Synergy**
* **Resource Library:** Cloud-based folder system organized by course code for sharing past papers and notes.
* **Virtual Tutoring:** A marketplace where senior students offer paid tutoring sessions.
* **Study Group Finder:** Matching students by course, year, and specific academic needs.
* **Internship Alerts:** A curated list of attachments and graduate programs for Kenyan undergrads.
* **Skill Exchange:** A "teach-to-learn" platform for peer-to-peer skill sharing.

### **C. Safety, Wellness & Governance**
* **Emergency SOS:** A one-tap button that alerts campus security or nearby student volunteers.
* **Anonymous "Sema" Portal:** A secure space for mental health discussions and reporting grievances.
* **Issue Reporting:** A tracker for campus facility problems and administrative feedback.
* **Election Portal:** A digital platform for student leadership voting and official polling.

### **D. Campus Life Enhancement**
* **Event Aggregator:** Centralized ticketing for sports, plays, and "inter-uni" bashes via M-Pesa.
* **Lost & Found:** A digital portal with a photo verification system for recovered items.
* **Campus Navigation:** Interactive maps for building locations and essential campus services.
* **Student Deals:** Exclusive discounts from local businesses for verified students.

---

## 🛡 4. Security, Trust & Verification
To maintain a professional and safe environment, the platform implements:
* **University Email Verification:** Mandatory for all account creations to ensure authenticity.
* **Moderation Framework:** Student moderators assigned from each respective institution.
* **Data Privacy Controls:** Granular user control over personal information and visibility.
* **Reputation System:** Rating systems for all business advertisers and service providers.

---

## 🚀 5. Getting Started

### **Installation**
1.  **Clone the Source:**
    ```bash
    git clone [https://github.com/vertigo0628/CampusConnect.git](https://github.com/vertigo0628/CampusConnect.git)
    cd CampusConnect
    ```
2.  **Environment Configuration:**
    Create a `.env` file and input the following keys:
    * <kbd>SUPABASE_URL</kbd> — Your Supabase project URL.
    * <kbd>SUPABASE_ANON_KEY</kbd> — Your Supabase anonymous/public key.
    * <kbd>NEXT_PUBLIC_FIREBASE_API_KEY</kbd> — Your Firebase API key.
    * <kbd>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN</kbd> — Your Firebase Auth domain.
    * <kbd>NEXT_PUBLIC_FIREBASE_PROJECT_ID</kbd> — Your Firebase Project ID.
    * <kbd>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET</kbd> — Your Firebase Storage Bucket.
    * <kbd>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID</kbd> — Your Firebase Messaging Sender ID.
    * <kbd>NEXT_PUBLIC_FIREBASE_APP_ID</kbd> — Your Firebase App ID.
    * <kbd>MPESA_DARAJA_CREDENTIALS</kbd> — Your M-Pesa Daraja API credentials.
3.  **Boot the System:**
    ```bash
    npm install && npm run dev
    ```

### **Contributing**
We welcome all student developers. Please follow the **Fork-and-Pull** model. All feature additions must align with the security protocols outlined in Section 4.

---
<div align="center">
  <sub>Developed for the Kenyan Student Community. &copy; 2026 Campus Connect Kenya.</sub>
</div>
