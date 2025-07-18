import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

type SimpleFilterCategory = 'quality' | 'status' | 'duration' | 'playlist';

interface FilterSubtopics {
  [topicId: string]: string[];
}

export interface SelectedFilters {
  trending: boolean | null;
  quality: 'HD' | 'SD' | null;
  status: 'Live' | 'Upcoming' | 'Archived' | null;
  duration: 'Short' | 'Medium' | 'Long' | null;
  topic: string | null;
  subtopics: FilterSubtopics;
  playlist: string | null;
}

@Component({
  selector: 'app-filter',
  template: `
    <ng-container>
      <!-- Trending Chip -->
      <div class="chip-group" *ngIf="searchType === 'videos'">
        <ion-chip
          [color]="selectedFilters.trending ? 'primary' : 'light'"
          (click)="toggleTrending()"
        >
          <ion-label>Trending</ion-label>
        </ion-chip>
      </div>

      <!-- Duration Group -->
      <div class="chip-group" *ngIf="searchType === 'videos'" [class.disabled]="selectedFilters.trending">
        <ion-chip
          [color]="selectedFilters.duration === 'Short' ? 'primary' : 'light'"
          (click)="selectFilter('duration', 'Short')"
        >
          <ion-label>Short</ion-label>
        </ion-chip>
        <ion-chip
          [color]="selectedFilters.duration === 'Medium' ? 'primary' : 'light'"
          (click)="selectFilter('duration', 'Medium')"
        >
          <ion-label>Medium</ion-label>
        </ion-chip>
        <ion-chip
          [color]="selectedFilters.duration === 'Long' ? 'primary' : 'light'"
          (click)="selectFilter('duration', 'Long')"
        >
          <ion-label>Long</ion-label>
        </ion-chip>
      </div>

      <!-- HD/SD Group -->
      <div class="chip-group" *ngIf="searchType === 'videos'" [class.disabled]="selectedFilters.trending">
        <ion-chip
          [color]="selectedFilters.quality === 'HD' ? 'primary' : 'light'"
          (click)="selectFilter('quality', 'HD')"
        >
          <ion-label>HD</ion-label>
        </ion-chip>
        <ion-chip
          [color]="selectedFilters.quality === 'SD' ? 'primary' : 'light'"
          (click)="selectFilter('quality', 'SD')"
        >
          <ion-label>SD</ion-label>
        </ion-chip>
      </div>

      <!-- Live/Upcoming/Archived Group -->
      <div class="chip-group" *ngIf="searchType === 'videos'" [class.disabled]="selectedFilters.trending">
        <ion-chip
          [color]="selectedFilters.status === 'Live' ? 'primary' : 'light'"
          (click)="selectFilter('status', 'Live')"
        >
          <ion-label>Live</ion-label>
        </ion-chip>
        <ion-chip
          [color]="selectedFilters.status === 'Upcoming' ? 'primary' : 'light'"
          (click)="selectFilter('status', 'Upcoming')"
        >
          <ion-label>Upcoming</ion-label>
        </ion-chip>
        <ion-chip
          [color]="selectedFilters.status === 'Archived' ? 'primary' : 'light'"
          (click)="selectFilter('status', 'Archived')"
        >
          <ion-label>Archived</ion-label>
        </ion-chip>
      </div>

      <!-- Playlists Group -->
      <div class="chip-group" *ngIf="searchType === 'playlists'">
        <ion-chip
          *ngFor="let playlist of playlists"
          [color]="
            selectedFilters.playlist === playlist.value ? 'primary' : 'light'
          "
          (click)="selectFilter('playlist', playlist.value)"
        >
          <ion-label>{{ playlist.label }}</ion-label>
        </ion-chip>
      </div>

      <!-- Topics Group -->
      <!-- Topics Bar -->
      <div class="channels-filter">
        <div class="chip-group" *ngIf="searchType === 'channels'">
          <ion-chip
            *ngFor="let topic of topics"
            [color]="isTopicSelected(topic.value) ? 'primary' : 'light'"
            (click)="selectFilter('topic', topic.value)"
          >
            <ion-label>{{ topic.label }}</ion-label>
          </ion-chip>
        </div>

        <!-- Subtopics Bar (visible only if expandedTopic has subtopics) -->
        <div
          class="chip-group subtopics"
          *ngIf="
            searchType === 'channels' &&
            expandedTopic &&
            getSubtopics(expandedTopic)?.length
          "
        >
          <ion-chip
            *ngFor="let sub of getSubtopics(expandedTopic)"
            [color]="
              isSubtopicSelected(expandedTopic, sub.value) ? 'primary' : 'light'
            "
            (click)="selectSubtopic(expandedTopic, sub.value)"
          >
            <ion-label>{{ sub.label }}</ion-label>
          </ion-chip>
        </div>
      </div>
    </ng-container>
  `,
  styleUrls: ['./filter.component.scss'],
  imports: [CommonModule, FormsModule, IonicModule],
})
export class FilterComponent {
  @Input() searchType: string = 'videos';
  @Input() channelFilters: any = [];
  @Input() playlistFilters: any = [];
  @Input() videoFilters: any = [];
  @Output() filtersChanged = new EventEmitter<any>();


  private previousFilters: SelectedFilters | null = null;

  selectedFilters: SelectedFilters = {
    trending: null,
    quality: null,
    status: null,
    duration: null,
    topic: null,
    subtopics: {},
    playlist: null,
  };

  expandedTopic: string | null = null;

  playlists = [
    { label: 'All', value: 'all' },
    { label: 'Favorites', value: 'favorites' },
    { label: 'Recent', value: 'recent' },
  ];

  topics = [
    {
      label: 'Music',
      value: '/m/04rlf',
      subtopics: [
        { label: 'Christian', value: '/m/02mscn' },
        { label: 'Classical', value: '/m/0ggq0m' },
        { label: 'Country', value: '/m/01lyv' },
        { label: 'Electronic', value: '/m/02lkt' },
        { label: 'Hip-hop', value: '/m/0glt670' },
        { label: 'Independent', value: '/m/05rwpb' },
        { label: 'Jazz', value: '/m/03_d0' },
        { label: 'Asian', value: '/m/028sqc' }, // Renamed for clarity
        { label: 'Latin American', value: '/m/0g293' }, // Renamed for clarity
        { label: 'Pop', value: '/m/064t9' },
        { label: 'Reggae', value: '/m/06cqb' },
        { label: 'Rhythm and blues', value: '/m/06j6l' },
        { label: 'Rock', value: '/m/06by7' },
        { label: 'Soul', value: '/m/0gywn' },
        { label: 'Folk', value: '/m/0gnn_q' }, // Added
        { label: 'Metal', value: '/m/0hgs8' }, // Added
        { label: 'Soundtrack', value: '/m/02qg1' }, // Added
      ],
    },
    {
      label: 'Gaming',
      value: '/m/0bzvm2',
      subtopics: [
        { label: 'Action', value: '/m/025zzc' },
        { label: 'Adventure', value: '/m/02ntfj' },
        { label: 'Casual', value: '/m/0b1vjn' },
        { label: 'Music Games', value: '/m/02hygl' }, // Renamed for clarity
        { label: 'Puzzle', value: '/m/04q1x3q' },
        { label: 'Racing', value: '/m/01sjng' },
        { label: 'Role-playing', value: '/m/0403l3g' },
        { label: 'Simulation', value: '/m/021bp2' },
        { label: 'Sports', value: '/m/022dc6' },
        { label: 'Strategy', value: '/m/03hf_rm' },
        { label: 'Fighting', value: '/m/02chyl' }, // Added
        { label: 'Horror', value: '/m/0c_fw0' }, // Added (often a subgenre within action/adventure)
        { label: 'Open World', value: '/m/052_h' }, // Added (often a subgenre)
      ],
    },
    {
      label: 'Sports',
      value: '/m/06ntj',
      subtopics: [
        { label: 'American Football', value: '/m/0jm_' },
        { label: 'Baseball', value: '/m/018jz' },
        { label: 'Basketball', value: '/m/018w8' },
        { label: 'Boxing', value: '/m/01cgz' },
        { label: 'Cricket', value: '/m/09xp_' },
        { label: 'Football (Soccer)', value: '/m/02vx4' },
        { label: 'Golf', value: '/m/037hz' },
        { label: 'Ice Hockey', value: '/m/03tmr' },
        { label: 'MMA', value: '/m/01h7lh' },
        { label: 'Motorsport', value: '/m/0410tth' },
        { label: 'Tennis', value: '/m/07bs0' },
        { label: 'Volleyball', value: '/m/07_53' },
        { label: 'Athletics', value: '/m/02b2by' }, // Added (Track & Field)
        { label: 'Cycling', value: '/m/02_n6y' }, // Added
        { label: 'Winter Sports', value: '/m/081q4' }, // Added
        { label: 'Water Sports', value: '/m/0b40g' }, // Added
        { label: 'Extreme Sports', value: '/m/027k4' }, // Added
      ],
    },
    {
      label: 'Lifestyle',
      value: '/m/019_rr',
      subtopics: [
        { label: 'Fashion', value: '/m/032tl' },
        { label: 'Fitness', value: '/m/027x7n' },
        { label: 'Food', value: '/m/02wbm' },
        { label: 'Hobby', value: '/m/03glg' },
        { label: 'Pets', value: '/m/068hy' },
        { label: 'Beauty', value: '/m/041xxh' },
        { label: 'Technology', value: '/m/07c1v' },
        { label: 'Tourism', value: '/m/07bxq' },
        { label: 'Vehicles', value: '/m/07yv9' },
        { label: 'DIY', value: '/m/02_kt' }, // Added (Do It Yourself)
        { label: 'Home & Garden', value: '/m/02yjr' }, // Added
        { label: 'Parenting', value: '/m/04w0j' }, // Added
        { label: 'Travel', value: '/m/06bm2' }, // Added (more general than Tourism)
      ],
    },
    {
      label: 'Knowledge',
      value: '/m/01k8wb', // This is a good general Freebase ID for "Knowledge" or "Education"
      subtopics: [
        { label: 'Science', value: '/m/06mkb' }, // General science
        { label: 'History', value: '/m/03_d0b' },
        { label: 'Education', value: '/m/02l_c' },
        { label: 'DIY & How-to', value: '/m/07pr_n' }, // Often overlaps with Lifestyle
        { label: 'Finance', value: '/m/02g_f' },
        { label: 'Health', value: '/m/0kt51' },
        { label: 'Language Learning', value: '/m/033_f' },
        { label: 'Nature', value: '/m/05qv0' }, // Includes wildlife, environment
        { label: 'Philosophy', value: '/m/05lp6' },
        { label: 'Psychology', value: '/m/06n9d' },
        { label: 'Space', value: '/m/06_y' },
        { label: 'Current Events', value: '/m/098wr' }, // News and analysis
        { label: 'Politics', value: '/m/05qt0' },
        { label: 'Arts & Culture', value: '/m/01s_55' }, // Covers broad cultural topics
        { label: 'Literature', value: '/m/04j1j' },
        { label: 'Mathematics', value: '/m/04_t0' },
        { label: 'Engineering', value: '/m/0cgh4' },
        { label: 'Business', value: '/m/016_4x' },
      ],
    },
    {
      label: 'Film & Animation', // Added common top-level category
      value: '/m/02vxn',
      subtopics: [
        { label: 'Action & Adventure', value: '/m/02l7c' },
        { label: 'Comedy', value: '/m/02jds' },
        { label: 'Documentary', value: '/m/032d80' },
        { label: 'Drama', value: '/m/02rtx' },
        { label: 'Family', value: '/m/01k3g' },
        { label: 'Horror', value: '/m/02n4r' },
        { label: 'Science Fiction', value: '/m/02xzz' },
        { label: 'Thriller', value: '/m/05_50' },
        { label: 'Animation', value: '/m/01sj3' },
        { label: 'Trailers', value: '/m/0p8qg' },
        { label: 'Reviews', value: '/m/0ggql' },
      ],
    },
    {
      label: 'Comedy', // Often a standalone category on YouTube
      value: '/m/0h66_y',
      subtopics: [
        { label: 'Sketch', value: '/m/02qg1n0' },
        { label: 'Stand-up', value: '/m/06cpw' },
        { label: 'Parody', value: '/m/081q4' }, // Often overlaps with music/film
        { label: 'Vlogs (Comedy)', value: '/m/02jds0' }, // Comedy vlogs
      ],
    },
    {
      label: 'Vlogs', // General vlogging
      value: '/m/0g4b3l', // Often mapped to a broader "People & Blogs" or similar
      subtopics: [
        { label: 'Daily', value: '/m/01k8wb' }, // Can be general life vlogs
        { label: 'Travel', value: '/m/07bxq' },
        { label: 'Beauty', value: '/m/041xxh' },
        { label: 'Gaming', value: '/m/0bzvm2' },
        { label: 'Family', value: '/m/04w0j' },
      ],
    },
  ];

  toggleTrending() {
    if (!this.selectedFilters.trending) {
      // Save current filters before clearing
      this.previousFilters = { ...this.selectedFilters };
      this.resetFilters(); // Clear filters without emitting
      this.selectedFilters.trending = true;
    } else {
      // Restore saved filters
      if (this.previousFilters) {
        this.selectedFilters = { ...this.previousFilters };
        this.previousFilters = null;
      }
      this.selectedFilters.trending = null;
    }

    this.emitFiltersChange();
  }

  selectFilter(category: 'topic' | SimpleFilterCategory, value: string) {
    if (category === 'topic') {
      if (this.selectedFilters.topic === value) {
        this.selectedFilters.topic = null;
        this.expandedTopic = null;
        this.selectedFilters.subtopics = {};
      } else {
        this.selectedFilters.topic = value;
        this.expandedTopic = value;
        this.selectedFilters.subtopics = { [value]: [] };
      }
    } else {
      const currentValue = this.selectedFilters[category];
      this.selectedFilters[category] =
        currentValue !== value ? (value as any) : null;
    }

    this.emitFiltersChange();
  }

  selectSubtopic(parent: string, subtopic: string) {
    if (!this.selectedFilters.subtopics) {
      this.selectedFilters.subtopics = {};
    }

    if (!this.selectedFilters.subtopics[parent]) {
      this.selectedFilters.subtopics[parent] = [];
    }

    const list = this.selectedFilters.subtopics[parent];
    const index = list.indexOf(subtopic);

    if (index === -1) {
      list.push(subtopic);
    } else {
      list.splice(index, 1);
    }

    this.emitFiltersChange();
  }

  isTopicSelected(value: string): boolean {
    return this.selectedFilters.topic === value;
  }

  isSubtopicSelected(parent: string, subtopic: string): boolean {
    return (
      this.selectedFilters.subtopics?.[parent]?.includes(subtopic) || false
    );
  }

  getSubtopics(topicValue: string) {
    const topic = this.topics.find((t) => t.value === topicValue);
    return topic?.subtopics || [];
  }

  /** 🔥 New: Flatten selected topic + subtopics into array */
  get flattenedTopics(): string[] {
    const { topic, subtopics } = this.selectedFilters;
    if (!topic) return [];
    const selectedSubs = subtopics[topic];
    return selectedSubs && selectedSubs.length > 0 ? selectedSubs : [topic];
  }

  emitFiltersChange() {
    this.filtersChanged.emit({
      ...this.selectedFilters,
      flattenedTopics: this.flattenedTopics,
    });
  }

  resetFilters() {
    this.selectedFilters = {
      trending: null,
      quality: null,
      status: null,
      duration: null,
      topic: null,
      subtopics: {},
      playlist: null,
    };
    this.expandedTopic = null;
    this.emitFiltersChange();
  }

  hasActiveFilters(): boolean {
    return !!(
      this.selectedFilters.quality ||
      this.selectedFilters.status ||
      this.selectedFilters.duration ||
      this.selectedFilters.topic ||
      this.selectedFilters.playlist ||
      Object.values(this.selectedFilters.subtopics).some((list) => list.length)
    );
  }
}
