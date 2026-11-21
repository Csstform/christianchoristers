export type Album = {
  slug: string;
  title: string;
  /** Public path under /public for CD cover art */
  coverImage: string;
  /** open.spotify.com album URL when available */
  spotifyUrl: string | null;
  /** Melt the Heart (or other) CD/MP3 purchase URL */
  cdUrl: string | null;
  /**
   * Optional on-server audio relative to UPLOADS_DIR (e.g. albums/count-me-in.mp3).
   * When the file exists, /music shows an HTML5 player and streams via the public API.
   */
  localAudioPath: string | null;
};

/** Official eight-CD set sold via Melt the Heart, plus known Spotify embeds. */
export const albums: Album[] = [
  {
    slug: "he-is-the-amen",
    title: "He Is the Amen",
    coverImage: "/album-covers/he-is-the-amen.jpg",
    spotifyUrl: "https://open.spotify.com/album/5UgaNLJs5r8rxqaniTX6nt",
    cdUrl: "https://melttheheart.com/he-is-the-amen-cd-by-christian-choristers/",
    localAudioPath: null,
  },
  {
    slug: "proclaim-the-glory-of-the-lord",
    title: "Proclaim the Glory of the Lord",
    coverImage: "/album-covers/proclaim-the-glory-of-the-lord.jpg",
    spotifyUrl: "https://open.spotify.com/album/6HSLmPhPlMgGiwMPQEaIgD",
    cdUrl: "https://melttheheart.com/proclaim-the-glory-of-the-lord-cd-by-christian-choristers/",
    localAudioPath: null,
  },
  {
    slug: "the-christian-choristers",
    title: "The Christian Choristers",
    coverImage: "/album-covers/the-christian-choristers.jpg",
    spotifyUrl: null,
    cdUrl: "https://melttheheart.com/the-christian-choristers-cd-by-christian-choristers/",
    localAudioPath: null,
  },
  {
    slug: "count-me-in",
    title: "Count Me In",
    coverImage: "/album-covers/count-me-in.jpg",
    spotifyUrl: null,
    cdUrl: "https://melttheheart.com/count-me-in-cd-by-christian-choristers/",
    localAudioPath: "albums/count-me-in.mp3",
  },
  {
    slug: "i-want-to-be-there",
    title: "I Want To Be There",
    coverImage: "/album-covers/i-want-to-be-there.jpg",
    spotifyUrl: null,
    cdUrl: "https://melttheheart.com/i-want-to-be-there-cd-by-christian-choristers/",
    localAudioPath: null,
  },
  {
    slug: "i-wont-turn-back",
    title: "I Won't Turn Back",
    coverImage: "/album-covers/i-wont-turn-back.jpg",
    spotifyUrl: null,
    cdUrl: "https://melttheheart.com/i-wont-turn-back-cd-by-christian-choristers/",
    localAudioPath: null,
  },
  {
    slug: "kingdom-seekers",
    title: "Kingdom Seekers",
    coverImage: "/album-covers/kingdom-seekers.jpg",
    spotifyUrl: null,
    cdUrl: "https://melttheheart.com/kingdom-seekers-cd-mp3-by-christian-choristers/",
    localAudioPath: null,
  },
  {
    slug: "my-heart-keeps-singing",
    title: "My Heart Keeps Singing",
    coverImage: "/album-covers/my-heart-keeps-singing.jpg",
    spotifyUrl: null,
    cdUrl: "https://melttheheart.com/my-heart-keeps-singing-cd-by-christian-choristers/",
    localAudioPath: null,
  },
];

export const albumSetUrl =
  "https://melttheheart.com/set-of-8-cds-by-christian-choristers/";

export type LiveRecording = {
  title: string;
  location: string;
  year: number;
  youtubeUrl: string | null;
};

export const liveRecordings: LiveRecording[] = [
  {
    title: "Sunday – Christian Choristers",
    location: "North Phoenix, AZ",
    year: 2019,
    youtubeUrl:
      "https://www.youtube.com/playlist?list=PLhv8RTZ0BOYOXMp7rs7tcZczCMycBibR0",
  },
  {
    title: "Let Some Drops Fall On Me",
    location: "Union City, PA",
    year: 2011,
    youtubeUrl: "https://www.youtube.com/watch?v=dZvYsC7_fFo",
  },
  {
    title: "When He Shall Come – 50th Year Reunion",
    location: "Norton, OH",
    year: 2009,
    youtubeUrl: "https://www.youtube.com/watch?v=FZuddy0sRO4",
  },
];
