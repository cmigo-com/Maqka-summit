# Adding Your Own Photos to Maqka Summit

Drop your real photos into `frontend/public/images/` using the structure below.
Nothing here uses stock, AI-generated, or placeholder photography — these folders
are empty on purpose, waiting for your uploads. Anywhere a photo is missing, the
site simply skips it (no broken-image icon), so you can fill this in gradually.

## Folder structure

```
public/images/
  home/
    hero.jpg              <- Home page hero background
  about/
    hero.jpg               <- About Us page banner (optional, wire up if you add one)
  why-choose-us/
    (any images you want to use alongside the "why choose us" reasons)
  cta/
    (any images for booking/CTA sections you add later)
  gallery/
    (a general adventure gallery grid — mixed photos from any trek)
  mountains/
    mount-kenya/
    mount-longonot/
    ngong-hills/
    hells-gate/
    aberdare-range/
    kereita-forest/
    mount-mtelo/
    loita-hills/
    menengai-crater/
```

## Naming convention per mountain/adventure

Inside each `mountains/<mountain-slug>/` folder, use descriptive names, e.g. for
Mount Kenya:

```
mountains/mount-kenya/
  hero.jpg
  sirimon-trail.jpg
  chogoria-trail.jpg
  naromoru-trail.jpg
  point-lenana-summit.jpg
  camp-shiptons.jpg
  hiking-group.jpg
```

## Wiring a photo to an adventure

Each adventure in the database has an `image_url` field. Point it at the path
under `public/images/...` (Vite serves anything in `public/` from the site root,
so `public/images/mountains/mount-kenya/hero.jpg` is reachable at
`/images/mountains/mount-kenya/hero.jpg`).

You can update this two ways:
1. **Admin dashboard** → Adventures tab → edit an adventure → "Image URL" field
2. **Seed data** — edit `backend/src/db/seed.js` before running `npm run seed`

## Home page hero

Drop your hero photo at `frontend/public/images/home/hero.jpg` — the CSS
(`.hero` in `src/styles.css`) already points at this path with a forest-green
overlay gradient on top, so any photo you use there will automatically get the
brand-colored tint.

## Accessibility & performance already handled in the code

- All adventure images render with `loading="lazy"` so below-the-fold photos
  don't block page load
- Alt text is generated from the adventure title + location/route automatically
- Images use `object-fit: cover` with a fixed aspect ratio so they crop
  consistently on mobile without distorting
- Missing images fail silently (hidden via `onError`) instead of showing a
  broken-image icon — useful while you're still gathering photos

## Not yet built (flagged for next steps)

- A proper multi-photo gallery *per adventure* (currently one `image_url` per
  adventure) — would need a small `adventure_images` table plus a gallery
  component on the adventure detail page
- An admin image upload button (currently admins paste a path/URL) — real file
  upload would need a storage service (S3, Cloudinary, or local disk uploads)
