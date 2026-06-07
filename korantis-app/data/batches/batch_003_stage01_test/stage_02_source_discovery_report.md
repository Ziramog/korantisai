# Stage 02 Source Discovery Report

- Batch: batch_003_stage01_test
- Generated: 2026-06-07T18:37:35.715Z
- Venues processed: 5
- Websites attempted: 5
- Websites fetched: 5
- Instagram candidates found: 3
- Menu candidates found: 3
- Reservation candidates found: 2
- WhatsApp candidates found: 2
- Editorial/press mentions found: 1
- Average source confidence: 0.78

## Venue Results

| Venue | Website | Instagram | Reservation | Menu | WhatsApp | Editorial | Confidence | Missing | Next Action |
| --- | --- | --- | --- | --- | --- | ---: | ---: | --- | --- |
| Verne Club | http://vernecocktailclub.com/ | https://www.instagram.com/verneclub/ | http://verne.meitre.com/ | http://vernecocktailclub.com/nuestro-menu/ | https://wa.me/5491176386823 | 0 | 0.95 | editorial_press_mentions | Ready for evidence extraction. |
| Oporto Almacén | https://oporto.meitre.com/ | none | none | none | none | 0 | 0.55 | instagram, reservation_url, menu_url, whatsapp, editorial_press_mentions | Review website manually or add targeted source discovery for missing official links. |
| Gran Bar Danzon | https://granbardanzon.com.ar/ | https://www.instagram.com/granbardanzon/ | https://granbardanzon.com.ar/reservas/ | none | none | 0 | 0.80 | menu_url, whatsapp, editorial_press_mentions | Review website manually or add targeted source discovery for missing official links. |
| La Biela | https://la-biela.shop/ | none | none | https://la-biela.shop/menu | none | 1 | 0.75 | instagram, reservation_url, whatsapp | Review website manually or add targeted source discovery for missing official links. |
| Floreria Atlántico | http://floreriaatlantico.com.ar/ | https://www.instagram.com/floreriaatlantico/ | none | http://floreriaatlantico.com.ar/menu-es.html | https://api.whatsapp.com/send?phone=5491164882199&text=%C2%A1Hola%21%20Quisiera%20hacer%20una%20reserva%20 | 0 | 0.85 | reservation_url, editorial_press_mentions | Review website manually or add targeted source discovery for missing official links. |

## Safety

- Report-only stage.
- No Supabase writes.
- No Cloudinary uploads.
- No external model calls.
- No consumer UI changes.
- Fetches only Google-seeded official websites and links found on those pages.
