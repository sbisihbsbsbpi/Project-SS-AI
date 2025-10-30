# 🚀 Getting Started with Headless Screenshot Tool

## Quick Start (5 minutes)

### 1. Install Dependencies
```bash
cd "/Users/tlreddy/Desktop/PYTHON/tekion/project ss Ai"
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Start Development Server
```bash
npm run dev
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🎯 Headless Screenshot Tool - Powered by Playwright   ║
║                                                            ║
║     Server running on: http://localhost:3000              ║
║                                                            ║
║     Endpoints:                                            ║
║     - GET  /health                                        ║
║     - POST /api/screenshot                                ║
║     - POST /api/screenshot/save                           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### 4. Test the API

**In a new terminal:**

```bash
# Test health endpoint
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
project ss Ai/
├── src/
│   ├── core/
│   │   └── screenshotService.ts    # Core screenshot logic
│   ├── api/
│   │   └── server.ts               # Express API
│   ├── types/
│   │   └── index.ts                # TypeScript types
│   └── index.ts                    # Entry point
├── tests/                          # Test files
├── dist/                           # Compiled output (after build)
├── node_modules/                   # Dependencies
├── .env                            # Environment config
├── .gitignore                      # Git ignore rules
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript config
├── README.md                       # Full documentation
├── RESEARCH.md                     # Research findings
├── PROJECT_SETUP_SUMMARY.md        # Setup details
└── GETTING_STARTED.md              # This file
```

## 🛠️ Available Commands

```bash
# Development
npm run dev              # Start dev server with hot reload

# Production
npm run build            # Compile TypeScript to JavaScript
npm start                # Run production server

# Testing
npm test                 # Run tests once
npm run test:watch       # Run tests in watch mode

# Maintenance
npm run lint             # Run linter
npm run clean            # Remove build artifacts
```

## 📡 API Examples

### Example 1: Basic Screenshot
```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com"
  }' > github.png
```

### Example 2: Custom Viewport
```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "viewport": {
      "width": 375,
      "height": 667
    }
  }' > mobile.png
```

### Example 3: Wait for Element
```bash
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "waitForSelector": ".main-content",
    "waitForTimeout": 5000
  }' > screenshot.png
```

### Example 4: Save to File
```bash
curl -X POST http://localhost:3000/api/screenshot/save \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "url": "https://example.com",
      "format": "jpeg",
      "fullPage": true
    },
    "outputDir": "./my-screenshots"
  }'
```

## 🔧 Configuration

Edit `.env` file:
```env
PORT=3000                    # Change server port
NODE_ENV=development         # Set environment
```

## 🐛 Troubleshooting

### Error: "Playwright browsers not found"
```bash
npx playwright install
```

### Error: "Port 3000 already in use"
```bash
# Option 1: Use different port
PORT=3001 npm run dev

# Option 2: Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Error: "Screenshot timeout"
Increase `waitForTimeout`:
```json
{
  "url": "https://example.com",
  "waitForTimeout": 10000
}
```

### Error: "Cannot find module"
```bash
npm install
npm run build
```

## 📚 Next Steps

1. **Explore the Code**
   - Read `src/core/screenshotService.ts` to understand screenshot logic
   - Check `src/api/server.ts` for API implementation
   - Review `src/types/index.ts` for TypeScript interfaces

2. **Build Features**
   - Add batch screenshot processing
   - Implement queue management
   - Add caching mechanisms
   - Create monitoring dashboard

3. **Deploy**
   - Build Docker image
   - Deploy to cloud (AWS, GCP, Azure)
   - Set up CI/CD pipeline
   - Configure monitoring

4. **Optimize**
   - Implement browser pooling
   - Add performance monitoring
   - Optimize memory usage
   - Add rate limiting

## 📖 Documentation

- **README.md** - Full feature documentation
- **RESEARCH.md** - Technology research and comparison
- **PROJECT_SETUP_SUMMARY.md** - Detailed setup information
- **GETTING_STARTED.md** - This file

## 🎯 Key Features

✅ Cross-browser support (Chrome, Firefox, Safari)
✅ REST API for easy integration
✅ Multiple output formats (PNG, JPEG, WebP)
✅ Full page and viewport screenshots
✅ Custom viewport sizes
✅ Wait strategies (selector, timeout)
✅ Cookie and header support
✅ User agent customization
✅ TypeScript for type safety
✅ Error handling and graceful shutdown

## 💡 Tips

1. **Use Postman** for easier API testing
2. **Check logs** in terminal for debugging
3. **Monitor memory** for long-running processes
4. **Use environment variables** for configuration
5. **Test with different URLs** to verify functionality

## 🆘 Need Help?

1. Check **README.md** for detailed documentation
2. Review **RESEARCH.md** for technology details
3. Check **PROJECT_SETUP_SUMMARY.md** for setup info
4. Look at **Playwright docs**: https://playwright.dev
5. Check **Express docs**: https://expressjs.com

## 🎉 You're Ready!

Your Headless Screenshot Tool is ready to use. Start the server and begin taking screenshots!

```bash
npm run dev
```

Happy screenshotting! 📸

---

**Questions?** Check the documentation files or review the code comments.
