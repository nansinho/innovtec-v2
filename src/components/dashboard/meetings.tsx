import Image from "next/image";
import { Card, CardHeader } from "@/components/ui/card";

interface Meeting {
  location: string;
  time: string;
  name: string;
  avatars: string[];
  extra: number;
}

const meetings: Meeting[] = [
  {
    location: "Gardanne",
    time: "9:15 — 10:30",
    name: "Réunion chantier Voltaire",
    avatars: [
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&q=80",
    ],
    extra: 3,
  },
  {
    location: "Visio Teams",
    time: "14:00 — 15:00",
    name: "Point hebdo QSE",
    avatars: [
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&q=80",
    ],
    extra: 0,
  },
];

export default function Meetings() {
  return (
    <Card>
      <CardHeader title="Réunions du jour" />
      <div className="space-y-2.5 px-4 py-2.5">
        {meetings.map((meeting) => (
          <div
            key={meeting.name}
            className="rounded-[var(--radius-sm)] border border-[var(--border-1)] bg-[var(--bg)] p-4"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[10px] text-[var(--text-muted)]">
                {meeting.location}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">
                {meeting.time}
              </span>
            </div>
            <div className="mb-2 text-[13px] font-medium text-[var(--heading)]">
              {meeting.name}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex">
                {meeting.avatars.map((src, i) => (
                  <div
                    key={i}
                    className="relative h-[26px] w-[26px] overflow-hidden rounded-full border-2 border-[var(--card)]"
                    style={{ marginLeft: i > 0 ? "-6px" : 0 }}
                  >
                    <Image src={src} alt="" fill className="object-cover" />
                  </div>
                ))}
                {meeting.extra > 0 && (
                  <div
                    className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-2 border-[var(--card)] bg-[var(--yellow-surface)] text-[8px] font-medium text-[#b07800]"
                    style={{ marginLeft: "-6px" }}
                  >
                    +{meeting.extra}
                  </div>
                )}
              </div>
              <button className="rounded-full bg-[var(--yellow)] px-3.5 py-[5px] text-[10px] font-medium text-white transition-colors hover:bg-[var(--yellow-hover)]">
                Rejoindre
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
