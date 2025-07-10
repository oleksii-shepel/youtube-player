export interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      default: { url: string; width?: number; height?: number };
      medium: { url: string; width?: number; height?: number };
      high: { url: string; width?: number; height?: number };
    };
    country?: string;
  };
  contentDetails: {
    relatedPlaylists: {
      likes?: string;
      uploads?: string;
      favorites?: string;
      watchHistory?: string;
      watchLater?: string;
    };
  };
  statistics: {
    viewCount: string;
    subscriberCount: string;
    hiddenSubscriberCount: boolean;
    videoCount: string;
  };
}
