import express, { Express, Request, Response } from 'express';
import { ScreenshotService } from '../core/screenshotService';
import { ScreenshotOptions, ApiResponse, ScreenshotResult } from '../types';
import * as fs from 'fs';

const app: Express = express();
const screenshotService = new ScreenshotService();

// Middleware
app.use(express.json());

// Initialize screenshot service on startup
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await screenshotService.initialize('chromium');
    initialized = true;
  }
}

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Screenshot service is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Take a screenshot endpoint
 */
app.post('/api/screenshot', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();

    const options: ScreenshotOptions = req.body;

    if (!options.url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await screenshotService.takeScreenshot(options);

    if (result.success && result.buffer) {
      // Send buffer as response
      res.setHeader('Content-Type', `image/${options.format || 'png'}`);
      res.send(result.buffer);
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Save screenshot to file endpoint
 */
app.post('/api/screenshot/save', async (req: Request, res: Response) => {
  try {
    await ensureInitialized();

    const { options, outputDir } = req.body;

    if (!options || !options.url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        timestamp: new Date().toISOString()
      });
    }

    const result = await screenshotService.saveScreenshot(
      options as ScreenshotOptions,
      outputDir || './screenshots'
    );

    const response: ApiResponse<ScreenshotResult> = {
      success: result.success,
      data: {
        ...result,
        buffer: undefined // Don't send buffer in JSON response
      },
      error: result.error,
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await screenshotService.close();
  process.exit(0);
});

export { app, screenshotService };
