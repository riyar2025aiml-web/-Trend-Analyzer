import streamlit as st
from pytrends.request import TrendReq
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
import time
from sklearn.tree import DecisionTreeRegressor

# --- Page Config ---
st.set_page_config(page_title="AI Trend Analyzer", page_icon="📈", layout="wide")

st.title("🚀 AI Hashtag Trend Prediction Dashboard")
st.markdown("Analyze trends and predict future hashtag performance using AI.")

# --- Input ---
keyword = st.text_input("Enter Topic or Hashtag", placeholder="e.g. AI, Cricket, GPT")

# --- Fetch Google Trends ---
@st.cache_data(ttl=3600)
def fetch_data(kw):
    pytrends = TrendReq(hl='en-US', tz=330)
    pytrends.build_payload([kw], timeframe='today 12-m')
    data = pytrends.interest_over_time()
    return data

if keyword:
    try:
        with st.spinner("Fetching data..."):
            data = fetch_data(keyword)

        if data.empty or data[keyword].sum() == 0:
            st.error("No data found for this keyword")
        else:
            if 'isPartial' in data.columns:
                data = data.drop(columns=['isPartial'])

            # --- Metrics ---
            trend_score = data[keyword].mean()
            std_dev = data[keyword].std()
            accuracy = max(0, 100 - std_dev)

            growth_rate = data[keyword].pct_change().mean() * 100

            col1, col2, col3 = st.columns(3)
            col1.metric("Trend Score", f"{trend_score:.2f}")
            col2.metric("Stability", f"{accuracy:.2f}")
            col3.metric("Growth Rate", f"{growth_rate:.2f}%")

            st.divider()

            # --- Charts ---
            st.subheader("📊 Trend Over Time")
            fig1 = px.line(data, x=data.index, y=keyword)
            st.plotly_chart(fig1, use_container_width=True)

            st.subheader("📊 Histogram")
            fig2 = px.histogram(data, x=keyword)
            st.plotly_chart(fig2, use_container_width=True)

            st.subheader("📊 Scatter Plot")
            fig3 = px.scatter(data, x=data.index, y=keyword, size=data[keyword])
            st.plotly_chart(fig3, use_container_width=True)

            # --- Moving Average ---
            data['moving_avg'] = data[keyword].rolling(window=7).mean()

            fig4 = go.Figure()
            fig4.add_trace(go.Scatter(x=data.index, y=data[keyword], name="Actual"))
            fig4.add_trace(go.Scatter(x=data.index, y=data['moving_avg'], name="Moving Avg"))
            st.plotly_chart(fig4, use_container_width=True)

            # =========================================
            # 🤖 DECISION TREE MODEL (MAIN PART)
            # =========================================

            st.subheader("🤖 AI Prediction using Decision Tree")

            # Prepare data
            data = data.reset_index()
            data['day'] = np.arange(len(data))

            X = data[['day']]
            y = data[keyword]

            # Train model
            model = DecisionTreeRegressor(max_depth=5)
            model.fit(X, y)

            # Predict next 7 days
            future_days = np.array([[len(data)+i] for i in range(1, 8)])
            predictions = model.predict(future_days)

            # Create prediction dataframe
            future_df = pd.DataFrame({
                "Day": range(len(data)+1, len(data)+8),
                "Predicted Trend": predictions
            })

            st.write("### 🔮 Next 7 Days Prediction")
            st.dataframe(future_df)

            # Prediction graph
            st.line_chart(future_df.set_index("Day"))

            # --- Combined Graph ---
            st.subheader("📊 Actual vs Predicted")

            actual_series = pd.Series(data[keyword].values)
            pred_series = pd.Series(predictions)

            combined = pd.concat([actual_series, pred_series], ignore_index=True)

            st.line_chart(combined)

            # --- Search Filter ---
            st.subheader("🔍 Search (Filter by Value > Input)")

            threshold = st.slider("Select minimum trend value", 0, 100, 50)

            filtered = data[data[keyword] > threshold]

            st.write(filtered)

            # --- Peak Info ---
            peak_value = data[keyword].max()
            peak_date = data.loc[data[keyword].idxmax(), 'date']

            st.success(f"🏆 Peak: {peak_value} on {peak_date}")

    except Exception as e:
        st.error(f"Error: {str(e)}")

else:
    st.info("Enter a keyword to start analysis")
