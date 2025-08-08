// enhanced-virtual-scroll.directive.ts
import {
  Directive,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef,
  Renderer2,
  NgZone,
  ChangeDetectorRef
} from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';

interface VirtualScrollItem {
  data: any;
  height: number;
  offsetTop: number;
  rendered: boolean;
}

@Directive({
  selector: '[virtualScroll]',
  standalone: false
})
export class VirtualScrollDirective implements OnInit, OnChanges, OnDestroy {
  @Input('virtualScrollOf') items: any[] = [];
  @Input('virtualScrollItemTemplate') itemTemplate!: TemplateRef<any>;

  private readonly viewport: HTMLElement;
  private contentWrapper!: HTMLElement;
  private virtualItems: VirtualScrollItem[] = [];
  private renderedViews = new Map<number, any>();

  private scrollPosition = 0;
  private containerHeight = 0;
  private totalHeight = 0;

  // Auto-calculated parameters
  private readonly estimatedItemHeight = 100; // Conservative estimate
  private readonly bufferSize = 8; // Generous buffer for dynamic heights
  private readonly debounceTime = 16; // ~60fps

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private scrollSubject = new Subject<Event>();
  private destroy$ = new Subject<void>();

  // Keep track of items that need height measurement
  private pendingMeasurements = new Set<number>();
  private measurementTimeout?: number;

  constructor(
    private elementRef: ElementRef,
    private viewContainer: ViewContainerRef,
    private renderer: Renderer2,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.viewport = this.elementRef.nativeElement;
    this.setupViewport();
    this.setupScrollListener();
  }

  ngOnInit() {
    this.setupResizeObserver();
    this.setupMutationObserver();
    this.updateViewport();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['items']) {
      this.resetVirtualization();
      this.updateViewport();
    }
  }

  ngOnDestroy() {
    this.cleanup();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupViewport() {
    // Setup viewport styles
    this.renderer.setStyle(this.viewport, 'overflow-y', 'auto');
    this.renderer.setStyle(this.viewport, 'position', 'relative');
    this.renderer.setStyle(this.viewport, 'will-change', 'scroll-position');
    this.renderer.setStyle(this.viewport, 'contain', 'layout style paint');

    // Create content wrapper
    this.contentWrapper = this.renderer.createElement('div');
    this.renderer.setStyle(this.contentWrapper, 'position', 'relative');
    this.renderer.setStyle(this.contentWrapper, 'contain', 'layout style paint');
    this.renderer.appendChild(this.viewport, this.contentWrapper);
  }

  private setupScrollListener() {
    // Use RxJS to debounce scroll events for better performance
    this.scrollSubject
      .pipe(
        debounceTime(this.debounceTime),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.ngZone.run(() => {
          this.updateRenderedItems();
        });
      });

    // Listen to scroll events
    this.ngZone.runOutsideAngular(() => {
      this.renderer.listen(this.viewport, 'scroll', (event: Event) => {
        this.scrollPosition = this.viewport.scrollTop;
        this.scrollSubject.next(event);
      });
    });
  }

  private setupResizeObserver() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        this.ngZone.run(() => {
          for (const entry of entries) {
            if (entry.target === this.viewport) {
              this.containerHeight = entry.contentRect.height;
              this.updateRenderedItems();
            } else {
              // Handle dynamic item height changes
              this.handleItemResize(entry.target as HTMLElement);
            }
          }
        });
      });

      this.resizeObserver.observe(this.viewport);
    }
  }

  private setupMutationObserver() {
    // Observe DOM changes within rendered items to handle dynamic content
    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldUpdate = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' ||
            (mutation.type === 'attributes' &&
             (mutation.attributeName === 'style' || mutation.attributeName === 'class'))) {
          shouldUpdate = true;
        }
      });

      if (shouldUpdate) {
        this.ngZone.run(() => {
          this.scheduleMeasurement();
        });
      }
    });

    this.mutationObserver.observe(this.contentWrapper, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  private resetVirtualization() {
    this.virtualItems = this.items.map((data, index) => ({
      data,
      height: this.estimatedItemHeight,
      offsetTop: index * this.estimatedItemHeight,
      rendered: false
    }));

    this.renderedViews.clear();
    this.viewContainer.clear();
    this.pendingMeasurements.clear();
    this.scrollPosition = 0;

    this.calculateTotalHeight();
  }

  private updateViewport() {
    if (!this.items?.length) {
      this.viewContainer.clear();
      return;
    }

    this.containerHeight = this.viewport.offsetHeight;
    if (!this.virtualItems.length) {
      this.resetVirtualization();
    }

    this.updateRenderedItems();
  }

  private updateRenderedItems() {
    if (!this.virtualItems.length || !this.containerHeight || !this.itemTemplate) {
      return;
    }

    const { startIndex, endIndex } = this.calculateVisibleRange();

    // Remove views that are no longer visible
    this.removeInvisibleViews(startIndex, endIndex);

    // Render new visible items
    this.renderVisibleItems(startIndex, endIndex);

    // Update content wrapper height
    this.updateContentHeight();
  }

  private calculateVisibleRange(): { startIndex: number; endIndex: number } {
    const scrollTop = this.scrollPosition;
    const scrollBottom = scrollTop + this.containerHeight;

    let startIndex = 0;
    let endIndex = this.virtualItems.length;

    // Find start index using binary search for better performance
    let low = 0;
    let high = this.virtualItems.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const item = this.virtualItems[mid];

      if (item.offsetTop + item.height < scrollTop) {
        low = mid + 1;
      } else {
        high = mid - 1;
        startIndex = mid;
      }
    }

    // Find end index
    for (let i = startIndex; i < this.virtualItems.length; i++) {
      const item = this.virtualItems[i];
      if (item.offsetTop > scrollBottom) {
        endIndex = i;
        break;
      }
    }

    // Apply buffer
    startIndex = Math.max(0, startIndex - this.bufferSize);
    endIndex = Math.min(this.virtualItems.length, endIndex + this.bufferSize);

    return { startIndex, endIndex };
  }

  private removeInvisibleViews(startIndex: number, endIndex: number) {
    const viewsToRemove: number[] = [];

    this.renderedViews.forEach((view, index) => {
      if (index < startIndex || index >= endIndex) {
        view.destroy();
        viewsToRemove.push(index);
        this.virtualItems[index].rendered = false;

        // Stop observing this element
        if (this.resizeObserver && view.rootNodes[0]) {
          this.resizeObserver.unobserve(view.rootNodes[0]);
        }
      }
    });

    viewsToRemove.forEach(index => this.renderedViews.delete(index));
  }

  private renderVisibleItems(startIndex: number, endIndex: number) {
    for (let i = startIndex; i < endIndex; i++) {
      if (!this.renderedViews.has(i)) {
        this.renderItem(i);
      }
    }
  }

  private renderItem(index: number) {
    const virtualItem = this.virtualItems[index];

    // Create embedded view
    const view = this.viewContainer.createEmbeddedView(this.itemTemplate, {
      $implicit: virtualItem.data,
      index: index
    });

    const element = view.rootNodes[0] as HTMLElement;
    if (!element) return;

    // Position the element
    this.renderer.setStyle(element, 'position', 'absolute');
    this.renderer.setStyle(element, 'top', `${virtualItem.offsetTop}px`);
    this.renderer.setStyle(element, 'left', '0');
    this.renderer.setStyle(element, 'right', '0');
    this.renderer.setStyle(element, 'width', '100%');

    // Append to content wrapper
    this.renderer.appendChild(this.contentWrapper, element);

    // Store the view
    this.renderedViews.set(index, view);
    virtualItem.rendered = true;

    // Observe for resize changes
    if (this.resizeObserver) {
      this.resizeObserver.observe(element);
    }

    // Schedule height measurement
    this.pendingMeasurements.add(index);
    this.scheduleMeasurement();
  }

  private scheduleMeasurement() {
    if (this.measurementTimeout) {
      cancelAnimationFrame(this.measurementTimeout);
    }

    this.measurementTimeout = requestAnimationFrame(() => {
      this.measurePendingItems();
    });
  }

  private measurePendingItems() {
    if (this.pendingMeasurements.size === 0) return;

    let hasChanges = false;

    this.pendingMeasurements.forEach(index => {
      const view = this.renderedViews.get(index);
      const virtualItem = this.virtualItems[index];

      if (view && virtualItem) {
        const element = view.rootNodes[0] as HTMLElement;
        if (element) {
          const newHeight = element.offsetHeight;

          if (newHeight > 0 && newHeight !== virtualItem.height) {
            virtualItem.height = newHeight;
            hasChanges = true;
          }
        }
      }
    });

    this.pendingMeasurements.clear();

    if (hasChanges) {
      this.calculateOffsets();
      this.updateRenderedItemPositions();
      this.updateContentHeight();
    }
  }

  private handleItemResize(element: HTMLElement) {
    // Find which virtual item this element belongs to
    this.renderedViews.forEach((view, index) => {
      if (view.rootNodes[0] === element) {
        this.pendingMeasurements.add(index);
        this.scheduleMeasurement();
      }
    });
  }

  private calculateOffsets() {
    let currentOffset = 0;

    this.virtualItems.forEach(item => {
      item.offsetTop = currentOffset;
      currentOffset += item.height;
    });

    this.totalHeight = currentOffset;
  }

  private calculateTotalHeight() {
    this.totalHeight = this.virtualItems.reduce((sum, item) => sum + item.height, 0);
  }

  private updateRenderedItemPositions() {
    this.renderedViews.forEach((view, index) => {
      const element = view.rootNodes[0] as HTMLElement;
      const virtualItem = this.virtualItems[index];

      if (element && virtualItem) {
        this.renderer.setStyle(element, 'top', `${virtualItem.offsetTop}px`);
      }
    });
  }

  private updateContentHeight() {
    this.renderer.setStyle(this.contentWrapper, 'height', `${this.totalHeight}px`);
  }

  private cleanup() {
    if (this.measurementTimeout) {
      cancelAnimationFrame(this.measurementTimeout);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.renderedViews.clear();
    this.viewContainer.clear();
    this.pendingMeasurements.clear();
  }

  // Public API methods
  public scrollToIndex(index: number) {
    if (index >= 0 && index < this.virtualItems.length) {
      const targetOffset = this.virtualItems[index].offsetTop;
      this.viewport.scrollTop = targetOffset;
    }
  }

  public scrollToTop() {
    this.viewport.scrollTop = 0;
  }

  public scrollToBottom() {
    this.viewport.scrollTop = this.totalHeight;
  }

  public getVisibleRange(): { start: number; end: number } {
    const { startIndex, endIndex } = this.calculateVisibleRange();
    return { start: startIndex, end: endIndex };
  }
}
