export function classifyDescriptionLocal(
  description: string,
  categories: { id: string; name: string }[]
): string | null {
  if (!description || description.trim().length < 3) return null;
  const text = description.toLowerCase();

  const rules: { keywords: string[]; categoryMatch: string }[] = [
    {
      keywords: ['rash', 'speed', 'signal', 'brake', 'over-speeding', 'danger', 'accident', 'driver', 'drunk', 'fast'],
      categoryMatch: 'Safety & Over-speeding',
    },
    {
      keywords: ['ticket', 'conductor', 'charge', 'behaviour', 'behave', 'rude', 'money', 'change', 'abuse', 'overcharging', 'fare'],
      categoryMatch: 'Staff Misbehaviour & Ticket Overcharging',
    },
    {
      keywords: ['delay', 'cancel', 'late', 'schedule', 'time', 'waiting', 'stop', 'trip', 'missed', 'timing'],
      categoryMatch: 'Schedule Delay & Trip Cancellation',
    },
    {
      keywords: ['seat', 'dirty', 'hygiene', 'clean', 'smell', 'water', 'leak', 'broken', 'window', 'fan', 'ac'],
      categoryMatch: 'Bus Hygiene & Broken Seats',
    },
    {
      keywords: ['luggage', 'parcel', 'bag', 'cargo', 'weight', 'roof', 'box'],
      categoryMatch: 'Luggage / Parcel Handling Issue',
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      const catMatch = categories.find((c) => c.name.toLowerCase() === rule.categoryMatch.toLowerCase());
      if (catMatch) return catMatch.name;
    }
  }

  return null;
}
