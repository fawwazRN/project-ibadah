import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  MapPin,
  Clock,
  Send,
  Users,
  Sparkles,
  Map as MapIcon,
  CheckCircle2,
  Armchair,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { useCountUp, useReveal } from "../../hooks/useReveal";
import { useScrollProgress } from "../../hooks/useScrollProgress";
import DrawOrnament from "../../components/event/DrawOrnament";
import { eventService } from "../../services/eventService";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Field, Textarea } from "../../components/ui/Field";
import { Badge } from "../../components/ui/Badge";
import { BrandMark } from "../../components/ui/BrandMark";
import {
  RevealSection,
  TextReveal,
  CinematicZoom,
  SlideCard,
  ParallaxLayer,
  ScaleLine,
  FloatRing,
} from "../../components/event/InvitationKit";

/* ===== COVER sinematik — zoom-out + fade saat scroll ===== */
function Cover({ event, dateStr, timeStr }) {
  const [ref, p] = useScrollProgress();
  const scale = 1 - Math.min(0.25, p * 1.5);
  const opacity = Math.max(0.2, 1 - p * 1.6);
  const y = p * 120;

  return (
    <section
      ref={ref}
      className="relative flex flex-col justify-center items-center px-6 w-full min-h-[140vh] overflow-hidden text-center">
      <ParallaxLayer
        speed={0.5}
        className="top-1/2 left-1/2 absolute -translate-x-1/2 -translate-y-1/2">
        <FloatRing size={560} duration={50} />
        <FloatRing
          size={440}
          duration={40}
          reverse
          className="absolute inset-[60px]"
        />
        <FloatRing
          size={320}
          duration={30}
          className="absolute inset-[120px]"
        />
      </ParallaxLayer>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.12),transparent_65%)]" />

      <div
        className="relative"
        style={{ transform: `translateY(${y}px) scale(${scale})`, opacity }}>
        <span className="place-items-center grid bg-brand/10 shadow-card mx-auto border border-brand/25 rounded-3xl size-16 text-brand-soft glow-pulse">
          <BrandMark className="size-9" />
        </span>
        <p className="mt-10 font-semibold text-[11px] text-brand-soft uppercase tracking-[0.45em]">
          Undangan Resmi
        </p>
        <h1 className="mt-8 font-display font-bold text-slate-50 text-5xl sm:text-7xl leading-[1.2]">
          {event?.title ?? "Memuat…"}
        </h1>
        {event?.subtitle && (
          <p className="mt-5 font-display font-light text-slate-400 text-xl tracking-wide">
            {event.subtitle}
          </p>
        )}

        {event && (
          <DrawOrnament className="mx-auto mt-12 w-80 text-brand-soft" />
        )}

        {event && (
          <p className="mt-10 font-display font-light text-slate-300 text-xl tracking-wider">
            {dateStr}
          </p>
        )}

        {event && (
          <div className="flex flex-col items-center gap-3 mt-28 text-slate-600">
            <p className="font-semibold text-[10px] uppercase tracking-[0.35em]">
              Gulir perlahan
            </p>
            <span className="bg-gradient-to-b from-slate-600 to-transparent w-px h-10" />
          </div>
        )}
      </div>
    </section>
  );
}

/* ===== Countdown ===== */
function Countdown({ targetDate }) {
  const calc = () => {
    const diff = Math.max(0, new Date(targetDate) - Date.now());
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff / 3600000) % 24),
      m: Math.floor((diff / 60000) % 60),
      s: Math.floor((diff / 1000) % 60),
      done: diff === 0,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const i = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(i);
  }, [targetDate]);

  if (t.done) {
    return (
      <p className="font-display text-brand-soft text-xl">
        Acara telah berlangsung
      </p>
    );
  }
  const cells = [
    [t.d, "Hari"],
    [t.h, "Jam"],
    [t.m, "Menit"],
    [t.s, "Detik"],
  ];
  return (
    <div className="flex flex-wrap justify-center gap-4">
      {cells.map(([v, l]) => (
        <div
          key={l}
          className="px-3 py-6 border-brand/25 border-t border-b w-24 text-center hover:scale-110 transition-transform duration-300">
          <p className="font-display font-light tabular-nums text-slate-100 text-4xl">
            {String(v).padStart(2, "0")}
          </p>
          <p className="mt-3 font-semibold text-[9px] text-brand-soft uppercase tracking-[0.3em]">
            {l}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ===== StatPill ===== */
function StatPill({ icon: Icon, value, label }) {
  const counted = useCountUp(value, true);
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] shadow-card px-5 py-4 border border-white/[0.07] rounded-2xl">
      <span className="place-items-center grid bg-brand/10 border border-brand/25 rounded-xl size-10 text-brand-soft">
        <Icon size={17} />
      </span>
      <div>
        <p className="font-display font-bold text-slate-50 text-xl">
          {counted}
        </p>
        <p className="text-[11px] text-slate-500">{label}</p>
      </div>
    </div>
  );
}

/* ==================================================================== */
export default function InvitationPage() {
  const { session, profile } = useAuth();
  const { push } = useToast();

  // ================= SEMUA HOOKS DULU =================
  const [event, setEvent] = useState(null);
  const [error, setError] = useState(null);
  const [rsvps, setRsvps] = useState([]);
  const [form, setForm] = useState({ attendance: "hadir", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  // [FIX] load bersih — cek status undangan ditangani InvitationGate
  const load = useCallback(() => {
    setError(null);
    (async () => {
      const ev = await eventService.getActive();
      setEvent(ev);
      if (!ev._dummy) {
        eventService
          .listRsvps(ev.id)
          .then(setRsvps)
          .catch(() => setRsvps([]));
      }
    })().catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  const counts = useMemo(
    () => ({
      hadir: rsvps.filter((r) => r.attendance === "hadir").length,
      total: rsvps.length,
    }),
    [rsvps],
  );

  const send = async () => {
    const name = profile?.full_name ?? "";
    if (!name) return push("error", "Nama tidak ditemukan");
    setSending(true);
    try {
      await eventService.sendRsvp({
        event_id: event.id,
        guest_name: name,
        guest_class: profile?.class_name ?? null,
        attendance: form.attendance,
        message: form.message.trim() || null,
      });
      setSent(true);
      if (event.id !== "dummy") {
        const r = await eventService.listRsvps(event.id);
        setRsvps(r);
      }
    } catch (e) {
      push("error", "Gagal mengirim konfirmasi", e.message);
    } finally {
      setSending(false);
    }
  };

  // ================= TAMPILAN =================
  const dateStr = event
    ? new Date(event.event_date).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const timeStr = event
    ? new Date(event.event_date).toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <div
      data-invitation
      className="relative bg-ink-950 min-h-screen overflow-x-clip text-slate-300">
      {/* ===== COVER sinematik ===== */}
      <Cover event={event} dateStr={dateStr} timeStr={timeStr} />

      {event && (
        <>
          {/* ===== SALAM — TextReveal per kata ===== */}
          <RevealSection className="mx-auto px-6 py-28 max-w-3xl text-center">
            <p className="mb-10 font-semibold text-[10px] text-brand-soft uppercase tracking-[0.45em]">
              Bismillahirrahmanirrahim
            </p>
            <DrawOrnament className="mx-auto w-72 text-brand-soft" />
            <TextReveal
              text="Dengan penuh rasa syukur, kami mengundang Bapak/Ibu serta rekan-rekan sekalian untuk hadir dalam acara apresiasi pengurus OSIS madrasah."
              className="mt-10 font-light text-slate-200 text-xl leading-loose"
            />
            <ScaleLine className="mt-16" />
          </RevealSection>

          {/* ===== DETAIL — CinematicZoom zig-zag ===== */}
          <section className="py-10">
            <RevealSection className="mb-8 text-center">
              <p className="font-semibold text-[10px] text-brand-soft uppercase tracking-[0.45em]">
                Rangkaian Acara
              </p>
            </RevealSection>

            {[
              { icon: CalendarDays, label: "Hari / Tanggal", value: dateStr },
              { icon: Clock, label: "Waktu", value: `${timeStr} WIB` },
              {
                icon: MapPin,
                label: "Tempat",
                value: event.location_name ?? "—",
              },
            ].map((c, i) => (
              <div
                key={c.label}
                className="mx-auto px-6 py-8 max-w-4xl overflow-x-clip">
                <CinematicZoom
                  className={`flex justify-center ${i % 2 === 0 ? "sm:justify-start" : "sm:justify-end"}`}>
                  <div
                    className={`w-full max-w-md rounded-3xl border border-white/[0.08] bg-ink-900/60 p-7 shadow-card backdrop-blur-md ${i % 2 === 0 ? "" : "text-right"}`}>
                    <div
                      className={`flex items-center gap-4 ${i % 2 === 0 ? "" : "sm:flex-row-reverse"}`}>
                      <span className="place-items-center grid bg-brand/10 border border-brand/25 rounded-2xl size-14 text-brand-soft shrink-0">
                        <c.icon size={24} />
                      </span>
                      <div className={i % 2 === 0 ? "" : "text-right"}>
                        <p className="font-semibold text-[10px] text-brand-soft uppercase tracking-[0.3em]">
                          {String(i + 1).padStart(2, "0")}
                        </p>
                        <p className="font-display font-bold text-slate-50 text-lg">
                          {c.label}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 pt-4 border-white/[0.06] border-t font-display font-light text-slate-200 text-base tracking-wide">
                      {c.value}
                    </p>
                  </div>
                </CinematicZoom>
              </div>
            ))}
          </section>

          {/* ===== DESKRIPSI — TextReveal ===== */}
          {event.description && (
            <section className="mx-auto px-6 py-20 max-w-3xl overflow-x-clip text-center">
              <RevealSection className="mb-8">
                <p className="font-semibold text-[10px] text-brand-soft uppercase tracking-[0.45em]">
                  Tentang Acara
                </p>
              </RevealSection>
              <TextReveal
                text={event.description}
                className="font-light text-slate-300 text-lg leading-loose"
                stagger={60}
              />
            </section>
          )}

          {/* ===== COUNTDOWN — overflow-hidden ===== */}
          <section className="relative py-24 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_70%)]" />
            <ParallaxLayer speed={0.4} className="absolute inset-0">
              <FloatRing
                size={400}
                duration={45}
                className="top-1/3 left-[-60px] absolute"
              />
              <FloatRing
                size={300}
                duration={35}
                reverse
                className="right-[-40px] bottom-1/4 absolute"
              />
            </ParallaxLayer>
            <div className="relative mx-auto px-6 max-w-2xl text-center">
              <RevealSection className="mb-12">
                <p className="font-semibold text-[10px] text-brand-soft uppercase tracking-[0.45em]">
                  Menuju Hari Yang Bahagia
                </p>
              </RevealSection>
              <Countdown targetDate={event.event_date} />
            </div>
          </section>

          {/* ===== STATISTIK ===== */}
          {!event._dummy && rsvps.length > 0 && (
            <section className="mx-auto px-6 py-14 max-w-2xl overflow-x-clip">
              <div className="flex flex-wrap justify-center gap-5">
                <SlideCard direction="left">
                  <StatPill
                    icon={Users}
                    value={counts.hadir}
                    label="Konfirmasi Hadir"
                  />
                </SlideCard>
                <SlideCard direction="right">
                  <StatPill
                    icon={Sparkles}
                    value={counts.total}
                    label="Total Konfirmasi"
                  />
                </SlideCard>
              </div>
            </section>
          )}

          {/* ===== FORM RSVP ===== */}
          <section className="mx-auto px-6 py-16 max-w-xl overflow-x-clip">
            <CinematicZoom>
              <Card className="p-7">
                <div className="text-center">
                  <p className="font-display font-bold text-slate-50 text-lg">
                    Konfirmasi Kehadiran
                  </p>
                  <p className="mt-1.5 text-slate-500 text-xs">
                    {session
                      ? `Atas nama ${profile?.full_name}${profile?.class_name ? ` · ${profile.class_name}` : ""}`
                      : "Masuk terlebih dahulu untuk mengirim konfirmasi"}
                  </p>
                </div>

                {!session ? (
                  <div className="mt-6 text-center">
                    <Link to="/auth/login">
                      <Button variant="primary" className="w-full">
                        Masuk untuk Konfirmasi
                      </Button>
                    </Link>
                    <p className="mt-3 text-[11px] text-slate-600">
                      Mode tamu dapat melihat undangan, namun konfirmasi
                      memerlukan akun.
                    </p>
                  </div>
                ) : sent ? (
                  <div className="flex flex-col items-center gap-2 mt-6 py-6 text-center">
                    <CheckCircle2 size={26} className="text-emerald-300" />
                    <p className="font-display font-bold text-emerald-300">
                      Konfirmasi terkirim
                    </p>
                    <p className="text-slate-500 text-xs">
                      Terima kasih — sampai jumpa di acara.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-5 mt-6">
                    <div className="gap-2 grid grid-cols-3">
                      {[
                        { v: "hadir", l: "Hadir", icon: CheckCircle2 },
                        { v: "ragu", l: "Ragu", icon: Armchair },
                        { v: "tidak_hadir", l: "Tidak Hadir", icon: X },
                      ].map((o) => (
                        <button
                          type="button"
                          key={o.v}
                          onClick={() =>
                            setForm((f) => ({ ...f, attendance: o.v }))
                          }
                          className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-xs font-medium transition-colors ${
                            form.attendance === o.v
                              ? "border-brand/40 bg-brand/10 text-brand-soft"
                              : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200"
                          }`}>
                          <o.icon size={15} /> {o.l}
                        </button>
                      ))}
                    </div>
                    <Field label="Pesan / Ucapan (opsional)">
                      <Textarea
                        rows={3}
                        value={form.message}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, message: e.target.value }))
                        }
                        placeholder="Tulis ucapan…"
                      />
                    </Field>
                    <Button
                      variant="primary"
                      icon={Send}
                      loading={sending}
                      onClick={send}
                      className="w-full">
                      Kirim Konfirmasi
                    </Button>
                  </div>
                )}
              </Card>
            </CinematicZoom>
          </section>

          {/* ===== UCAPAN — SlideCard bergantian ===== */}
          {!event._dummy && rsvps.length > 0 && (
            <section className="mx-auto px-6 py-16 max-w-2xl overflow-x-clip">
              <RevealSection className="mb-10 text-center">
                <p className="font-semibold text-[10px] text-brand-soft uppercase tracking-[0.45em]">
                  Ucapan &amp; Doa
                </p>
              </RevealSection>
              <div className="space-y-6">
                {rsvps.map((r, i) => (
                  <SlideCard key={i} direction={i % 2 === 0 ? "left" : "right"}>
                    <div className="bg-ink-900/50 shadow-card backdrop-blur-md p-5 border border-white/[0.08] rounded-3xl">
                      <div className="flex justify-between items-center gap-2">
                        <p className="font-semibold text-slate-100 text-sm">
                          {r.guest_name}
                          {r.guest_class && (
                            <span className="ml-1.5 text-slate-500 text-xs">
                              {r.guest_class}
                            </span>
                          )}
                        </p>
                        <Badge
                          tone={
                            r.attendance === "hadir"
                              ? "emerald"
                              : r.attendance === "ragu"
                                ? "amber"
                                : "rose"
                          }>
                          {r.attendance === "hadir"
                            ? "Hadir"
                            : r.attendance === "ragu"
                              ? "Ragu"
                              : "Tidak Hadir"}
                        </Badge>
                      </div>
                      {r.message && (
                        <p className="mt-2 font-light text-slate-400 text-sm leading-relaxed">
                          {r.message}
                        </p>
                      )}
                    </div>
                  </SlideCard>
                ))}
              </div>
            </section>
          )}

          {/* ===== LOKASI — CinematicZoom ===== */}
          <section className="mx-auto px-6 py-20 max-w-xl overflow-x-clip text-center">
            <RevealSection className="mb-6">
              <p className="font-semibold text-[10px] text-brand-soft uppercase tracking-[0.45em]">
                Lokasi Acara
              </p>
            </RevealSection>
            <CinematicZoom>
              <DrawOrnament className="mx-auto w-56 text-brand-soft" />
              <div className="bg-ink-900/50 shadow-card backdrop-blur-md mt-8 p-8 border border-white/[0.08] rounded-3xl">
                <MapIcon size={24} className="mx-auto text-brand-soft" />
                <p className="mt-4 font-display font-light text-slate-100 text-lg tracking-wide">
                  {event.location_name}
                </p>
                {event.location_url && (
                  <a
                    href={event.location_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block hover:bg-brand/10 mt-5 px-4 py-2 border border-brand/30 rounded-lg font-medium text-brand-soft text-xs transition-colors">
                    Buka di Google Maps
                  </a>
                )}
              </div>
            </CinematicZoom>
          </section>

          {/* ===== PENUTUP — ParallaxLayer dalam overflow-hidden ===== */}
          <section className="relative mx-auto px-6 pt-10 pb-36 max-w-xl overflow-hidden text-center">
            <ParallaxLayer speed={0.5} className="top-0 absolute inset-x-0">
              <DrawOrnament className="mx-auto w-72 text-brand-soft" />
            </ParallaxLayer>
            <div className="relative pt-20">
              <TextReveal
                text="Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu berkenan hadir"
                className="font-light text-slate-200 text-2xl leading-loose"
                stagger={90}
              />
              <RevealSection className="mt-16" delay={200}>
                <p className="font-semibold text-[10px] text-brand-soft uppercase tracking-[0.45em]">
                  Kami yang mengundang
                </p>
                <p className="mt-6 font-display font-bold text-slate-50 text-3xl">
                  {profile?.full_name ?? "Tamu Undangan"}
                </p>
                <p className="mt-1 text-slate-600 text-xs">
                  {profile?.role === "santri"
                    ? `Santri · ${profile?.class_name ?? ""}`
                    : "Pengurus OSIS"}
                </p>
              </RevealSection>
              <ScaleLine className="mt-16" />
              <div className="flex justify-center items-center gap-2 mt-10 text-slate-600 text-xs">
                <BrandMark className="size-4" />
                OSIS Management
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
