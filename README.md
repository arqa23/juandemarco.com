# juandemarco.com

A plain HTML/CSS site hosted for free on GitHub Pages, with the domain staying at GoDaddy.

## What's in here

| File | What it does |
|---|---|
| `tools/build.py` | **Builds every page** from one shared layout. The About text, the Contact email and the list of projects live here. Run `python3 tools/build.py` after editing |
| `index.html` | The landing page: a random full-screen image, the name, the links, the footer (generated) |
| `images.js` | **The list of cover images.** Add or remove a line to change which images can show up |
| `images/` | The image files themselves |
| `style.css` | All the look and feel (fonts, sizes, spacing) |
| `work/`, `about/`, `contact/` | Generated pages; `work/project-N/` is one page per project |
| `CNAME` | Tells GitHub Pages the site lives at juandemarco.com |

## Adding a cover image

1. Export it at **2400 px on the long edge**, as **WebP (quality ~80)** or JPEG (quality ~80). Aim for **300–600 KB**, never over 1 MB. The free tool https://squoosh.app does this in the browser.
2. Name it simply, e.g. `cover-04.webp` (no spaces).
3. Put it in `images/` and add `"/images/cover-04.webp",` to `images.js`.

## One-time setup

### 1. GitHub repo
Create a **public** repo named `juandemarco.com` under `arqa23` (free GitHub Pages needs a public repo on a free account). Upload these files to it.

### 2. Turn on GitHub Pages
Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
Custom domain: `juandemarco.com` → Save. Once the check passes, tick **Enforce HTTPS**.

### 3. GoDaddy DNS
GoDaddy → My Products → juandemarco.com → **DNS**. Delete any existing `A` record for `@` (often "Parked" or "WebsiteBuilder"), then add:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | arqa23.github.io |

Leave any `MX` / `TXT` records alone (those are for email). Changes usually work within an hour, sometimes up to 24.
