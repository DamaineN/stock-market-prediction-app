"""
Model Evaluation and Comparison Script for Stolckr
--------------------------------------------------
Evaluates all registered models (LSTM, Random Forest, XGBoost, Linear Regression)
on a selected dataset and computes standard metrics:
MAE, RMSE, MAPE, and Directional Accuracy.
Also generates line charts for backtesting visualization.
"""

import os
import asyncio
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import mean_absolute_error, mean_squared_error
from math import sqrt

# Import your existing ModelManager
from models.model_manager import ModelManager

# =============== CONFIGURATION ==================
DATA_PATH = "data/historical_datasets/AAPL.csv"  # Example dataset path
SYMBOL = "AAPL"                                  # Stock symbol for evaluation
TEST_RATIO = 0.2                                 # 80/20 train-test split
PRED_DAYS = 30                                   # Prediction window (matches lookback_days)
PLOT_RESULTS = True                              # Toggle plotting
# =================================================


# --------- Metric functions ---------
def mean_absolute_percentage_error(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    mask = y_true != 0
    return np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100

def directional_accuracy(y_true, y_pred):
    if len(y_true) < 2 or len(y_pred) < 2:
        return np.nan
    actual_dir = np.sign(np.diff(y_true))
    pred_dir = np.sign(np.diff(y_pred))
    return np.mean(actual_dir == pred_dir)

# --------- Evaluation logic ---------
async def evaluate_all_models():
    # Load dataset
    df = pd.read_csv(DATA_PATH)
    df = df.sort_values("date")
    prices = df["close"].values

    # Train-test split
    split_idx = int(len(prices) * (1 - TEST_RATIO))
    train, test = prices[:split_idx], prices[split_idx:]

    # Initialize Model Manager
    manager = ModelManager()

    print(f"\nEvaluating models for {SYMBOL}")
    print(f"Train size: {len(train)}, Test size: {len(test)}")

    results = []

    for model_name in manager.models.keys():
        print(f"\n--- Running {model_name} ---")

        try:
            # Use backtest method if available, otherwise simulate prediction
            backtest = await manager.backtest_model(
                model_name=model_name,
                symbol=SYMBOL,
                historical_data=df.to_dict("records"),
                test_days=len(test)
            )

            preds = [item["predicted"] for item in backtest["predictions_vs_actual"]]
            actual = [item["actual"] for item in backtest["predictions_vs_actual"]]

            # Compute metrics
            mae = mean_absolute_error(actual, preds)
            rmse = sqrt(mean_squared_error(actual, preds))
            mape = mean_absolute_percentage_error(actual, preds)
            da = directional_accuracy(actual, preds)

            results.append({
                "Model": model_name,
                "MAE": round(mae, 4),
                "RMSE": round(rmse, 4),
                "MAPE (%)": round(mape, 2),
                "Directional Accuracy": round(da * 100, 2)
            })

            print(f"MAE: {mae:.4f} | RMSE: {rmse:.4f} | MAPE: {mape:.2f}% | Dir.Acc: {da*100:.2f}%")

            # Plot for report evidence
            if PLOT_RESULTS:
                plt.figure(figsize=(10, 4))
                plt.plot(actual, label="Actual", linewidth=2)
                plt.plot(preds, label=f"{model_name} Predicted", linestyle="--")
                plt.title(f"{SYMBOL} - {model_name} Backtesting Results")
                plt.xlabel("Time Step")
                plt.ylabel("Price")
                plt.legend()
                plt.grid(True)
                os.makedirs("results/plots", exist_ok=True)
                plt.savefig(f"results/plots/{SYMBOL}_{model_name}_backtest.png", dpi=150)
                plt.close()

        except Exception as e:
            print(f"Error evaluating {model_name}: {e}")

    # Combine results into DataFrame
    result_df = pd.DataFrame(results)
    os.makedirs("results", exist_ok=True)
    result_path = f"results/{SYMBOL}_model_comparison.csv"
    result_df.to_csv(result_path, index=False)
    print(f"\nEvaluation complete. Results saved to {result_path}\n")
    print(result_df)
    return result_df


# --------- Run script directly ---------
if __name__ == "__main__":
    asyncio.run(evaluate_all_models())
