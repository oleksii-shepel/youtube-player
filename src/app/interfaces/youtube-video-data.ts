export interface VideoComment {
  id: string;
  author: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
  likes: number;
}

export interface YouTubeVideo {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    tags?: string[]; // ✅ New: Optional list of video tags
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
    defaultLanguage?: string;
    defaultAudioLanguage?: string;
  };

  contentDetails: {
    duration: string; // ISO 8601 duration format, e.g. "PT15M33S"
    dimension: '2d' | '3d';
    definition: 'hd' | 'sd';
    caption: 'true' | 'false';
    licensedContent: boolean;
    projection: 'rectangular' | '360';
    contentRating?: {
      mpaaRating?: string;
      tvpgRating?: string;
      ytRating?: 'ytAgeRestricted';
      [key: string]: string | undefined;
    };
    regionRestriction?: {
      allowed?: string[];
      blocked?: string[];
    };
  };

  statistics: {
    viewCount: string;
    likeCount?: string;
    dislikeCount?: string;
    favoriteCount: string;
    commentCount?: string;
  };

  // ✅ Optional: Include if using &part=status
  status?: {
    uploadStatus: 'processed' | 'uploaded' | 'failed' | 'deleted' | 'rejected';
    privacyStatus: 'public' | 'private' | 'unlisted';
    license?: 'youtube' | 'creativeCommon';
    embeddable: boolean;
    publicStatsViewable: boolean;
    madeForKids?: boolean;
  };

  // ✅ Optional: Include if using &part=player
  player?: {
    embedHtml: string;
    embedHeight?: number;
    embedWidth?: number;
  };

  // ✅ Optional: Include if using &part=topicDetails
  topicDetails?: {
    topicIds?: string[];
    relevantTopicIds?: string[];
    topicCategories?: string[];
  };
}
