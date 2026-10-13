# Room photo credits

Interior photographs from [Unsplash](https://unsplash.com), used under the
[Unsplash License](https://unsplash.com/license) (free to use, no attribution
required; credited here anyway). The same pictures were first published under
CC0 on StockSnap. Pictures that hung on the walls in the originals were
retouched out so a work can be shown in their place.

| File | Photographer | Original |
| --- | --- | --- |
| living.jpg | Naomi Hébert | https://unsplash.com/photos/2dcYhvbHV-M |
| dining.jpg | Joey Sforza | https://unsplash.com/photos/ZB5Cy_f8NMg |
| studio.jpg | Bench Accounting | https://unsplash.com/photos/nvzvOPQW0gc |

Masters are 2400 px wide; `scripts/make-thumbs.py` writes the 2400 and 1200 px
WebP copies the site loads. Each room's scale (pixels per centimetre on the
wall), floor line and wall centre are measured in `src/js/work-view.js`
(ROOMS) on a 960 px copy and used as proportions. Re-measure them if a photo
is replaced.
