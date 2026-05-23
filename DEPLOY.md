# Deployment

Quick notes for deploying KLIMA:

- XAMPP (local): copy folder to `c:\xampp\htdocs\KLIMA` and start Apache.
- Docker: build image with `docker build -t klima .` and run with `docker run -p 8080:80 klima`.
- Ensure environment variables are set (`OWM_API_KEY`, etc.) and `assets/icon-*.png` are present for PWA.

Health checks and logging

- A health endpoint is available at `/api/health.php` and returns JSON with `status`, `time`, `php_version`, and provider/cache checks.
- Log rotation: `scripts/rotate_logs.php` can be scheduled via cron to rotate `.cache/requests.log` when it grows.
