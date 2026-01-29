# Claude.ai Clone - AI Chat Interface

A fully functional clone of Claude.ai built with React, Node.js, Express, and SQLite. This application provides a modern, clean chat interface for interacting with Claude via the Anthropic API, featuring conversation management, artifact rendering, project organization, and advanced settings.

## 🌟 Features

### Core Features
- **Chat Interface**: Streaming responses, markdown rendering, code highlighting, LaTeX support
- **Artifacts System**: Code viewer, HTML/SVG preview, React components, Mermaid diagrams
- **Conversation Management**: Create, rename, delete, search, pin, archive, and export conversations
- **Projects**: Group conversations, custom instructions, knowledge base
- **Model Selection**: Switch between Claude Sonnet 4.5, Haiku 4.5, and Opus 4.1
- **Advanced Settings**: Temperature, max tokens, top-p controls, custom system prompts
- **Themes**: Light mode, dark mode, and auto (system preference)
- **Responsive Design**: Mobile-first, tablet, and desktop layouts

### Advanced Features
- Image upload and multi-modal input
- Message editing and regeneration
- Conversation branching
- Prompt library with templates
- Usage tracking and cost estimation
- Share conversations via link
- Export to JSON, Markdown, and PDF
- Command palette (Cmd/Ctrl+K)
- Full keyboard navigation
- Accessibility support

## 🛠️ Technology Stack

### Frontend
- **Framework**: React with Vite
- **Styling**: Tailwind CSS (via CDN)
- **State Management**: React hooks and context
- **Routing**: React Router
- **Markdown**: React Markdown with syntax highlighting

### Backend
- **Runtime**: Node.js with Express
- **Database**: SQLite with better-sqlite3
- **API Integration**: Anthropic Claude API
- **Streaming**: Server-Sent Events (SSE)

## 📋 Prerequisites

- Node.js 16+ and npm
- Anthropic API key (placed at `/tmp/api-key` or configured in environment)
- pnpm (recommended) or npm for frontend dependencies

## 🚀 Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd my_project

# Run the initialization script
bash init.sh
```

The `init.sh` script will:
- Install all frontend and backend dependencies
- Initialize the SQLite database
- Start both development servers

### 2. Manual Setup (Alternative)

If you prefer to set up manually:

```bash
# Install frontend dependencies
pnpm install  # or npm install

# Install backend dependencies
cd server
npm install
cd ..

# Initialize the database
node server/init-db.js

# Start backend (in one terminal)
cd server
npm run dev

# Start frontend (in another terminal)
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:5173 (or configured port)
- **Backend API**: http://localhost:3000

## 📁 Project Structure

```
my_project/
├── feature_list.json       # 200+ test cases for all features
├── init.sh                 # Setup and initialization script
├── README.md               # This file
├── package.json            # Frontend dependencies
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── contexts/           # React contexts for state
│   ├── hooks/              # Custom React hooks
│   ├── pages/              # Page components
│   ├── utils/              # Utility functions
│   └── App.jsx             # Main app component
├── server/                 # Backend source code
│   ├── server.js           # Express server
│   ├── db.js               # Database initialization
│   ├── routes/             # API route handlers
│   ├── middleware/         # Express middleware
│   └── utils/              # Backend utilities
├── public/                 # Static assets
└── database/               # SQLite database files
```

## 🗄️ Database Schema

The application uses SQLite with the following tables:

- **users**: User profiles and preferences
- **projects**: Project organization and custom instructions
- **conversations**: Chat conversations with settings
- **messages**: Individual messages in conversations
- **artifacts**: Generated artifacts (code, HTML, diagrams)
- **shared_conversations**: Shared conversation links
- **prompt_library**: Saved prompt templates
- **conversation_folders**: Folder structure for organization
- **usage_tracking**: Token usage and cost tracking
- **api_keys**: API key management

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Anthropic API Key
VITE_ANTHROPIC_API_KEY=your_api_key_here

# Frontend Port (optional)
VITE_PORT=5173

# Backend Port (optional)
PORT=3000

# Database Path (optional)
DATABASE_PATH=./database/claude.db
```

Alternatively, the backend will read the API key from `/tmp/api-key` if available.

## 🎨 Design System

The application closely matches Claude.ai's design language:

- **Primary Color**: Orange/amber accent (#CC785C)
- **Light Mode**: White background, dark text, light gray surfaces
- **Dark Mode**: Dark gray background (#1A1A1A), light text, darker surfaces
- **Typography**: System font stack (Inter, SF Pro, Roboto)
- **Code Font**: Monospace (JetBrains Mono, Consolas, Monaco)

## 📝 Development Progress

Track implementation progress in `feature_list.json`. This file contains 200+ detailed test cases covering:

- **Functional tests**: Core features, API integration, data persistence
- **Style tests**: UI/UX requirements, responsive design, accessibility

Each test case includes:
- Category (functional/style)
- Description of what's being tested
- Step-by-step testing instructions
- Pass/fail status

### Testing Progress

```bash
# Count completed features
cat feature_list.json | grep '"passes": true' | wc -l

# Count total features
cat feature_list.json | grep '"passes":' | wc -l
```

## 🔑 API Integration

The application uses the Anthropic Claude API for chat functionality:

- **Streaming**: Real-time message streaming using Server-Sent Events
- **Models**: Support for multiple Claude models
- **Images**: Multi-modal support for image inputs
- **Parameters**: Configurable temperature, max tokens, and top-p

## 🚧 Implementation Roadmap

1. ✅ **Project Foundation**: Setup, database schema, basic structure
2. **Core Chat Interface**: Message display, streaming, markdown rendering
3. **Conversation Management**: CRUD operations, search, organization
4. **Artifacts System**: Detection, rendering, editing
5. **Projects and Organization**: Projects, folders, custom instructions
6. **Advanced Features**: Model selection, parameters, image upload
7. **Settings and Customization**: Themes, preferences, keyboard shortcuts
8. **Sharing and Collaboration**: Share links, exports, templates
9. **Polish and Optimization**: Responsive design, accessibility, performance

## 🤝 Contributing

This project follows a multi-agent development process:

1. All features are defined in `feature_list.json`
2. Features are implemented one at a time
3. Each feature is thoroughly tested before marking as passing
4. Progress is committed regularly with descriptive messages
5. The `claude-progress.txt` file tracks what has been accomplished

### Commit Guidelines

- Focus on one feature or closely related features per commit
- Write clear, descriptive commit messages
- Test thoroughly before committing
- Update `feature_list.json` when features are completed

## 📚 Documentation

- **API Endpoints**: See `app_spec.txt` for complete API documentation
- **Component Documentation**: JSDoc comments throughout the codebase
- **Database Schema**: Detailed in `app_spec.txt`
- **Design System**: Specified in `app_spec.txt`

## 🐛 Troubleshooting

### Backend won't start
- Check if port 3000 is already in use
- Verify API key is available at `/tmp/api-key` or in `.env`
- Check `backend.log` for error messages

### Frontend won't start
- Check if port 5173 is already in use
- Run `pnpm install` or `npm install` to ensure dependencies are installed
- Check `frontend.log` for error messages

### Database errors
- Delete `database/claude.db` and run `node server/init-db.js` to recreate
- Check file permissions on the database directory

### API errors
- Verify your Anthropic API key is valid and has sufficient credits
- Check network connectivity
- Review backend logs for API error details

## 📄 License

This project is for educational purposes. Anthropic and Claude are trademarks of Anthropic, PBC.

## 🙏 Acknowledgments

Built as a clone of [Claude.ai](https://claude.ai) by Anthropic. This project is not affiliated with or endorsed by Anthropic.

---

**Status**: 🏗️ In Development

**Current Progress**: Foundation setup complete, implementing core features

See `feature_list.json` for detailed progress tracking of all 200+ features.
