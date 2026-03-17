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
            accuracy = max(0, 100 - (std_dev))
            growth_rate = data[keyword].pct_change().mean()*100

            col1, col2, col3 = st.columns(3)

            col1.metric("Trend Score", f"{trend_score:.2f}%")
            col2.metric("Prediction Accuracy", f"{accuracy:.2f}%")
            col3.metric("Growth Rate", f"{growth_rate:.2f}%")


            st.subheader("Trend Recommendation")

            if trend_score > 70:
                st.success(f"High trending topic | Confidence: {accuracy:.2f}%")
            elif trend_score > 40:
                st.info(f"Moderate trending topic | Confidence: {accuracy:.2f}%")
            else:
                st.warning(f"Low trending topic | Confidence: {accuracy:.2f}%")


            st.subheader("Related Trending Topics")

            related = pytrends.related_queries()

            if related[keyword]['top'] is not None:

                related_df = related[keyword]['top'].head(10)

                st.dataframe(related_df)

            

            st.subheader("1 Trend Over Time (Line Chart)")

            fig1 = px.line(data, x=data.index, y=keyword)

            st.plotly_chart(fig1)

           
            st.subheader("2 Monthly Trend (Bar Chart)")

            monthly = data.resample('M').mean()

            fig2 = px.bar(monthly, x=monthly.index, y=keyword)

            st.plotly_chart(fig2)


            st.subheader("3 Trend Distribution (Pie Chart)")

            bins = pd.cut(data[keyword], bins=5).value_counts()

            pie_df = pd.DataFrame({
                "Range": bins.index.astype(str),
                "Count": bins.values
            })

            fig3 = px.pie(pie_df, names="Range", values="Count")

            st.plotly_chart(fig3)

           

            st.subheader("4 Area Growth Chart")

            fig4 = px.area(data, x=data.index, y=keyword)

            st.plotly_chart(fig4)

           

            st.subheader("5 Scatter Plot")

            fig5 = px.scatter(data, x=data.index, y=keyword)

            st.plotly_chart(fig5)

           

            st.subheader("6 Trend Distribution Histogram")

            fig6 = px.histogram(data, x=keyword)

            st.plotly_chart(fig6)

           

            st.subheader("7 Stacked Bar Chart")

            data['moving_avg'] = data[keyword].rolling(7).mean()

            stacked_df = data[[keyword, 'moving_avg']].dropna()

            fig7 = px.bar(
                stacked_df,
                x=stacked_df.index,
                y=[keyword, 'moving_avg']
            )

            st.plotly_chart(fig7)


            st.subheader("8 Trend Heatmap")

            heat = data.copy()

            heat["Month"] = heat.index.month
            heat["Day"] = heat.index.day

            pivot = heat.pivot_table(values=keyword, index="Month", columns="Day")

            fig8 = px.imshow(pivot)

            st.plotly_chart(fig8)

            st.subheader("9 Waterfall Chart")

            diff = data[keyword].diff().fillna(0)

            fig9 = go.Figure(go.Waterfall(
                y=diff
            ))

            st.plotly_chart(fig9)

          
            st.subheader("10 Bubble Chart")

            bubble_df = data.reset_index()

            bubble_df["size"] = bubble_df[keyword] * 2

            fig10 = px.scatter(
                bubble_df,
                x="date",
                y=keyword,
                size="size"
            )

            st.plotly_chart(fig10)


            st.subheader("Top Regions")

            region = pytrends.interest_by_region()

            if not region.empty:

                region = region.sort_values(by=keyword, ascending=False).head(10)

                fig_region = px.bar(region, x=region.index, y=keyword)

                st.plotly_chart(fig_region)

            peak_value = data[keyword].max()
            peak_date = data[keyword].idxmax()

            st.success(f"Peak Trend: {peak_value}% on {peak_date.date()}")

    except Exception as e:

        st.error("Invalid keyword or data unavailable")
