import {
  Directive,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  OnDestroy,
  NgZone // Important for performance and change detection
} from '@angular/core';
import Sortable, { Options } from 'sortablejs';

@Directive({
  selector: '[appSortable]',
  standalone: false
})
export class SortableDirective implements OnChanges, AfterViewInit, OnDestroy {
  @Input('appSortable') data: any[] = []; // The array to be sorted
  @Input('sortableOptions') options: Options = {}; // SortableJS options

  @Output() sortUpdate = new EventEmitter<{ oldIndex: number; newIndex: number; item: any }>();

  private sortable: Sortable | null = null;

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  ngOnChanges(changes: SimpleChanges): void {
    // If the options input changes, we need to handle updating SortableJS
    if (changes['options'] && this.sortable) {
      const currentOptions = changes['options'].currentValue;
      const previousOptions = changes['options'].previousValue;

      // Only re-apply options if they have actually changed (deep comparison might be needed for complex objects)
      // For simplicity, let's assume direct object reference comparison for now.
      if (currentOptions !== previousOptions) {
        // Option 1: Iterate and set each option individually (safe for most options)
        // This is the correct way to use sortable.option() for multiple options
        for (const key in currentOptions) {
          if (currentOptions.hasOwnProperty(key)) {
            // Ensure the key exists in Options interface to satisfy TypeScript
            if (key in previousOptions && currentOptions[key as keyof Options] === previousOptions[key as keyof Options]) {
                // Skip if option hasn't changed to avoid unnecessary calls
                continue;
            }
            this.sortable.option(key as keyof Options, currentOptions[key as keyof Options]);
          }
        }

        // Option 2 (Alternative for significant option changes): Destroy and re-create
        // This is necessary for options like 'group', 'handle', 'filter' that
        // are often only settable at initialization.
        // If you anticipate changing such options frequently, you might need to
        // uncomment this block and remove Option 1.
        /*
        this.destroySortable(); // Destroy the old instance
        this.ngZone.runOutsideAngular(() => {
          this.sortable = new Sortable(this.el.nativeElement, {
            animation: 150, // Default animation (can be overridden by options)
            onUpdate: (event: Sortable.SortableEvent) => {
              this.ngZone.run(() => {
                const oldIndex = event.oldIndex!;
                const newIndex = event.newIndex!;
                const movedItem = this.data.splice(oldIndex, 1)[0];
                this.data.splice(newIndex, 0, movedItem);
                this.sortUpdate.emit({ oldIndex, newIndex, item: movedItem });
              });
            },
            ...this.options // Apply the latest options here
          });
        });
        */
      }
    }
  }

  ngAfterViewInit(): void {
    this.initializeSortable();
  }

  ngOnDestroy(): void {
    this.destroySortable();
  }

  private initializeSortable(): void {
  this.ngZone.runOutsideAngular(() => {
    this.sortable = new Sortable(this.el.nativeElement, {
      animation: 150,
      forceFallback: this.options.forceFallback ?? false, // Default if user wants it
      fallbackOnBody: true, // Ensures fallback uses fixed positioning relative to body
      ...this.options,

      // Ensure the original user's onStart is preserved
      onStart: (evt) => {
        if (this.options.onStart) {
          this.options.onStart(evt);
        }

        requestAnimationFrame(() => {
          const dragClone = document.querySelector('.sortable-drag') as HTMLElement;
          const original = evt.item as HTMLElement;

          if (dragClone && original) {
            // Copy 'selected' state class
            if (original.classList.contains('selected')) {
              dragClone.classList.add('selected');
            }

            // Get bounding rect before Sortable applies offsets
            const rect = original.getBoundingClientRect();

            // Fix the position of the dragged item to avoid jump
            dragClone.style.position = 'fixed';
            dragClone.style.top = `${rect.top}px`;
            dragClone.style.left = `${rect.left}px`;
            dragClone.style.width = `${rect.width}px`;
            dragClone.style.height = `${rect.height}px`;
            dragClone.style.margin = '0';
            dragClone.style.zIndex = '1000';
            dragClone.style.pointerEvents = 'none';
            dragClone.style.transform = 'none'; // Prevent jumping sideways
          }
        });
      },

      onUpdate: (event: Sortable.SortableEvent) => {
        this.ngZone.run(() => {
          const oldIndex = event.oldIndex!;
          const newIndex = event.newIndex!;
          const movedItem = this.data.splice(oldIndex, 1)[0];
          this.data.splice(newIndex, 0, movedItem);
          this.sortUpdate.emit({ oldIndex, newIndex, item: movedItem });
        });
      },
    });
  });
}


  private destroySortable(): void {
    if (this.sortable) {
      this.sortable.destroy();
      this.sortable = null;
    }
  }
}
