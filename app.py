import streamlit as st
from pytrends.request import TrendReq
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np

st.set_page_config(page_title="AI Trend Analyzer", layout="wide")

st.title("AI Hashtag Trend Prediction Dashboard")

keyword = st.text_input("Enter Topic or Hashtag")

if keyword:
    try:
        pytrends = TrendReq(hl='en-US', tz=330)
        pytrends.build_payload([keyword], timeframe='today 12-m')
        data = pytrends.interest_over_time()

        if data.empty or data[keyword].sum() == 0:
            st.error("Keyword not available or no trend data found")

        else:
            data = data.drop(columns=['isPartial'])

            trend_score = data[keyword].mean()
            std_dev = data[keyword].std()
            accuracy = max(0, 100 - std_dev)
            growth_rate = data[keyword].pct_change().mean() * 100

            col1, col2, col3 = st.columns(3)
            col1.metric("Trend Score", f"{trend_score:.2f}%")
            col2.metric("Prediction Accuracy", f"{accuracy:.2f}%")
            col3.metric("Growth Rate", f"{growth_rate:.2f}%")

            # ── Trend Recommendation ──────────────────────────────────────
            st.subheader("Trend Recommendation")
            if trend_score > 70:
                st.success(f"High trending topic | Confidence: {accuracy:.2f}%")
            elif trend_score > 40:
                st.info(f"Moderate trending topic | Confidence: {accuracy:.2f}%")
            else:
                st.warning(f"Low trending topic | Confidence: {accuracy:.2f}%")

            # ── Related Trending Topics ───────────────────────────────────
            # FIX: Isolated try/except so failures here don't break the rest
            st.subheader("Related Trending Topics")
            try:
                related = pytrends.related_queries()
                top_related = related.get(keyword, {}).get('top')
                if top_related is not None and not top_related.empty:
                    st.dataframe(top_related.head(10))
                else:
                    st.info("No related trending topics found for this keyword.")
            except Exception as related_err:
                st.info(f"Related topics data unavailable: {related_err}")

            # ── 1  Trend Over Time (Line Chart) ───────────────────────────
            st.subheader("1  Trend Over Time (Line Chart)")
            fig1 = px.line(data, x=data.index, y=keyword)
            st.plotly_chart(fig1)

            # ── 2  Monthly Trend (Bar Chart) ──────────────────────────────
            st.subheader("2  Monthly Trend (Bar Chart)")
            monthly = data.resample('ME').mean()   # 'ME' = month-end (pandas ≥2.2)
            fig2 = px.bar(monthly, x=monthly.index, y=keyword)
            st.plotly_chart(fig2)

            # ── 3  Trend Distribution (Pie Chart) ─────────────────────────
            st.subheader("3  Trend Distribution (Pie Chart)")
            bins = pd.cut(data[keyword], bins=5).value_counts()
            pie_df = pd.DataFrame({
                "Range": bins.index.astype(str),
                "Count": bins.values
            })
            fig3 = px.pie(pie_df, names="Range", values="Count")
            st.plotly_chart(fig3)

            # ── 4  Area Growth Chart ──────────────────────────────────────
            st.subheader("4  Area Growth Chart")
            fig4 = px.area(data, x=data.index, y=keyword)
            st.plotly_chart(fig4)

            # ── 5  Scatter Plot ───────────────────────────────────────────
            st.subheader("5  Scatter Plot")
            fig5 = px.scatter(data, x=data.index, y=keyword)
            st.plotly_chart(fig5)

            # ── 6  Trend Distribution Histogram ──────────────────────────
            st.subheader("6  Trend Distribution Histogram")
            fig6 = px.histogram(data, x=keyword)
            st.plotly_chart(fig6)

            # ── 7  Stacked Bar Chart ──────────────────────────────────────
            st.subheader("7  Stacked Bar Chart (Raw vs 7-day Moving Avg)")
            data['moving_avg'] = data[keyword].rolling(7).mean()
            stacked_df = data[[keyword, 'moving_avg']].dropna()
            fig7 = px.bar(stacked_df, x=stacked_df.index, y=[keyword, 'moving_avg'])
            st.plotly_chart(fig7)

            # ── 8  Trend Heatmap ──────────────────────────────────────────
            st.subheader("8  Trend Heatmap")
            heat = data.copy()
            heat["Month"] = heat.index.month
            heat["Week"] = heat.index.isocalendar().week.astype(int)
            pivot = heat.pivot_table(values=keyword, index="Month", columns="Week")
            fig8 = px.imshow(pivot, aspect="auto")
            st.plotly_chart(fig8)

            # ── 9  Waterfall Chart ────────────────────────────────────────
            st.subheader("9  Waterfall Chart")
            diff = data[keyword].diff().fillna(0)
            fig9 = go.Figure(go.Waterfall(
                x=[str(d.date()) for d in data.index],
                y=diff,
                connector={"line": {"color": "rgb(63, 63, 63)"}}
            ))
            fig9.update_layout(showlegend=False)
            st.plotly_chart(fig9)

            # ── 10  Bubble Chart ──────────────────────────────────────────
            st.subheader("10  Bubble Chart")
            bubble_df = data.reset_index()
            bubble_df["size"] = bubble_df[keyword] * 2
            fig10 = px.scatter(bubble_df, x="date", y=keyword, size="size",
                               size_max=30)
            st.plotly_chart(fig10)

            # ── Top Regions ───────────────────────────────────────────────
            st.subheader("Top Regions")
            try:
                region = pytrends.interest_by_region()
                if not region.empty:
                    region = region.sort_values(by=keyword, ascending=False).head(10)
                    fig_region = px.bar(region, x=region.index, y=keyword)
                    st.plotly_chart(fig_region)
                else:
                    st.info("No regional data available for this keyword.")
            except Exception as region_err:
                st.info(f"Regional data unavailable: {region_err}")

            # ── Peak Trend ────────────────────────────────────────────────
            peak_value = data[keyword].max()
            peak_date = data[keyword].idxmax()
            st.success(f"Peak Trend: {peak_value}% on {peak_date.date()}")

    except Exception as e:
        st.error(f"Error fetching trend data: {e}")
