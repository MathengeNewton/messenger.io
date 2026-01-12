# Messenger Deployment Configuration

## Port Configuration

- **Backend**: Port `4500` (exposed on `localhost:4500`)
- **Frontend**: Port `3010` (exposed on `localhost:3010`)

## Domain Configuration

- **Frontend**: `messenger.jerdyl.co.ke` → proxies to `http://localhost:3010`
- **Backend API**: `messenger-api.jerdyl.co.ke` → proxies to `http://localhost:4500`

## Nginx Virtual Host Setup

The nginx virtual host configuration file is located at:
```
/home/newton/projects/messenger/nginx-messenger.conf
```

### Installation Steps

1. **Copy the configuration to nginx sites-available:**
   ```bash
   sudo cp nginx-messenger.conf /etc/nginx/sites-available/messenger
   ```

2. **Create symbolic link to sites-enabled:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/messenger /etc/nginx/sites-enabled/messenger
   ```

3. **Test nginx configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

## Docker Compose

Start the services:
```bash
docker-compose up -d
```

The services will be available on:
- Backend: `http://localhost:4500`
- Frontend: `http://localhost:3010`

## Environment Variables

### Frontend
- `NEXT_PUBLIC_API_URL`: Set to `https://messenger-api.jerdyl.co.ke/api` (configured in docker-compose.yml)

### Backend
- `PORT`: Set to `4500` (configured in docker-compose.yml)

## CORS Configuration

The backend CORS is configured to allow requests from:
- `http://messenger.jerdyl.co.ke`
- `https://messenger.jerdyl.co.ke`
- `http://localhost:3010` (for local development)

## SSL/HTTPS Setup (Recommended)

For production, you should set up SSL certificates using Let's Encrypt:

```bash
sudo certbot --nginx -d messenger.jerdyl.co.ke -d messenger-api.jerdyl.co.ke
```

After SSL setup, update the frontend API URL in `docker-compose.yml` to use `https://messenger-api.jerdyl.co.ke/api`.

