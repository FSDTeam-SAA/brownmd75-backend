# BrownMd Backend API

## 🚀 Swagger API Documentation
The API documentation is interactive and allows for direct testing of all endpoints.
- **Local URL:** [http://localhost:5000/api-docs/](http://localhost:5000/api-docs/)
- **Features:** 
  - Interactive "Try it out" buttons.
  - Pre-filled request body examples (Login, Register, Reviews, etc.).
  - **Authentication:** Click the "Authorize" button and enter `Bearer <your_token>` to test protected routes.

---

## 📖 Project Overview
BrownMd is a robust backend system built with Node.js, TypeScript, and MongoDB. It provides a comprehensive suite of services for equipment rental, order management, and user interaction.

## ✨ Key Features
- **User Authentication:** Secure registration, login, JWT-based auth, and OTP verification.
- **Equipment Management:** Detailed equipment listings with categorization and dynamic pricing.
- **Category System:** Hierarchical management of equipment categories.
- **Cart & Order Management:** Add items to cart and process orders via **Stripe** or **Cash on Delivery (COD)**.
- **Review & Rating System:** Equipment and website-wide reviews with average rating calculations.
- **Payment Integration:** Secure payment processing with Stripe.
- **File Uploads:** Image handling using Multer and Cloudinary.
- **Contact & Feedback:** Dedicated module for user inquiries.
- **Security:** Implementation of rate limiting, helmet, hpp, and data sanitization.

## 🛠️ Tech Stack
- **Backend:** Node.js, Express.js (v5)
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Documentation:** Swagger (swagger-autogen & swagger-ui-express)
- **Validation:** Zod
- **Security:** JWT, Bcrypt, Helmet, XSS-Clean, Express-Rate-Limit
- **Payments:** Stripe API
- **Cloud Storage:** Cloudinary
- **Logging:** Pino & Pino-Pretty

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd brownmd75-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and copy the contents from `.env.example`. Fill in your secrets (MongoDB URL, Stripe Keys, Cloudinary Credentials, etc.).

4. **Run the Development Server:**
   ```bash
   npm run dev
   ```
   This will start both the server and the Swagger documentation watcher.

## 📜 Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Starts the dev server with nodemon and swagger-watch. |
| `npm run build` | Regenerates Swagger docs and compiles TypeScript to JS. |
| `npm run start` | Runs the compiled production build. |
| `npm run swagger` | Manually regenerates `swagger.json`. |
| `npm run lint` | Checks the code for linting issues. |

## 🔒 Environment Variables
Ensure the following keys are set in your `.env`:
- `MONGODB_URL`: Your MongoDB connection string.
- `JWT_SECRET`: Secret key for token generation.
- `STRIPE_SECRET_KEY`: Your Stripe secret key.
- `CLOUDINARY_*`: Cloudinary configuration tokens.
- `EMAIL_*`: Credentials for sending OTPs via NodeMailer.

---
© 2026 BrownMd Team
