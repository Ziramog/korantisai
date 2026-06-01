# Localization Smoke Checklist

## EN

- [ ] App loads with English by default when `korantis.locale` is absent.
- [ ] GlobalNav shows English accessible labels: Explore, Atlas, Taste.
- [ ] Search placeholder and pills show English labels.
- [ ] VenueCard names stay unchanged.
- [ ] VenueCard category/tags render in English.
- [ ] VenueDetail section headers render in English.
- [ ] Atlas labels render in English.
- [ ] Taste labels render in English.

## ES

- [ ] Pressing ES/Spanish changes locale to `es` without reload.
- [ ] Refresh persists Spanish from `localStorage.korantis.locale`.
- [ ] GlobalNav accessible labels translate to Explorar, Atlas, Gustos.
- [ ] Search placeholder and pills translate to Spanish.
- [ ] VenueCard category/tags render in Spanish when mapped.
- [ ] VenueDetail section headers render in Spanish.
- [ ] Atlas labels render in Spanish.
- [ ] Taste labels render in Spanish.

## Data Safety

- [ ] Venue names remain unchanged.
- [ ] District names remain unchanged.
- [ ] City names remain unchanged.
- [ ] Source/product names remain unchanged.
- [ ] Canonical search values remain English internally.
- [ ] Search behavior still works after selecting Spanish pills.
- [ ] Venue descriptions remain English when no safe Spanish variant exists.
- [ ] No ranking, publishing, intelligence, or database writes occur.
