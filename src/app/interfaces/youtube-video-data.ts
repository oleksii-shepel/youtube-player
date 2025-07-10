export interface YouTubeVideo {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      default: { url: string; width?: number; height?: number };
      medium: { url: string; width?: number; height?: number };
      high: { url: string; width?: number; height?: number };
      standard?: { url: string; width?: number; height?: number };
      maxres?: { url: string; width?: number; height?: number };
    };
    channelTitle: string;
    categoryId?: string;
    liveBroadcastContent?: 'none' | 'live' | 'upcoming';
    localized?: {
      title: string;
      description: string;
    };
  };
  contentDetails: {
    duration: string; // ISO 8601 duration format, e.g. "PT15M33S"
    dimension: '2d' | '3d';
    definition: 'hd' | 'sd';
    caption: 'true' | 'false';
    licensedContent: boolean;
    projection: 'rectangular' | '360';
  };
  statistics: {
    viewCount: string; // numbers as strings in YouTube API
    likeCount?: string;
    dislikeCount?: string;
    favoriteCount: string;
    commentCount?: string;
  };
}
