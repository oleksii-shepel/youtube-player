export interface YouTubePlaylist {
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
    };
    channelTitle: string;
    localized?: {
      title: string;
      description: string;
    };
  };
  contentDetails: {
    itemCount: number;
  };
}
