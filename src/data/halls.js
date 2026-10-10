// WebP copies built by scripts/make-thumbs.py; the JPEG masters beside them are
// never bundled.
const modules = import.meta.glob("../assets/img/art/*.webp", { eager: true, import: "default" });
// Downscaled copies (scripts/make-thumbs.py) for everywhere a work is shown
// small. The field alone puts ~50 of them on screen, and decoding full-size
// files while panning is what made it stutter.
const thumbs = import.meta.glob("../assets/thumbs/art/*.webp", { eager: true, import: "default" });
const webp = (file) => file.replace(/\.jpg$/, ".webp");
const img = (file) => modules[`../assets/img/art/${webp(file)}`];
const thumb = (file) => thumbs[`../assets/thumbs/art/${webp(file)}`] ?? img(file);

// Images: public-domain paintings from the Art Institute of Chicago open
// access collection (CC0), see src/assets/img/art/CREDITS.md. The artists,
// titles and dates below belong to the gallery's own fiction.
// Width ÷ height of each file. Every tile, strip and card sizes itself from
// this, so a landscape is never squeezed into a portrait frame and cropped.
// Re-measure after replacing an image.
const ASPECT = {
  "calder-01.jpg": 0.679,
  "calder-02.jpg": 0.971,
  "calder-03.jpg": 1.199,
  "calder-04.jpg": 1.628,
  "calder-05.jpg": 0.833,
  "cole-01.jpg": 0.739,
  "cole-02.jpg": 1.001,
  "cole-03.jpg": 0.667,
  "cole-04.jpg": 0.766,
  "cole-05.jpg": 0.817,
  "ferreira-01.jpg": 0.803,
  "ferreira-02.jpg": 1.486,
  "ferreira-03.jpg": 1.633,
  "ferreira-04.jpg": 0.823,
  "kern-01.jpg": 0.867,
  "kern-02.jpg": 0.757,
  "kern-03.jpg": 0.803,
  "kern-04.jpg": 0.844,
  "kern-05.jpg": 0.853,
  "lindqvist-01.jpg": 1.719,
  "lindqvist-02.jpg": 1.394,
  "lindqvist-03.jpg": 1.329,
  "lindqvist-04.jpg": 1.317,
  "lindqvist-05.jpg": 1.431,
  "osei-01.jpg": 1.227,
  "osei-02.jpg": 1.219,
  "osei-03.jpg": 1.253,
  "osei-04.jpg": 0.831,
  "wolfstein-01.jpg": 1.546,
  "wolfstein-02.jpg": 1.32,
  "wolfstein-03.jpg": 1.587,
  "wolfstein-04.jpg": 1.267,
  "wolfstein-05.jpg": 1.509,
  "wolfstein-06.jpg": 1.72,
  "wolfstein-07.jpg": 1.587,
  "wolfstein-08.jpg": 1.255,
};

const work = (file, id, title, year, month, text) => ({
  id,
  title,
  year,
  date: `${month} ${year}`,
  text,
  image: img(file),
  thumb: thumb(file),
  aspect: ASPECT[file] ?? 0.75,
});

export const halls = [
  {
    id: "wolfstein",
    artist: {
      name: "Jack Wolfstein",
      nationality: "British",
      born: 1968,
      birthplace: "Whitby",
      basedIn: "Hastings",
      movement: "Seascape",
      medium: "Oil on board",
      since: 2010,
      quote: "I need the drawing from the day itself. If I lose it, I can't finish the picture.",
      bio: "Jack Wolfstein paints the North Sea coast, usually in bad weather. He has worked with the gallery since 2010.",
      statement: "Wolfstein was born in Whitby in 1968 and studied painting at Leeds. He draws outdoors in pencil and finishes each picture in his studio in Hastings, sometimes several years later. His paintings are built up in thin layers of oil over a warm brown ground. He has had five solo exhibitions at the gallery, the most recent in 2024.",
    },
    works: [
      work("wolfstein-01.jpg", "before-the-squall", "Before the Squall", 2011, "October", "Two fishing boats making for harbour ahead of a squall. Shown in Sea Pieces, Wolfstein's first solo exhibition at the gallery, in 2011."),
      work("wolfstein-02.jpg", "heavy-weather", "Two Boats, Heavy Weather", 2012, "February", "A companion to Before the Squall, painted the following winter. The horizon sits low, so most of the panel is sky."),
      work("wolfstein-03.jpg", "approaching-weather", "Approaching Weather", 2014, "June", "Bathers and beach huts on a summer afternoon as the weather turns. Worked up from drawings made at Hastings."),
      work("wolfstein-04.jpg", "heath-under-storm", "The Heath under Storm", 2015, "November", "One of Wolfstein's few inland subjects: a cart crossing open heath under a heavy sky."),
      work("wolfstein-05.jpg", "rain-over-the-valley", "Rain over the Valley", 2017, "April", "A river valley seen from high ground with rain coming in from the west. Parts of the sky were scraped back with a palette knife."),
      work("wolfstein-06.jpg", "rocky-coast", "Rocky Coast at Low Tide", 2019, "August", "Rocks at low water on a still day. Exhibited in Low Water in 2019."),
      work("wolfstein-07.jpg", "northern-coast", "The Northern Coast", 2021, "January", "Cliffs and pack ice, painted from drawings made on a trip to northern Norway. At 1.4 metres wide, his largest painting to date."),
      work("wolfstein-08.jpg", "breakers", "Breakers", 2024, "March", "Surf breaking on a rocky shore. Shown in Wolfstein's 2024 exhibition Breakers."),
    ],
  },
  {
    id: "lindqvist",
    artist: {
      name: "Mira Lindqvist",
      nationality: "Swedish",
      born: 1979,
      birthplace: "Gothenburg",
      basedIn: "Gothenburg and London",
      movement: "Figure painting",
      medium: "Oil on canvas",
      since: 2013,
      quote: "I start with the building and the light. The people come last, one at a time.",
      bio: "Mira Lindqvist paints festivals, parties and processions with large casts of figures. She joined the gallery in 2013.",
      statement: "Lindqvist was born in Gothenburg in 1979 and trained at the Valand Academy there. Her paintings take their subjects from eighteenth-century fêtes and city festivals, staged in invented settings. She paints on a red ground and adds the figures last, one by one. She divides her time between Gothenburg and London.",
    },
    works: [
      work("lindqvist-01.jpg", "festival-in-the-square", "Festival in the Square", 2013, "May", "A crowded square during a summer festival, with carriages and stands of spectators. The central work of her first exhibition with the gallery."),
      work("lindqvist-02.jpg", "pastoral-gathering", "Pastoral Gathering", 2014, "July", "An open-air party in a wooded park, after the fêtes galantes of the 1720s."),
      work("lindqvist-03.jpg", "the-may-dance", "The May Dance", 2016, "May", "Dancers in a woodland clearing on May Day."),
      work("lindqvist-04.jpg", "afternoon-party", "An Afternoon Party", 2018, "September", "A garden party painted in thick, broken colour. One of a group of small works from 2018."),
      work("lindqvist-05.jpg", "figures-in-costume", "Figures in Costume", 2020, "December", "A masked party in an interior lit by candles. Painted in Gothenburg in 2020."),
    ],
  },
  {
    id: "kern",
    artist: {
      name: "Tobias Kern",
      nationality: "German",
      born: 1972,
      birthplace: "Leipzig",
      basedIn: "Berlin",
      movement: "Portraiture",
      medium: "Oil on oak panel",
      since: 2015,
      quote: "Each sitter was a real person. The painting is my best guess at who they were.",
      bio: "Tobias Kern paints portraits in the manner of seventeenth-century Dutch painters, working from damaged archive photographs. He has shown with the gallery since 2015.",
      statement: "Kern was born in Leipzig in 1972 and trained as a paintings conservator before returning to his own work in 2008. Each portrait starts from a photograph that is too damaged to read, found in family albums or archives. He grinds his own pigments and paints on oak panel. He lives and works in Berlin.",
    },
    works: [
      work("kern-01.jpg", "man-in-a-black-coat", "Man in a Black Coat", 2015, "March", "Reconstructed from a water-damaged studio photograph in which only the collar and one hand survived."),
      work("kern-02.jpg", "old-man-fur-cap", "Old Man in a Fur Cap", 2015, "April", "The first painting in the series Restorations, shown at the gallery in 2015."),
      work("kern-03.jpg", "lace-collar", "Portrait with a Lace Collar", 2017, "October", "The lace collar is painted in full and then partly scraped back."),
      work("kern-04.jpg", "woman-white-cap", "Woman in a White Cap", 2019, "February", "Taken from a family album found in a house clearance in Potsdam."),
      work("kern-05.jpg", "the-young-heir", "The Young Heir", 2022, "June", "A boy in adult dress, painted from a damaged cabinet card."),
    ],
  },
  {
    id: "osei",
    artist: {
      name: "Amara Osei",
      nationality: "British-Ghanaian",
      born: 1985,
      birthplace: "Kumasi",
      basedIn: "London",
      movement: "Plein-air painting",
      medium: "Oil on canvas",
      since: 2018,
      quote: "I go back to the same corner at the same time every day until nothing surprises me.",
      bio: "Amara Osei paints streets and squares from life, returning to the same spot for weeks. She has shown with the gallery since 2018.",
      statement: "Osei was born in Kumasi in 1985 and moved to London as a child. She studied at the Slade School of Fine Art. She works outdoors, from the same position and at the same hour, over many sessions, and finishes in the studio only when the weather makes it impossible to continue.",
    },
    works: [
      work("osei-01.jpg", "square-in-the-rain", "The Square in the Rain", 2018, "November", "A city square in the rain, painted from a first-floor window over twenty-two mornings."),
      work("osei-02.jpg", "street-early-afternoon", "Street, Early Afternoon", 2019, "May", "A shopping street just after lunch."),
      work("osei-03.jpg", "road-into-town", "The Road into Town", 2021, "August", "The approach to a market town in summer. The figures were added as people walked past."),
      work("osei-04.jpg", "avenue-winter", "Avenue, Winter", 2023, "January", "A tree-lined avenue in snow. Shown in Osei's 2023 exhibition Ordinary Hours."),
    ],
  },
  {
    id: "cole",
    artist: {
      name: "River Cole",
      nationality: "American",
      born: 1990,
      birthplace: "Baltimore",
      basedIn: "London",
      movement: "Portraiture",
      medium: "Oil on board",
      since: 2019,
      quote: "One sitting for one face. If it doesn't work, I turn the board to the wall and start again.",
      bio: "River Cole paints portraits in a single sitting, usually of friends and other artists. Cole has shown with the gallery since 2019.",
      statement: "Cole was born in Baltimore in 1990 and is self-taught. Cole moved to London in 2014 and painted murals and shop signs before turning to portraits. Each portrait is painted in one sitting and is not reworked afterwards.",
    },
    works: [
      work("cole-01.jpg", "jeanne", "Jeanne", 2019, "March", "A friend of the artist in profile, painted in a two-hour sitting."),
      work("cole-02.jpg", "the-sculptor", "The Sculptor", 2019, "April", "A portrait of a fellow artist, painted in a single afternoon."),
      work("cole-03.jpg", "self-portrait-twenty-five", "Self-Portrait at Twenty-Five", 2020, "October", "Painted from a mirror in 2020."),
      work("cole-04.jpg", "self-portrait-studio-light", "Self-Portrait, Studio Light", 2022, "January", "A self-portrait lit from a single high window in the studio."),
      work("cole-05.jpg", "black-scarf", "Woman in a Black Scarf", 2025, "May", "A portrait of a regular visitor to the gallery, painted in 2025."),
    ],
  },
  {
    id: "calder",
    artist: {
      name: "Ines Calder",
      nationality: "Scottish",
      born: 1981,
      birthplace: "Edinburgh",
      basedIn: "Edinburgh",
      movement: "Flower painting",
      medium: "Oil on linen",
      since: 2021,
      quote: "A bouquet takes me a year, because each flower has to be painted in the week it opens.",
      bio: "Ines Calder paints flowers from life, in the tradition of Dutch flower pieces. She joined the gallery in 2021.",
      statement: "Calder was born in Edinburgh in 1981. She studied botany at the University of Edinburgh and worked as a botanical illustrator for ten years before turning to painting. Every flower in her paintings is painted from life, so a single bouquet can take a full growing season.",
    },
    works: [
      work("calder-01.jpg", "earthenware-vase", "Bouquet in an Earthenware Vase", 2021, "June", "Flowers that bloom months apart, painted over one year and combined into a single arrangement."),
      work("calder-02.jpg", "flowers-glass-vase", "Flowers on a Stone Ledge", 2021, "September", "A smaller arrangement, made as a study for Bouquet in an Earthenware Vase."),
      work("calder-03.jpg", "garden-roses", "Garden Roses", 2022, "July", "Roses from the artist's garden against a dark ground."),
      work("calder-04.jpg", "magnolias-blue-velvet", "Magnolias on Blue Velvet", 2023, "April", "Two magnolia flowers on a blue cloth, painted at life size."),
      work("calder-05.jpg", "nest-among-ferns", "Nest among Ferns", 2025, "March", "An empty bird's nest, painted where it was found among ferns."),
    ],
  },
  {
    id: "ferreira",
    artist: {
      name: "Sam Ferreira",
      nationality: "Portuguese",
      born: 1976,
      birthplace: "Porto",
      basedIn: "Lisbon",
      movement: "Trompe l'oeil",
      medium: "Oil on canvas",
      since: 2022,
      quote: "Everything in the paintings was pinned to my studio wall at the time.",
      bio: "Sam Ferreira paints trompe l'oeil still lifes of letter racks, tools and studio objects at life size. Ferreira joined the gallery in 2022.",
      statement: "Ferreira was born in Porto in 1976 and studied at the Faculty of Fine Arts there. The paintings follow the American and Dutch trompe l'oeil traditions: objects are painted at their real size, so that from a distance the picture can be mistaken for the thing itself. Ferreira lives and works in Lisbon.",
    },
    works: [
      work("ferreira-01.jpg", "letter-rack", "Letter Rack", 2022, "February", "The artist's own letter rack, with envelopes, tickets and a pencil drawing."),
      work("ferreira-02.jpg", "old-lanterns", "Old Lanterns", 2022, "May", "Two lanterns hanging from a nail, painted from the objects."),
      work("ferreira-03.jpg", "pewter-and-glass", "Table with Pewter and Glass", 2023, "October", "A table laid with a pewter jug, a glass and bread."),
      work("ferreira-04.jpg", "pinned-notice", "Pinned Notice", 2025, "February", "A torn page pinned to bare boards."),
    ],
  },
];

// Catalogue numbers run across the whole gallery, not per hall, so a work
// carries the same number in the field as it does in the list.
const numbers = new Map();
halls.forEach((hall) => {
  hall.works.forEach((work) => numbers.set(`${hall.id}/${work.id}`, numbers.size + 1));
});

export function workNumber(hallId, workId) {
  return String(numbers.get(`${hallId}/${workId}`) ?? 0).padStart(2, "0");
}

export function findWork(hallId, workId) {
  const hall = halls.find((h) => h.id === hallId);
  const work = hall?.works.find((w) => w.id === workId);
  return work ? { hall, work } : null;
}

/** "British, b. 1968", the short line that sits under an artist's name. */
export function artistLine(artist) {
  return `${artist.nationality}, b. ${artist.born}`;
}

/** Label/value pairs for an artist's fact sheet. */
export function artistFacts(hall) {
  const { artist } = hall;
  return [
    ["Born", `${artist.born}, ${artist.birthplace}`],
    ["Nationality", artist.nationality],
    ["Lives in", artist.basedIn],
    ["Direction", artist.movement],
    ["Medium", artist.medium],
    ["With the gallery", `since ${artist.since}`],
    ["In the collection", `${hall.works.length} works`],
  ];
}
