# Circadian Ranking Test Report

Generated: 2026-06-01T17:16:21.519Z
Venue source: http://localhost:3000/api/venues
Venue count: 50

## Root Cause Snapshot

- The previous ranking used venue quality plus atmosphere/time distance, but did not explicitly control category mix.
- Cafes can rank high at midday when their atmosphere and image/quality scores are strong.
- The new layer applies a modest presentation-only category bias and a top-10 mix guardrail when there is no explicit user search intent.

## morning

Hour tested: 9

Before distribution: cafe: 10
After distribution: cafe: 10

| Rank | Venue | Category | Kind | Display score | Bias |
| --- | --- | --- | --- | ---: | ---: |
| 1 | John & Joe \| Café de Especialidad | Specialty Coffee | cafe | 0.693 | 0.080 |
| 2 | TERRASOHO - Specialty Coffee | Specialty Coffee | cafe | 0.693 | 0.080 |
| 3 | Toki Moment - Specialty Coffee | Specialty Coffee | cafe | 0.693 | 0.080 |
| 4 | Koofi \| Café de especialidad | Specialty Coffee | cafe | 0.693 | 0.080 |
| 5 | Tona Café | Specialty Coffee | cafe | 0.693 | 0.080 |
| 6 | Birdy Birds Specialty Coffee Roasters | Specialty Coffee | cafe | 0.693 | 0.080 |
| 7 | Kaldi | Specialty Coffee | cafe | 0.693 | 0.080 |
| 8 | Origen Coffee House | Specialty Coffee | cafe | 0.673 | 0.080 |
| 9 | Crisol Café | Coffee & Bakery | cafe | 0.673 | 0.100 |
| 10 | Vive Café Cafe de especialidad , cafés de campeonatos | Specialty Coffee | cafe | 0.673 | 0.060 |

## midday

Hour tested: 12.5

Before distribution: bar: 1, cafe: 9
After distribution: bar: 1, cafe: 4, restaurant: 4, wine_bar: 1

| Rank | Venue | Category | Kind | Display score | Bias |
| --- | --- | --- | --- | ---: | ---: |
| 1 | Invernadero | Gin & Tapas | bar | 0.549 | 0.010 |
| 2 | Crisol Café | Coffee & Bakery | cafe | 0.505 | 0.015 |
| 3 | La Biela | Historic Grand Café | cafe | 0.487 | -0.050 |
| 4 | Don Julio Parrilla | Restaurant | restaurant | 0.430 | 0.100 |
| 5 | Parrilla Don Julio | Classic Parrilla | restaurant | 0.426 | 0.100 |
| 6 | Mishiguene | Jewish Cuisine | restaurant | 0.420 | 0.100 |
| 7 | Ciro Palermo | Restaurant | restaurant | 0.410 | 0.080 |
| 8 | Oporto Almacén | Wine Bar & Dining | wine_bar | 0.465 | 0.050 |
| 9 | Toki Moment - Specialty Coffee | Specialty Coffee | cafe | 0.480 | -0.050 |
| 10 | Import Coffee Co. | Specialty Coffee | cafe | 0.480 | -0.050 |

## afternoon

Hour tested: 16

Before distribution: bar: 2, cafe: 6, restaurant: 1, wine_bar: 1
After distribution: bar: 1, cafe: 8, wine_bar: 1

| Rank | Venue | Category | Kind | Display score | Bias |
| --- | --- | --- | --- | ---: | ---: |
| 1 | Surry Hills Coffee | Australian Café | cafe | 0.624 | 0.080 |
| 2 | Ninina | Bakery & Café | cafe | 0.613 | 0.080 |
| 3 | La Biela | Historic Grand Café | cafe | 0.604 | 0.050 |
| 4 | Libros del Pasaje | Bookshop & Café | cafe | 0.594 | 0.050 |
| 5 | Oporto Almacén | Wine Bar & Dining | wine_bar | 0.581 | 0.050 |
| 6 | Birkin | Brunch & Coffee | cafe | 0.573 | 0.050 |
| 7 | Cuervo Café | cafe | cafe | 0.570 | 0.050 |
| 8 | Invernadero | Gin & Tapas | bar | 0.556 | 0.000 |
| 9 | John & Joe \| Café de Especialidad | Specialty Coffee | cafe | 0.493 | 0.080 |
| 10 | TERRASOHO - Specialty Coffee | Specialty Coffee | cafe | 0.493 | 0.080 |

## golden_hour

Hour tested: 18.5

Before distribution: bar: 3, cafe: 2, cocktail_bar: 2, restaurant: 2, wine_bar: 1
After distribution: bar: 4, cafe: 1, cocktail_bar: 4, wine_bar: 1

| Rank | Venue | Category | Kind | Display score | Bias |
| --- | --- | --- | --- | ---: | ---: |
| 1 | Oporto Almacén | Wine Bar & Dining | wine_bar | 0.681 | 0.100 |
| 2 | Trade Sky Bar | Restaurant | bar | 0.630 | 0.100 |
| 3 | Backroom Bar | Restaurant | cocktail_bar | 0.630 | 0.100 |
| 4 | Verne Club | Restaurant | cocktail_bar | 0.630 | 0.100 |
| 5 | Florería Atlántico | bar | cocktail_bar | 0.610 | 0.100 |
| 6 | Uptown Bar | Rooftop Lounge | cocktail_bar | 0.602 | 0.100 |
| 7 | Kraken bar | Restaurant | bar | 0.600 | 0.070 |
| 8 | Bestial Fly Bar | Restaurant | bar | 0.600 | 0.070 |
| 9 | El Boliche de Roberto | Historic Tango Bar | bar | 0.584 | 0.070 |
| 10 | Ninina | Bakery & Café | cafe | 0.583 | 0.000 |

## night

Hour tested: 21

Before distribution: bar: 3, cocktail_bar: 2, restaurant: 5
After distribution: bar: 4, cocktail_bar: 2, restaurant: 4

| Rank | Venue | Category | Kind | Display score | Bias |
| --- | --- | --- | --- | ---: | ---: |
| 1 | Trade Sky Bar | Restaurant | bar | 0.693 | 0.080 |
| 2 | Backroom Bar | Restaurant | cocktail_bar | 0.693 | 0.080 |
| 3 | Kraken bar | Restaurant | bar | 0.693 | 0.080 |
| 4 | Verne Club | Restaurant | cocktail_bar | 0.693 | 0.080 |
| 5 | Bestial Fly Bar | Restaurant | bar | 0.693 | 0.080 |
| 6 | Don Julio Parrilla | Restaurant | restaurant | 0.683 | 0.070 |
| 7 | Ciro Palermo | Restaurant | restaurant | 0.683 | 0.070 |
| 8 | El Preferido de Palermo | Restaurant | restaurant | 0.683 | 0.070 |
| 9 | Parrilla Don Julio | Classic Parrilla | restaurant | 0.679 | 0.070 |
| 10 | El Boliche de Roberto | Historic Tango Bar | bar | 0.677 | 0.080 |

## Midday Guardrail

Before top-10 distribution: bar: 1, cafe: 9
After top-10 distribution: bar: 1, cafe: 4, restaurant: 4, wine_bar: 1
Cafes dominated before: yes
Cafes dominate after: no
Restaurants appear at lunch: yes
Restaurant share after: 4/10

