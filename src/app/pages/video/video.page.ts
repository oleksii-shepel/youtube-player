import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { YoutubeDataService } from '../../services/data.service';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { YoutubeVideoComponent } from '../../components/youtube-video/youtube-video.component';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-video',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/search"></ion-back-button>
        </ion-buttons>
        <ion-title>Video Details</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="video-details-content" *ngIf="video">
      <div class="video-player-wrapper">
        <!-- Using iframe for YouTube embed -->
        <iframe
          [src]="sanitizedVideoUrl"
          frameborder="0"
          allow="autoplay; encrypted-media"
          allowfullscreen
          class="video-iframe"
        ></iframe>
      </div>

      <div class="video-info">
        <h2 class="video-title">{{ video.snippet.title }}</h2>
        <p class="video-stats">
          {{ formatNumber(video.statistics.viewCount) }} views ·
          {{ video.snippet.publishedAt | date: 'mediumDate' }}
        </p>

        <div class="action-buttons">
          <ion-button fill="clear" size="small">
            <ion-icon name="thumbs-up-outline"></ion-icon>
            <span>{{ formatNumber(video.statistics.likeCount) }}</span>
          </ion-button>
          <ion-button fill="clear" size="small">
            <ion-icon name="thumbs-down-outline"></ion-icon>
            <span>{{ formatNumber(video.statistics.dislikeCount || 0) }}</span>
          </ion-button>
          <ion-button fill="clear" size="small">
            <ion-icon name="share-social-outline"></ion-icon>
            <span>Share</span>
          </ion-button>
          <ion-button fill="clear" size="small">
            <ion-icon name="download-outline"></ion-icon>
            <span>Download</span>
          </ion-button>
        </div>
      </div>

      <div class="comments-section" *ngIf="comments?.length">
        <h3>Comments</h3>
        <ion-list>
          <ion-item *ngFor="let comment of comments">
            <ion-avatar slot="start">
              <img [src]="comment.authorProfileImageUrl" />
            </ion-avatar>
            <ion-label>
              <h4>{{ comment.authorDisplayName }}</h4>
              <p>{{ comment.textDisplay }}</p>
              <small>{{ comment.publishedAt | date: 'short' }}</small>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>

      <div class="related-videos-section" *ngIf="relatedVideos?.length">
        <h3>Related Videos</h3>
        <ion-list>
          <ion-item
            *ngFor="let related of relatedVideos"
            (click)="goToVideo(related.id.videoId)"
            button
            detail
          >
            <ion-thumbnail slot="start">
              <img [src]="related.snippet.thumbnails.medium.url" />
            </ion-thumbnail>
            <ion-label>
              <h4>{{ related.snippet.title }}</h4>
              <p>
                {{ formatNumber(related.statistics?.viewCount || 0) }} views ·
                {{ related.snippet.publishedAt | date: 'mediumDate' }}
              </p>
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  `,
  styleUrls: ['./video.page.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class VideoPage implements OnInit {
  videoId!: string;
  video: any = null;
  comments: any[] = [];
  relatedVideos: any[] = [];
  sanitizedVideoUrl: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private youtubeDataService: YoutubeDataService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.videoId = this.route.snapshot.paramMap.get('id') || '';

    if (!this.videoId) {
      this.router.navigate(['/search']);
      return;
    }

    this.loadVideo();
    this.loadComments();
    this.loadRelatedVideos();
  }

  loadVideo() {
    this.youtubeDataService.fetchVideos([this.videoId]).subscribe((res) => {
      if (res.items.length > 0) {
        this.video = res.items[0];
        this.sanitizedVideoUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
          `https://www.youtube.com/embed/${this.videoId}`
        );
      }
    });
  }

  loadComments() {
    // this.youtubeDataService.fetchComments(this.videoId).subscribe((res) => {
    //   this.comments = res.items?.map((item: any) => item.snippet.topLevelComment.snippet) || [];
    // });
  }

  loadRelatedVideos() {
    // this.youtubeDataService.fetchRelatedVideos(this.videoId).subscribe((res) => {
    //   this.relatedVideos = res.items || [];
    // });
  }

  goToVideo(videoId: string) {
    this.router.navigate(['/video', videoId]);
  }

  formatNumber(num: number): string {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  }
}
