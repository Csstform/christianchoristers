export const albums = [
  { title: "He Is the Amen", spotifyUrl: null as string | null },
  { title: "Proclaim the Glory of the Lord", spotifyUrl: null },
  { title: "In the Lord Alone", spotifyUrl: null },
  { title: "I'm Feeling Fine", spotifyUrl: null },
  { title: "Sweet Beulah Land", spotifyUrl: null },
  { title: "No More Night", spotifyUrl: null },
  { title: "Let Some Drops Fall On Me", spotifyUrl: null },
  { title: "When He Shall Come", spotifyUrl: null },
];

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
