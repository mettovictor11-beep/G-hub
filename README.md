# G-Hub Connect 

### A Community-Based Online Marketplace

G-Hub Connect is a web-based marketplace designed to connect buyers and sellers within Gataka, Karen, Rongai, and nearby university communities in Kenya.

The platform provides a central place where users can discover products, browse listings, compare prices, view seller information, and contact sellers directly. Sellers can create profiles, publish products, and manage their listings through a dedicated seller dashboard.

The project is built with React, Vite, Tailwind CSS, and Firebase.

##  Project Objectives

- Make it easier for people to discover products within their local communities.
- Provide sellers with a simple way to advertise and manage their products.
- Enable direct communication between buyers and sellers.
- Allow visitors to browse products without creating an account.
- Build a responsive and user-friendly marketplace experience.

##  Features

###  Public Marketplace
- Browse active product listings without signing in.
- View product images, prices, descriptions, and seller information.
- Search for products.
- Filter listings by category and location.
- View detailed information about individual products.

###  User Authentication
- User registration and sign-in using Firebase Authentication.
- Access protected features through an authenticated account.
- Use one account for both buying and selling.

###  Seller Dashboard
- Access the seller centre when choosing to sell an item.
- View listing summary counts.
- Create and manage product listings.
- Access seller profile settings.

###  Product Listing Management
- Create product listings with titles, descriptions, prices, categories, and locations.
- Upload product photos through the listing form.
- Compress images in the browser before converting them into a format that can be stored in Firestore.
- Edit existing listings.
- Delete listings.
- Update listing status to Active, Sold, or Unavailable.

###  Seller Profiles
- Create a personal or business seller profile.
- View saved profile information.
- Edit profile details when needed.

###  Communication
- Contact sellers through available contact options, including WhatsApp.
- Use in-platform inbox and chat features to communicate with other users.

##  Technology Stack

| Technology | Purpose |

| React | Building reusable user interface components |
| Vite | Development server and production build tooling |
| JavaScript (ES6+) | Application logic and interactivity |
| Tailwind CSS | Responsive styling and interface design |
| Firebase Authentication | User registration and authentication |
| Cloud Firestore | Cloud database for listings and seller profiles |
| Git and GitHub | Version control and source code management |

##  Application Architecture

G-Hub Connect uses a React frontend connected to Firebase services.

- **Frontend:** Displays the marketplace, listing forms, seller dashboard, profiles, and messaging interface.
- **Authentication:** Firebase Authentication manages user identity.
- **Database:** Cloud Firestore stores listing information, seller profiles, and other application data.
- **Real-time updates:** Firestore listeners keep supported listing views updated as data changes.

### Main Firestore Collections

**`listings`**

Stores product information, including listing details, seller ID, product images, and listing status.

**`profiles`**

Stores seller profile information associated with a user's account.

##  Getting Started

Follow these steps to run the project locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm, which is included with Node.js
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)
- A Firebase project

### 1. Clone the Repository

```bash
git clone https://github.com/mettovictor11-beep/G-hub.git
```

### 2. Navigate to the Project Directory

```bash
cd G-hub
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Firebase

Create or use a Firebase project in the [Firebase Console](https://console.firebase.google.com/).

Enable Firebase Authentication and configure the sign-in methods used by the application. Create a Cloud Firestore database and configure the required security rules.

Ensure the Firebase configuration in `src/firebase.js` matches your Firebase project.

**Security note:** Never commit private service-account credentials or other sensitive secrets to GitHub. Configure appropriate Firestore Security Rules to protect user accounts, listings, and profiles.

### 5. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal, usually:

```text
http://localhost:5173
```

### 6. Build for Production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```


##  Security Considerations

- Require authentication for protected account actions.
- Use Firestore Security Rules to enforce listing ownership and access permissions.
- Validate user input before saving data.
- Avoid exposing private credentials in source control.
- Apply suitable access rules to chat messages and seller profile data.

Client-side checks improve the user experience but must not replace backend security rules.

##  Future Improvements

Potential improvements include:

- Save and favourite listings.
- Improve the messaging experience.
- Integrate dedicated image storage using Firebase Storage.
- Add more advanced search and filtering options.
- Improve listing moderation and user reporting.
- Introduce a verified seller system.
- Explore integrated payments and transaction management.
- Deploy the application for public use.

These are planned improvements, not claims that all features have already been implemented.

##  Learning Outcomes

This project provides practical experience with:

- Building reusable components with React.
- Managing component state and side effects with React Hooks.
- Creating forms and validating user input.
- Working with Firebase Authentication.
- Reading and writing data using Cloud Firestore.
- Handling asynchronous operations with Promises and `async`/`await`.
- Processing and displaying product images.
- Using Git and GitHub for version control.
- Designing a responsive marketplace interface.

##  Author

**Victor Metto**

GitHub: [@mettovictor11-beep](https://github.com/mettovictor11-beep)

Project Repository: [G-Hub Connect](https://github.com/mettovictor11-beep/G-hub)

---

G-Hub Connect — Connecting local communities through a simpler marketplace experience.

