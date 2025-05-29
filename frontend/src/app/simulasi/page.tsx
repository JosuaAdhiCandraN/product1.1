"use client"
import { Commodity } from "@/components/commodity/commodity";
import CommodityList from "@/components/simulation/CommodityList";
import TableSimulation from "@/components/simulation/tableSimulasi";
import Button from "@/components/ui/CustomButton";
import InputPasar from "@/components/ui/inputPasar";
import InputTanggal from "@/components/ui/inputTanggal";
import InputWilayah from "@/components/ui/inputWilayah";
import Loader from "@/components/ui/loader";
import { useState } from "react";
import { DateTime } from "luxon";

export default function Simulation() {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedRegion, setSelectedRegion] = useState("Kota Yogyakarta");
    const [selectedMarketType, setSelectedMarketType] = useState("Pasar Tradisional");
    const [selectedCommodities, setSelectedComodities] = useState<Commodity[]>([]);
    const [updatedCommodities, setUpdatedCommodities] = useState<Commodity[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCommodityLoading, setIsCommodityLoading] = useState(true);

    // Multiplier berdasarkan kota dan jenis pasar
    const regionMultiplier: Record<string, number> = {
        "Kota Yogyakarta": 1.10,
        "Kabupaten Sleman": 1.05,
        "Kabupaten Bantul": 1.00,
    };

    const marketTypeMultiplier: Record<string, number> = {
        "Pasar Tradisional": 1.00,
        "Supermarket": 1.20,
    };

    const calculateHariKeN = (tanggal: string): number => {
        const today = DateTime.now().setZone("Asia/Jakarta").startOf("day");
        const selected = DateTime.fromISO(tanggal, { zone: "Asia/Jakarta" }).startOf("day");
        const diff = selected.diff(today, "days").toObject().days ?? 0;
        return diff;
    };
    
       

    const handleSubmit = async () => {
        if (selectedCommodities.length === 0 || !selectedDate) {
            alert("Lengkapi semua input!");
            return;
        }

        setIsLoading(true);

        const komoditas = selectedCommodities.map(c => c.id_komoditas);
        const hari = calculateHariKeN(selectedDate);
        console.log("Mengirim ke API:", { komoditas, hari });

        try {
            const response = await fetch("/api/simulasi", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ komoditas, hari }),
            });

            const res = await response.json();
            const data = res.data;

            const regionMulti = regionMultiplier[selectedRegion] || 1;
            const marketMulti = marketTypeMultiplier[selectedMarketType] || 1;
            const finalMultiplier = regionMulti * marketMulti;

            const updated = selectedCommodities.map(commodity => {
                const match = data.find((item: any) => item.komoditas === commodity.id_komoditas);
                const hargaDasar = match ? Number(match.harga) : 0;
                const hargaFinal = hargaDasar * finalMultiplier;
                return {
                    ...commodity,
                    price: hargaFinal,
                    total: hargaFinal * (commodity.quantity ?? 0),
                };
            });

            setUpdatedCommodities(updated);
        } catch (err) {
            console.error(err);
            alert("Gagal mengambil data dari API.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {(isLoading || isCommodityLoading) && (
                <div className="fixed inset-0 bg-white bg-opacity-80 z-50 flex items-center justify-center">
                    <Loader
                        message={isCommodityLoading ? "Mengambil data komoditas..." : "Sedang dihitung..."}
                        subMessage={isCommodityLoading ? "Mohon tunggu sebentar" : "Tunggu yaa!"}
                    />
                </div>
            )}
            <div className="min-h-screen bg-white">
                <div className="flex text-center font-semibold lg:text-4xl md:text-3xl text-2xl text-black justify-center mt-10">
                    Simulasi Anggaran Belanja
                </div>
                <div className="mt-10 lg:mx-20 mx-8">
                    <div className="lg:text-2xl md:text-xl text-lg text-black font-medium mb-5">
                        Pilih Komoditas
                    </div>
                    <CommodityList onChange={setSelectedComodities} setIsLoading={setIsCommodityLoading} />
                    <div className="mt-10 lg:text-2xl md:text-xl text-lg text-black font-medium">
                        Pilih Waktu, Wilayah, dan Jenis Pasar
                    </div>
                    <div className="flex lg:flex-row flex-col gap-5 mt-5">
                        <div className="w-[250px]">
                            <InputTanggal date={selectedDate} setDate={setSelectedDate} />
                        </div>
                        <div className="w-[250px]">
                            <InputWilayah region={selectedRegion} setRegion={setSelectedRegion} />
                        </div>
                        <div className="w-[250px]">
                            <InputPasar marketType={selectedMarketType} setMarketType={setSelectedMarketType} />
                        </div>
                    </div>
                    <div className="flex mt-10 justify-end">
                        <Button text="Coba Simulasi" className="md:w-60 md:h-15 w-40 h-10 items-center justify-center md:text-2xl text-lg font-semibold" onClick={handleSubmit} />
                    </div>
                </div>
                <div className="pt-10 lg:mx-20 mx-8 pb-10">
                <div className="text-black font-medium lg:text-2xl md:text-xl text-l mb-2">
                    Rincian Hasil Simulasi Anggaran Belanja
                </div>
                    {updatedCommodities.length === 0 ? (
                    <div className="text-gray-600 italic text-base md:text-lg text-center mt-20 mb-10">
                        Pilih komoditas dan tanggal prediksi untuk mendapatkan simulasi anggaran belanja.
                    </div>
                 ) : (
                <>
                 <div className="text-black text-base md:text-lg mb-5">
                    Rencana Anggaran Belanja untuk tanggal <span className="font-semibold">{selectedDate}</span><br />
                <span className="italic">
                    Lihat berapa kira-kira isi keranjang belanjamu hari itu! Kami udah hitung berdasarkan harga yang disesuaikan sama wilayah dan jenis pasar pilihanmu. Yuk cek, jangan sampai dompet kaget!
                </span>
                </div>
            <TableSimulation data={updatedCommodities} />
        </>
    )}
</div>

            </div>
        </>
    );
}
