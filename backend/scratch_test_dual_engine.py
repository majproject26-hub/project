import time
import pandas as pd
import numpy as np
import duckdb
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
from prophet import Prophet
import warnings
warnings.filterwarnings('ignore')

# 1. Load data via DuckDB
con = duckdb.connect(":memory:")
con.execute("CREATE VIEW trends AS SELECT * FROM read_parquet('data/parquet/daily_revenue_and_usage_trends.parquet')")
df = con.execute('SELECT date AS ds, daily_revenue AS y FROM trends ORDER BY date ASC').df()

# 2. Clean & Resample
df['ds'] = pd.to_datetime(df['ds'])
df = df.sort_values('ds').set_index('ds')
df = df.resample('D').mean().interpolate(method='linear')
df = df.reset_index()

print("Dataset prepared:", len(df), "rows. Date range:", df['ds'].min(), "to", df['ds'].max())

# 3. Train/Test Split (last 14 days holdout)
holdout = 14
train_df = df.iloc[:-holdout].copy()
test_df = df.iloc[-holdout:].copy()

# 4. Fit ARIMA
t0 = time.perf_counter()
adf_res = adfuller(train_df['y'])
d = 1 if adf_res[1] > 0.05 else 0
arima_train = ARIMA(train_df['y'], order=(1, d, 1)).fit()
arima_val_pred = arima_train.get_forecast(steps=holdout).predicted_mean.values
arima_rmse = float(np.sqrt(np.mean((test_df['y'].values - arima_val_pred)**2)))
arima_mae = float(np.mean(np.abs(test_df['y'].values - arima_val_pred)))
arima_mape = float(np.mean(np.abs((test_df['y'].values - arima_val_pred) / test_df['y'].values)) * 100)
arima_time = round((time.perf_counter() - t0) * 1000, 2)

print(f"ARIMA Results -> RMSE: {arima_rmse:.2f}, MAE: {arima_mae:.2f}, MAPE: {arima_mape:.2f}%, FitTime: {arima_time}ms, AIC: {arima_train.aic:.2f}")

# 5. Fit Prophet
t1 = time.perf_counter()
m = Prophet(interval_width=0.95, daily_seasonality=False, weekly_seasonality=True, yearly_seasonality=False)
m.fit(train_df[['ds', 'y']])
future_val = m.make_future_dataframe(periods=holdout, freq='D')
prophet_val_fc = m.predict(future_val).iloc[-holdout:]
prophet_pred = prophet_val_fc['yhat'].values
prophet_rmse = float(np.sqrt(np.mean((test_df['y'].values - prophet_pred)**2)))
prophet_mae = float(np.mean(np.abs(test_df['y'].values - prophet_pred)))
prophet_mape = float(np.mean(np.abs((test_df['y'].values - prophet_pred) / test_df['y'].values)) * 100)
prophet_time = round((time.perf_counter() - t1) * 1000, 2)

print(f"Prophet Results -> RMSE: {prophet_rmse:.2f}, MAE: {prophet_mae:.2f}, MAPE: {prophet_mape:.2f}%, FitTime: {prophet_time}ms")

winner = "Prophet" if prophet_rmse < arima_rmse else "ARIMA"
print(f"Auto-selected winner based on holdout validation: {winner}!")
