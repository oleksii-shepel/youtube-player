export type YouTubeVideoDuration = 'any' | 'long' | 'short' | 'medium';
export type YouTubeVideoDefinition = 'standard' | 'high';
export type YouTubeEventType = '' | 'live' | 'upcoming' | 'completed';
export type YouTubeQueryType = 'video' | 'channel' | 'playlist';
export type YouTubePlaylistType = 'all' | 'favorites' | 'recent';

export enum YouTubeVideoCategory {
  All = '', // All categories
  FilmAndAnimation = '1', // Film & Animation
  AutosAndVehicles = '2', // Autos & Vehicles
  Music = '10', // Music
  PetsAndAnimals = '15', // Pets & Animals
  Sports = '17', // Sports
  ShortMovies = '18', // Short Movies
  TravelAndEvents = '19', // Travel & Events
  Gaming = '20', // Gaming
  Videoblogging = '21', // Videoblogging
  PeopleAndBlogs = '22', // People & Blogs
  Comedy = '23', // Comedy
  Entertainment = '24', // Entertainment
  NewsAndPolitics = '25', // News & Politics
  HowtoAndStyle = '26', // How-to & Style
  Education = '27', // Education
  ScienceAndTechnology = '28', // Science & Technology
  NonprofitsAndActivism = '29', // Nonprofits & Activism
  Movies = '30', // Movies
  AnimeAndAnimation = '31', // Anime & Animation
  ActionAndAdventure = '32', // Action & Adventure
  Classics = '33', // Classics
  ComedyMovies = '34', // Comedy Movies
  Documentary = '35', // Documentary
  Drama = '36', // Drama
  Family = '37', // Family
  Foreign = '38', // Foreign
  Horror = '39', // Horror
  SciFiAndFantasy = '40', // Sci-Fi & Fantasy
  Thriller = '41', // Thriller
  Shorts = '42', // Shorts
  Shows = '43', // Shows
  Trailers = '44' // Trailers
}


export enum YouTubeRegion {
  US = 'US', // United States
  UK = 'GB', // United Kingdom
  CA = 'CA', // Canada
  DE = 'DE', // Germany
  RU = 'RU', // Russia
  UA = 'UA', // Ukraine
  FR = 'FR', // France
  IN = 'IN', // India
  JP = 'JP', // Japan
  KR = 'KR', // South Korea
  BR = 'BR', // Brazil
  MX = 'MX', // Mexico
  AU = 'AU', // Australia
  IT = 'IT', // Italy
  ES = 'ES', // Spain
  CN = 'CN', // China (Note: YouTube is restricted in some areas)
  SE = 'SE', // Sweden
  NL = 'NL', // Netherlands
  SA = 'SA', // Saudi Arabia
  ZA = 'ZA', // South Africa
}


export enum YouTubeTimeFrame {
  Any = '',
  PastHour = 'hour',
  Today = 'day',
  ThisWeek = 'week',
  ThisMonth = 'month',
  ThisYear = 'year'
}

export enum YouTubeSortBy {
  Relevance = 'relevance',
  UploadDate = 'uploadDate',
  ViewCount = 'viewCount',
  Rating = 'rating'
}

export enum YouTubeLanguage {
  Any = '', // No specific language
  English = 'en', // English
  Spanish = 'es', // Spanish
  French = 'fr', // French
  German = 'de', // German
  Russian = 'ru', // Russian
  Ukrainian = 'uk', // Ukrainian
  ChineseSimplified = 'zh-Hans', // Chinese (Simplified)
  ChineseTraditional = 'zh-Hant', // Chinese (Traditional)
  Japanese = 'ja', // Japanese
  Korean = 'ko', // Korean
  Portuguese = 'pt', // Portuguese
  Italian = 'it', // Italian
  Dutch = 'nl', // Dutch
  Arabic = 'ar', // Arabic
  Hindi = 'hi', // Hindi
  Bengali = 'bn', // Bengali
  Turkish = 'tr', // Turkish
  Persian = 'fa', // Persian
  Polish = 'pl', // Polish
  Swedish = 'sv', // Swedish
  Thai = 'th', // Thai
  Vietnamese = 'vi', // Vietnamese
}


export enum YouTubeSafeSearch {
  All = 'none',
  Moderate = 'moderate',
  Strict = 'strict'
}

export interface IYoutubeQueryParams {
  q?: string; // Search query term
  part?: string; // Part of the resource to retrieve (e.g., snippet)
  type?: YouTubeQueryType; // Type of search: video, channel, playlist

  // Shared parameters for all types (video, channel, playlist)
  regionCode?: string; // Region code (e.g., US, GB)
  publishedAfter?: string; // ISO 8601 timestamp
  publishedBefore?: string; // ISO 8601 timestamp
  maxResults?: number; // Max number of results per page (1-50)
  order?: YouTubeSortBy; // Sort by relevance, viewCount, date, etc.
  relevanceLanguage?: YouTubeLanguage; // Filter by language
  safeSearch?: YouTubeSafeSearch; // Safe search level (none, moderate, strict)
  pageToken?: string; // Pagination token

  // Video-specific parameters
  videoDuration?: YouTubeVideoDuration; // any | short | medium | long
  videoDefinition?: YouTubeVideoDefinition; // standard | high
  eventType?: YouTubeEventType; // live | completed | upcoming
  videoCategoryId?: YouTubeVideoCategory; // Video category ID

  // Playlist-specific parameters
  playlistType?: YouTubePlaylistType; // all | favorites | recent

  // Channel-specific parameters
  topics?: string[]; // List of channel topics
}

export const YoutubeTopics = [
  { id: '/m/04rlf', name: 'Music' },
  { id: '/m/0bzvm2', name: 'Gaming' },
  { id: '/m/06ntj', name: 'Sports' },
  { id: '/m/02jjt', name: 'Entertainment' },
  { id: '/m/019_rr', name: 'Lifestyle' },
  { id: '/m/098wr', name: 'Society' },
  { id: '/m/01k8wb', name: 'Knowledge' },
  { id: '/m/03glg', name: 'Technology' },
  { id: '/m/07c1v', name: 'Film & Animation' },
  { id: '/m/0f2f9', name: 'Food & Drink' },
  { id: '/m/027x7n', name: 'Travel & Events' },
  { id: '/m/02vxn', name: 'Autos & Vehicles' },
  { id: '/m/01h7lh', name: 'Education' },
  { id: '/m/05qt0', name: 'Science & Engineering' },
  { id: '/m/01jnbd', name: 'News & Politics' },
  { id: '/m/02wbm', name: 'Comedy' },
  { id: '/m/09s1f', name: 'Nonprofits & Activism' },
  { id: '/m/032tl', name: 'Pets & Animals' },
  { id: '/m/0kt51', name: 'Health & Fitness' }
];

export interface SearchResults {
  items: any[];
  pageToken: string;
}
