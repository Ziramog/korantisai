# Venue Type Prioritization for Korantis

Based on everything in your guidelines, **the current priority order (bars > rooftops > cafés > restaurants) is not quite right.** Here's why and what it should be:

## The Correct Priority Order

```
1. BARS (cocktail bars, speakeasies, wine bars)
2. CAFÉS (specialty coffee, café-bars with "double life")
3. BARS with unique spaces (rooftops, terraces, hidden)
4. RESTAURANTS (only atmosphere-forward ones)
```

## Why Bars First — This IS Correct

Bars are where Korantis's emotional classification has the **strongest differential** vs. Google Maps:

- Highest atmosphere variance (a speakeasy vs. a beer garden are completely different emotional experiences)
- Strongest mood signal ("intimate candlelit bar" vs. "loud patio" is exactly what Korantis solves)
- Most time-of-day variation (same bar = different mood at 19hs vs. 01hs)
- Highest "decision fatigue" problem (people know WHAT they want to feel but not WHERE)
- Best hero photography potential (lighting, atmosphere, visual identity)

## Why Rooftops as a Category is Wrong

**"Rooftop" isn't a venue type — it's a spatial attribute.** Your schema already handles this with `space.configuration: ["terraza", "rooftop"]` and `space.has_outdoor: true`.

A rooftop bar is still a **bar**. A rooftop restaurant is still a **restaurant**. Prioritizing "rooftops" as a category means you're chasing an Instagram aesthetic rather than emotional diversity.

The risk:
- Too many rooftops = visual homogeneity in the feed
- Rooftops skew toward one mood profile (Social, Energético, Celebratorio)
- You lose the diversity that makes mood filtering actually useful
- It signals "we curate what's photogenic" not "we curate what matches your mood"

**What you should do instead:** Include rooftops as part of your bar/restaurant coverage, tagged with `outdoor_type: "rooftop"` — but don't over-index on them.

## Recommended Mix for First 100 Venues (BA)

```
BARS (40-45 venues):
├── Speakeasies / cocktail bars: 12-15
├── Wine bars / natural wine: 8-10
├── Neighborhood bars with character: 8-10
├── Hotel bars / lobby bars: 4-5
├── Beer bars with atmosphere: 4-5
└── Bars with notable outdoor (rooftop/terraza): 5-7

CAFÉS (30-35 venues):
├── Specialty coffee (productivo/calmo): 12-15
├── Café-bars with "double life" (day=café, night=bar): 8-10
├── Historic/notable cafés: 5-6
└── Bakery-cafés with atmosphere: 4-5

RESTAURANTS (20-25 venues):
├── Atmosphere-forward restaurants (design, lighting, experience): 10-12
├── Small/intimate restaurants (date-worthy): 5-7
├── Restaurants with notable bar/lounge area: 4-5
└── Historic/iconic restaurants: 3-4
```

## Why This Mix

| Type | % | Justification |
|------|---|---------------|
| Bars | 40-45% | Highest mood variance, strongest use case ("where to go tonight"), best visual content |
| Cafés | 30-35% | Daily use case ("where to work/read/meet"), drives morning/afternoon retention, café culture is massive in BA |
| Restaurants | 20-25% | Only atmosphere-first ones — NOT "good food" restaurants without distinctive mood |

## The Critical Filter for Restaurants

Your guidelines are clear on this: Korantis is **not a food guide**. A restaurant enters Korantis only if:

- The **atmosphere** is the reason to go (not just the food)
- It has a clear mood profile (intimate, celebratory, contemplative)
- It photographs well as an *environment*, not just plating
- It answers the question "where should we GO" not "what should we EAT"

A restaurant with incredible food but fluorescent lighting and zero atmosphere design? **Not Korantis material.**

## Summary

```
CURRENT:  Bars > Rooftops > Cafés > Restaurants
CORRECT:  Bars > Cafés > Restaurants (atmosphere-first only)
          with "rooftop/terraza" as a TAG, not a category
```

Cafés should be higher than you have them — they drive **daily usage** and cover the morning/afternoon gap that bars can't fill. Without cafés, Korantis is only useful at night.