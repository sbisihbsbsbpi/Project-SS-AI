# 🎯 Headless Screenshot Tool

A powerful, production-ready headless screenshot tool built with **Node.js** and **Playwright**.

## ✨ Features

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

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd project\ ss\ Ai

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Development

```bash
# Start development server
npm run dev

# Server will run on http://localhost:3000
```

### Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### 1. Health Check
```bash
GET /health
```

Response:
```json
{
  "success": true,
  "message": "Screenshot service is running",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 2. Take Screenshot (Return as Image)
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

Response: Binary image data

### 3. Save Screenshot to File
```bash
POST /api/screenshot/save
Content-Type: application/json

{
  "options": {
    "url": "https://example.com",
    "format": "png",
    "fullPage": true
  },
  "outputDir": "./screenshots"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "success": true,
    "url": "https://example.com",
    "filePath": "./screenshots/screenshot-aGR0cHM-1704110400000.png",
    "duration": 2345,
    "timestamp": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## 📋 Screenshot Options

```typescript
interface ScreenshotOptions {
  url: string;                    // Required: URL to screenshot
  format?: 'png' | 'jpeg' | 'webp'; // Default: 'png'
  fullPage?: boolean;             // Default: true
  viewport?: {
    width: number;
    height: number;
  };
  waitForSelector?: string;       // CSS selector to wait for
  waitForTimeout?: number;        // Milliseconds to wait
  emulateDevice?: string;         // Device name to emulate
  cookies?: Array<{
    name: string;
    value: string;
    domain?: string;
    path?: string;
  }>;
  headers?: Record<string, string>;
  userAgent?: string;
}
```

## 💡 Usage Examples

### Using cURL

```bash
# Take screenshot and save to file
curl -X POST http://localhost:3000/api/screenshot/save \
  -H "Content-Type: application/json" \
  -d '{
    "options": {
      "url": "https://google.com",
      "format": "png",
      "fullPage": true
    }
  }' > response.json

# Get screenshot as image
curl -X POST http://localhost:3000/api/screenshot \
  -H "Content-Type: application/json" \
  -d '{"url": "https://google.com"}' > screenshot.png
```

### Using Node.js

```javascript
const { ScreenshotService } = require('./dist/core/screenshotService');

async function main() {
  const service = new ScreenshotService();
  await service.initialize('chromium');

  const result = await service.saveScreenshot({
    url: 'https://example.com',
    format: 'png',
    fullPage: true
  }, './screenshots');

  console.log(result);
  await service.close();
}

main();
```

### Using Python

```python
import requests
import json

url = "http://localhost:3000/api/screenshot/save"
payload = {
    "options": {
        "url": "https://example.com",
        "format": "png",
        "fullPage": True
    }
}

response = requests.post(url, json=payload)
print(response.json())
```

## 🏗️ Project Structure

```
project ss Ai/
├── src/
│   ├── core/
│   │   └── screenshotService.ts    # Core screenshot logic
│   ├── api/
│   │   └── server.ts               # Express API server
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   └── index.ts                    # Entry point
├── tests/                          # Test files
├── dist/                           # Compiled JavaScript
├── package.json
├── tsconfig.json
├── .env
└── README.md
```

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## 🔧 Configuration

Create a `.env` file:

```env
PORT=3000
NODE_ENV=development
```

## 📦 Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)

## 🐛 Troubleshooting

### Playwright browsers not installed
```bash
npx playwright install
```

### Port already in use
```bash
# Change PORT in .env or use different port
PORT=3001 npm run dev
```

### Screenshot timeout
Increase `waitForTimeout` in options:
```json
{
  "url": "https://example.com",
  "waitForTimeout": 10000
}
```

## 📚 Documentation

- [Playwright Docs](https://playwright.dev)
- [Express Docs](https://expressjs.com)
- [TypeScript Docs](https://www.typescriptlang.org)

## 📝 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using Playwright**
