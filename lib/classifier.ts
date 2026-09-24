export function classifyDescriptionLocal(
  description: string,
  categories: { id: string; name: string }[]
): string | null {
  if (!description || description.trim().length < 2) return null;
  const text = description.toLowerCase();

  const rules: { keywords: string[]; categoryMatch: string }[] = [
    {
      keywords: [
        'rash',
        'speed',
        'speeeed',
        'overspeed',
        'over-speeding',
        'signal',
        'brake',
        'danger',
        'accident',
        'driver',
        'drunk',
        'fast',
        'racing',
        'overtake',
        'overtaking',
        'dangerous',
        'reckless',
        'high speed',
        'too rash',
      ],
      categoryMatch: 'Safety & Over-speeding',
    },
    {
      keywords: [
        'ticket',
        'conductor',
        'charge',
        'behaviour',
        'behavior',
        'behave',
        'rude',
        'money',
        'change',
        'abuse',
        'overcharging',
        'fare',
        'shouting',
        'misbehaviour',
        'refused',
        'rudely',
        'skipped stop',
      ],
      categoryMatch: 'Staff Misbehaviour & Ticket Overcharging',
    },
    {
      keywords: [
        'delay',
        'cancel',
        'cancelled',
        'late',
        'schedule',
        'time',
        'waiting',
        'stop',
        'trip',
        'missed',
        'timing',
        'late arrival',
        'postponed',
      ],
      categoryMatch: 'Schedule Delay & Trip Cancellation',
    },
    {
      keywords: [
        'seat',
        'dirty',
        'hygiene',
        'hygine',
        'clean',
        'smell',
        'stink',
        'baad smell',
        'badd smell',
        'water',
        'leak',
        'broken',
        'window',
        'fan',
        'ac',
        'air conditioning',
        'dust',
        'latch',
      ],
      categoryMatch: 'Bus Hygiene & Broken Seats',
    },
    {
      keywords: [
        'luggage',
        'luggages',
        'parcel',
        'bag',
        'cargo',
        'weight',
        'roof',
        'box',
        'handling',
        'poor handling',
        'damaged bag',
      ],
      categoryMatch: 'Luggage / Parcel Handling Issue',
    },
  ];

  for (const rule of rules) {
    if (rule.keywords.some((kw) => text.includes(kw))) {
      const catMatch = categories.find(
        (c) => c.name.toLowerCase() === rule.categoryMatch.toLowerCase()
      );
      if (catMatch) return catMatch.name;
      return rule.categoryMatch;
    }
  }

  return null;
}
