# B-Plus POS - Point of Sale System

<div align="center">
  <h3>🏪 Modern, Offline-Capable Point of Sale Application</h3>
  <p>Built with React, TypeScript, Node.js, and PostgreSQL</p>
  
  [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/kV0c8L?referralCode=bonus)
</div>

## 🌟 Features

- **💳 Sales Processing**: Fast checkout with multiple payment methods
- **📦 Product Management**: Add, edit, and organize products with barcode scanning
- **👥 Customer Management**: Track customer information and purchase history
- **🧾 Receipt Generation**: Print or email receipts automatically
- **📊 Sales Reports**: Real-time sales analytics and order history
- ** WooCommerce Integration**: Sync with your online store automatically
- **🎫 Coupon System**: Create and manage discount codes and promotions
- **👤 Multi-User Support**: Role-based access for cashiers and administrators
- **📱 Responsive Design**: Works perfectly on tablets, phones, and desktops
- **🔒 Secure Authentication**: Encrypted passwords and session management
- **⚡ Offline Capability**: Continue operations even without internet connection

## 🚀 Deploy to Railway (Recommended)

Railway provides the easiest deployment with automatic PostgreSQL database provisioning.

### One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/kV0c8L?referralCode=bonus)

### Manual Deployment

1. **Fork this repository** to your GitHub account

2. **Sign up for Railway** at [railway.app](https://railway.app)

3. **Create New Project**:
   - Click "Deploy from GitHub repo"
   - Select your forked repository
   - Railway will automatically detect it's a Node.js app

4. **Add PostgreSQL Database**:
   - In your project dashboard, click "New Service"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically configure DATABASE_URL

5. **Set Environment Variables**:
   - Go to your web service settings
   - Add these variables:
     ```
     NODE_ENV=production
     SESSION_SECRET=your-super-secret-session-key-minimum-32-characters
     ```
   - Generate a secure session secret (32+ random characters)

6. **Deploy**: Railway will automatically build and deploy your application

## � Configuration

### Required Environment Variables

```bash
# Automatically set by Railway
DATABASE_URL=postgresql://user:password@host:port/database

# Required - Generate a random 32+ character string
SESSION_SECRET=your-super-secret-session-key

# Automatically set by Railway
NODE_ENV=production
```

### Optional Integrations

Add these to enable additional features:

```bash
# WooCommerce Sync (Optional)
WOOCOMMERCE_URL=https://your-store.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxxxxxxx

# Email Receipts (Optional - SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

## � First Login

After deployment:

1. **Access your application** at the Railway-provided URL
2. **Login with default credentials**:
   - Username: `admin`
   - Password: `admin123`
3. **⚠️ IMMEDIATELY CHANGE THE PASSWORD** for security
4. **Create additional cashier accounts** as needed

## 🎯 Key Features

### For Retail Stores
- Quick product scanning and checkout
- Inventory management with low-stock alerts
- Customer loyalty tracking
- Daily sales reports

### For Restaurants & Cafes
- Fast order processing
- Table management
- Kitchen order printing
- Payment splitting

### For Service Businesses
- Service item management
- Customer appointment tracking
- Invoice generation
- Payment tracking

## 🛡️ Security Features

- **🔐 Secure Authentication**: Session-based login with encrypted passwords
- **🚦 Rate Limiting**: Protection against brute force attacks
- **🛡️ Input Validation**: All data is sanitized and validated
- **� HTTPS**: Automatic SSL/TLS encryption on Railway
- **🚨 Security Headers**: XSS and CSRF protection

## 🔧 Local Development

If you want to run locally for development:

```bash
# Clone the repository
git clone <your-repo-url>
cd BPlusPOS

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local PostgreSQL database URL

# Start development server
npm run dev

# Access at http://localhost:5000
```

## � API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List all products
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details

### Customers
- `GET /api/customers` - List customers
- `POST /api/customers` - Create customer
- `PUT /api/customers/:id` - Update customer

## 🆘 Support

### Common Issues

1. **Can't login after deployment**:
   - Wait 2-3 minutes for database initialization
   - Use credentials: admin/admin123
   - Check Railway logs for any errors

2. **Database connection error**:
   - Verify PostgreSQL service is running in Railway
   - Check DATABASE_URL is automatically set

3. **Build failures**:
   - Check Railway build logs
   - Ensure all dependencies are in package.json

### Getting Help

- Check the health endpoint: `https://your-app.railway.app/api/health`
- Review Railway deployment logs
- Ensure all environment variables are set

## 🏗️ Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Hosting**: Railway with automatic deployments
- **Security**: Session-based authentication with bcrypt

---

<div align="center">
  <p>🚀 <strong>Ready to deploy?</strong> Click the Railway button above!</p>
  <p>Built with ❤️ for modern businesses</p>
</div>
