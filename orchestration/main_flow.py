from prefect import flow, task
import subprocess

@task
def run_script(script_name: str):
    print(f"[RUNNING] {script_name}")
    result = subprocess.run(["python", script_name], capture_output=True, text=True)
    if result.returncode == 0:
        print(f"[SUCCESS] {script_name}\n{result.stdout}")
    else:
        print(f"[FAILED] {script_name}\n{result.stderr}")

@flow(name="Orkestrasi Scraping dan Prediksi Harian")
def main_flow():
    scraper_scripts = [
        "scrap_bawang_merah.py",
        "scrap_bawang_putih.py",
        "scrap_beras.py",
        "scrap_cabai_rawit_merah.py",
        "scrap_kangkung.py",
        "scrap_kedelai.py",
        "scrap_kentang.py",
        "scrap_ketimun.py",
        "scrap_sawi.py",
        "scrap_tomat.py"
    ]

    prediction_scripts = [
        "bawang_merah.py",
        "bawang_putih.py",
        "beras.py",
        "cabai.py",
        "kangkung.py",
        "kedelai.py",
        "kentang.py",
        "ketimun.py",
        "sawi.py",
        "tomat.py"
    ]

    for script in scraper_scripts:
        run_script(script)

    for script in prediction_scripts:
        run_script(script)
