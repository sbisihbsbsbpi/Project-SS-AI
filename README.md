# 🎯 Project SS AI

A production-ready headless screenshot tool powered by Playwright and Node.js.

## 📋 Overview

**Project SS AI** is a powerful automation tool that captures headless screenshots of web pages with advanced features like multi-browser support, custom viewports, and REST API integration.

## ✨ Key Features

- ✅ **Cross-browser support** (Chrome, Firefox, Safari)
- ✅ **REST API** for easy integration
- ✅ **Multiple output formats** (PNG, JPEG, WebP)
- ✅ **Full page & viewport screenshots**
- ✅ **Custom viewport sizes**
- ✅ **Wait strategies** (selector, timeout)
- ✅ **Cookie & header support**
- ✅ **User agent customization**
- ✅ **TypeScript** for type safety
- ✅ **Error handling** & graceful shutdown

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/Project-SS-AI.git
cd Project-SS-AI

# Navigate to project
cd "project ss Ai"

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Start development server
npm run dev
```

### Test the API

```bash
# Health check
curl http://localhost:3000/health

# Take a screenshot
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}' > screenshot.png

# Save screenshot to file
curl -X POST http://localhost:3000/api/screenshot/save \
  -H "Content-Type: application/json" \
  -d '{
    "options": {"url": "https://example.com"},
    "outputDir": "./screenshots"
  }'
```

## 📁 Project Structure

```
Project-SS-AI/
├── project ss Ai/                     # Main application
│   ├── src/
│   │   ├── core/
│   │   │   └── screenshotService.ts   # Core screenshot logic
│   │   ├── api/
│   │   │   └── server.ts              # Express API server
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   └── index.ts                   # Entry point
│   ├── tests/                         # Test files
│   ├── dist/                          # Compiled output
│   ├── package.json                   # Dependencies
│   ├── tsconfig.json                  # TypeScript config
│   ├── .env                           # Environment variables
│   ├── .gitignore                     # Git ignore rules
│   ├── README.md                      # Full documentation
│   ├── GETTING_STARTED.md             # Quick start guide
│   ├── RESEARCH.md                    # Technology research
│   └── PROJECT_SETUP_SUMMARY.md       # Setup details
├── README.md                          # This file
└── .gitignore                         # Root git ignore

```

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production server

# Testing
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode

# Maintenance
npm run lint             # Run linter
npm run clean            # Remove build artifacts
```

## 📡 API Endpoints

### 1. Health Check
```bash
GET /health
```
Returns server status.

### 2. Take Screenshot
```bash
POST /api/screenshot
Content-Type: application/json

{
  "url": "https://example.com",
  "format": "png",
  "fullPage": true,
  "viewport": {
    "width": 1920,
    "height": 1080
  }
}
```
Returns screenshot as binary image.

### 3. Save Screenshot
```bash
POST /api/screenshot/save
Content-Type: application/json

{
  "options": {
    "url": "https://example.com",
    "format": "jpeg",
    "fullPage": true
  },
  "outputDir": "./screenshots"
}
```
Saves screenshot to file and returns metadata.

## 📊 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | 16+ |
| Language | TypeScript | 5.3.3 |
| Browser Automation | Playwright | 1.40.0 |
| Web Framework | Express | 4.18.2 |
| Testing | Vitest | 1.1.0 |

## 📚 Documentation

- **[GETTING_STARTED.md](./project%20ss%20Ai/GETTING_STARTED.md)** - Quick start guide with examples
- **[README.md](./project%20ss%20Ai/README.md)** - Full feature documentation
- **[RESEARCH.md](./project%20ss%20Ai/RESEARCH.md)** - Technology research and comparison
- **[PROJECT_SETUP_SUMMARY.md](./project%20ss%20Ai/PROJECT_SETUP_SUMMARY.md)** - Detailed setup information

## 🔧 Configuration

Edit `.env` file in `project ss Ai/`:
```env
PORT=3000                    # Server port
NODE_ENV=development         # Environment
```

## 🐛 Troubleshooting

### Playwright browsers not found
```bash
npx playwright install
```

### Port already in use
```bash
PORT=3001 npm run dev
```

### Screenshot timeout
Increase `waitForTimeout` in request:
```json
{
  "url": "https://example.com",
  "waitForTimeout": 10000
}
```

## 📈 Performance

- **Average screenshot time:** 2-3 seconds
- **Supported concurrent requests:** Configurable
- **Memory usage:** ~100-200MB per browser instance
- **CPU usage:** Minimal when idle

## 🎯 Use Cases

- 📸 **Web Monitoring** - Track website changes
- 🧪 **Visual Testing** - Automated screenshot testing
- 📊 **Report Generation** - Generate visual reports
- 🔍 **SEO Monitoring** - Track page rendering
- 📱 **Responsive Testing** - Test different viewports
- 🤖 **Automation** - Integrate with workflows

## 🚀 Deployment

### Docker
```bash
docker build -t project-ss-ai .
docker run -p 3000:3000 project-ss-ai
```

### Cloud Platforms
- AWS Lambda
- Google Cloud Functions
- Azure Functions
- Heroku

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For issues and questions:
1. Check the documentation files
2. Review the code comments
3. Check Playwright docs: https://playwright.dev
4. Check Express docs: https://expressjs.com

---

**Built with ❤️ using modern technologies**

**Repository:** https://github.com/YOUR_USERNAME/Project-SS-AI
