# JYTA-FRONTEND
**Joe Youtube Transcript APP Frontend**

A React/TypeScript frontend application for YouTube transcript management with Supabase integration.

## Project Overview

JYTA-FRONTEND is a modern web application built with React, TypeScript, and Vite that provides an interface for managing YouTube video transcripts. The application features authentication, note-taking capabilities, and YouTube video integration.

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Functions)
- **Package Manager**: npm/bun
- **Development**: ESLint, PostCSS

## Features

- 🔐 User Authentication (Supabase Auth)
- 📝 Note Management System
- 🎥 YouTube Video Integration
- 📱 Responsive Design
- 🎨 Modern UI with shadcn/ui components
- ⚡ Fast development with Vite

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun package manager
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone https://github.com/JoeBosi/JYTA-FRONTEND.git
cd JYTA-FRONTEND
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

4. Start the development server:
```bash
npm run dev
# or
bun dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── common/         # Shared components
│   ├── main/           # Main application components
│   ├── ui/             # shadcn/ui components
│   └── youtube/        # YouTube-specific components
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
├── lib/                # Utility functions
└── pages/              # Page components
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Supabase Setup

1. Create a new Supabase project
2. Run the migrations in `supabase/migrations/`
3. Set up the environment variables
4. Configure Supabase functions if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit your changes
5. Push to the branch
6. Create a Pull Request

## Author

**Giuseppe Bosi**

## License

This project is private and proprietary.
