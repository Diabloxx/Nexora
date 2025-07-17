# Nexora - Real-time Communication Platform

A full-stack real-time communication web application similar to Discord, built with modern web technologies.

## 🚀 Features

### Core Features
- **Authentication System**
  - User registration and login with email/password
  - JWT-based session handling
  - OAuth login (Google, GitHub) *[Coming Soon]*
  
- **User Profile Management**
  - Avatar upload *[Coming Soon]*
  - Username and bio updates
  - Online/offline status tracking
  - Friend system with requests

- **Server and Channel System**
  - Create and manage servers (guilds)
  - Multiple text and voice channels per server
  - Role-based permissions system
  - Server invites with expiration and usage limits

- **Real-time Text Chat**
  - WebSocket-based messaging using Socket.IO
  - Message editing and deletion
  - Typing indicators
  - Message reactions
  - Markdown support *[Coming Soon]*

- **Voice and Video Chat**
  - WebRTC for peer-to-peer voice/video
  - Join/leave voice channels
  - Mute/unmute functionality
  - Screen sharing *[Coming Soon]*

- **Notification System** *[Coming Soon]*
  - Real-time updates when tagged or DMed
  - In-app notifications

### Technical Features
- Responsive design (mobile and desktop)
- Dark theme (light theme coming soon)
- Real-time presence tracking
- Scalable server architecture
- Secure WebSocket handling
- Input validation and rate limiting

## 🛠️ Tech Stack

### Frontend
- **React 19** with TypeScript
- **TailwindCSS** for styling
- **Redux Toolkit** for state management
- **Socket.IO Client** for real-time communication
- **Axios** for API calls
- **React Router** for navigation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **Socket.IO** for real-time communication
- **MongoDB** with Mongoose for database
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Rate Limit** for rate limiting
- **Helmet** for security headers
- **CORS** for cross-origin requests

### Development Tools
- **Nodemon** for server development
- **Concurrently** for running multiple processes
- **ESLint** and **Prettier** *[Coming Soon]*

## 📁 Project Structure

```
nexora/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── store/          # Redux store and slices
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utility functions
│   │   └── types/          # TypeScript type definitions
│   └── package.json
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   ├── socket/         # Socket.IO handlers
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Server entry point
│   ├── .env.example        # Environment variables template
│   └── package.json
├── shared/                 # Shared types and utilities
│   └── types.ts           # Shared TypeScript types
├── .gitignore
├── package.json           # Root package.json with scripts
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd nexora
   ```

2. **Install dependencies for all packages**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   ```bash
   # Copy the example environment file
   cp server/.env.example server/.env
   ```
   
   Edit `server/.env` with your configuration:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/nexora
   
   # JWT Secrets (generate secure random strings)
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
   
   # Client URL
   CLIENT_URL=http://localhost:3000
   
   # Server Port
   PORT=5000
   ```

4. **Start the development servers**
   ```bash
   # Start both client and server concurrently
   npm run dev
   
   # Or start them separately:
   npm run server:dev  # Start server on http://localhost:5000
   npm run client:dev  # Start client on http://localhost:3000
   ```

### Environment Variables

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/nexora

# Client Configuration
CLIENT_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here-change-this-in-production
JWT_REFRESH_EXPIRES_IN=30d

# OAuth Configuration (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Redis Configuration (Optional - for advanced presence tracking)
REDIS_URL=redis://localhost:6379

# Email Configuration (Optional - for email verification)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# File Upload Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user

### Server Endpoints
- `GET /api/servers` - Get user's servers
- `POST /api/servers` - Create a new server
- `GET /api/servers/:serverId` - Get server details
- `PATCH /api/servers/:serverId` - Update server
- `DELETE /api/servers/:serverId` - Delete server
- `POST /api/servers/join/:inviteCode` - Join server by invite
- `POST /api/servers/:serverId/invites` - Create server invite

### User Endpoints
- `GET /api/users/profile/:userId` - Get user profile
- `PATCH /api/users/profile` - Update user profile
- `GET /api/users/search` - Search users
- `POST /api/users/friends/request` - Send friend request
- `POST /api/users/friends/accept/:userId` - Accept friend request
- `GET /api/users/friends` - Get friends list

## 🔌 Socket.IO Events

### Connection Events
- `connection` - User connects
- `disconnect` - User disconnects

### Message Events
- `message:send` - Send a message
- `message:edit` - Edit a message
- `message:delete` - Delete a message
- `message:new` - Receive new message
- `typing:start` - Start typing indicator
- `typing:stop` - Stop typing indicator

### Voice Events
- `voice:join` - Join voice channel
- `voice:leave` - Leave voice channel
- `voice:mute` - Mute/unmute audio
- `voice:deafen` - Deafen audio

### Presence Events
- `presence:update` - Update user status
- `user:status` - User status changed

## 🚀 Deployment

### Frontend Deployment (Vercel)

1. **Prepare Environment Variables**
   Update `client/.env.production`:
   ```env
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   REACT_APP_SERVER_URL=https://your-backend-url.vercel.app
   REACT_APP_SOCKET_URL=https://your-backend-url.vercel.app
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Configure build settings:
     - Framework: Create React App
     - Build Command: `cd client && npm install && npm run build`
     - Output Directory: `client/build`
   - Set environment variables in Vercel dashboard

### Backend Deployment

For optimal WebSocket support, deploy the backend to:
- **Railway** (Recommended)
- **Render**
- **Heroku** (if available)

Set up these environment variables:
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://your-atlas-connection-string
CLIENT_URL=https://your-frontend-url.vercel.app
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d
```

### Database Setup
1. Create a MongoDB Atlas cluster
2. Whitelist your hosting provider's IP addresses
3. Update MONGODB_URI in your environment variables

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 🗺️ Roadmap

### Short Term
- [ ] Complete OAuth authentication (Google, GitHub)
- [ ] File upload functionality
- [ ] Emoji picker and custom emojis
- [ ] Message search
- [ ] Light theme support

### Medium Term
- [ ] Push notifications
- [ ] Message threads
- [ ] Server discovery page
- [ ] Mobile app (React Native)
- [ ] Video calling improvements

### Long Term
- [ ] Server clustering and horizontal scaling
- [ ] Advanced moderation tools
- [ ] Plugin system
- [ ] Advanced voice features (noise suppression, echo cancellation)
- [ ] Screen sharing and application sharing

## 🐛 Known Issues

- TypeScript compilation warnings in development (will be resolved)
- Voice chat requires HTTPS in production for WebRTC
- File uploads not yet implemented

## 📞 Support

If you have any questions or need help, please:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Join our Discord server *[Coming Soon]*

## 🙏 Acknowledgments

- Inspired by Discord's excellent UX/UI
- Built with modern web technologies
- Community feedback and contributions

---

**Happy coding! 🚀**
