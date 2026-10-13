// Maskot lama ("Si Peci" bermata) diganti karakter tanpa wajah: lihat BkMascot.
// Wrapper ini menjaga semua pemakaian <Mascot/> yang sudah ada tetap jalan.
import { BkMascot } from "./BkMascot";

const MAP = { happy: "talk", cheer: "happy", worried: "care", sleepy: "think" };

export function Mascot({ mood = "happy", size = 96, className = "" }) {
  return <BkMascot mood={MAP[mood] ?? "talk"} size={size} className={className} />;
}

export default Mascot;
