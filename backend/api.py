from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pytrends.request import TrendReq
import pandas as pd
import numpy as np
import time
from typing import List, Optional

app = FastAPI(title="Trend Analyzer API")

# Enable CORS for React Native
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def fetch_trends_data(kw: str):
    def get_data_with_retry(payload_func, max_retries=3):
        last_err = None
        for i in range(max_retries):
            try:
                # Refresh session if 429
                pytrends_obj = TrendReq(hl='en-US', tz=330, timeout=(10,25))
                payload_func(pytrends_obj)
                return pytrends_obj
            except Exception as e:
                last_err = e
                if "429" in str(e):
                    wait_time = (i + 1) * 5
                    time.sleep(wait_time)
                else:
                    raise e
        raise last_err

    def build_payload_logic(pt):
        pt.build_payload([kw], timeframe='today 12-m')

    pytrends = get_data_with_retry(build_payload_logic)
    
    iot_data = pytrends.interest_over_time()
    
    try:
        rq_data = pytrends.related_queries()
    except Exception:
        rq_data = {}
        
    try:
        ibr_data = pytrends.interest_by_region()
    except Exception:
        ibr_data = pd.DataFrame()
        
    return iot_data, rq_data, ibr_data

@app.get("/trends")
async def get_trends(keyword: str):
    try:
        data, related, region = fetch_trends_data(keyword)

        if data.empty or (keyword in data and data[keyword].sum() == 0):
            return {"error": "No trend data found"}

        if 'isPartial' in data.columns:
            data = data.drop(columns=['isPartial'])

        # Core Metrics calculation logic
        trend_score = float(data[keyword].mean())
        std_dev = float(data[keyword].std())
        std_dev = 0 if np.isnan(std_dev) else std_dev
        accuracy = max(0, 100 - std_dev)
        
        pct_changes = data[keyword].pct_change()
        growth_rate = float(pct_changes.replace([np.inf, -np.inf], np.nan).dropna().mean() * 100)
        if np.isnan(growth_rate):
            growth_rate = 0

        # Processing history (Weekly)
        trend_history = []
        for index, row in data.iterrows():
            trend_history.append({
                "date": index.strftime('%Y-%m-%d'),
                "value": int(row[keyword])
            })

        # Processing Monthly Trends
        monthly_df = data.resample('ME').mean()
        monthly_data = []
        for index, row in monthly_df.iterrows():
            monthly_data.append({
                "month": index.strftime('%b %y'),
                "value": int(row[keyword])
            })

        # Processing Moving Average (7-week)
        data['moving_avg'] = data[keyword].rolling(window=7, min_periods=1).mean()
        ma_data = []
        for index, row in data.iterrows():
            ma_data.append({
                "date": index.strftime('%Y-%m-%d'),
                "value": float(row['moving_avg'])
            })

        # Distribution (Pie Chart)
        distribution = []
        try:
            bins = pd.cut(data[keyword], bins=5).value_counts()
            for label, count in bins.items():
                distribution.append({
                    "range": str(label),
                    "count": int(count)
                })
        except Exception:
            pass

        # Waterfall (Momentum)
        diff = data[keyword].diff().fillna(0)
        momentum = []
        for index, val in diff.items():
            momentum.append({
                "date": index.strftime('%Y-%m-%d'),
                "value": float(val)
            })

        # Interest by region
        region_data = []
        if not region.empty and keyword in region.columns:
            top_regions = region.sort_values(by=keyword, ascending=False).head(15)
            for index, row in top_regions.iterrows():
                region_data.append({
                    "region": index,
                    "value": int(row[keyword])
                })

        # Related topics
        related_top = []
        related_rising = []
        if keyword in related:
            if related[keyword]['top'] is not None:
                for index, row in related[keyword]['top'].iterrows():
                    related_top.append({"query": row['query'], "value": int(row['value'])})
            if related[keyword]['rising'] is not None:
                for index, row in related[keyword]['rising'].iterrows():
                    related_rising.append({"query": row['query'], "value": int(row['value'])})

        peak_value = int(data[keyword].max())
        peak_date = data[keyword].idxmax().strftime('%B %d, %Y')

        return {
            "keyword": keyword,
            "metrics": {
                "trend_score": round(trend_score, 2),
                "stability": round(accuracy, 2),
                "growth_rate": round(growth_rate, 2),
                "peak": {"value": peak_value, "date": peak_date}
            },
            "history": trend_history,
            "monthly": monthly_data,
            "moving_avg": ma_data,
            "distribution": distribution,
            "momentum": momentum,
            "regions": region_data,
            "related": {
                "top": related_top,
                "rising": related_rising
            }
        }

    except Exception as e:
        if "429" in str(e):
            raise HTTPException(status_code=429, detail="Rate limit exceeded")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Make sure to set host to 0.0.0.0 for external device access
    uvicorn.run(app, host="0.0.0.0", port=8000)
