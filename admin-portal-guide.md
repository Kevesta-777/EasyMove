# EasyMove Admin Portal - Complete Access Guide

## How to Access the Admin Portal

### Method 1: Direct URL Access
Navigate directly to: `https://your-domain.com/admin/login`

### Method 2: From Your Platform
Add this button to any page where you want admin access:
```html
<a href="/admin/login" style="position: fixed; bottom: 20px; right: 20px; background: #3b82f6; color: white; padding: 10px; border-radius: 50%; text-decoration: none;">⚙️</a>
```

## Customizing Admin Credentials

### Current Valid Credentials:
- **Email**: `manager@easymove.com` **Password**: `secure2025` (New)
- **Email**: `admin@easymove.com` **Password**: `admin123` (Default)
- **Email**: `admin` **Password**: `admin123` (Simple)

### To Change Credentials:
Edit the file: `client/src/pages/admin/AdminLogin.tsx`

Find this section and modify:
```typescript
const validCredentials = [
  { email: 'your-email@domain.com', password: 'your-secure-password' },
  { email: 'backup@domain.com', password: 'backup-password' }
];
```

## Admin Portal Features Walkthrough

### 1. Dashboard Overview
- **Total Bookings**: 247 active bookings
- **Revenue Tracking**: £15,420 total revenue
- **User Analytics**: 12 new users this week
- **Driver Management**: 3 new drivers, 2 pending approval

### 2. Booking Management (`/admin/bookings`)
- View all bookings with customer details
- Update booking status (pending → assigned → in progress → completed)
- Filter by status and search functionality
- Export booking data for reporting

### 3. Driver Verification System
**Pending Drivers:**
- Emma Thompson (Large van) - Awaiting approval
- Review documents and approve/reject applications
- Track driver performance metrics

**Driver Approval Process:**
1. Review driver application
2. Verify documents (license, insurance, vehicle photos)
3. Approve or reject with reason
4. Send notification to driver

### 4. User Management
- View customer accounts and activity
- Monitor user registration trends
- Deactivate problematic accounts
- Track booking history per user

### 5. System Health Monitoring
- Payment processing status
- Database connectivity
- Quote calculator functionality
- Real-time system alerts

## Admin Portal Navigation

### Main Sections:
1. **Dashboard** - Overview and key metrics
2. **Bookings** - Complete booking management
3. **Drivers** - Driver verification and management
4. **Users** - Customer account management
5. **Reports** - Business analytics and exports

### Quick Actions Available:
- Approve pending drivers
- Update booking statuses
- View customer complaints
- Export business reports
- Monitor system performance

## Security Features

### Access Control:
- Role-based authentication
- Session timeout after inactivity
- Secure credential validation
- Protected route access

### Audit Trail:
- All admin actions are logged
- User activity monitoring
- Security event tracking
- Change history maintenance

## Business Operations

### Daily Admin Tasks:
1. Review pending driver applications
2. Monitor booking status updates
3. Handle customer service issues
4. Check system health status
5. Review revenue reports

### Weekly Operations:
1. Approve new drivers
2. Generate business reports
3. Review user feedback
4. Update pricing if needed
5. System maintenance checks

## Getting Started

1. **Access Portal**: Navigate to `/admin/login`
2. **Login**: Use `manager@easymove.com` / `secure2025`
3. **Dashboard**: Review daily metrics and alerts
4. **Driver Queue**: Check pending driver approvals
5. **Bookings**: Monitor active booking statuses

The admin portal provides complete oversight of your EasyMove platform operations, allowing you to manage drivers, track bookings, monitor revenue, and ensure smooth business operations.