import streamlit as st
from pytrends.request import TrendReq
import pandas as pd
import plotly.express as px
import numpy as np

st.set_page_config(page_title="AI Trend Analyzer", layout="wide")

st.title("AI Hashtag Trend Prediction Dashboard")

keyword = st.text_input("Enter Topic or Hashtag")

if keyword:

    try:

        pytrends = TrendReq(hl='en-US', tz=330)

        pytrends.build_payload([keyword], timeframe='today 12-m')

        data = pytrends.interest_over_time()

        # =========================
        # VALIDATION
        # =========================

        if data.empty or data[keyword].sum() == 0:

            st.error("Keyword not available or no trend data found")

        else:

            data = data.drop(columns=['isPartial'])

            # =========================
            # Trend Score
            # =========================

            trend_score = data[keyword].mean()

            st.metric("Trend Score", f"{trend_score:.2f}%")

            # =========================
            # Accuracy Calculation
            # =========================

            std_dev = data[keyword].std()

            accuracy = 100 - (std_dev / 100 * 100)

            if accuracy < 0:
                accuracy = 0

            st.metric("Prediction Accuracy", f"{accuracy:.2f}%")

            # =========================
            # Growth Rate
            # =========================

            growth_rate = data[keyword].pct_change().mean()*100

            st.metric("Growth Rate", f"{growth_rate:.2f}%")

            # =========================
            # Recommendation System
            # =========================

            st.subheader("Trend Recommendation")

            if trend_score > 70:
                st.success(f"High trending topic | Confidence: {accuracy:.2f}%")
            elif trend_score > 40:
                st.info(f"Moderate trending topic | Confidence: {accuracy:.2f}%")
            else:
                st.warning(f"Low trending topic | Confidence: {accuracy:.2f}%")

            # =========================
            # Visualization 1
            # =========================

            st.subheader("1 Trend Over Time")

            fig1 = px.line(data, x=data.index, y=keyword)

            st.plotly_chart(fig1)

            # =========================
            # Visualization 2
            # =========================

            st.subheader("2 Trend Distribution")

            fig2 = px.histogram(data, x=keyword)

            st.plotly_chart(fig2)

            # =========================
            # Visualization 3
            # =========================

            monthly = data.resample('M').mean()

            st.subheader("3 Monthly Trend")

            fig3 = px.bar(monthly, x=monthly.index, y=keyword)

            st.plotly_chart(fig3)

            # =========================
            # Visualization 4
            # =========================

            data["moving_avg"] = data[keyword].rolling(7).mean()

            st.subheader("4 Moving Average Trend")

            fig4 = px.line(data, x=data.index, y=["moving_avg"])

            st.plotly_chart(fig4)

            # =========================
            # Visualization 5
            # =========================

            st.subheader("5 Area Growth Chart")

            fig5 = px.area(data, x=data.index, y=keyword)

            st.plotly_chart(fig5)

            # =========================
            # Visualization 6
            # =========================

            st.subheader("6 Box Plot Variability")

            fig6 = px.box(data, y=keyword)

            st.plotly_chart(fig6)

            # =========================
            # Visualization 7
            # =========================

            heat = data.copy()

            heat["Month"] = heat.index.month
            heat["Day"] = heat.index.day

            pivot = heat.pivot_table(values=keyword, index="Month", columns="Day")

            st.subheader("7 Trend Heatmap")

            fig7 = px.imshow(pivot)

            st.plotly_chart(fig7)

            # =========================
            # Region Analysis
            # =========================

            st.subheader("Top Regions")

            region = pytrends.interest_by_region()

            if not region.empty:

                region = region.sort_values(by=keyword, ascending=False).head(10)

                fig8 = px.bar(region, x=region.index, y=keyword)

                st.plotly_chart(fig8)

            # =========================
            # Peak Trend
            # =========================

            peak_value = data[keyword].max()
            peak_date = data[keyword].idxmax()

            st.success(f"Peak Trend: {peak_value}% on {peak_date.date()}")

    except:

        st.error("Invalid keyword or data unavailable")