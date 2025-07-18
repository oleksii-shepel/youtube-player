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
  // The array to be sorted. The directive will manipulate this array directly on sort.
  @Input('appSortable') data: any[] = [];
  // SortableJS options to configure the drag-and-drop behavior.
  @Input('sortableOptions') options: Options = {};
  // New input: A boolean flag to enable or disable the sortable functionality.
  // Defaults to true, meaning the directive is active by default, mimicking original behavior.
  @Input() enabled: boolean = true;

  // Event emitted when the sort order is updated.
  @Output() sortUpdate = new EventEmitter<{ oldIndex: number; newIndex: number; item: any }>();

  private sortable: Sortable | null = null; // Holds the SortableJS instance.

  constructor(private el: ElementRef, private ngZone: NgZone) {}

  /**
   * Lifecycle hook that is called when any data-bound property of a directive changes.
   * This is used to react to changes in `isSortableEnabled` and `sortableOptions`.
   */
  ngOnChanges(changes: SimpleChanges): void {
    // Check if the 'isSortableEnabled' input has changed.
    if (changes['isSortableEnabled']) {
      const isEnabled = changes['isSortableEnabled'].currentValue;
      const wasEnabled = changes['isSortableEnabled'].previousValue;

      // If sorting is now enabled AND SortableJS is not yet initialized, initialize it.
      if (isEnabled && !this.sortable) {
        this.initializeSortable();
      }
      // If sorting is now disabled AND SortableJS is currently initialized, destroy it.
      else if (!isEnabled && this.sortable) {
        this.destroySortable();
      }
    }

    // Check if 'options' input has changed AND if SortableJS is currently enabled and initialized.
    // We only update options if the directive is active.
    if (this.enabled && this.sortable && changes['options']) {
      const currentOptions = changes['options'].currentValue;
      const previousOptions = changes['options'].previousValue;

      // Only re-apply options if the object reference has changed.
      // For deep changes, a deep comparison might be necessary, but for simplicity,
      // we assume direct object reference changes or primitive option changes.
      if (currentOptions !== previousOptions) {
        // Iterate over the new options and set them on the SortableJS instance.
        for (const key in currentOptions) {
          // Ensure the property belongs to the object itself, not its prototype chain.
          if (currentOptions.hasOwnProperty(key)) {
            // Avoid setting options that haven't actually changed to optimize performance.
            if (previousOptions && currentOptions[key as keyof Options] === previousOptions[key as keyof Options]) {
              continue;
            }
            // Use sortable.option() to update individual options.
            this.sortable.option(key as keyof Options, currentOptions[key as keyof Options]);
          }
        }
      }
    }
  }

  /**
   * Lifecycle hook that is called after Angular has initialized all of the directive's content.
   * This is the ideal place to initialize SortableJS based on the initial `isSortableEnabled` value.
   */
  ngAfterViewInit(): void {
    if (this.enabled) {
      this.initializeSortable();
    }
  }

  /**
   * Lifecycle hook that is called when the directive is destroyed.
   * Ensures that the SortableJS instance is properly destroyed to prevent memory leaks.
   */
  ngOnDestroy(): void {
    this.destroySortable();
  }

  /**
   * Initializes the SortableJS instance.
   * Runs outside Angular's zone to prevent unnecessary change detection cycles during drag operations.
   */
  private initializeSortable(): void {
    // Ensure SortableJS is not already initialized before creating a new instance.
    if (this.sortable) {
      this.destroySortable();
    }

    this.ngZone.runOutsideAngular(() => {
      this.sortable = new Sortable(this.el.nativeElement, {
        animation: 150, // Default animation duration.
        forceFallback: this.options.forceFallback ?? false, // Forces fallback for older browsers/specific cases.
        fallbackOnBody: true, // Ensures the fallback element is appended to the body for correct positioning.
        ...this.options, // Spread any additional options provided by the user.

        // Custom onStart handler to fix drag clone positioning and copy classes.
        onStart: (evt) => {
          // Call the user's onStart handler if provided in the options.
          if (this.options.onStart) {
            this.options.onStart(evt);
          }

          // Use requestAnimationFrame for visual updates to ensure smooth rendering.
          requestAnimationFrame(() => {
            const dragClone = document.querySelector('.sortable-drag') as HTMLElement;
            const original = evt.item as HTMLElement;

            if (dragClone && original) {
              // Copy the 'selected' class from the original item to the drag clone.
              if (original.classList.contains('selected')) {
                dragClone.classList.add('selected');
              }

              // Get the bounding rectangle of the original element BEFORE Sortable applies its transforms.
              const rect = original.getBoundingClientRect();

              // Fix the position of the dragged item to avoid initial "jump".
              dragClone.style.position = 'fixed';
              dragClone.style.top = `${rect.top}px`;
              dragClone.style.left = `${rect.left}px`;
              dragClone.style.width = `${rect.width}px`;
              dragClone.style.height = `${rect.height}px`;
              dragClone.style.margin = '0'; // Remove any margin that might cause offset.
              dragClone.style.zIndex = '1000'; // Ensure the clone is on top.
              dragClone.style.pointerEvents = 'none'; // Prevent interaction with the clone itself.
              dragClone.style.transform = 'none'; // Clear any default Sortable transforms that might cause jumps.
            }
          });
        },

        // Callback function triggered when the order of items is updated.
        onUpdate: (event: Sortable.SortableEvent) => {
          // Run inside Angular's zone to ensure change detection is triggered
          // after modifying the data array.
          this.ngZone.run(() => {
            // Safely get old and new indices (Sortable.js guarantees their presence in onUpdate).
            const oldIndex = event.oldIndex!;
            const newIndex = event.newIndex!;

            // Manipulate the original data array to reflect the new order.
            // Remove the item from its old position.
            const movedItem = this.data.splice(oldIndex, 1)[0];
            // Insert the item into its new position.
            this.data.splice(newIndex, 0, movedItem);

            // Emit the sortUpdate event with details of the movement.
            this.sortUpdate.emit({ oldIndex, newIndex, item: movedItem });
          });
        },
      });
    });
  }

  /**
   * Destroys the SortableJS instance if it exists.
   */
  private destroySortable(): void {
    if (this.sortable) {
      this.sortable.destroy(); // Destroy the SortableJS instance.
      this.sortable = null; // Clear the reference.
    }
  }
}
