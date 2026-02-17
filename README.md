
<div align="center">
  <img src="https://img.shields.io/badge/Campus_Connect-PDR_Baseline-006633?style=for-the-badge&logo=university&logoColor=white" alt="Project Badge" />
  <h1>🏫 Campus Connect: PDR v1.0</h1>
  <p><i>A Formal Preliminary Design Review for the University Super-App Ecosystem</i></p>
</div>

---

## 📑 Executive Summary
Campus Connect is designed to solve the **fragmentation of student services**. This PDR outlines the transition from a conceptual "Comrade Market" to a robust, formal architecture supporting academic synergy, peer-to-peer commerce, and campus safety.

---

## 🏛 1. System Architecture
The platform utilizes a **Modular Service-Oriented Architecture (SOA)** built on the MERN stack. This ensures that the high-traffic "Marketplace" and high-criticality "SOS System" remain stable under load.



### **Technical Breakdown**
<table>
  <tr>
    <th width="30%">Layer</th>
    <th>Technology Stack</th>
    <th>Purpose</th>
  </tr>
  <tr>
    <td><b>Frontend</b></td>
    <td>React.js + Tailwind CSS</td>
    <td>Mobile-first, data-lite UI for limited connectivity environments.</td>
  </tr>
  <tr>
    <td><b>Backend</b></td>
    <td>Node.js / Express</td>
    <td>API Gateway & Business Logic Controller.</td>
  </tr>
  <tr>
    <td><b>Real-time</b></td>
    <td>Socket.io</td>
    <td>Low-latency signaling for the Emergency SOS module.</td>
  </tr>
  <tr>
    <td><b>Database</b></td>
    <td>MongoDB Atlas</td>
    <td>Flexible schema for diverse marketplace listings.</td>
  </tr>
</table>

---

## 🚀 2. Strategic Roadmap & Features
<details open>
<summary><b>View Module Development Status</b></summary>

| Priority | Module | Feature Set | Implementation |
| :--- | :--- | :--- | :--- |
| 🔴 **High** | **Commerce** | Book Swap, Side-Hustle Hub, Hostel Finder | CRUD + Cloudinary API |
| 🔴 **High** | **Safety** | Anonymous "Sema" Portal, Emergency SOS | WebSockets + Geolocation |
| 🟡 **Med** | **Academics** | Resource Library, Skill Matching | S3 Object Storage |
| 🟢 **Low** | **Events** | M-Pesa Ticketing, QR Code Entry | Daraja 2.0 API Integration |

</details>

---

## 🛠 3. Developer Get Started
To initialize the development environment, ensure you have the required runtime versions installed.

### **Initial Setup**
1. **Clone the Source:**
   ```bash
   git clone [https://github.com/vertigo0628/ComradeConnect.git](https://github.com/vertigo0628/ComradeConnect.git)
   cd ComradeConnect
