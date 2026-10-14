// Maskot lama ("Si Peci" bermata) diganti karakter tanpa wajah: lihat BkMascot.
// Wrapper ini menjaga semua pemakaian <Mascot/> yang sudah ada tetap jalan.
import { BkMascot } from "./BkMascot";

const MAP = { happy: "talk", cheer: "wave", worried: "care", sleepy: "sleep" };

export function Mascot({ mood = "happy", size = 96, className = "", interactive = false }) {
  return <BkMascot mood={MAP[mood] ?? mood} size={size} className={className} interactive={interactive} />;
}

export default Mascot;
