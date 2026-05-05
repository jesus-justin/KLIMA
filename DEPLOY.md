# Deployment

Quick notes for deploying KLIMA:

- XAMPP (local): copy folder to `c:\xampp\htdocs\KLIMA` and start Apache.
- Docker: build image with `docker build -t klima .` and run with `docker run -p 8080:80 klima`.
- Ensure environment variables are set (`OWM_API_KEY`, etc.) and `assets/icon-*.png` are present for PWA.
