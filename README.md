# YouTube Scripts & Playbook Generator

A Next.js application for extracting YouTube video transcripts and generating AI-powered startup playbooks. Built with modern web technologies and integrated with n8n for automated workflow processing.

## 🚀 Features

### Core Functionality
- **YouTube Transcript Extraction**: Convert YouTube videos to transcripts using video URLs or IDs
- **Multiple Output Formats**: Generate transcripts in JSON, TSV, PDF, and Markdown formats
- **AI Playbook Generation**: Create comprehensive startup playbooks using n8n automation
- **Real-time Processing**: Live progress tracking with status updates
- **File Management**: Download, share, and manage generated content

### Advanced Features
- **Smart Content Processing**: Automatic video metadata extraction (title, channel, thumbnail)
- **Playbook Templates**: Structured startup guides with actionable insights
- **PDF Generation**: Professional document creation with custom styling
- **Share Functionality**: Generate shareable links for playbooks
- **Database Integration**: Persistent storage with Supabase
- **Responsive Design**: Mobile-friendly interface with modern UI components

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS 4, shadcn/ui components
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Automation**: n8n workflow integration
- **PDF Generation**: jsPDF
- **UI Components**: Radix UI primitives, Framer Motion
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+
- Python 3.x
- pnpm package manager
- Supabase account (for database)
- n8n instance (for playbook generation)

## 🚀 Quick Start

### 1. Installation

```bash
# Install dependencies
pnpm install

# Install Python dependencies
pip install -r requirements.txt
```

### 2. Environment Setup

Create a `.env.local` file in the project directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# n8n Configuration
N8N_WEBHOOK_URL=your_n8n_webhook_url
```

### 3. Database Setup

Set up your Supabase database with the following table structure:

```sql
CREATE TABLE processed_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_url TEXT NOT NULL,
  title TEXT,
  channel_name TEXT,
  prefix TEXT NOT NULL,
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  markdown_content TEXT,
  thumbnail_url TEXT,
  playbook_generated BOOLEAN DEFAULT FALSE,
  playbook_content TEXT,
  share_id UUID DEFAULT gen_random_uuid()
);
```

### 4. Development

```bash
# Start development server
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the application.

## 📖 Usage Guide

### Basic Transcript Extraction

1. **Enter YouTube URL**: Paste a YouTube video URL or video ID
2. **Set Prefix**: Provide a descriptive prefix for your output files
3. **Process**: Click "Process Video" to extract the transcript
4. **Download**: Choose your preferred format (JSON, TSV, PDF, Markdown)

### Playbook Generation

1. **Generate Playbook**: Click the "Generate Playbook" button on any processed video
2. **Wait for Processing**: Monitor the real-time progress indicator
3. **Review Content**: View the generated playbook with structured sections
4. **Download PDF**: Export the playbook as a professional PDF document
5. **Share**: Generate a shareable link for collaboration

### File Management

- **View History**: Access all previously processed videos
- **Download Files**: Get transcripts and playbooks in multiple formats
- **Share Content**: Create public links for easy sharing
- **Delete Records**: Remove videos from your processing history

## 🏗️ Architecture

### Frontend Structure
```
app/
├── page.tsx                 # Main application interface
├── layout.tsx              # Root layout component
├── globals.css             # Global styles
├── api/                    # API routes
│   ├── transcribe/         # Transcript processing
│   ├── generate-playbook/  # Playbook generation
│   ├── share/             # Share functionality
│   └── outputs/           # File serving
├── shared/                # Shared playbook pages
└── test-playbook/         # Playbook testing
```

### Component Architecture
```
components/
├── ui/                    # Base UI components (shadcn/ui)
├── playbook/              # Playbook-specific components
└── PlaybookGenerationProgress.tsx
```

### Key Libraries
```
lib/
├── supabase.ts           # Database operations
├── pdf-generator.ts      # PDF generation utilities
├── transcript-utils.ts   # Transcript processing
└── utils/
    └── playbook-transformer.ts
```

## 🔧 API Endpoints

### `/api/transcribe`
- **Method**: POST
- **Purpose**: Process YouTube videos and extract transcripts
- **Input**: `{ url: string, prefix: string }`
- **Output**: Processing status and file downloads

### `/api/generate-playbook`
- **Method**: POST
- **Purpose**: Generate AI-powered startup playbooks
- **Input**: `{ transcript: string, prefix?: string }`
- **Output**: Playbook content and generation status

### `/api/share`
- **Method**: POST
- **Purpose**: Create shareable links for playbooks
- **Input**: `{ videoId: string }`
- **Output**: Shareable URL

### `/api/outputs/[filename]`
- **Method**: GET
- **Purpose**: Serve generated files
- **Input**: Filename parameter
- **Output**: File content with appropriate headers

## 🚀 Deployment

### Railway Deployment

This application is optimized for Railway deployment:

```bash
# Build the application
pnpm run build

# Deploy to Railway
railway up
```

### Environment Variables for Production

Ensure all environment variables are set in your Railway project:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `N8N_WEBHOOK_URL`

## 🔄 n8n Integration

The application integrates with n8n for automated playbook generation:

1. **Webhook Trigger**: Receives transcript data from the frontend
2. **AI Processing**: Uses AI models to analyze content and generate insights
3. **Content Structuring**: Organizes information into actionable playbook sections
4. **Response**: Returns structured playbook content to the application

### n8n Workflow Features
- **Switch Logic**: Handles different content types and prefixes
- **Error Handling**: Graceful fallbacks for processing failures
- **Content Validation**: Ensures quality output before returning results

## 🎨 UI/UX Features

- **Modern Design**: Clean, minimalist interface using shadcn/ui
- **Dark Mode Support**: Automatic theme detection and switching
- **Responsive Layout**: Optimized for desktop and mobile devices
- **Loading States**: Smooth transitions and progress indicators
- **Toast Notifications**: User feedback for all actions
- **Accessibility**: WCAG compliant components and interactions

## 🧪 Development

### Available Scripts

```bash
# Development
pnpm dev              # Start development server with Turbopack
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Python Scripts
python transcribe_and_merge.py  # Manual transcript processing
```

### Code Quality

- **TypeScript**: Full type safety across the application
- **ESLint**: Code linting and formatting
- **Prettier**: Consistent code formatting
- **Component Testing**: Playwright for end-to-end testing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For issues and questions:
1. Check the existing issues in the repository
2. Create a new issue with detailed information
3. Include error messages and reproduction steps

---

**Built with ❤️ using Next.js, TailwindCSS, and shadcn/ui**