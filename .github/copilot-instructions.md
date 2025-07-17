# Copilot Instructions for Nexora

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a full-stack real-time communication web application similar to Discord, built with React, Node.js, TypeScript, and Socket.IO.

## Code Style Guidelines

### General
- Use TypeScript throughout the project
- Follow functional programming patterns where possible
- Prefer async/await over Promises
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

### Frontend (React)
- Use functional components with hooks
- Implement proper error boundaries
- Use Redux Toolkit for state management
- Follow React best practices for performance
- Use TailwindCSS for styling with Discord-like color scheme
- Implement responsive design patterns

### Backend (Node.js)
- Use Express with TypeScript
- Implement proper error handling middleware
- Use Mongoose for MongoDB operations
- Follow RESTful API conventions
- Implement proper authentication and authorization
- Use Socket.IO for real-time features

### Database
- Use MongoDB with Mongoose ODM
- Define proper schemas with validation
- Use indexes for performance optimization
- Implement soft deletes where appropriate

### Security
- Always validate input data
- Use rate limiting for APIs
- Implement proper CORS configuration
- Hash passwords with bcryptjs
- Use JWT for authentication
- Sanitize user input

### Socket.IO
- Implement proper authentication for socket connections
- Use rooms for channel-based communication
- Handle disconnections gracefully
- Implement typing indicators and presence updates

## File Structure Conventions
- Place React components in `/client/src/components/`
- Place API routes in `/server/src/routes/`
- Place database models in `/server/src/models/`
- Place shared types in `/shared/types.ts`
- Use barrel exports (index.ts) for better imports

## Common Patterns

### API Responses
Always return consistent API response format:
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  errors?: ValidationError[];
}
```

### Error Handling
- Use try-catch blocks in async functions
- Implement proper error middleware
- Return meaningful error messages
- Log errors for debugging

### Socket.IO Events
- Use TypeScript interfaces for event data
- Implement proper error handling in socket handlers
- Use authentication middleware for socket connections

## Dependencies
- Frontend: React, Redux Toolkit, TailwindCSS, Socket.IO Client, Axios
- Backend: Express, Socket.IO, Mongoose, JWT, bcryptjs
- Shared: TypeScript types and utilities

## Environment Variables
Always use environment variables for:
- Database connections
- JWT secrets
- API keys
- Server ports
- External service configurations

## Testing Guidelines
- Write unit tests for utility functions
- Implement integration tests for API endpoints
- Test Socket.IO events
- Use React Testing Library for component tests

## Performance Considerations
- Implement pagination for large data sets
- Use database indexes effectively
- Optimize Socket.IO room management
- Implement proper caching strategies
- Use lazy loading for React components

## Discord-like Features to Implement
- Real-time messaging with typing indicators
- Voice and video chat using WebRTC
- Server and channel management
- Role-based permissions
- Friend system
- Presence and status updates
- Message reactions and threads
- File uploads and embeds
