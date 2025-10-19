# 📈 Stolckr

A comprehensive AI-powered stock market prediction application built with modern technologies and machine learning models.

## 🏗️ Architecture Overview

This application features a modern microservices architecture with clear separation of concerns:

- **Backend**: Python FastAPI with ML models (LSTM, ARIMA, Random Forest, SVM, XGBoost, LightGBM)
- **Frontend**: Next.js 15 with TypeScript
- **Database**: MongoDB Atlas (NoSQL)
- **Data Sources**: Yahoo Finance, Alpha Vantage API
- **Authentication**: JWT-based with role-based access control
- **ML Pipeline**: TensorFlow/Keras for deep learning, Scikit-learn for traditional ML

## 📁 Project Structure

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

## 🚀 Getting Started

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

## 🔧 Configuration

### API Keys Required

1. **Alpha Vantage**: Get free API key from [alphavantage.co](https://www.alphavantage.co)
2. **Yahoo Finance**: Optional premium features

### Database Setup

#### MongoDB Atlas (Primary Database)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get connection string
3. Add `MONGODB_CONNECTION_STRING` to `.env` file
4. The application will create necessary collections automatically

**Note**: The application can run without database connection using mock data for testing purposes.

## 📊 Features

### Data Collection & Preprocessing
- ✅ **Automatic data fetching** from multiple sources
- ✅ **Real-time and historical data** support
- ✅ **Data cleaning and preprocessing** pipelines
- ✅ **Rate limiting and error handling**

### Machine Learning Models
- 🔄 **LSTM (Long Short-Term Memory)** - Primary prediction engine
- 🔄 **ARIMA** - Statistical baseline for short-term patterns
- 🔄 **Random Forest & SVM** - Ensemble model components
- 🔄 **Linear Regression** - Simple baseline comparison

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
- ✅ **Interactive charts** with Recharts and Chart.js
- ✅ **Real-time price tracking** via HTTP polling
- ✅ **Prediction visualization** with confidence intervals
- ✅ **Paper trading simulation** with virtual portfolio
- ✅ **Responsive design** with Tailwind CSS
- ✅ **Role-based user experience** (Beginner, Casual, Paper Trader)
- ✅ **AI trading insights** and recommendations
- ✅ **XP system** with goals and achievements
- ✅ **User authentication** and profile management

## 🛠️ Development

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
- MongoDB Atlas (Primary database with mock data fallback)

**Deployment**:
- Local development (Backend: uvicorn, Frontend: Next.js dev server)
- Production-ready with Docker support

### Code Quality

- **ESLint** for JavaScript/TypeScript linting
- **Black** for Python code formatting
- **Pytest** for Python testing
- **Jest** for JavaScript testing
- **Pre-commit hooks** for code quality

## 📈 ML Model Details

### LSTM (Primary Model)
- **Purpose**: Captures sequential patterns and volatility
- **Input**: Time-series price data with technical indicators
- **Architecture**: Multi-layer LSTM with dropout regularization
- **Training**: Rolling window approach with early stopping

### ARIMA (Baseline)
- **Purpose**: Short-term stationary pattern detection
- **Method**: Automatic parameter selection (p, d, q)
- **Best for**: Stable market conditions

### Ensemble Models
- **Combination**: LSTM + ARIMA + Random Forest
- **Weighting**: Dynamic based on recent performance
- **Confidence**: Monte Carlo simulation for uncertainty

## 🚢 Deployment

### Frontend (Vercel)
```bash
# Deploy to Vercel
cd frontend
vercel --prod
```

### Backend (Docker)
```bash
# Build Docker image
docker build -t stock-prediction-api .

# Run container
docker run -p 8000:8000 --env-file .env stock-prediction-api
```

## 🔍 Testing

### Backend Tests
```bash
# Run Python tests
pytest tests/ -v --cov=api --cov=models
```

### Frontend Tests
```bash
# Run React tests
cd frontend
npm test
```

## 📋 Current Status

### ✅ Completed
- [x] Full-stack architecture with FastAPI + Next.js
- [x] User authentication and authorization (JWT)
- [x] Role-based access control (Beginner, Casual, Paper Trader)
- [x] Stock data integration with Yahoo Finance
- [x] Historical dataset management (10 major stocks)
- [x] LSTM neural network models for prediction
- [x] Ensemble ML models (Random Forest, XGBoost, LightGBM)
- [x] Real-time price tracking and visualization
- [x] Interactive charts and technical indicators
- [x] Paper trading simulation with portfolio management
- [x] AI-powered trading insights and recommendations
- [x] XP system with goals and achievements
- [x] Responsive web interface with modern design
- [x] MongoDB integration with fallback to mock data
- [x] Comprehensive API documentation
- [x] Admin dashboard for user management

### 🔄 Active Features
- ✅ **10 Stocks Available**: AAPL, GOOGL, MSFT, TSLA, AMZN, META, NVDA, NFLX, TSMC, SPY
- ✅ **7 ML Models**: Moving Average, LSTM, ARIMA, Linear Regression, Random Forest, XGBoost, SVR
- ✅ **3 User Roles**: Each with tailored experience and features
- ✅ **Paper Trading**: Buy/sell simulation with real-time P&L tracking
- ✅ **AI Coach**: Personalized trading advice after each transaction

### 📋 Future Enhancements
1. Expand stock universe beyond current 10 stocks
2. Add cryptocurrency and forex support
3. Implement advanced portfolio analytics
4. Add social features (leaderboards, sharing)
5. Mobile app development
6. Advanced risk management tools
7. Integration with real broker APIs

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions and support, please contact:
- **Email**: your-email@example.com
- **GitHub Issues**: [Create an issue](../../issues)

---

**Built with ❤️ for accurate stock market predictions**
