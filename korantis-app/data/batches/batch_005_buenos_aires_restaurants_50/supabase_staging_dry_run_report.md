# Supabase Staging Dry Run Report

## Summary

- Batch id: batch_005_buenos_aires_restaurants_50
- Approved count: 36
- Blocked count: 14
- Dry-run only: yes
- venue_images conflict key: venue_id,photo_reference
- venue_atmosphere excluded from apply: yes
- Apply idempotent after required index: yes

## Required Unique Index

- Verified through schema introspection: no
- Manually assumed: no
- Note: Index metadata is not exposed through the current Supabase/PostgREST schemas; --apply must fail before writes unless explicitly confirmed.

```sql
create unique index if not exists venue_images_venue_photo_reference_uidx
on venue_images (venue_id, photo_reference);
```

## Partial Write Detection

- Checked: yes
- Partial writes detected: no
- staging_venues rows for batch: 0
- venue_images rows for approved venues: 0
- selected hero image rows for approved venues: 0
- quality_scores rows for approved venues: 0
- 0 staging_venues rows found for batch batch_005_buenos_aires_restaurants_50.
- 0 venue_images rows found for approved venue ids.
- 0 selected Stage 08 hero image rows found for approved venue ids.
- 0 quality_scores rows found for approved venue ids.

## Schema Compatibility

- Read-only live probe attempted: yes
- Read-only live probe succeeded: yes

| Table | Found | Columns Found | Missing Columns | Fallback Decision |
| --- | --- | --- | --- | --- |
| staging_venues | yes | id, name, city, category_seed, status, canonical_data, atmosphere_prose, enrichment_data, pipeline_batch_id, pipeline_status, eligibility_score, primary_atmosphere, mood_tags | curation_status, eligibility, evidence, best_for, grounded_description, curation_notes | Map only found columns and skip missing columns: curation_status, eligibility, evidence, best_for, grounded_description, curation_notes. |
| venue_images | yes | id, venue_id, photo_reference, google_photo_reference, width, height, is_cover, status, url, role, source, quality_score, hero_suitability_score, selection_data, rights_status, is_selected_hero, sort_order | photo_scores | Map only found columns and skip missing columns: photo_scores. |
| venue_atmosphere | yes | id, venue_id, prose, word_count, model | none | Treat as not staging-compatible unless FK compatibility with staging venue ids is confirmed; use staging_venues.atmosphere_prose fallback. |
| quality_scores | yes | venue_id, review_count, has_images, has_prose, has_embeddings, resonance_score, editorial_themes, interpretation_notes, atmosphere_word_count, last_processed_at, pipeline_quality_data | none | All expected dry-run columns found. |
| venue_quality | yes | id, venue_id, review_count, has_atmosphere, has_embedding, has_images, completeness_score, ready_for_review | none | All expected dry-run columns found. |

## Venue Mapping

- Mambo Restoran: target ChIJBRmG2DjLvJURA30XmLuDsSY; category restaurant; neighborhood Villa Crespo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMK0XiiHuoNH0jk4ThMrBcCSZun3OmBjmi43h9V6IGheApFJXILhqokprdow_Zun5ZXhD81YhE2ceyMMqKHLVazbHcFRLIVNaRUYiQATgdd1DCxGqKum-5FUcNkRn8gd2oJf6T_RCptFvPgO9R1WKEI=s4800-w1366-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Casa Parra: target ChIJp-6_-sq1vJUR6xmWmn6vKRw; category restaurant; neighborhood Colegiales; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOO5ETb6NorIR9iU4ziZW0vP31XRwffIF62OC4a-F3X8NJRrSTJXxKX_nLras7kyRPve1xtNx5KYuvp94HFHV3OO_XLEbDDopI95y1FKOO7yeRPBVUSq8BkNG3aajHJzyBXhXoRxIWpHI923Q=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- La Justina Bistró: target ChIJhwXpH2fKvJURfUi5L9WGg8w; category restaurant; neighborhood Almagro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPcxUGGsrzY5OMK2WLVH6yol7pQABjoOUNgeu564BJq5NCiLvGDNYrEyRcE0t63f2_Yorjg-u58oRnMtHy1mEzCPcZNYHzobYuWaODSZlIDcicHXqKTz94ggpvTIeSXYrBZlot_RTFieQTyVQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Parrilla Sanabria Palermo: target ChIJxVSddwDLvJURZmCezPjyXDs; category restaurant; neighborhood Palermo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMJCofjrpEti_QGGTr1NDwDTBmrNxje5m9KsLCmMnsYYmYnTryKlO5kWH1u-W92d4J9dRnN8TuLaskGsKnIjSWhKWAzcAdsr3pF3jng7nkl4mmEwsY1mgcOtPa6xMLRNtisZ-WwWN6YCntUIu4QZqupbg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- La Caprichosa Parrilla: target ChIJ4_8dbADLvJURYUfRMj4HQcM; category restaurant; neighborhood Recoleta; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNh004_WBNTVtny0G6-_vtKJs86E0VHJCEsFvZlVWqoA-4cUJqsjyWZuveHr5gbEr8wO5XKIF-Ii3Wdg67T11GX4dSMLp0brcDGnWyw5Y2h2q3TiCcIVxUQgNavzy1T9FtbN8kUInbUfDPZK-YV1JPIhw=s4800-w1080-h1440; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Parrilla "La Coqueta": target ChIJY811cJjKvJURmT4zu7so5s8; category restaurant; neighborhood Recoleta; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNrlrNtSu7s4AxgZUQyg0hwcr63b7WE5tKtiDJuUtpbNj_TY-u2Aj31o1xeHdbAO7kNwtR6UvMVBReh2FdS_VZyXbpfFmSSjmOcHSFQp9LN4-O2KJbzIJ13eHFQxj3KTh6i4shAwOrBhH1DKQ=s4800-w1080-h607; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Tu Jardín Secreto - Restó Secreto: target ChIJBUxJqt21vJURUNL5jEnFgxk; category restaurant; neighborhood Colegiales; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPgKvmxzMmfAc13hVIkHxVY_dOQpbhu88lC950ujxELFlL3Ex2Ea-jUZBGsxHa-D1g9kgSHQEbo03iagYh-g1Otvwt36__ctF2oqpNEkLLf__8PjOqEQf2nJdClL6qpF4F9hz_kx6lkHBQBjH9RLs7F=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- La plazoleta parrilla: target ChIJ5WRoBJm1vJURw5DqAu70ZRU; category restaurant; neighborhood Colegiales; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMLHOopFJTKe_N7lfTIMlle24EIxiTMLZl5jEW8-DaA0HEuqzrTd5IgcqEf0TgLVPuhxvzt0WPTire9otFqX-JJ8cWrSSspU7dzT737NTTPDg8zpn55i0FS2NfG2IO2O1Cxt8p7a2rHTeSCgQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Parrilla Nuñez: target ChIJ03-AOgC1vJURSsMddB0Vb1c; category restaurant; neighborhood Belgrano; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOsGLcJY4ODpNNfWnu3oJIQLzCxicNlO12E1xlr4xLXXY13dSOUPFgdqyuSMKkCiOnfifm5Al1hZqDR-w_a0aTN6oa5dGhNLdbi4ie-jJxXuvW9hxp5jpLj-eeqf3-1P_casXoXDlCaD90ynmWTw2lbEQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- La Dorita del Mercado Belgrano: target ChIJL46_5cq1vJURmC-GnOCvoHY; category restaurant; neighborhood Belgrano; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOUb7URcmwr5sYQ5NyHFHtZBDsfoKm4SZDl4yY_XkHrRVaHfoIhNeRcBNZ2M3t3qGDy4KO_QuQLetkFdp3S3dSTOpMrzz0awts2JgKALEm1sideVeau0LycuSo65iW9fbxUz240ABGzefl29BXmh5Z5lg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Tierno Parrilla: target ChIJMROijR-1vJURjdnosD8lCwQ; category restaurant; neighborhood Belgrano; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOMkN5ofUxvU2d7DR_j-ggisbm-L_eSKXvQWuJg1km2GtZCalEJIm7BCD28XMzirh5hfkcX3kXRQpFa15CXZeOk3CdLf2TAUVDHLcRNeeoeh8dKXhbv9hh6WVCGc-mMGzYfsavBQLjjBb9aQHitqMpd_Q=s4800-w900-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Parrilla La Banda: target ChIJrSq8_IrKvJURyNkraBPZ1Bk; category restaurant; neighborhood Almagro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOPQddQ6pcmT0pzqoIa5X1fW0GQslamlCOTVWbucAyP0aOVY80eYNXBzLJJSpfI5XOLmwkssaBqTAahEHFPvlaijbl-sEqgjh1A6iQ4LT1jsZyOIxcQXVUsUGjghAr0Lva14W03cfLUnU2o=s4800-w1440-h1080; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Atis Bar: target ChIJiQqL59jLvJURql6ZgKZ32AY; category bar; neighborhood San Telmo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOSYRLR9h2MyKrZlMhKNsQfQ0q7lXzbYhYIf5k9sben0l_ACVVEP5hLNtspAJoS4sKl-ZwbNKi0p7jmOmV5HrJkXy9eA5EGc355X3mtXL7Tz1jhvnwM_TOg-Oo8fur4Jor_0Asi-Oi8O2N7Ra5s6_Q0=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- El Taller Arte & Café: target ChIJzX74SnO1vJURDl6xoIAVfdQ; category restaurant; neighborhood Palermo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPf3PvuHIlZOVBaz2PjdvSjg8uhyS1b2scVo5pLFDRwam7vynU_49KZoa_bjgiSBytodumeg_yDCD_wLGB6zvOdSVliSy61hsMW_nNyt1LNVK9fHSK6YbhP0UB75O6K6hZFDupQ3-gR822dKA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Bar & Restaurant El Correo: target ChIJ_9iPfbzKvJUR7_ciB0CJRoc; category bar; neighborhood Recoleta; hero https://lh3.googleusercontent.com/place-photos/AJRVUZOWqlIvya6KlKJYa-7JEQbh04s-YgEmN_fwK_GlFFfpKANFDCeXEZirST5pEaXP_-Z73WXj4K-zHUdXYxHDs-UwZ9ignlBIt8-YBl66yktiiudD_8iL4N1v156wAAyVCKpEf1DU0YrzcCuqQz7EsLM_GA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- RUFINO: target ChIJw0Yrh2HLvJURQeTSn4kSYv8; category restaurant; neighborhood Recoleta; hero https://lh3.googleusercontent.com/place-photos/AJRVUZONZl6rtaOJKZy7s1dMq9WThnkD889BQDIb-1JVu97eKC5izGE5QSCvmoyy8qtR6gJVw3th0-7OAep35esTyawIaBIUVXfopBMjBQjKLASEO-Ca8B2KzoK_UwdU1wQlMulmT1E_EK9XPhwO_g=s4800-w819-h1024; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- L' Orangerie Alvear Palace Hotel: target ChIJNUuUfKPKvJURwBFcWiDsv40; category bar; neighborhood Recoleta; hero https://lh3.googleusercontent.com/place-photos/AJRVUZO_aHKDA3H0gcQsNBddVPWn4cjamhlPGhVUffXRaZOEkFJEBf_YqgbUd89GT7In2zewsyqyluQnKiVhRMCJctj1wR3S8twhuk6sMZJHf9eWvMvtwC1u1cIp8vIJ2cDnTqQYJ7OQUd4ONmHg1sWMoTC3=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- El Chiri de Villa Kreplaj: target ChIJHRgyRnXKvJURl_Km8KpHYfI; category restaurant; neighborhood Villa Crespo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZP_j5cZfm9c5W8nbbsP2f4ZVGOpR0vb_OW1MaoaZjeJ0EalT9LNR560nOcZPxvXKvX-U9s2twEaicnbhKxOkhiHzlZ1MKrdCh0YahEBuNJKSYZfsv2KqoEn4NIFo3PjMGnQbmJfv4rItdq8L8m9apuwBg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- jakub: target ChIJLWjgKdq1vJURIwCG26u3Zi0; category restaurant; neighborhood Colegiales; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMCcbRvrLBYX2aw3095v5uDjMa9hyB2CdyHZjo8qOidMUd3ZUAR1swF6B17Pzr42KQWUbxbMN4FgvoKYu9_-PsXMtre_WYwpne0yGSFH20uac0sp0ga8uN9YU5zStxrDq22gdbZMPpQxSPsI4rc9aWAFQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Lo Del Francés Café Bistrot: target ChIJHzxV0CzLvJURpNhwh6llXeo; category restaurant; neighborhood San Telmo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMBlyVFrAvpaiEXLTlnoboYkGIBQz-QVVWFlGj8-0c9n3Q1hgijHXVCzY45eevKHSF8qijRBZNqESxEAwpylZuGKW0nZ0Wta5gEpC508KwsZkfm7Ao_4FrVxJece_zB_snjzEdJhLL6JLLvYA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Dada Bistró: target ChIJKaSlIATKvJURnhxTrnzX2HE; category bar; neighborhood Retiro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMX9i01oRhEwW28mIndCODPlh4N_PFiCp9SstZqo1qm0eB345N_rSsIz1kgrFqYJaQBXmptDn9e2EsWC6mRxEJ7O96S3UxdHYXGQSGVNkurJs7z5h5gAueCbv-IEuoi8kAfcAT-Ggrg_F9lQDbXiVMX2g=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Jardín de Invierno: target ChIJo7BjwqLKvJURK4y4QX7RP6A; category restaurant; neighborhood Recoleta; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNPRvSExjWMwztG9du3H3A2G4yjrjfoFCok-_03rVDck1Lx_7Vf8aPAYVAjvfI8jmiY-B21HQeE73OTnkHyuBD36cJTJS2ei0NhGKdPKOq57f2ZlAyLfds3Nb3F4oxw_8wftQ9PVU9IQ33CNRkDkuRjWg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- El Estrebe: target ChIJ20jwZZnKvJURPIXYs2-9ZVM; category restaurant; neighborhood Recoleta; hero http://www.elestrebe.com.ar/imgs/slide05-salon-final.jpg; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings missing_instagram
- Maure Parrilla: target ChIJc9pYAtq1vJURb-CrFKraBUU; category restaurant; neighborhood Chacarita; hero https://lh3.googleusercontent.com/place-photos/AJRVUZP5Zb7k8YiVXiozAa_fD935DtEH8jpGtZl_leTtulxn5sRXkQyL_5_k_q3zD1wrp65PpY109CTIOJdFENI3y-wf_1-qi_HfvElh2fsZNiIFfTh_AodxhYZkAh10i7SK3AAg-xQTzg3BwgPZcUA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Fraga Bodegón: target ChIJG2nMEnm1vJURwHxozPMx9uY; category restaurant; neighborhood Chacarita; hero https://lh3.googleusercontent.com/place-photos/AJRVUZO1QLcIFK_NlBKttvcE9emN4T-bDG0-5W_7pJMArk0dKdb-8DhqGTZl_8TZWFgUPSSxMQV_KMtQq8riBt_q1lNFvPQpxsd4yC572snEjmLvZtfxLCoe7BRYfuldLoAdL13pIBE-TX5AvgnidEpzFm7grw=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- El Tordo: target ChIJ3WcG9Pq3vJURBNgNCshk6gc; category restaurant; neighborhood Belgrano; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMh4uti5X4JSdVe7nY1EVA67w-SaJqE7jGaG2Dz2ccPf-kEsa_w1lLfY8SXcgySIZAzx9YeZfW-PVz1AVUAY-hVIvMCV7c_NgW7e_0fGV6M4r9hLNoGUz6aATEE_HK0cMUTfuoeGFlzSFR3=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Hierro Parrilla San Telmo: target ChIJG5tUKrfLvJURoUK0uPSA8sg; category bar; neighborhood San Telmo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZPbc3uhf2XOUaD-X9BWhkYCInoW6dDISR_mw6Wd42KfFiuFdy1YJ_vl4QQkatTfGleqgYW0aevFpAoWpDIx4YJ6PDPW7LrzIdp2A6lGTNXGk0JGxrhS5v-BNbwQD3AJFWNwqAZBUsMew_ufFohWcoT06g=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Parrilla Lo De Mary - Restaurante: target ChIJV3sHeGPKvJURSoUXCRuvS5I; category restaurant; neighborhood Almagro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNC4qZ493rKmFwdQhHb2RBbdSsuUIJkUVKexklT6Rz53Ay_ynhaKxz7JDvyvqd3qeTK9HuzKIzPrQY4pVESm405DLe9TMazJH5e0g2daV4AdlAmL0P2-4FzIVl8RBEWyF8lmTgcH0kD3dFk=s4800-w720-h720; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, below_preferred_resolution, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- El Mirasol De Boedo: target ChIJjRKgq1jKvJURZ1R2OmxHM-w; category restaurant; neighborhood Almagro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNRxIT7eEfBOXaRkm2ntRMtagwysUsmsC45-VV7D18j08WiXpQuHkLdFYDc8nOK70x963CxJ7VfCatjnt76aTH6KG5XOMEDvNnLILtgSUoFAxxRK2MT7l9GIOAKsKJXY2DzD7DGiBacyA96LEa-bXHaOg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Parrilla Cero5: target ChIJ95DwEyfLvJURliRjO-ZpqU4; category bar; neighborhood Retiro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZNrYBZ02r6HGeSaRQo_JLZQoKoYKW3yJNK2caiBCIXfN4skNc5XpUetG5g10DLQXuT1Io8fxEiw_bv7MbxGnfycZ-NmC9NvIF8QSqJGflrePAIw131MaWrEJ_txk37v3USfwrUSTPrJcDsBFg=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- El Mirasol de La Recova: target ChIJsd-Q9LDKvJURX4NWWE7wUr4; category restaurant; neighborhood Retiro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMA0ZXWZ7hSFkkfy3-Oh1p0FnA-re_2Av74ccTqUwwzFD6_GAS8mnw4Eq8Yk_in-Kur8TxnYS8DHXLZNE_Qqe7v-ZxLjLsXmDg6wWGOf8ApPiCUHWJInH0yDeJB1PDV9O6DlRavgWY6wDzqVY3xHhzYnA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- La Dorita: target ChIJ4Z0WDo61vJURDjA6d6vKufA; category restaurant; neighborhood Palermo; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMIaeebCg3Es-BErzWuMufg4j5ICkM-tVJaSkFepaim1JctyD98zwyPwx9NMv86kL7gSm6bElwkZnk8cD4XIxTfV9vEb45LZb6UxLDY86muWTvMA4yMlIKNSBaisUHGnaUHNzo15EPqDmD9U5OLtD82=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Pentos Colegiales: target ChIJN2gUWSy1vJURQJeCgfoIEfw; category bar; neighborhood Colegiales; hero https://lh3.googleusercontent.com/place-photos/AJRVUZM30qt4-78IF18TGqQGWhPc19bBZmoNPQ4TQEOo3i6yRKbtJ2tUNfCWSq3dqaxCaxf9ijDVpU737Bwo2qD0vfyxAa6Dk9BA5pIB5L9VnnXE_17DIdGqBSG1wfakjRa0LhS4zCq6ONYpQGvU8C3s3fzt=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed
- Bar Britanico: target ChIJyyTsSM00o5URxzB6EWJli4E; category bar; neighborhood San Telmo; hero https://turismo.buenosaires.gob.ar/sites/turismo/files/bar-britanico-1500x610_0.jpg; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings missing_instagram
- Ancora Buenos Aires: target ChIJu51WzPbLvJURrmObcSy9XLA; category restaurant; neighborhood Retiro; hero https://lh3.googleusercontent.com/place-photos/AJRVUZP4bfh5lwz8NWT9SAl30yp04azf1eLLzMrXiQ1L22PA13RerxmNwv5tCjnx40f_O-zlmAsxI7hhcMwYWb-2RgRR7JeUuX82O9ARj5mkmCsvDEJKdp36le54bc3h7aZ64zNU9wBz5Ai46sj3vz7hj7adwA=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_website, missing_instagram, missing_price_hint, image_rights_review_required_before_publication, rights_review_needed
- Croque Madame Puerto Madero: target ChIJJcWpbzE1o5UR9pPaamH_--c; category restaurant; neighborhood Puerto Madero; hero https://lh3.googleusercontent.com/place-photos/AJRVUZMuehinf__tbbSK4ZMfQKMyIee2bsZw-SdzpCz0lyu8HG1YVlVToIXYHC17d6i_P2XHpwNLGD0jEBBdN1b3Dpy3g58elwIEMsvtuIGvIUt4hbgp238ev8LfHOgU1bEEeMYdSC5_KV0cM2kzMQ=s4800-w1600-h1600; image rights not_approved_for_publication; writes staging_venues, venue_images, quality_scores, venue_atmosphere; warnings medium_rights_risk, missing_instagram, image_rights_review_required_before_publication, rights_review_needed

## Skipped Venues

- Bistro Tokio: no_hero_image
- ALMA BUENOS AIRES: no_hero_image
- Parrilla Lo de Susy: no_hero_image
- Casa Cuba Restaurant & Grill: no_hero_image
- Nuestra Parrilla: no_hero_image
- Restaurante Corte Comedor: no_hero_image
- República del Fuego: no_hero_image
- Parrilla lo del Russo: no_hero_image
- La Esquina Del Virrey: no_hero_image
- Casa Cuba: missing_or_short_tagline, missing_description, fewer_than_two_mood_tags, evidence_confidence_below_minimum
- El Patio de Mingo: no_hero_image
- La Parrillita del Pasaje: no_hero_image
- Huacho: no_hero_image
- Anafe: no_hero_image

## Safety Checks

- no_supabase_writes: yes
- no_public_venues_writes: yes
- no_cloudinary_uploads: yes
- no_image_rights_approval: yes
- no_ui_files_touched: yes
- no_external_model_calls: yes
- no_migrations_created_or_applied: yes

## How Stage 08 Works

- Reads `approval_manifest.json` and `batch_result_quality_gated.json` for the batch.
- Qualifies only venues listed in `approved_for_db_staging`; blocked and needs-review venues are skipped.
- Dry-run probes live schema, builds deterministic payload previews, detects partial writes, and writes only local JSON/Markdown reports.
- Apply requires explicit `--apply`, service-role credentials, successful preflight, required bridge columns, and manual confirmation of the venue image unique index.
- Apply writes only `staging_venues`, `venue_images`, and `quality_scores`.
- Apply intentionally does not write `public.venues`, `venues`, `venue_atmosphere`, Cloudinary, image storage, public publication state, auth, ranking, API, Mapbox, or consumer UI.
- Image rights remain `not_approved_for_publication`; selected heroes are staging references only.
- Idempotency comes from upserts on `staging_venues.id`, `venue_images(venue_id, photo_reference)`, and `quality_scores.venue_id`.
- After a partial failure, rerun dry-run first, confirm the required index exists, then rerun apply; existing partial rows are updated rather than duplicated.

## Path To 50 Buenos Aires Venues

1. Finish Stage 08 test apply for `batch_003_stage01_test` after the required `venue_images` unique index is in place.
2. Confirm the 4 approved venues are staged correctly in `staging_venues`, `venue_images`, and `quality_scores`.
3. Prepare a new Buenos Aires batch of 50 venues.
4. Run Stages 01-08 in dry-run mode first.
5. Review blocked venues and missing hero images before any apply.
6. Apply only approved venues to staging.
7. Do not publish to `public.venues` until image rights and editorial review are complete.

Ready for 50 venues means Stage 08 apply is idempotent, reports are clear, failed venues do not block valid venues, skipped venues have actionable reasons, no public tables are touched, and image rights remain blocked for publication.
