
import random
import psycopg2
from datetime import date
from conn_params import conn_params

MEAN_HARGA   = 18700
MEDIAN_HARGA = 19000
TABEL_FAKTA  = "kentang"         
TABEL_WAKTU  = "waktu"         



def pilih_harga(mean, median, p_mean: float = 0.5) -> float:
    """Kembalikan mean atau median dengan probabilitas p_mean."""
    return mean if random.random() < p_mean else median


def get_or_create_id_waktu(conn, tanggal):
    """Pastikan tanggal ada di tabel waktu, lalu kembalikan id_waktu."""
    with conn.cursor() as cur:
        cur.execute(f"SELECT id_waktu FROM {TABEL_WAKTU} WHERE tanggal = %s",
                    (tanggal,))
        row = cur.fetchone()

        if row:
            return row[0]

        cur.execute(f"""
            INSERT INTO {TABEL_WAKTU} (tanggal)
            VALUES (%s)
            RETURNING id_waktu
        """, (tanggal,))
        id_waktu = cur.fetchone()[0]
        conn.commit()
        return id_waktu


def run(conn_params: dict):
    """Jalankan satu siklus penyisipan data kentang."""
    conn = psycopg2.connect(**conn_params)
    try:
        today = date.today()
        id_waktu = get_or_create_id_waktu(conn, today)
        harga   = pilih_harga(MEAN_HARGA, MEDIAN_HARGA)

        with conn.cursor() as cur:
            cur.execute(
                f"INSERT INTO {TABEL_FAKTA} (harga, id_waktu) VALUES (%s, %s)",
                (harga, id_waktu),
            )
        conn.commit()
        print(f"[OK] {TABEL_FAKTA}: {today}  harga={harga:,.0f}")

    except Exception as e:
        conn.rollback()
        print("[ERROR]", e)
    finally:
        conn.close()

if __name__ == "__main__":
    run(conn_params)
