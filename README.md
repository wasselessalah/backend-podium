# Backend Podium

Express.js backend server for the Podium project with MongoDB integration.

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB (local or cloud instance)

## Installation

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd backend-podium
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env with your actual values
   nano .env
   ```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/podium

# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

### Environment Variable Details

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `JWT_SECRET` | Secret key for JWT signing (min 32 chars) | Any secure random string |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3001` or `https://frontend-podium.vercel.app` |

## Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Seed Database
```bash
# Seed all data (users, teams, admin)
npm run seed

# Seed only users
npm run seed-users

# Create admin user
npm run create-admin
```

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create new team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

## Project Structure

```
backend-podium/
├── app.js                 # Main application file
├── package.json          # Dependencies and scripts
├── .env.example          # Example environment file
├── .gitignore           # Git ignore patterns
├── config/
│   └── database.js      # MongoDB connection configuration
├── middleware/
│   └── auth.js          # JWT authentication middleware
├── models/
│   ├── User.js          # User data model
│   ├── Team.js          # Team data model
│   └── Admin.js         # Admin data model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User routes
│   └── teams.js         # Team routes
└── scripts/
    ├── seed.js          # Database seeding script
    ├── seedUsers.js     # Seed users
    ├── seedTeams.js     # Seed teams
    └── createAdmin.js   # Create admin user
```

## Development Tips

1. **Use nodemon** for automatic server restart during development
   ```bash
   npm run dev
   ```

2. **Check server health**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **Set correct CORS_ORIGIN** for your frontend URL

4. **Keep JWT_SECRET secure** and use a strong random string in production

## Deployment

### Render.com
1. Push code to GitHub
2. Connect repository to Render
3. Set environment variables in Render dashboard:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Your JWT secret key
   - `CORS_ORIGIN` - Your frontend URL (e.g., https://frontend-podium.vercel.app)
   - `NODE_ENV` - Set to `production`
   - `PORT` - Usually auto-assigned by Render

## Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` in `.env` matches your frontend URL
- Remove trailing slashes from the origin URL
- Clear browser cache if issue persists

### MongoDB Connection Errors
- Verify `MONGODB_URI` is correct
- Check MongoDB username and password
- Ensure IP whitelist includes your server's IP

### Port Already in Use
- Change `PORT` in `.env` to an available port
- Or kill the process using that port

## License

ISC
