# Stolckr

A comprehensive AI-powered stock market prediction application built with modern technologies and machine learning models.

## Architecture Overview

This application features a modern microservices architecture with clear separation of concerns:

- **Backend**: Python FastAPI with ML models (LSTM, ARIMA, Random Forest, SVM, XGBoost, LightGBM)
- **Frontend**: Next.js 15 with TypeScript
- **Database**: MongoDB Atlas (NoSQL)
- **Data Sources**: Yahoo Finance, Alpha Vantage API
- **Authentication**: JWT-based with role-based access control
- **ML Pipeline**: TensorFlow/Keras for deep learning, Scikit-learn for traditional ML

## Project Structure

```
stock-market-prediction-app/
├── backend/               # FastAPI backend services
│   ├── api/
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── middleware/    # Authentication & security
│   │   ├── database/      # Database connections
│   │   └── collectors/    # Data collection modules
│   ├── models/           # Machine Learning models
│   │   ├── lstm/         # LSTM neural networks
│   │   └── ensemble/     # Ensemble ML models
│   ├── data/
│   │   └── historical_datasets/  # Historical stock data
│   ├── config/           # Configuration management
│   └── main.py          # FastAPI application entry point
├── frontend/             # Next.js frontend application
│   ├── src/
│   │   ├── app/         # App router pages
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── contexts/    # React contexts
│   │   └── lib/         # Utility libraries
│   └── package.json
└── README.md
```

## How to Start

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **Git**

### Backend Setup

1. **Clone and navigate to the project**:
   ```bash
   git clone <your-repo-url>
   cd stock-market-prediction-app
   ```

2. **Create and activate Python virtual environment**:
   ```bash
   python -m venv venv
   # Windows
   ./venv/Scripts/Activate.ps1
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

4. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**:
   ```bash
   cp .env.template .env
   # Edit .env with your API keys and database credentials
   ```

6. **Run the FastAPI server**:
   ```bash
   python main.py
   ```
   API will be available at: http://localhost:8000
   
   Interactive docs at: http://localhost:8000/docs

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```
   Frontend will be available at: http://localhost:3000

## Configuration

### Database Setup

#### MongoDB Atlas (Primary Database)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get connection string
3. Add `MONGODB_CONNECTION_STRING` to `.env` file
4. The application will create necessary collections automatically

## Features

### Machine Learning Models
- **LSTM (Long Short-Term Memory)** 
- **XGBoost** 
- **Random Forest**
- **Linear Regression** 

### API Endpoints

#### Health & System
- `GET /api/v1/health` - Basic health check
- `GET /api/v1/health/detailed` - Detailed system metrics

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `PUT /api/v1/auth/profile` - Update user profile

#### Stock Data
- `GET /api/v1/stocks/search` - Search available stocks
- `GET /api/v1/stocks/{symbol}/info` - Stock information
- `GET /api/v1/stocks/{symbol}/historical` - Historical price data
- `GET /api/v1/stocks/{symbol}/current` - Current stock price

#### ML Predictions
- `POST /api/v1/predictions/{symbol}` - Generate predictions
- `GET /api/v1/predictions/{symbol}` - Get cached predictions
- `GET /api/v1/predictions/models` - Available ML models

#### Watchlist
- `GET /api/v1/watchlist` - Get user's watchlist
- `POST /api/v1/watchlist` - Add stock to watchlist
- `DELETE /api/v1/watchlist/{symbol}` - Remove from watchlist

#### AI Insights
- `GET /api/v1/insights/{symbol}` - Get AI trading insights

#### Paper Trading
- `GET /api/v1/paper-trading/portfolio` - Get portfolio
- `POST /api/v1/paper-trading/buy` - Execute buy order
- `POST /api/v1/paper-trading/sell` - Execute sell order
- `GET /api/v1/paper-trading/history` - Trade history

#### XP & Gamification
- `GET /api/v1/xp/progress` - User XP progress
- `GET /api/v1/xp/goals` - Available goals
- `POST /api/v1/xp/complete-goal` - Complete a goal

#### Dashboard
- `GET /api/v1/dashboard/stats` - Dashboard statistics
- `GET /api/v1/dashboard/activity` - User activity stats

### User Interface Features
- **Interactive charts** with Recharts and Chart.js
- **Prediction visualization** with confidence intervals
- **Paper trading simulation** with virtual portfolio
- **Responsive design** with Tailwind CSS
- **Role-based user experience** (Beginner, Casual, Paper Trader)
- **Trading insights** and recommendations
- **XP system** with goals and achievements
- **User authentication** and profile management

## Development

### Tech Stack

**Backend**:
- FastAPI (Python web framework)
- TensorFlow/Keras (Deep learning)
- Scikit-learn (Machine learning)
- Pandas & NumPy (Data processing)
- Matplotlib & Plotly (Visualization)
- Pydantic (Data validation)
- Uvicorn (ASGI server)

**Frontend**:
- Next.js 15 (React framework)
- TypeScript (Type safety)
- Tailwind CSS (Styling)
- Recharts (Charts)
- Lucide React (Icons)

**Database**:
- MongoDB Atlas 

**Deployment**:
- Local development (Backend: uvicorn, Frontend: Next.js dev server)

### Future Enhancements
1. Incorporate real-time data collection with real broker APIs
2. Implement advanced portfolio analytics
3. Add social features (leaderboards, sharing)
4. Mobile app development
5. Advanced cybersecurity measures
6. Advanced risk management tools

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Support

For questions and support, please contact:
- **Email**: damaine334@example.com
- **GitHub Issues**: [Create an issue](../../issues)

---
