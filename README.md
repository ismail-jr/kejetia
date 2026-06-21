# Kejetia

A campus marketplace and service platform that connects students and service providers within the university community.

Built with Next.js, TypeScript, Tailwind CSS, Supabase, Redis, and Node.js.

## Features

- Student and Provider accounts
- OTP email verification
- Secure authentication with Supabase Auth
- Multi-role support using a single university email
- Role switching between Student and Provider
- Redis-powered OTP storage and login protection
- Responsive modern UI
- Protected routes and session management
- Real-time backend integration

## Tech Stack

### Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS

### Backend

- Node.js
- Express.js
- Supabase Authentication
- Supabase PostgreSQL
- Redis Cloud

### Security

- OTP verification
- Rate limiting
- Login attempt tracking
- Email normalization
- Secure JWT session handling

## Project Structure

```bash
src/
├── app/
├── components/
├── hooks/
├── lib/
├── providers/
├── services/
├── types/
└── utils/
```

## Installation

Clone the repository:

```bash
git clone <repository-url>
cd kejetia
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env.local` file in the root directory.

```env
NEXT_PUBLIC_API_URL=http://localhost:5000

NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Running the Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Available Scripts

```bash
npm run dev
```

Runs the application in development mode.

```bash
npm run build
```

Builds the application for production.

```bash
npm run start
```

Starts the production server.

```bash
npm run lint
```

Runs ESLint.

## Authentication Flow

### Registration

1. User enters email and account details.
2. Backend generates a 6-digit OTP.
3. OTP is stored securely in Redis.
4. Verification code is sent via email.
5. User verifies OTP.
6. Account is provisioned in Supabase Auth.
7. Profile is created or updated.

### Login

1. User signs in using email and password.
2. Supabase validates credentials.
3. User profile and roles are loaded.
4. Session tokens are returned.
5. Failed login attempts are tracked and rate limited.

## Roles

### Student

Students can:

- Request services
- Browse providers
- Manage bookings
- Track requests

### Provider

Providers can:

- Offer services
- Manage listings
- Accept requests
- Track earnings and activity

A single university email account can hold both Student and Provider roles.

## Deployment

### Frontend

Deploy using Vercel:

```bash
vercel
```

### Backend

Deploy using:

- Railway
- Render
- Fly.io
- DigitalOcean
- VPS

### Required Services

- Supabase
- Redis Cloud
- Email Provider

## Security

- OTP expiration
- Redis-backed verification storage
- Login rate limiting
- Session management with JWT
- Input validation
- Role-based access control
- Secure environment variables

## Contributors

Kejetia Development Team

## License

This project is licensed under the MIT License.
