import psycopg2
import pandas as pd
import pickle
import random
from datetime import timedelta
from conn_params import conn_params 

TABLE_NAME = "tomat"
MODEL_FILE = "model_arima_tomat.pkl"
FORECAST_DAYS = 5
INFLASI_RATE = 0.03
DEFLASI_RATE = 0.02
PPN = 0.11  

def normalize_prob(prob_dict):
    total = sum(prob_dict.values())
    return {k: v / total for k, v in prob_dict.items()}

def weighted_random_choice(prob_dict):
    choices, weights = zip(*prob_dict.items())
    return random.choices(choices, weights=weights)[0]

def fetch_last_prices(conn, table_name, limit=50):
    query = f"""
        SELECT w.tanggal, f.harga
        FROM {table_name} f
        JOIN waktu w ON f.id_waktu = w.id_waktu
        ORDER BY w.tanggal DESC
        LIMIT %s
    """
    df = pd.read_sql(query, conn, params=(limit,))
    df = df.sort_values("tanggal") 
    df.set_index("tanggal", inplace=True)
    return df

def run_forecast(model_file, df, forecast_days):
    with open(model_file, "rb") as f:
        model = pickle.load(f)
    forecast = model.forecast(steps=forecast_days)

    start_date = df.index[-1] + pd.Timedelta(days=1)
    forecast_dates = pd.date_range(start=start_date, periods=forecast_days, freq='D')
    return pd.DataFrame({'harga_awal': forecast.values}, index=forecast_dates)

def apply_market_fluctuation(harga_awal_series):
    prediksi_final = []

    cuaca_harian = random.choices(['cerah', 'buruk'], k=len(harga_awal_series))

    for i, (tanggal, harga_awal) in enumerate(harga_awal_series.items()):
        cuaca = cuaca_harian[i]
        stok = random.choice(['normal', 'oversupply', 'undersupply'])

        probs = {'stagnan': 1/3, 'inflasi': 1/3, 'deflasi': 1/3}

        if stok == 'normal':
            probs['inflasi'] *= 0.9
        elif stok == 'oversupply':
            probs['deflasi'] *= 1.3
            probs['inflasi'] *= 0.8
            probs['stagnan'] *= 0.9
        elif stok == 'undersupply':
            probs['inflasi'] *= 1.3
            probs['deflasi'] *= 0.8
            probs['stagnan'] *= 0.9

        if cuaca == 'cerah':
            probs['stagnan'] *= 1.2
        elif cuaca == 'buruk':
            probs['inflasi'] *= 1.2

        probs = normalize_prob(probs)
        kondisi = weighted_random_choice(probs)

        harga = harga_awal
        if kondisi == 'inflasi':
            harga *= (1 + INFLASI_RATE)
        elif kondisi == 'deflasi':
            harga *= (1 - DEFLASI_RATE)

        harga *= (1 + PPN)
        harga_final = round(harga, 2)
        prediksi_final.append((tanggal.date(), harga_final))

    return prediksi_final

def save_forecast_to_db(conn, prediksi_list, id_start):
    """
    Simpan hasil prediksi ke tabel simulasi_prediksi.
    prediksi_list: list of tuples (tanggal, harga)
    id_start: integer id awal untuk komoditas ini
    """
    with conn.cursor() as cur:
        for i, (tanggal, harga) in enumerate(prediksi_list, start=id_start):
            cur.execute("""
                INSERT INTO simulasi_prediksi (id, harga_prediksi)
                VALUES (%s, %s)
                ON CONFLICT (id) DO UPDATE SET harga_prediksi = EXCLUDED.harga_prediksi
            """, (i, harga))
        conn.commit()


if __name__ == "__main__":
    try:
        conn = psycopg2.connect(**conn_params)
        df = fetch_last_prices(conn, TABLE_NAME)
        df_forecast = run_forecast(MODEL_FILE, df, FORECAST_DAYS)
        hasil = apply_market_fluctuation(df_forecast['harga_awal'])

        print("Prediksi harga tomat 5 hari ke depan:")
        for tgl, harga in hasil:
            print(f"{tgl}: Rp {harga:,.0f}")

        save_forecast_to_db(conn, hasil, id_start=46)

    except Exception as e:
        print("[ERROR]", e)
    finally:
        if 'conn' in locals():
            conn.close()
