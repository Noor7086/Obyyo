# Obyyo - Lottery Prediction Platform

A comprehensive lottery prediction platform built with modern web technologies, designed to enhance winning odds through 80-100% accurate predictions.

## 🎯 Project Overview

Obyyo is a lottery prediction platform that helps players avoid "low vibration" numbers and improve their winning odds. The platform provides:

- **80-100% Accurate Predictions**: Advanced analysis identifies non-viable numbers
- **Pay-Per-Use Model**: No subscriptions, pay only when you need predictions
- **7-Day Free Trial**: Test the service with your selected lottery
- **Instant Notifications**: Real-time alerts for new predictions
- **Number Generator**: Create winning combinations from viable numbers
- **Multi-Lottery Support**: Gopher 5, Lotto America, Mega Million, Powerball

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Bootstrap 5** for responsive UI
- **React Router** for navigation
- **React Hook Form** for form handling
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **Rate Limiting** for API protection

### Key Features
- User authentication and authorization
- Trial system with automatic expiration
- Prediction upload and management
- Payment processing (Stripe integration ready)
- Admin panel for prediction management
- Responsive design for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd lottery-prediction
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp backend/.env.example backend/.env
   
   # Edit backend/.env with your configuration
   nano backend/.env
   ```

4. **Configure Environment Variables**
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/obyyo-lottery
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   
   # Frontend URL
   FRONTEND_URL=http://localhost:3000
   
   # Payment Processing (Stripe)
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
   STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
   
   # Email (Nodemailer)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Admin
   ADMIN_EMAIL=admin@obyyo.com
   ADMIN_PASSWORD=secure-admin-password
   
   # Environment
   NODE_ENV=development
   PORT=5000
   ```

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start them separately:
   # Backend (Terminal 1)
   npm run server
   
   # Frontend (Terminal 2)
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Health Check: http://localhost:5000/api/health

## 📁 Project Structure

```
lottery-prediction/
├── backend/                    # Backend API
│   ├── config/                # Database configuration
│   ├── controllers/           # Route controllers
│   ├── middleware/            # Custom middleware
│   ├── models/                # Database models
│   ├── routes/                # API routes
│   └── server.js              # Main server file
├── src/                       # Frontend React app
│   ├── components/            # Reusable components
│   │   ├── auth/              # Authentication components
│   │   └── layout/            # Layout components
│   ├── contexts/              # React contexts
│   ├── pages/                 # Page components
│   │   ├── admin/             # Admin pages
│   │   ├── auth/              # Authentication pages
│   │   ├── legal/             # Legal pages
│   │   ├── tools/             # Tool pages
│   │   └── user/              # User pages
│   ├── services/              # API services
│   ├── types/                 # TypeScript types
│   ├── App.tsx                # Main app component
│   └── main.tsx               # App entry point
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## 🎮 Business Model

### Free Trial System
- New users get 7 days of free predictions
- Must select one lottery type during registration
- Instant notifications included during trial
- No credit card required

### Pay-Per-Use Model
- After trial, predictions cost the same as one lottery line
- Example: Powerball prediction = $2 (same as Powerball ticket)
- Wallet system for easy payments
- No subscription fees

### Supported Lotteries
1. **Gopher 5 (Minnesota)** - $1/prediction
2. **Lotto America (USA)** - $1/prediction
3. **Mega Million (USA)** - $3/prediction
4. **Powerball (USA)** - $2/prediction

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start frontend only
npm run server       # Start backend only
npm run dev:full     # Start both frontend and backend

# Building
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
```

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

#### Predictions
- `GET /api/predictions/:lotteryType` - Get predictions
- `GET /api/predictions/:lotteryType/:id` - Get prediction details
- `POST /api/predictions/:lotteryType/:id/purchase` - Purchase prediction
- `GET /api/predictions/my-purchases` - Get user purchases
- `GET /api/predictions/trial/:lotteryType` - Get trial predictions

#### Admin
- `GET /api/admin/stats` - Get admin statistics
- `POST /api/admin/predictions` - Upload prediction
- `GET /api/admin/users` - Get all users

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables for API URL

### Backend Deployment (Railway/Heroku)
1. Set up MongoDB database
2. Configure environment variables
3. Deploy the backend folder
4. Update frontend API URL

### GoDaddy Hosting Setup
1. Upload files to your hosting account
2. Configure database connection
3. Set up SSL certificate
4. Configure domain settings

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS protection
- Helmet security headers
- Environment variable protection

## 📱 Features in Development

- [ ] Complete prediction upload system
- [ ] Payment processing integration
- [ ] Number combination generator
- [ ] Admin panel functionality
- [ ] Blog system
- [ ] FAQ section
- [ ] Legal pages content
- [ ] Mobile app (future)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Email: support@obyyo.com
- Website: https://obyyo.com

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic project structure
- ✅ User authentication
- ✅ Frontend pages
- ✅ API structure

### Phase 2 (Next)
- [ ] Prediction upload system
- [ ] Payment integration
- [ ] Admin panel

### Phase 3 (Future)
- [ ] Mobile applications
- [ ] Advanced analytics
- [ ] Multilingual support
- [ ] API for third-party integrations

---

**Built with ❤️ for lottery players worldwide**

