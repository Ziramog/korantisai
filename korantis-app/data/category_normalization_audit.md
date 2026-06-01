# Category Normalization Audit

Generated: 2026-06-01T17:29:10.156Z
Public venue source: http://localhost:3000/api/venues

## Summary

- Total findings: 85
- High severity: 0
- Medium severity: 24
- Low severity: 61
- Duplicate/generic category names: 6

## High Severity Findings

- None

## Medium Severity Findings

- Don Julio Parrilla: Restaurant -> parrilla (generic_category, display_normalized_divergence)
- Trade Sky Bar: Restaurant -> bar (name_contains_bar_but_category_restaurant, generic_category, display_normalized_divergence)
- Backroom Bar: Restaurant -> bar (name_contains_bar_but_category_restaurant, generic_category, display_normalized_divergence)
- Kraken bar: Restaurant -> bar (name_contains_bar_but_category_restaurant, generic_category, display_normalized_divergence)
- Bestial Fly Bar: Restaurant -> bar (name_contains_bar_but_category_restaurant, generic_category, display_normalized_divergence)
- Blanca Deco and Cafe: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- L Harmonie: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- Altar Cafe: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- La Garage: cafe -> bakery_cafe (generic_category, display_normalized_divergence)
- La Panera Rosa: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- Amarante: cafe -> brunch (generic_category, display_normalized_divergence)
- London City: cafe -> classic_cafe (generic_category, display_normalized_divergence)
- La Kitchen: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- Florida Garden: cafe -> bakery_cafe (generic_category, display_normalized_divergence)
- Hierbabuena: cafe -> brunch (generic_category, display_normalized_divergence)
- Malvon: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- Morro Cafe: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- Le Ble Las Canitas: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- Moshu Las Canitas: cafe -> specialty_cafe (generic_category, display_normalized_divergence)
- Napoles: restaurant -> cocktail_bar (google_bar_type_but_category_restaurant, generic_category, display_normalized_divergence)
- Dada Bistro: restaurant -> bar (google_bar_type_but_category_restaurant, generic_category, display_normalized_divergence)
- Chila: restaurant -> premium_restaurant (generic_category, display_normalized_divergence)
- Las Cholas: restaurant -> parrilla (generic_category, display_normalized_divergence)
- 36 Billares: restaurant -> classic_cafe (google_bar_type_but_category_restaurant, generic_category, display_normalized_divergence)

## Duplicate / Generic Category Names

- restaurant: 28
- cafe: 17
- specialty coffee: 17
- cocktail_bar: 8
- wine_bar: 7
- cocktail bar: 2

## All Findings

| Venue | Source | Current | Proposed | Severity | Confidence | Issues |
| --- | --- | --- | --- | --- | ---: | --- |
| Crisol | public_venues | cafe | cafe | low | 78 | generic_category |
| Cuervo Café | public_venues | cafe | cafe | low | 78 | generic_category |
| El Boliche de Roberto | public_venues | Historic Tango Bar | bar | low | 78 |  |
| Florería Atlántico | public_venues | bar | bar | low | 78 | generic_category |
| Invernadero | public_venues | Gin & Tapas | bar | low | 78 | display_normalized_divergence |
| Florería Atlántico | public_venues | Speakeasy Bar | cocktail_bar | low | 78 | display_normalized_divergence |
| La Biela | public_venues | Historic Grand Café | classic_cafe | low | 78 | display_normalized_divergence |
| Lattente | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Melbourne Café | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Ninina | public_venues | Bakery & Café | bakery_cafe | low | 78 | display_normalized_divergence |
| Oporto Almacén | public_venues | Wine Bar & Dining | wine_bar | low | 78 |  |
| Padre Coffee Roasters | public_venues | Roastery & Café | specialty_cafe | low | 78 | display_normalized_divergence |
| Surry Hills Coffee | public_venues | Australian Café | cafe | low | 78 |  |
| Uptown Bar | public_venues | Rooftop Lounge | bar | low | 78 | display_normalized_divergence |
| Café Cuervo | public_venues | Rustic Café | cafe | low | 78 |  |
| Birkin | public_venues | Brunch & Coffee | brunch | low | 78 |  |
| Mishiguene | public_venues | Jewish Cuisine | restaurant | low | 78 | display_normalized_divergence |
| Origen Coffee House | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Parrilla Don Julio | public_venues | Classic Parrilla | parrilla | low | 78 |  |
| Tres Monos | public_venues | Cocktail Bar | cocktail_bar | low | 78 |  |
| Verne Club | public_venues | Cocktail Vault | cocktail_bar | low | 78 | display_normalized_divergence |
| Attaboy | public_venues | Speakeasy | cocktail_bar | low | 78 | display_normalized_divergence |
| Crisol Café | public_venues | Coffee & Bakery | bakery_cafe | low | 78 | display_normalized_divergence |
| Devoción | public_venues | Coffee Roastery | specialty_cafe | low | 78 | display_normalized_divergence |
| Libros del Pasaje | public_venues | Bookshop & Café | cafe | low | 78 |  |
| Niño Gordo | public_venues | Asian Fusion | restaurant | low | 78 | display_normalized_divergence |
| John & Joe \| Café de Especialidad | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| TERRASOHO - Specialty Coffee | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Vive Café Cafe de especialidad , cafés de campeonatos | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Café Boheme - Café de Especialidad | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| RITA® Specialty Coffee Armenia | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Toki Moment - Specialty Coffee | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Import Coffee Co. | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Koofi \| Café de especialidad | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Tona Café | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Don Julio Parrilla | public_venues | Restaurant | parrilla | medium | 78 | generic_category, display_normalized_divergence |
| Trade Sky Bar | public_venues | Restaurant | bar | medium | 78 | name_contains_bar_but_category_restaurant, generic_category, display_normalized_divergence |
| Wine Window Argentina (Palermo Soho) | public_venues | Wine Bar | wine_bar | low | 78 |  |
| Backroom Bar | public_venues | Restaurant | bar | medium | 78 | name_contains_bar_but_category_restaurant, generic_category, display_normalized_divergence |
| Kraken bar | public_venues | Restaurant | bar | medium | 78 | name_contains_bar_but_category_restaurant, generic_category, display_normalized_divergence |
| Verne Club | public_venues | Restaurant | restaurant | low | 78 | generic_category |
| Bari Coffee & Drinks | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Birdy Birds Specialty Coffee Roasters | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Ciao Cacao Specialty coffee | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Ciro Palermo | public_venues | Restaurant | restaurant | low | 78 | generic_category |
| Bestial Fly Bar | public_venues | Restaurant | bar | medium | 78 | name_contains_bar_but_category_restaurant, generic_category, display_normalized_divergence |
| CICHAUS | public_venues | Cocktail Bar | cocktail_bar | low | 78 |  |
| El Preferido de Palermo | public_venues | Restaurant | restaurant | low | 78 | generic_category |
| Kaldi | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Rita Specialty Coffee Soler | public_venues | Specialty Coffee | specialty_cafe | low | 78 | display_normalized_divergence |
| Blanca Deco and Cafe | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| L Harmonie | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| Altar Cafe | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| La Garage | controlled_batch | cafe | bakery_cafe | medium | 78 | generic_category, display_normalized_divergence |
| La Panera Rosa | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| Amarante | controlled_batch | cafe | brunch | medium | 78 | generic_category, display_normalized_divergence |
| London City | controlled_batch | cafe | classic_cafe | medium | 78 | generic_category, display_normalized_divergence |
| La Kitchen | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| Florida Garden | controlled_batch | cafe | bakery_cafe | medium | 78 | generic_category, display_normalized_divergence |
| Hierbabuena | controlled_batch | cafe | brunch | medium | 78 | generic_category, display_normalized_divergence |
| Malvon | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| Maleza Cafe | controlled_batch | cafe | cafe | low | 78 | generic_category |
| Morro Cafe | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| Le Ble Las Canitas | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| Moshu Las Canitas | controlled_batch | cafe | specialty_cafe | medium | 78 | generic_category, display_normalized_divergence |
| Julia | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Roux | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Anchoita | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Cafe San Juan | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| El Cuartito | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Reliquia | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Apu Nena | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Corte Comedor | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Narda Comedor | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Guerrin | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Napoles | controlled_batch | restaurant | cocktail_bar | medium | 78 | google_bar_type_but_category_restaurant, generic_category, display_normalized_divergence |
| Dada Bistro | controlled_batch | restaurant | bar | medium | 78 | google_bar_type_but_category_restaurant, generic_category, display_normalized_divergence |
| Chila | controlled_batch | restaurant | premium_restaurant | medium | 78 | generic_category, display_normalized_divergence |
| Cabaña Las Lilas | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Cucina Paradiso Colegiales | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Narda Lepes Mercado | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Las Cholas | controlled_batch | restaurant | parrilla | medium | 78 | generic_category, display_normalized_divergence |
| Olsen Las Canitas | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| Filo | controlled_batch | restaurant | restaurant | low | 78 | generic_category |
| 36 Billares | controlled_batch | restaurant | classic_cafe | medium | 78 | google_bar_type_but_category_restaurant, generic_category, display_normalized_divergence |
