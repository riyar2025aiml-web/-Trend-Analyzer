import streamlit as st
from pytrends.request import TrendReq
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import numpy as np
import time

# --- Page Configuration ---
st.set_page_config(
    page_title="AI Trend Analyzer", 
    page_icon="📈",
    layout="wide",
)

# --- Custom Styling ---
st.markdown("""
    <style>
    .main {
        background-color: #f8f9fa;
    }
    .stMetric {
        background-color: #ffffff;
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .stAlert {
        border-radius: 10px;
    }
    </style>
    """, unsafe_allow_html=True)

st.title("🚀 AI Hashtag Trend Prediction Dashboard")
st.markdown("Enter a topic or hashtag below to analyze its Google Trends performance and forecast its future trajectory.")

keyword = st.text_input("Enter Topic or Hashtag", placeholder="e.g. Artificial Intelligence, #ReactJS, GPT-4")

if keyword:
    try:
        # Initialize pytrends with a small backoff if needed
        @st.cache_data(ttl=3600)  # Cache for 1 hour to avoid rate limits
        def fetch_trends(kw):
            # Helper for retrying requests
            def get_data_with_retry(payload_func, max_retries=3):
                last_err = None
                for i in range(max_retries):
                    try:
                        # Re-initialize TrendReq to refresh headers/session if needed
                        # Adding custom headers can sometimes help bypass filters
                        pytrends_obj = TrendReq(hl='en-US', tz=330, timeout=(10,25))
                        payload_func(pytrends_obj)
                        return pytrends_obj
                    except Exception as e:
                        last_err = e
                        if "429" in str(e):
                            # Back off: 5s, 10s, 15s...
                            wait_time = (i + 1) * 5
                            time.sleep(wait_time)
                        else:
                            raise e
                raise last_err

            # Build Payload with logic
            def build_payload_logic(pt):
                pt.build_payload([kw], timeframe='today 12-m')

            pytrends = get_data_with_retry(build_payload_logic)
            
            # Fetch interest over time
            iot_data = pytrends.interest_over_time()
            
            # Fetch related queries
            try:
                rq_data = pytrends.related_queries()
            except Exception:
                rq_data = {}
                
            # Fetch interest by region
            try:
                ibr_data = pytrends.interest_by_region()
            except Exception:
                ibr_data = pd.DataFrame()
                
            return iot_data, rq_data, ibr_data

        with st.spinner(f"Analyzing trends for '{keyword}'..."):
            data, related, region = fetch_trends(keyword)

        if data.empty or (keyword in data and data[keyword].sum() == 0):
            st.error("⚠️ No trend data found for this keyword. It might be too niche or recently introduced.")
        else:
            # Clean data safely
            if 'isPartial' in data.columns:
                data = data.drop(columns=['isPartial'])

            # --- Metrics Calculation ---
            trend_score = data[keyword].mean()
            std_dev = data[keyword].std()
            # If std_dev is NaN, fall back to 0
            std_dev = 0 if pd.isna(std_dev) else std_dev
            accuracy = max(0, 100 - std_dev)
            
            # Safe growth rate calculation
            pct_changes = data[keyword].pct_change()
            # Remove infinity and NaN from growth rate
            growth_rate = pct_changes.replace([np.inf, -np.inf], np.nan).dropna().mean() * 100
            if pd.isna(growth_rate):
                growth_rate = 0

            # --- Metrics Display ---
            col1, col2, col3 = st.columns(3)
            col1.metric("Trend Score", f"{trend_score:.2f}%", help="Avg interest over the last 12 months (0-100 scale)")
            col2.metric("Trend Stability", f"{accuracy:.2f}%", help="How consistent the trend is. Lower deviation = Higher stability.")
            col3.metric("Growth Rate (Avg)", f"{growth_rate:.2f}%", help="Average week-over-week percentage change.")

            st.divider()

            # --- Recommendation ---
            if trend_score > 70:
                st.success(f"🔥 **High Trending Topic** | Confidence: {accuracy:.2f}%")
            elif trend_score > 40:
                st.info(f"✨ **Moderate Trending Topic** | Confidence: {accuracy:.2f}%")
            else:
                st.warning(f"📉 **Low Trending Topic** | Confidence: {accuracy:.2f}%")

            # --- Layout: Main Charts ---
            tab1, tab2, tab3 = st.tabs(["📊 Performance Analysis", "🗺️ Geographic Insights", "🔗 Related Topics"])

            with tab1:
                c1, c2 = st.columns(2)
                
                with c1:
                    st.subheader("1. Trend Over Time")
                    fig1 = px.line(data, x=data.index, y=keyword, markers=True, 
                                 title="Weekly Interest Level", labels={'index': 'Date', keyword: 'Interest'})
                    fig1.update_traces(line_color='#007BFF', line_width=2)
                    st.plotly_chart(fig1, use_container_width=True)

                with c2:
                    st.subheader("2. Monthly Trend")
                    monthly = data.resample('ME').mean() # Use 'ME' for Month End to avoid deprecation warning
                    fig2 = px.bar(monthly, x=monthly.index, y=keyword, 
                                title="Average Monthly Interest", color_discrete_sequence=['#28A745'])
                    st.plotly_chart(fig2, use_container_width=True)

                c3, c4 = st.columns(2)
                
                with c3:
                    st.subheader("3. Trend Distribution")
                    # Safe binning
                    try:
                        bins = pd.cut(data[keyword], bins=5).value_counts()
                        pie_df = pd.DataFrame({"Range": bins.index.astype(str), "Count": bins.values})
                        fig3 = px.pie(pie_df, names="Range", values="Count", hole=0.4, title="Intensity Distribution")
                        st.plotly_chart(fig3, use_container_width=True)
                    except Exception:
                        st.write("Insufficient data for distribution pie chart.")

                with c4:
                    st.subheader("4. Area Growth")
                    fig4 = px.area(data, x=data.index, y=keyword, title="Cumulative Interest Trajectory")
                    st.plotly_chart(fig4, use_container_width=True)

                st.subheader("5. Trend Volatility (Scatter)")
                fig5 = px.scatter(data, x=data.index, y=keyword, size=data[keyword].clip(lower=1), 
                                 color=data[keyword], hover_name=data.index, title="Scatter Deviation")
                st.plotly_chart(fig5, use_container_width=True)

                st.subheader("6. Histogram")
                fig6 = px.histogram(data, x=keyword, nbins=20, title="Frequency of Interest Levels", 
                                   color_discrete_sequence=['#6C757D'])
                st.plotly_chart(fig6, use_container_width=True)

                st.subheader("7. Moving Average Analysis")
                data['moving_avg'] = data[keyword].rolling(window=7, min_periods=1).mean()
                fig7 = go.Figure()
                fig7.add_trace(go.Bar(x=data.index, y=data[keyword], name="Actual Interest", marker_color='#17A2B8'))
                fig7.add_trace(go.Scatter(x=data.index, y=data['moving_avg'], name="7-Week Moving Average", 
                                         line=dict(color='#DC3545', width=3)))
                fig7.update_layout(title="Actual vs Moving Average", xaxis_title="Date", yaxis_title="Interest")
                st.plotly_chart(fig7, use_container_width=True)

                st.subheader("8. Weekly Trend Heatmap")
                heat = data.copy()
                heat["Month"] = heat.index.strftime('%b')
                heat["Day"] = heat.index.day
                try:
                    pivot = heat.pivot_table(values=keyword, index="Month", columns="Day")
                    fig8 = px.imshow(pivot, labels=dict(x="Day of Month", y="Month", color="Interest"),
                                   color_continuous_scale='Viridis', title="Daily Interest Matrix")
                    st.plotly_chart(fig8, use_container_width=True)
                except Exception:
                    st.write("Could not generate heatmap with current data.")

                st.subheader("9. Trend Momentum (Waterfall)")
                diff = data[keyword].diff().fillna(0)
                fig9 = go.Figure(go.Waterfall(
                    x=data.index,
                    y=diff,
                    connector={"line": {"color": "rgb(63, 63, 63)"}},
                    name="Momentum"
                ))
                fig9.update_layout(title="Week-over-Week Interest Momentum")
                st.plotly_chart(fig9, use_container_width=True)

                st.subheader("10. Trend Bubble Chart")
                bubble_df = data.reset_index()
                bubble_df["bubble_size"] = bubble_df[keyword].clip(lower=5)
                fig10 = px.scatter(bubble_df, x="date", y=keyword, size="bubble_size", 
                                 color=keyword, hover_name="date", title="Trend Density over Time")
                st.plotly_chart(fig10, use_container_width=True)

            with tab2:
                st.subheader("Interest by Region")
                if not region.empty and keyword in region.columns:
                    top_regions = region.sort_values(by=keyword, ascending=False).head(15)
                    fig_region = px.bar(top_regions, x=top_regions.index, y=keyword, 
                                        labels={'index': 'Region', keyword: 'Interest Score'},
                                        title=f"Top 15 Countries/Regions for '{keyword}'",
                                        color=keyword, color_continuous_scale='Plasma')
                    st.plotly_chart(fig_region, use_container_width=True)
                else:
                    st.info("No regional data available.")

            with tab3:
                st.subheader("Foundational Related Topics")
                if keyword in related and related[keyword]['top'] is not None:
                    col_rel1, col_rel2 = st.columns(2)
                    with col_rel1:
                        st.markdown("**Top Related Queries**")
                        st.dataframe(related[keyword]['top'], use_container_width=True)
                    with col_rel2:
                        if related[keyword]['rising'] is not None:
                            st.markdown("**Rising Queries** (Potential Breakouts)")
                            st.dataframe(related[keyword]['rising'], use_container_width=True)
                else:
                    st.info("No related queries found for this topic.")

            # Peak Highlight
            peak_value = data[keyword].max()
            peak_date = data[keyword].idxmax()
            st.info(f"🏆 **Peak Performance:** Reached **{peak_value}%** interest on **{peak_date.strftime('%B %d, %Y')}**")

    except Exception as e:
        if "429" in str(e):
            st.error("🚫 **Rate Limit Exceeded:** Google Trends has temporarily blocked requests from this IP (Code 429).")
            st.warning("🔄 **We attempted 3 automatic retries**, but the block persists. Please wait 1-2 minutes or try a different keyword.")
        else:
            st.error(f"🚫 **An error occurred during analysis:** {str(e)}")
            st.info("💡 **Tip:** This often happens due to Google's rate limits. Please wait a few seconds and try again, or use a broader keyword.")
        
        # Only show the full traceback to the developer if needed
        with st.expander("Technical details"):
            st.exception(e)
else:
    st.info("🔍 Enter a keyword above to start the analysis.")
