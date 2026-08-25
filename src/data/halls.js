const modules = import.meta.glob("../assets/img/**/*.jpg", { eager: true, import: "default" });
const img = (file) => modules[`../assets/img/${file}`];

export const halls = [
  {
    id: "wolfstein",
    cell: { col: 0, row: 0 },
    artist: {
      name: "Jack Wolfstein",
      bio: "Renowned for his innovative style and unique approach to art. With a career spanning over a decade, he blends traditional techniques with modern elements, creating pieces that tell compelling stories.",
    },
    works: [
      { id: "pompeii", title: "Last day of Pompeii", year: 2025, image: img("gallery/artwork-01.jpg") },
      { id: "wave", title: "The Great Wave", year: 2024, image: img("gallery/artwork-02.jpg") },
      { id: "still-life", title: "Still Life with Flowers", year: 2023, image: img("gallery/artwork-03.jpg") },
      { id: "face", title: "Fractured Portrait", year: 2025, image: img("gallery/artwork-04.jpg") },
      { id: "birds", title: "Birds Among Branches", year: 2022, image: img("gallery/artwork-05.jpg") },
      { id: "landscape", title: "Mountain Pass", year: 2021, image: img("gallery/artwork-06.jpg") },
      { id: "portrait", title: "Study in Feathers", year: 2024, image: img("gallery/artwork-07.jpg") },
      { id: "castle", title: "The Far Shore", year: 2020, image: img("gallery/artwork-10.jpg") },
    ],
  },
  {
    id: "lindqvist",
    cell: { col: 1, row: 0 },
    artist: {
      name: "Mira Lindqvist",
      bio: "A Scandinavian painter drawn to ceremony and spectacle. Her canvases stage crowded, theatrical scenes where light does the work of narration.",
    },
    works: [
      { id: "ascension", title: "Ascension", year: 2019, image: img("halls/h1-01.jpg") },
      { id: "gathering", title: "The Gathering", year: 2020, image: img("halls/h1-02.jpg") },
      { id: "processional", title: "Processional", year: 2018, image: img("halls/h1-03.jpg") },
      { id: "afterglow", title: "Afterglow", year: 2022, image: img("halls/h1-04.jpg") },
      { id: "recess", title: "Recess", year: 2021, image: img("halls/h1-05.jpg") },
    ],
  },
  {
    id: "kern",
    cell: { col: 2, row: 0 },
    artist: {
      name: "Tobias Kern",
      bio: "Works in oil and archive photography, revisiting old portraiture with a restorer's patience and a forger's curiosity.",
    },
    works: [
      { id: "sitting", title: "Sitting Room", year: 2017, image: img("halls/h2-01.jpg") },
      { id: "keeper", title: "The Keeper", year: 2019, image: img("halls/h2-02.jpg") },
      { id: "correspondence", title: "Correspondence", year: 2016, image: img("halls/h2-03.jpg") },
      { id: "provincial", title: "Provincial Hour", year: 2020, image: img("halls/h2-04.jpg") },
      { id: "inventory", title: "Inventory", year: 2018, image: img("halls/h2-05.jpg") },
    ],
  },
  {
    id: "osei",
    cell: { col: 0, row: 1 },
    artist: {
      name: "Amara Osei",
      bio: "A collector of found archives and civic photography, reassembled into quiet, democratic compositions about ordinary places.",
    },
    works: [
      { id: "archive-1", title: "Public Record", year: 2021, image: img("halls/h3-01.jpg") },
      { id: "archive-2", title: "Reading Room", year: 2020, image: img("halls/h3-02.jpg") },
      { id: "archive-3", title: "Civic Hour", year: 2019, image: img("halls/h3-03.jpg") },
      { id: "archive-4", title: "Borough", year: 2022, image: img("halls/h3-04.jpg") },
    ],
  },
  {
    id: "cole",
    cell: { col: 1, row: 1 },
    artist: {
      name: "River Cole",
      bio: "Street-raised and self-taught, painting directly onto walls and salvaged board — faces first, always faces.",
    },
    works: [
      { id: "witness", title: "Witness", year: 2023, image: img("halls/h4-01.jpg") },
      { id: "unspoken", title: "Unspoken", year: 2022, image: img("halls/h4-02.jpg") },
      { id: "relic-1", title: "Relic I", year: 2020, image: img("halls/h4-03.jpg") },
      { id: "relic-2", title: "Relic II", year: 2020, image: img("halls/h4-04.jpg") },
      { id: "relic-3", title: "Relic III", year: 2021, image: img("halls/h4-05.jpg") },
    ],
  },
  {
    id: "calder",
    cell: { col: 2, row: 1 },
    artist: {
      name: "Ines Calder",
      bio: "Trained as a botanist before turning to paint. Her work stays close to the specimen table — close, patient, a little clinical.",
    },
    works: [
      { id: "specimen-1", title: "Specimen No. 4", year: 2024, image: img("halls/h5-01.jpg") },
      { id: "specimen-2", title: "Hedgerow", year: 2023, image: img("halls/h5-02.jpg") },
      { id: "specimen-3", title: "Cutting", year: 2022, image: img("halls/h5-03.jpg") },
      { id: "specimen-4", title: "Understory", year: 2021, image: img("halls/h5-04.jpg") },
      { id: "specimen-5", title: "Late Bloom", year: 2024, image: img("halls/h5-05.jpg") },
    ],
  },
  {
    id: "ferreira",
    cell: { col: 0, row: 2 },
    artist: {
      name: "Sam Ferreira",
      bio: "More interested in the studio than the finished canvas — process, tools, and residue are the real subject of the work.",
    },
    works: [
      { id: "process-1", title: "Palette", year: 2023, image: img("halls/h6-01.jpg") },
      { id: "process-2", title: "Worked Surface", year: 2022, image: img("halls/h6-02.jpg") },
      { id: "process-3", title: "Studio Floor", year: 2024, image: img("halls/h6-03.jpg") },
      { id: "process-4", title: "Leftover Light", year: 2021, image: img("halls/h6-04.jpg") },
    ],
  },
];

export function findWork(hallId, workId) {
  const hall = halls.find((h) => h.id === hallId);
  const work = hall?.works.find((w) => w.id === workId);
  return work ? { hall, work } : null;
}
