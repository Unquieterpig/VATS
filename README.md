# VATS - Varia's Awesome Tracking Software (Web Version)

A modern web application for managing VR headsets, converted from the original PyQt6 desktop application.

## Features

- **Password Protection**: Simple password authentication to secure access
- **Headset Management**: Add, edit, and remove VR headsets
- **Real-time Status Tracking**: Monitor which headsets are in use or available
- **Smart Suggestions**: Get priority-based recommendations for the next available headset
- **Account Management**: Prevent conflicts when accounts are already in use
- **Priority System**: Customize headset priorities for better allocation
- **Responsive UI**: Modern Material-UI interface that works on all devices
- **Filter Options**: Hide headsets with accounts already in use
- **Persistent Login**: Stay logged in until browser is closed (24-hour session)

## Technology Stack

- **Frontend**: React 18 with TypeScript, Material-UI (MUI)
- **Backend**: Node.js with Express
- **Data Storage**: JSON file-based storage (easily replaceable with database)
- **API**: RESTful API with proper error handling

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies for all parts of the application:
   ```bash
   npm run install-all
   ```

2. Start the development servers:
   ```bash
   npm run dev
   ```
   
   Or use the startup script:
   ```bash
   start.bat
   ```

This will start:
- Backend server on http://localhost:3001
- Frontend development server on http://localhost:3000

### Production Build

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run server
   ```

The built files will be in the `client-vite/dist` folder.

## API Endpoints

- `GET /api/headsets` - Get all headsets (with optional filtering)
- `GET /api/suggestion` - Get suggested next headset
- `POST /api/checkout` - Checkout selected headsets
- `POST /api/return` - Return selected headsets
- `POST /api/headsets` - Add new headset
- `PUT /api/headsets/:id` - Update headset
- `DELETE /api/headsets/:id` - Remove headset
- `PUT /api/headsets/:id/priority` - Set headset priority
- `GET /api/health` - Health check

## Configuration

### Server Configuration
The application uses environment variables for configuration:

- `PORT` - Server port (default: 3001)

### Authentication Configuration
The default password can be changed in `client-vite/src/config/auth.ts`:

```typescript
export const AUTH_CONFIG = {
  DEFAULT_PASSWORD: 'Varia4Lyfe', // Change this to your desired password
  AUTH_DURATION: 24 * 60 * 60 * 1000, // 24 hours
  // ...
};
```

**Default Password**: `Varia4Lyfe`

## Data Migration

To migrate your existing headset data from the original PyQt6 application:

1. Copy your `headsets.json` file to `server/data/headsets.json`
2. The web application will automatically load and use this data

## Deployment

### Option 1: Traditional Web Hosting

1. Build the frontend: `npm run build`
2. Upload the `client/build` folder to your web server
3. Deploy the `server` folder to a Node.js hosting service
4. Configure environment variables

### Option 2: Docker (Recommended)

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies
RUN npm run install-all

# Build frontend
RUN npm run build

# Copy source code
COPY . .

EXPOSE 3001

CMD ["npm", "run", "server"]
```

### Option 3: Static Site Hosting + Serverless

- Frontend: Deploy to Vercel, Netlify, or GitHub Pages
- Backend: Deploy to Vercel Functions, AWS Lambda, or similar

## Differences from Original

### Improvements
- **Web-based**: Accessible from any device with a browser
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Material Design components with better UX
- **Real-time Updates**: No need to manually refresh
- **Better Error Handling**: Clear error messages and validation
- **Scalable Architecture**: Easy to extend with new features

### Maintained Features
- All core functionality from the original application
- Same data structure and business logic
- Priority-based suggestions
- Account conflict prevention
- Status filtering

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.