# Batch 02 Visual Analysis Report

Generated: 2026-06-06T23:04:38.432Z

## Readiness

- Publish readiness: false
- Staging readiness: partial
- Boundary: dry-run only; no Supabase writes, no Cloudinary uploads, no publication approval.

## Venue Coverage

| Metric | Value |
|---|---:|
| requested | 25 |
| processed | 25 |
| source_records | 25 |
| m3_venues_unique | 8 |

## M2.7 Evidence Coverage

| Metric | Value |
|---|---:|
| official_websites_found | 25 |
| reservation_links_found | 3 |
| menu_links_found | 4 |
| whatsapp_links_found | 3 |
| phone_numbers_found | 5 |
| price_hints_found | 1 |
| factual_evidence_items_found | 25 |

## Image Candidate Coverage

| Metric | Value |
|---|---:|
| raw_image_candidates_found | 176 |
| resolved_fullres_candidates | 153 |
| final_vision_queue_size_pre_sanitizer | 75 |
| sanitized_queue_size | 52 |

## M3 Visual Results

| Metric | Value |
|---|---:|
| m2_venues_requested | 25 |
| m2_venues_processed | 25 |
| m2_raw_image_candidates | 176 |
| m2_final_vision_queue_pre_sanitizer | 75 |
| sanitized_m3_items | 52 |
| m3_total_items | 52 |
| m3_ok_photo | 30 |
| m3_skipped | 22 |
| m3_below_preferred_resolution | 22 |
| m3_unique_venues | 8 |

## Scene Type Distribution

| Metric | Value |
|---|---:|
| logo | 1 |
| product_food | 18 |
| gallery_atmosphere | 2 |
| hero_interior | 6 |
| decorative | 1 |
| hero_exterior | 1 |
| crowd | 1 |

## Selected Candidates

- Verne Club: hero_interior / hero_candidate / not_approved_for_publication
- Verne Club: gallery_atmosphere / gallery_candidate / not_approved_for_publication
- Gran Bar Danzon: gallery_atmosphere / gallery_candidate / not_approved_for_publication
- Oporto Almacén: hero_interior / hero_candidate / not_approved_for_publication
- La Biela: hero_exterior / hero_candidate / not_approved_for_publication
- Florería Atlántico: hero_interior / hero_candidate / not_approved_for_publication

## Venue Candidate Coverage

Hero candidates: Verne Club, Oporto Almacén, La Biela, Florería Atlántico
Card candidates: Verne Club, Gran Bar Danzon
Gallery candidates: none
Venues without usable visual candidates: El Preferido de Palermo
Source-poor venues: Don Julio Parrilla, Milion, Ninina, Anchoita, Uptown Bar, Vini Bar

## Risks And Issues

| Metric | Value |
|---|---:|
| rights_review_needed | 0 |
| face_release_needed | 6 |
| identity_review_needed | 1 |
| below_preferred_resolution_candidates | 4 |
| ok_photos_with_faces | 4 |
| ok_photos_below_preferred_resolution | 22 |
| product_food_ok_photos | 18 |

## Pipeline Failures And Lessons

- Too many M3 calls were spent on thumbnails, product-food images, and low-resolution assets.
- The sanitizer accepted items whose real dimensions were only discovered during M3 runtime.
- Product-food images can only be retained as reference_only staging records.
- Below preferred resolution blocks strong staging readiness for hero/card use.

## Conclusion

Batch 02 is not ready for publishing. It is partially ready for evidence/image candidate staging as dry-run output only.
