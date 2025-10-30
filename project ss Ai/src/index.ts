import { app } from './api/server';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║     🎯 Headless Screenshot Tool - Powered by Playwright   ║
║                                                            ║
║     Server running on: http://localhost:${PORT}              ║
║                                                            ║
║     Endpoints:                                            ║
║     - GET  /health                                        ║
║     - POST /api/screenshot                                ║
║     - POST /api/screenshot/save                           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
  `);
});
