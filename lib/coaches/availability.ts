/**
 * Coach "Office Hours" — time-based availability indicators.
 * Makes coaches feel like real people with schedules.
 */

type AvailabilityStatus = "available" | "busy" | "offline";

interface AvailabilityInfo {
  status: AvailabilityStatus;
  label: string;
}

// Domain-based schedule rules
const DOMAIN_SCHEDULES: Record<string, { peakHours: number[]; description: string }> = {
  fitness: { peakHours: [5, 6, 7, 8, 9, 10, 16, 17, 18, 19], description: "Early morning & evening sessions" },
  nutrition: { peakHours: [7, 8, 9, 10, 11, 12, 13, 17, 18], description: "Meal planning hours" },
  mental_health: { peakHours: [8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20], description: "Therapy-friendly hours" },
  career: { peakHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], description: "Business hours" },
  finance: { peakHours: [8, 9, 10, 11, 12, 13, 14, 15, 16], description: "Market hours" },
  relationships: { peakHours: [9, 10, 11, 14, 15, 16, 19, 20, 21], description: "Flexible schedule" },
  parenting: { peakHours: [9, 10, 11, 12, 20, 21, 22], description: "After kids' bedtime & school hours" },
  leadership: { peakHours: [7, 8, 9, 10, 11, 12, 13, 14, 15, 16], description: "Executive hours" },
  creativity: { peakHours: [9, 10, 11, 14, 15, 16, 20, 21, 22], description: "Creative flow windows" },
  gardening: { peakHours: [6, 7, 8, 9, 10, 15, 16, 17, 18], description: "Golden hours" },
  philosophy: { peakHours: [8, 9, 10, 11, 19, 20, 21, 22], description: "Contemplation hours" },
};

export function getCoachAvailability(domain: string): AvailabilityInfo {
  const hour = new Date().getHours();
  const schedule = DOMAIN_SCHEDULES[domain];

  if (!schedule) {
    return { status: "available", label: "Available" };
  }

  if (schedule.peakHours.includes(hour)) {
    return { status: "available", label: "Available now" };
  }

  // Within 1 hour of peak = "busy" (transitioning)
  const nearPeak = schedule.peakHours.some(
    (h) => Math.abs(h - hour) === 1
  );
  if (nearPeak) {
    return { status: "busy", label: "Available soon" };
  }

  return { status: "offline", label: "Off hours" };
}

export function getStatusColor(status: AvailabilityStatus): string {
  switch (status) {
    case "available":
      return "bg-green-500";
    case "busy":
      return "bg-amber-500";
    case "offline":
      return "bg-gray-400";
  }
}
