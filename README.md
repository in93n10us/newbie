# VelvetKey - Trust-First Events Platform

## Overview
VelvetKey is a secure, privacy-focused events platform built with Next.js and FastAPI. The platform emphasizes trust, consent, and safety while providing powerful tools for event hosts and attendees.

## Project Structure

.
├── frontend/          # Next.js frontend application
├── backend/          # FastAPI backend service
├── e2e/             # End-to-end tests
└── docker/          # Docker configuration files


## Features
- Identity verification & consent management
- Event creation and management
- Secure payment processing
- Privacy-focused communication
- Post-event feedback system
- Reputation tracking

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- Docker & Docker Compose
- npm or yarn

### Development Setup

1. Clone the repository:
bash
git clone https://github.com/romecode/velvetkey.git
cd velvetkey


2. Start development environment:
bash
docker-compose up --build


Frontend will be available at `http://localhost:3000`
Backend API at `http://localhost:8000`

### Environment Variables

Create `.env` files in both frontend and backend directories:

Frontend (.env.local):

NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_KEY=your_stripe_public_key


Backend (.env):

DATABASE_URL=postgresql://user:password@db:5432/velvetkey
STRIPE_SECRET_KEY=your_stripe_secret_key
JWT_SECRET=your_jwt_secret


## Testing

Run frontend tests:
bash
cd frontend
npm test


Run backend tests:
bash
cd backend
pytest


Run e2e tests:
bash
docker-compose -f docker-compose.test.yml up --build


## Deployment

Production deployment uses Docker containers:

bash
docker-compose -f docker-compose.prod.yml up --build


## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## Security

Report security vulnerabilities to security@romecode.com

## License

Copyright © 2024 RomeCode Labs. All rights reserved.