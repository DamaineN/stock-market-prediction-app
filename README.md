# 📈 Stolckr

A comprehensive AI-powered stock market prediction application built with modern technologies and machine learning models.

## 🏗️ Architecture Overview

This application follows a **Waterfall Development Model** with clear separation between backend and frontend:

- **Backend**: Python FastAPI with ML models (LSTM, ARIMA, Random Forest, SVM)
- **Frontend**: Next.js with TypeScript, deployed on Vercel
- **Databases**: MongoDB Atlas (NoSQL) + PostgreSQL (SQL)
- **Data Sources**: Yahoo Finance, Google Finance, Alpha Vantage API

## 📁 Project Structure

```
stock-market-prediction-app/
├── api/                    # FastAPI backend services
│   ├── collectors/         # Data collection modules
│   ├── processors/         # Data processing utilities
│   ├── routes/            # API endpoints
│   └── database/          # Database connections
├── models/                # Machine Learning models
│   ├── lstm/              # Long Short-Term Memory models
│   ├── arima/             # ARIMA statistical models
│   └── ensemble/          # Ensemble/hybrid models
├── frontend/              # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   └── components/    # React components
├── data/                  # Data storage
│   ├── raw/               # Raw API responses
│   ├── processed/         # Cleaned datasets
│   └── historical/        # Historical data cache
├── config/                # Configuration files
├── tests/                 # Test suites
├── docs/                  # Documentation
└── scripts/               # Utility scripts
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

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.template .env
   # Edit .env with your API keys and database credentials
   ```

5. **Run the FastAPI server**:
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

#### MongoDB Atlas
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a cluster and get connection string
3. Add to `.env` file

#### PostgreSQL
1. Install PostgreSQL locally or use cloud provider
2. Create database named `stock_prediction`
3. Add credentials to `.env` file

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

#### Stock Data
- `GET /api/v1/stocks/{symbol}/historical` - Historical price data
- `GET /api/v1/stocks/{symbol}/info` - Stock information
- `GET /api/v1/stocks/{symbol}/intraday` - Real-time intraday data
- `GET /api/v1/stocks/{symbol}/technical-indicators` - Technical analysis
- `GET /api/v1/stocks/search` - Search stocks

#### ML Predictions
- `POST /api/v1/predictions/predict` - Generate predictions
- `GET /api/v1/predictions/{symbol}` - Get cached predictions
- `POST /api/v1/predictions/train` - Train models
- `GET /api/v1/predictions/models/status` - Model status
- `GET /api/v1/predictions/backtest/{symbol}` - Backtest performance

### User Interface Features
- 🔄 **Interactive charts** with Recharts and Chart.js
- 🔄 **Real-time price tracking**
- 🔄 **Prediction visualization** with confidence intervals
- 🔄 **Portfolio simulation** and backtesting
- 🔄 **Responsive design** with Tailwind CSS

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

**Databases**:
- MongoDB Atlas (Document store)
- PostgreSQL (Relational data)

**Deployment**:
- Vercel (Frontend hosting)
- Docker (Backend containerization)
- GitHub Actions (CI/CD)

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
- [x] Project structure and configuration
- [x] Virtual environment and dependencies
- [x] FastAPI backend with API routes
- [x] Next.js frontend initialization
- [x] Database connection setup
- [x] Configuration management
- [x] Documentation

### 🔄 In Progress
- [ ] Data collection modules (Yahoo Finance & Alpha Vantage)
- [ ] Database connection implementations
- [ ] ML model implementations (LSTM, ARIMA, Ensemble)

### 📋 Next Steps
1. Implement data collectors for Yahoo Finance and Alpha Vantage
2. Set up MongoDB and PostgreSQL connections
3. Build ML model predictors
4. Create frontend components and pages
5. Implement authentication and user management
6. Add comprehensive testing
7. Deploy to production

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
