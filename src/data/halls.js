const modules = import.meta.glob("../assets/img/art/*.jpg", { eager: true, import: "default" });
// Downscaled copies (scripts/make-thumbs.sh) for everywhere a work is shown
// small. The field alone puts ~50 of them on screen, and decoding full-size
// files while panning is what made it stutter.
const thumbs = import.meta.glob("../assets/thumbs/art/*.jpg", { eager: true, import: "default" });
const img = (file) => modules[`../assets/img/art/${file}`];
const thumb = (file) => thumbs[`../assets/thumbs/art/${file}`] ?? img(file);

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
      movement: "Romantic seascape",
      medium: "Oil on board",
      since: 2010,
      quote: "I paint the weather. The boats are only there to give it a size.",
      bio: "Paints the sea in bad weather and very little else. Every canvas starts as a pencil sketch made on the harbour wall and is finished in the studio, sometimes years later.",
      statement: "Wolfstein works in thin layers of oil over a warm ground, so the light in his skies comes from underneath rather than being laid on top. He keeps no photographs; if the sketch is gone, the painting is abandoned.",
    },
    works: [
      work("wolfstein-01.jpg", "before-the-squall", "Before the Squall", 2011, "October", "Two fishing boats run for the harbour as the cloud closes over them. The sea is painted in a single afternoon; the sky took most of a winter."),
      work("wolfstein-02.jpg", "heavy-weather", "Two Boats, Heavy Weather", 2012, "February", "A study in how little a boat weighs against water. The horizon is set low on purpose, so almost the whole canvas is weather."),
      work("wolfstein-03.jpg", "approaching-weather", "Approaching Weather", 2014, "June", "Painted from the beach at the end of a bright day, the minute the wind turned. The figures are barely there; the change in the air is the subject."),
      work("wolfstein-04.jpg", "heath-under-storm", "The Heath under Storm", 2015, "November", "One of the few inland pictures. The dark ground sits heavy under a torn sky, with a single strip of light crossing the middle distance."),
      work("wolfstein-05.jpg", "rain-over-the-valley", "Rain over the Valley", 2017, "April", "Rain moving across a river valley, seen from high ground. Wolfstein scraped back the wet paint with a palette knife to find the light again."),
      work("wolfstein-06.jpg", "rocky-coast", "Rocky Coast at Low Tide", 2019, "August", "A quiet picture by his standards: low water, still air, rocks laid down in warm browns. He calls it the calm he paints the storms against."),
      work("wolfstein-07.jpg", "northern-coast", "The Northern Coast", 2021, "January", "Ice and cliffs under a pale sky, from sketches made on a long trip north. The largest canvas he has shown at the gallery."),
      work("wolfstein-08.jpg", "breakers", "Breakers", 2024, "March", "A wave breaking on the rocks, painted close and fast. The surf is left almost as raw paint so it reads as spray from across the room."),
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
      movement: "Neo-rococo",
      medium: "Oil on canvas",
      since: 2013,
      quote: "A crowd is just a hundred small portraits that agreed to stand together.",
      bio: "A Scandinavian painter drawn to ceremony and spectacle. Her canvases stage crowded, theatrical scenes where light does the work of narration.",
      statement: "Lindqvist builds each picture like a stage set: architecture first, then the light, then the crowd, figure by figure. She paints on a red ground, which is why her shadows stay warm.",
    },
    works: [
      work("lindqvist-01.jpg", "festival-in-the-square", "Festival in the Square", 2013, "May", "A city square flooded for a summer festival, packed with carriages and spectators. The picture that needed the gallery's first temporary walls."),
      work("lindqvist-02.jpg", "pastoral-gathering", "Pastoral Gathering", 2014, "July", "An afternoon party under the trees, painted as if overheard. Nobody looks out of the picture; everyone is busy with someone else."),
      work("lindqvist-03.jpg", "the-may-dance", "The May Dance", 2016, "May", "A ring of dancers in a clearing on the first warm day of the year. The music is implied by the tilt of every head."),
      work("lindqvist-04.jpg", "afternoon-party", "An Afternoon Party", 2018, "September", "Lindqvist at her loosest: figures dissolve into thick, jewel-coloured paint, and the light matters more than any face."),
      work("lindqvist-05.jpg", "figures-in-costume", "Figures in Costume", 2020, "December", "Painted during the months the gallery was closed. A masquerade with no audience, lit as though for one."),
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
      movement: "Dutch Golden Age revival",
      medium: "Oil on oak panel",
      since: 2015,
      quote: "Every face I paint is a guess. I try to make it an honest one.",
      bio: "Paints portraits in the manner of the Dutch masters, reconstructing faces from damaged archive photographs with a restorer's patience and a forger's curiosity.",
      statement: "Kern grinds his own pigments and paints on oak panel. Each sitter is a real person from a photograph too damaged to read; the painting is his best guess at who they were.",
    },
    works: [
      work("kern-01.jpg", "man-in-a-black-coat", "Man in a Black Coat", 2015, "March", "A merchant, reconstructed from a studio photograph lost to water damage. Only the collar and one hand survived; the rest is inference."),
      work("kern-02.jpg", "old-man-fur-cap", "Old Man in a Fur Cap", 2015, "April", "The face that started the series. Kern worked on the eyes for six months and says they are still not right."),
      work("kern-03.jpg", "lace-collar", "Portrait with a Lace Collar", 2017, "October", "Every thread of the collar is painted, then partly scraped away, so the lace sits in the paint the way it sat in the ruined print."),
      work("kern-04.jpg", "woman-white-cap", "Woman in a White Cap", 2019, "February", "A young woman from a family album found in a house clearance. The white cap is the brightest note in the whole series."),
      work("kern-05.jpg", "the-young-heir", "The Young Heir", 2022, "June", "A boy dressed as a man, standing the way he was told to. Kern kept the stiffness; it is the most honest thing in the photograph."),
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
      movement: "Plein-air street painting",
      medium: "Oil on canvas",
      since: 2018,
      quote: "Nobody in my streets is the main character. That is the point.",
      bio: "Paints streets and squares at ordinary hours: the walk to work, the wait for a tram. Quiet, democratic compositions where nobody is the main character.",
      statement: "Osei paints outdoors, from the same spot, at the same hour, for weeks. The pictures are finished when the street stops surprising her.",
    },
    works: [
      work("osei-01.jpg", "square-in-the-rain", "The Square in the Rain", 2018, "November", "Cabs, umbrellas and wet cobbles, seen from a first-floor window. Painted over twenty-two mornings of the same weather."),
      work("osei-02.jpg", "street-early-afternoon", "Street, Early Afternoon", 2019, "May", "A shopping street at the dead hour after lunch. Osei calls it a portrait of the pavement."),
      work("osei-03.jpg", "road-into-town", "The Road into Town", 2021, "August", "The last road before the market square, in flat summer light. The figures were added last, as they walked past."),
      work("osei-04.jpg", "avenue-winter", "Avenue, Winter", 2023, "January", "A long avenue in snow, the crowd reduced to strokes. Her most-visited picture, and the one people most often say they know."),
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
      movement: "Expressive portraiture",
      medium: "Oil on board",
      since: 2019,
      quote: "One sitting, one face. If it goes wrong, the canvas faces the wall.",
      bio: "Self-taught, painting fast and close on whatever surface is to hand. Faces first, always faces, in loose strokes that leave the paint visible.",
      statement: "Cole paints each portrait in one sitting and never retouches it later. If a face goes wrong, the canvas is turned to the wall and a new one begun.",
    },
    works: [
      work("cole-01.jpg", "jeanne", "Jeanne", 2019, "March", "A friend in profile, painted in two hours in the gallery's back room. The unfinished edges are exactly where Cole stopped."),
      work("cole-02.jpg", "the-sculptor", "The Sculptor", 2019, "April", "A fellow artist posed with his arms folded, painted in hard outlines and flat colour. He sat for it on a single afternoon."),
      work("cole-03.jpg", "self-portrait-twenty-five", "Self-Portrait at Twenty-Five", 2020, "October", "Painted in a mirror during the closure. Cole says it was the only face available that year."),
      work("cole-04.jpg", "self-portrait-studio-light", "Self-Portrait, Studio Light", 2022, "January", "Lit from one high window, most of the face in shadow. The first portrait Cole kept longer than a week before showing it."),
      work("cole-05.jpg", "black-scarf", "Woman in a Black Scarf", 2025, "May", "A regular visitor to the gallery, painted on the day her fourth show closed. The black of the scarf is laid on in a single pass."),
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
      movement: "Botanical still life",
      medium: "Oil on linen",
      since: 2021,
      quote: "A bouquet takes a year, because every flower has to be painted in its own week.",
      bio: "Trained as a botanist before turning to paint. Her flower pieces stay close to the specimen table: exact, patient, and a little clinical.",
      statement: "Calder paints every flower from life, which means a bouquet takes a whole season: each bloom is painted in the week it opens and the arrangement exists only on canvas.",
    },
    works: [
      work("calder-01.jpg", "earthenware-vase", "Bouquet in an Earthenware Vase", 2021, "June", "More than a hundred flowers that never bloomed at the same time, gathered into one impossible bouquet over a single year."),
      work("calder-02.jpg", "flowers-glass-vase", "Flowers on a Stone Ledge", 2021, "September", "A smaller arrangement, painted as a study for the large bouquet and kept because the tulips came out better."),
      work("calder-03.jpg", "garden-roses", "Garden Roses", 2022, "July", "Roses from her own garden, painted soft against a dark ground. The only picture she painted in under a month."),
      work("calder-04.jpg", "magnolias-blue-velvet", "Magnolias on Blue Velvet", 2023, "April", "Two magnolia blooms laid on a cloth, painted at life size. The petals bruise brown at the edges, exactly as the real ones did."),
      work("calder-05.jpg", "nest-among-ferns", "Nest among Ferns", 2025, "March", "An empty nest found on a walk, painted in the ferns where it lay. The eggs were long gone; the painting leaves them out."),
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
      quote: "If you don't reach out to touch it, I haven't finished.",
      bio: "More interested in the studio than the finished canvas. Letter racks, lanterns, pinned notes and tools are the real subject, painted so close to life they fool the eye.",
      statement: "Ferreira paints trompe l'oeil the old way, at exactly life size, so that from across the room the picture reads as the object itself. Everything shown was on the studio wall at the time.",
    },
    works: [
      work("ferreira-01.jpg", "letter-rack", "Letter Rack", 2022, "February", "The studio's own letter rack, stuffed with envelopes, tickets and a pencil sketch. Visitors reach out to take the cards at least once a day."),
      work("ferreira-02.jpg", "old-lanterns", "Old Lanterns", 2022, "May", "Two broken lanterns hung on a nail, painted from the objects themselves. The rust took longer to paint than the glass."),
      work("ferreira-03.jpg", "pewter-and-glass", "Table with Pewter and Glass", 2023, "October", "A laid table in grey light: a tipped cup, a half-drunk glass, a crust of bread. The quietest thing Ferreira has made."),
      work("ferreira-04.jpg", "pinned-notice", "Pinned Notice", 2025, "February", "A single torn page pinned to bare boards. The wood grain is painted, the nail heads are painted; nothing on the canvas is real."),
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
