# Production Deployment Guide

## Quick Fix for DATABASE_URL Error

If you're seeing this error:
```
Error: DATABASE_URL must be set. Did you forget to provision a database?
```

### For Railway:
1. Go to your Railway project dashboard
2. Click "Variables" tab
3. Add `DATABASE_URL` or use the `POSTGRES_URL` from your PostgreSQL service
4. Redeploy your application

### For Vercel:
1. Set up a Neon database at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Add it as `DATABASE_URL` in your Vercel environment variables

### For Other Platforms:
1. Provision a PostgreSQL database
2. Set the `DATABASE_URL` environment variable with your database connection string
3. Format: `postgresql://username:password@host:port/database_name`

## Environment Variables Required

```bash
# Required
DATABASE_URL=postgresql://username:password@host:port/database_name
SESSION_SECRET=your-super-secret-session-key-minimum-32-characters-long

# Optional
NODE_ENV=production
PORT=5000
```

## Database Setup

The application will automatically:
1. Create database tables on first run
2. Seed initial data including admin user
3. Set up the schema using the built-in initialization

Default admin credentials (change after first login):
- Username: `admin`
- Password: `admin123`

## Manual Database Initialization

If you need to manually initialize the database:

```bash
npm run db:setup
```

This will create all tables and seed initial data.

## Troubleshooting

### Database Connection Issues
- Ensure your DATABASE_URL is correct
- Check if your database service is running
- Verify network connectivity to your database

### Build Issues
- Run `npm run build` locally to test
- Check for TypeScript errors with `npm run check`
- Ensure all dependencies are installed

### Runtime Issues
- Check server logs for detailed error messages
- Verify all environment variables are set
- Ensure database is accessible from your deployment platform
