// Film catalog for the BibleVerse VR Film Theater.
// Each film: web-optimized video in /films/, a themed 3D environment, and a KJV line.

export interface FilmEntry {
  id: string
  title: string
  subtitle: string
  video: string // path under public/
  /** KJV line shown as a scripture card while the film plays */
  verse: string
  reference: string
  /** Ambient environment theme */
  theme: 'beach' | 'ark' | 'stable' | 'desert' | 'upperroom' | 'tombgarden' | 'seashore'
  /** Background color used for the environment sky */
  sky: string
  /** Accent color for UI */
  accent: string
  blurb: string
}

export const FILMS: FilmEntry[] = [
  {
    id: 'ark',
    title: 'A Day on the Ark',
    subtitle: 'Walk two by two',
    video: 'films/ark.mp4',
    verse:
      'Come thou and all thy house into the ark… for thee have I seen righteous before me in this generation.',
    reference: 'Genesis 7:1',
    theme: 'ark',
    sky: '#2b3a4a',
    accent: '#c9a86a',
    blurb: 'Rain on the deck, animals two by two, and a welcome inside the hold.',
  },
  {
    id: 'nativity',
    title: 'The Nativity',
    subtitle: 'Unto us a child is born',
    video: 'films/nativity.mp4',
    verse:
      'For unto you is born this day in the city of David a Saviour, which is Christ the Lord.',
    reference: 'Luke 2:11',
    theme: 'stable',
    sky: '#1c2436',
    accent: '#e0b45c',
    blurb: 'A stable in Bethlehem, shepherds, kings, and a little drummer boy.',
  },
  {
    id: 'daniel',
    title: 'Daniel in the Lions’ Den',
    subtitle: 'Shut the lions’ mouths',
    video: 'films/daniel.mp4',
    verse: 'My God hath sent his angel, and hath shut the lions’ mouths, that they have not hurt me.',
    reference: 'Daniel 6:22',
    theme: 'desert',
    sky: '#141a26',
    accent: '#d9a441',
    blurb: 'Faithful prayer, four lions, and the dawn that delivers.',
  },
  {
    id: 'lastsupper',
    title: 'The Last Supper',
    subtitle: 'This is my body',
    video: 'films/lastsupper.mp4',
    verse: 'Take, eat; this is my body. … Drink ye all of it; for this is my blood of the new testament.',
    reference: 'Matthew 26:26–28',
    theme: 'upperroom',
    sky: '#2a1f14',
    accent: '#d8a45c',
    blurb: 'A lamp-lit room, washed feet, broken bread, and a new commandment.',
  },
  {
    id: 'resurrection',
    title: 'The Resurrection',
    subtitle: 'He is risen',
    video: 'films/resurrection.mp4',
    verse: 'He is not here: for he is risen, as he said.',
    reference: 'Matthew 28:6',
    theme: 'tombgarden',
    sky: '#3a4450',
    accent: '#e8c078',
    blurb: 'The stone rolled away, an angel’s word, and morning in the garden.',
  },
  {
    id: 'redsea',
    title: 'Parting of the Red Sea',
    subtitle: 'Fear ye not, stand still',
    video: 'films/redsea.mp4',
    verse: 'Fear ye not, stand still, and see the salvation of the LORD.',
    reference: 'Exodus 14:13',
    theme: 'seashore',
    sky: '#0e1420',
    accent: '#7fc0d8',
    blurb: 'Walls of water, dry ground, and the song of Moses at dawn.',
  },
]

export function getFilm(id: string): FilmEntry {
  return FILMS.find((f) => f.id === id) ?? FILMS[0]
}
