# EasyMove Man and Van - Production Deployment Guide

## Quick Start

1. **Environment Setup**
   ```bash
   cp .env.production .env
   # Edit .env with your production values
   ```

2. **Deploy Application**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. **Access Application**
   - Frontend: https://your-domain.com
   - Admin Portal: https://your-domain.com/admin/login
   - Health Check: https://your-domain.com/health

## Core Features Included

### Frontend Application
- React.js with TypeScript and Vite
- Mobile-first responsive design with TailwindCSS
- Real-time quote generation with Google Maps integration
- Dual payment processing (Stripe & PayPal)
- Progressive Web App capabilities

### Backend Services
- Express.js server with TypeScript
- PostgreSQL database with Drizzle ORM
- Secure admin authentication system
- Driver application and approval workflow
- Payment processing with GBP currency support

### Admin Portal
- Secure login: Use registration key "easymove2025"
- Driver management with approve/decline functionality
- Booking oversight and tracking
- Platform analytics and reporting

## Database Schema

### Core Tables
- `users` - Customer accounts and profiles
- `drivers` - Driver applications and approval status
- `bookings` - Job bookings and tracking
- `admins` - Admin user authentication
- `sessions` - Secure session management

### Key Features
- Automated migrations via Drizzle ORM
- Connection pooling for performance
- Daily automated backups
- Foreign key constraints for data integrity

## Payment Processing

### Stripe Integration
- Primary payment processor
- British Pounds Sterling (GBP) currency
- PCI DSS compliant implementation
- Real-time payment verification

### PayPal Integration
- Secondary payment option
- GBP currency support
- Sandbox and live environment ready
- Fast payment processing

## Security Implementation

### Authentication
- Secure admin portal with token-based auth
- Database-backed session management
- Password hashing with bcrypt
- Registration key protection

### Data Protection
- Input validation and sanitization
- SQL injection prevention
- XSS protection headers
- CORS configuration

### Infrastructure Security
- SSL/TLS encryption
- Rate limiting on API endpoints
- Security headers via nginx
- Docker container isolation

## Performance Optimizations

### Frontend
- Code splitting and lazy loading
- Image optimization and compression
- Service worker for offline capabilities
- CDN-ready static asset delivery

### Backend
- Database connection pooling
- Response caching strategies
- Query optimization with indexes
- Efficient API design

### Infrastructure
- nginx reverse proxy with gzip compression
- Docker multi-stage builds
- Health checks and auto-restart
- Resource monitoring

## Production Environment

### System Requirements
- Node.js 18+ with npm 8+
- PostgreSQL 15+
- Docker and Docker Compose
- SSL certificates for HTTPS

### Deployment Architecture
```
Internet → nginx (80/443) → App Container (5000) → PostgreSQL (5432)
                                ↓
                           Redis Cache (6379)
```

### Environment Variables
All sensitive data configured via environment variables:
- Database connection strings
- API keys (Google Maps, Stripe, PayPal)
- Session secrets
- SSL certificate paths

## Monitoring and Maintenance

### Health Monitoring
- Application health endpoints
- Database connection checks
- Payment processor status
- Automated service restart

### Logging
- Structured application logs
- nginx access and error logs
- Database query logging
- Payment transaction tracking

### Backup Strategy
- Daily automated database backups
- 30-day backup retention
- Compressed backup storage
- Easy restoration procedures

## Testing Coverage

### Automated Tests
- Unit tests for business logic
- Integration tests for API endpoints
- End-to-end workflow testing
- Payment processing validation

### Manual Testing Checklist
- [ ] Quote generation accuracy
- [ ] Payment flow completion
- [ ] Admin portal functionality
- [ ] Driver approval workflow
- [ ] Mobile responsiveness
- [ ] Security headers
- [ ] SSL certificate validity
- [ ] Database connectivity

## Operational Commands

### Application Management
```bash
# Start services
docker-compose -f docker-compose.production.yml up -d

# View logs
docker-compose -f docker-compose.production.yml logs -f

# Restart application
docker-compose -f docker-compose.production.yml restart app

# Stop all services
docker-compose -f docker-compose.production.yml down
```

### Database Operations
```bash
# Run migrations
npm run db:push

# Create backup
docker-compose -f docker-compose.production.yml exec db-backup /backup.sh

# Access database
docker-compose -f docker-compose.production.yml exec postgres psql -U easymove_user -d easymove_production
```

### SSL Certificate Management
```bash
# Generate self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/private.key \
  -out nginx/ssl/cert.pem

# For production, use Let's Encrypt or commercial certificates
```

## Troubleshooting

### Common Issues

1. **Application Won't Start**
   - Check environment variables are set
   - Verify database connectivity
   - Review application logs

2. **Payment Processing Fails**
   - Validate API keys are correct
   - Check currency settings (GBP)
   - Review payment processor logs

3. **Database Connection Issues**
   - Verify PostgreSQL is running
   - Check connection string format
   - Review firewall settings

### Log Locations
- Application: `docker-compose logs app`
- Database: `docker-compose logs postgres`
- nginx: `nginx/logs/`
- Backups: `backups/`

## Support and Updates

### Regular Maintenance
- Weekly security updates
- Monthly dependency updates
- Quarterly performance reviews
- Annual security audits

### Scaling Considerations
- Load balancer for multiple app instances
- Database read replicas
- CDN for static assets
- Monitoring and alerting systems

## Production Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database backups tested
- [ ] Payment processors verified
- [ ] Security scanning completed

### Post-Deployment
- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] Payment flows tested
- [ ] Admin portal accessible
- [ ] Monitoring configured
- [ ] Backup schedule verified

### Go-Live Verification
- [ ] Quote generation working
- [ ] Payment processing functional
- [ ] Admin functions operational
- [ ] Mobile experience tested
- [ ] Performance benchmarks met
- [ ] Security headers active