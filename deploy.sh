#!/bin/bash

# EasyMove Man and Van - Production Deployment Script
set -e

echo "🚀 Starting EasyMove Man and Van Production Deployment"

# Configuration
APP_NAME="easymove-man-and-van"
DB_NAME="easymove_production"
BACKUP_DIR="./backups"
DEPLOY_DATE=$(date +"%Y%m%d_%H%M%S")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required environment variables are set
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "DATABASE_URL"
        "GOOGLE_MAPS_API_KEY"
        "STRIPE_SECRET_KEY"
        "VITE_STRIPE_PUBLIC_KEY"
        "PAYPAL_CLIENT_ID"
        "PAYPAL_CLIENT_SECRET"
        "SESSION_SECRET"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi
    
    print_status "All required environment variables are set ✓"
}

# Create backup directory
create_backup_dir() {
    print_status "Creating backup directory..."
    mkdir -p "$BACKUP_DIR"
    print_status "Backup directory created ✓"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Install dependencies
    npm ci --only=production
    
    # Build frontend and backend
    npm run build
    
    print_status "Application built successfully ✓"
}

# Database setup
setup_database() {
    print_status "Setting up database..."
    
    # Run database migrations
    npm run db:push
    
    print_status "Database setup completed ✓"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p nginx/logs
    mkdir -p nginx/ssl
    
    print_status "Directories created ✓"
}

# Generate nginx configuration
generate_nginx_config() {
    print_status "Generating nginx configuration..."
    
    mkdir -p nginx
    
    cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=admin:10m rate=5r/s;

    upstream app {
        server app:5000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name _;

        # SSL configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/private.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        # Security
        client_max_body_size 10M;

        # Health check
        location /health {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_timeout 30s;
        }

        # Admin routes with stricter rate limiting
        location /admin/ {
            limit_req zone=admin burst=10 nodelay;
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static files
        location / {
            proxy_pass http://app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Cache static assets
            location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
                expires 1y;
                add_header Cache-Control "public, immutable";
                proxy_pass http://app;
            }
        }
    }
}
EOF

    print_status "Nginx configuration generated ✓"
}

# Generate backup script
generate_backup_script() {
    print_status "Generating backup script..."
    
    mkdir -p scripts
    
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash

# Database backup script
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="/backups/easymove_backup_${BACKUP_DATE}.sql"

echo "Creating database backup: $BACKUP_FILE"

# Create database backup
pg_dump -h postgres -U easymove_user -d easymove_production > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "Backup completed: ${BACKUP_FILE}.gz"

# Clean up old backups (keep last 30 days)
find /backups -name "easymove_backup_*.sql.gz" -mtime +30 -delete

echo "Old backups cleaned up"
EOF

    chmod +x scripts/backup.sh
    
    print_status "Backup script generated ✓"
}

# Start services
start_services() {
    print_status "Starting services with Docker Compose..."
    
    # Stop any existing containers
    docker-compose -f docker-compose.production.yml down
    
    # Start services
    docker-compose -f docker-compose.production.yml up -d
    
    print_status "Services started ✓"
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for services to start
    sleep 30
    
    # Check application health
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        print_status "Application health check passed ✓"
    else
        print_error "Application health check failed"
        exit 1
    fi
    
    # Check database connection
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U easymove_user -d easymove_production > /dev/null 2>&1; then
        print_status "Database health check passed ✓"
    else
        print_error "Database health check failed"
        exit 1
    fi
}

# Display deployment summary
deployment_summary() {
    print_status "Deployment completed successfully! 🎉"
    echo ""
    echo "📋 Deployment Summary:"
    echo "  • Application: Running on port 5000"
    echo "  • Database: PostgreSQL running on port 5432"
    echo "  • Nginx: Running on ports 80/443"
    echo "  • Backup: Automated daily backups configured"
    echo ""
    echo "🔗 Useful commands:"
    echo "  • View logs: docker-compose -f docker-compose.production.yml logs -f"
    echo "  • Stop services: docker-compose -f docker-compose.production.yml down"
    echo "  • Restart services: docker-compose -f docker-compose.production.yml restart"
    echo "  • Database backup: docker-compose -f docker-compose.production.yml exec db-backup /backup.sh"
    echo ""
    echo "🌐 Application URLs:"
    echo "  • Frontend: https://your-domain.com"
    echo "  • Admin Portal: https://your-domain.com/admin"
    echo "  • Health Check: https://your-domain.com/health"
}

# Main deployment process
main() {
    print_status "Starting deployment process..."
    
    check_env_vars
    create_backup_dir
    create_directories
    generate_nginx_config
    generate_backup_script
    build_application
    setup_database
    start_services
    health_check
    deployment_summary
}

# Run main function
main "$@"