import { DateTime } from "luxon";

interface DatePickerProps {
  date: string;
  setDate: (value: string) => void;
}

const InputTanggal = ({ date, setDate }: DatePickerProps) => {
  const todayJakarta = DateTime.now().setZone("Asia/Jakarta");

  const minDate = todayJakarta.plus({ days: 1 }).toFormat("yyyy-MM-dd");
  const maxDate = todayJakarta.plus({ days: 5 }).toFormat("yyyy-MM-dd");

  return (
    <div className="relative w-full">
      <label className="absolute top-1 left-[9px] px-1 text-sm font-medium text-gray-700">
        Tanggal
      </label>
      <input
        type="date"
        className="pl-3 pr-2 pt-6 pb-2 text-base bg-white border border-black rounded-lg focus:outline-none w-full shadow-md"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={minDate}
        max={maxDate}
      />
    </div>
  );
};

export default InputTanggal;
