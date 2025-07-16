import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { createSubject, takeUntil } from '@actioncrew/streamix';
import { VideoComment, YouTubeVideo } from 'src/app/interfaces/youtube-video-data';
import { YoutubeDataService } from 'src/app/services/data.service';


@Component({
  selector: 'app-video-page',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/search"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ currentVideo?.snippet?.title || 'Video' }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="video-page">
      <div class="scrollable">
        <!-- Video Player Section -->
        <div class="video-player-container">
          <div class="video-player">
            <ion-img
              [src]="
                currentVideo?.snippet?.thumbnails?.maxres?.url
                || currentVideo?.snippet?.thumbnails?.high?.url
                || ''"
              [alt]="(currentVideo?.snippet?.title || 'Video') + ' thumbnail'"
              class="video-thumbnail">
            </ion-img>
            <div class="play-button-overlay">
              <ion-icon name="play-circle" class="play-icon"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Video Info Section -->
        <div class="video-info-section">
          <h1 class="video-title">{{ currentVideo?.snippet?.title || 'Loading...' }}</h1>
          <div class="video-meta">
            <span class="view-count">
              {{ formatViewCount(currentVideo?.statistics?.viewCount) }} views
            </span>
            <span class="publish-date">
              {{ formatPublishDate(currentVideo?.snippet?.publishedAt) }}
            </span>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <ion-button fill="clear" (click)="toggleLike()" [class.liked]="isLiked">
              <ion-icon
                [name]="isLiked ? 'thumbs-up' : 'thumbs-up-outline'"
                slot="start">
              </ion-icon>
              {{ formatCount(currentVideo?.statistics?.likeCount) }}
            </ion-button>

            <ion-button fill="clear" (click)="toggleDislike()" [class.disliked]="isDisliked">
              <ion-icon
                [name]="isDisliked ? 'thumbs-down' : 'thumbs-down-outline'"
                slot="start">
              </ion-icon>
              {{ formatCount('120') }}
            </ion-button>

            <ion-button fill="clear" (click)="shareVideo()">
              <ion-icon name="share-outline" slot="start"></ion-icon>
              Share
            </ion-button>

            <ion-button fill="clear" (click)="downloadVideo()">
              <ion-icon name="download-outline" slot="start"></ion-icon>
              Download
            </ion-button>
          </div>
        </div>

        <!-- Comments Section -->
        <div class="comments-section">
          <h3 class="comments-title">Comments</h3>
          <div class="comments-list scrollable">
            <div *ngFor="let comment of comments" class="comment-item">
              <div class="comment-avatar">
                <ion-img
                  [src]="comment.authorAvatar || ''"
                  [alt]="(comment.author || 'User') + ' avatar'">
                </ion-img>
              </div>
              <div class="comment-content">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.author || 'Unknown' }}</span>
                  <span class="comment-time">{{ comment.timestamp || '' }}</span>
                </div>
                <p class="comment-text">{{ comment.text || '' }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Related Videos Section -->
        <div class="related-videos-section">
          <h3 class="section-title">Related Videos</h3>
          <div class="recommended-label">Recommended</div>

          <div class="related-videos-list">
            <div
              *ngFor="let video of relatedVideos"
              class="related-video-item"
              (click)="playVideo(video)">
              <div class="related-video-thumbnail">
                <ion-img
                  [src]="video.snippet.thumbnails.medium.url || ''"
                  [alt]="(video.snippet.title || 'Video') + ' thumbnail'">
                </ion-img>
              </div>
              <div class="related-video-info">
                <h4 class="related-video-title">{{ video.snippet.title || 'No Title' }}</h4>
                <div class="related-video-meta">
                  <span class="related-view-count">
                    {{ formatViewCount(video.statistics.viewCount) }} views
                  </span>
                  <span class="related-publish-date">
                    {{ formatPublishDate(video.snippet.publishedAt) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrls: ['./video.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class VideoPage implements OnInit, OnDestroy {
  private destroy$ = createSubject<void>();

  currentVideo: YouTubeVideo | null = null;
  relatedVideos: YouTubeVideo[] = [];
  comments: VideoComment[] = [];

  isLiked = false;
  isDisliked = false;

  constructor(private route: ActivatedRoute, private dataService: YoutubeDataService) {}

  ngOnInit(): void {
    const videoId = this.route.snapshot.paramMap.get('id');
    if (videoId) {
      this.loadVideoData(videoId);
      this.loadComments(videoId);
      this.loadRelatedVideos(videoId);
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadVideoData(videoId: string): void {
    this.dataService.fetchVideos([videoId]).pipe(
      takeUntil(this.destroy$))
      .subscribe((res) => {
        this.currentVideo = res.items?.[0] || null;
      });
  }

  private loadComments(videoId: string): void {
    this.dataService.fetchVideoComments(videoId).pipe(
      takeUntil(this.destroy$))
      .subscribe((res) => {
        this.comments = res.items?.map((item: any) => {
          const snippet = item.snippet.topLevelComment.snippet;
          return {
            id: item.id,
            author: snippet.authorDisplayName,
            authorAvatar: snippet.authorProfileImageUrl,
            text: snippet.textDisplay,
            timestamp: snippet.publishedAt,
            likes: snippet.likeCount,
          };
        }) || [];
      });
  }

  private loadRelatedVideos(videoId: string): void {
    this.dataService.fetchRelatedVideos(videoId).pipe(
      takeUntil(this.destroy$))
      .subscribe((res) => {
        const relatedIds = res.items?.map((item: any) => item.id.videoId).filter(Boolean);
        if (relatedIds?.length) {
          this.dataService.fetchVideos(relatedIds).pipe(
            takeUntil(this.destroy$))
            .subscribe((detailedRes) => {
              this.relatedVideos = detailedRes.items || [];
            });
        }
      });
  }

  formatViewCount(viewCount: string | undefined): string {
    if (!viewCount) return '0';
    const count = parseInt(viewCount, 10);
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  formatCount(count: string | undefined): string {
    if (!count) return '0';
    const num = parseInt(count, 10);
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatPublishDate(publishedAt: string | undefined): string {
    if (!publishedAt) return '';
    const publishDate = new Date(publishedAt);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 24) {
      return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) {
        return '1 day ago';
      } else if (diffInDays < 7) {
        return `${diffInDays} days ago`;
      } else {
        const diffInWeeks = Math.floor(diffInDays / 7);
        return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
      }
    }
  }

  toggleLike(): void {
    this.isLiked = !this.isLiked;
    if (this.isLiked && this.isDisliked) {
      this.isDisliked = false;
    }
  }

  toggleDislike(): void {
    this.isDisliked = !this.isDisliked;
    if (this.isDisliked && this.isLiked) {
      this.isLiked = false;
    }
  }

  shareVideo(): void {
    const video = this.currentVideo;
    if (!video) return;

    const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;
    if (navigator.share) {
      navigator.share({
        title: video.snippet.title || '',
        text: video.snippet.description || '',
        url: videoUrl,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(videoUrl).then(() => {
        // You could show a toast notification here
        console.log('Video URL copied to clipboard');
      });
    }
  }

  downloadVideo(): void {
    // This would typically integrate with a download service
    console.log('Download functionality would be implemented here');
    // For now, just show an alert
    alert('Download functionality not implemented in this demo');
  }

  playVideo(video: YouTubeVideo): void {
    this.currentVideo = video;
    // Scroll to top of the page
    document.querySelector('ion-content')?.scrollToTop();
  }
}
