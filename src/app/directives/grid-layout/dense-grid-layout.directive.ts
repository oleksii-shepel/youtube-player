import { AfterContentInit, ChangeDetectorRef, Directive, ElementRef, NgZone, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { Subject } from 'rxjs';

@Directive({
  selector: '[appDenseLayout]',
  standalone: true,
  exportAs: 'gridLayout'
})
export class DenseGridLayoutDirective implements AfterContentInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private baseCellWidth: number = 0;
  private baseRowHeight: number = 0;
  private totalColumns: number = 0;
  private totalRows: number = 0;
  private itemsMap: Map<string, { area: string; colSpan: number; rowSpan: number; startCol: number; startRow: number }> = new Map();
  private windowResizeCallback = this.onWindowResize.bind(this);
  private mutationObserver: MutationObserver;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef
  ) {}
  
  ngAfterContentInit(): void {
    this.initMutationObserver();
  }
  
  ngOnDestroy() {
    window.removeEventListener('resize', this.windowResizeCallback);
    
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Initialize MutationObserver to watch for DOM changes
  initMutationObserver() {
    const config = { childList: true, subtree: true }; // Watch for child elements being added or removed
    this.mutationObserver = new MutationObserver((mutationsList) => {
      window.removeEventListener('resize', this.windowResizeCallback);
      window.addEventListener('resize', this.windowResizeCallback);
      
      this.initializeLayout();
      this.analyzeGridLayout();
    });
    
    // Observe the container where typeahead results are inserted
    if (this.el && this.el.nativeElement) {
      this.mutationObserver.observe(this.el.nativeElement, config);
    }
  }

  private initializeLayout() {
    this.extractGridStyles();
  }

  private extractGridStyles() {
    const styles = getComputedStyle(this.el.nativeElement);
    const gridTemplateColumns = styles.getPropertyValue('grid-template-columns');
    const gridTemplateRows = styles.getPropertyValue('grid-template-rows');
    
    const gridAutoColumns = styles.getPropertyValue('grid-auto-columns');
    const gridAutoRows = styles.getPropertyValue('grid-auto-rows');
  
    // Extract the first column width as baseCellWidth
    this.baseCellWidth = this.parseGridDimension(gridTemplateColumns, gridAutoColumns);
  
    // Extract the first row height as baseRowHeight
    this.baseRowHeight = this.parseGridDimension(gridTemplateRows, gridAutoRows);
  
    console.log(`Extracted grid styles - baseCellWidth: ${this.baseCellWidth}, baseRowHeight: ${this.baseRowHeight}`);
  }
  
  private parseGridDimension(gridTemplate: string, gridAuto: string): number {
    // First try to get the dimension from gridTemplate
    const match = gridTemplate.match(/^(\d+(?:\.\d+)?)(px|rem|em|%)/);
    if (match) {
      return this.convertDimension(match);
    }
    
    // If no valid dimension found, fall back to gridAuto
    const autoMatch = gridAuto.match(/^(\d+(?:\.\d+)?)(px|rem|em|%)/);
    if (autoMatch) {
      return this.convertDimension(autoMatch);
    }
  
    console.warn('Could not parse grid dimension, using default value of 100px');
    return 100; // Default to 100px if parsing fails
  }
  
  private convertDimension(match: RegExpMatchArray): number {
    const value = parseFloat(match[1]);
    const unit = match[2];
  
    if (unit === 'px') {
      return value;
    } else if (unit === 'rem' || unit === 'em') {
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      return value * rootFontSize;
    } else if (unit === '%') {
      // For percentage, we'll use a fraction of the container width
      const containerWidth = this.el.nativeElement.clientWidth;
      return (value / 100) * containerWidth;
    }
  
    return 100; // Default to 100px if parsing fails
  }  

  private onWindowResize() {
    this.extractGridStyles();
    this.analyzeGridLayout();
  }

  private analyzeGridLayout() {
    const container = this.el.nativeElement;
    const elements = container.children;
    const containerWidth = this.getContainerWidth(container);

    const columnGap = parseInt(window.getComputedStyle(container).columnGap) || 0;
    const rowGap = parseInt(window.getComputedStyle(container).rowGap) || 0;

    this.totalColumns = Math.ceil((containerWidth + columnGap) / (this.baseCellWidth + columnGap));
    
    let gridArray: string[][] = [Array(this.totalColumns).fill('.')];

    
    for (let i = 0; i < elements.length; i++) {
        this.adjustItemSize(elements[i], container);
        this.placeItemInGrid(elements[i], i, gridArray);
    }
    
    gridArray = this.fillEmptyCells(gridArray);
    this.applyGridTemplateAreas(container, gridArray);
    this.cdr.detectChanges();
  }

  private adjustItemSize(item: HTMLElement, container: HTMLElement) {
    const rowGap = parseInt(window.getComputedStyle(container).rowGap) || 0;
    const columnGap = parseInt(window.getComputedStyle(container).columnGap) || 0; // Gap between grid items
    
    const maxWidth = this.getContainerWidth(container);
    const maxElementWidth = maxWidth;

    let currentWidth = maxElementWidth;
    let currentHeight = -rowGap;
    let previousWidth = maxWidth;
    
    const children = item.children; // Get all child elements
    const originalSizes = []; // Array to store original sizes

    // Step 1: Store original sizes
    Array.from(children).forEach((child: HTMLElement) => {
        const originalWidth = child.offsetWidth;
        const originalHeight = child.offsetHeight;
        originalSizes.push({ width: originalWidth, height: originalHeight });

        // Step 2: Set child's width and height to max-content
        child.style.width = 'max-content';
        child.style.height = 'max-content';
    });

    // Find the optimal size
    while (item.scrollHeight > currentHeight) {
      currentHeight += this.baseRowHeight + rowGap;
      currentWidth = maxElementWidth;
      
      item.style.height = `${currentHeight}px`;
      item.style.width = `${currentWidth}px`;
      window.getComputedStyle(item); // Force reflow
      previousWidth = currentWidth;

      while (currentWidth > 0) {
        if(item.scrollHeight <= currentHeight) {
          previousWidth = currentWidth;
          currentWidth -= this.baseCellWidth + columnGap;
          item.style.width = `${currentWidth}px`;
          window.getComputedStyle(item); // Force reflow
        } else {
          break;
        }
      }
  
      if (item.scrollHeight > currentHeight) {
        currentWidth = previousWidth;
        item.style.width = `${currentWidth}px`;
        window.getComputedStyle(item); // Force reflow
      }
    }
  
    const columnSpan = Math.ceil((item.scrollWidth) / (this.baseCellWidth + columnGap));
    const rowSpan = Math.ceil((item.scrollHeight) / (this.baseRowHeight + rowGap));
  
    // Step 3: Measure new dimensions
    Array.from(children).forEach((child: HTMLElement, index) => {
        const width = child.offsetWidth;
        const height = child.offsetHeight;

        // Step 4: Restore original sizes
        child.style.width = `100%`;
        child.style.height = `100%`;
    });

    item.style.width = '';
    item.style.height = '';
  
    // Set grid-column and grid-row spans for the element
    item.style.gridColumn = `span ${columnSpan}`;
    item.style.gridRow = `span ${rowSpan}`;
  }

  private placeItemInGrid(item: HTMLElement, index: number, gridArray: string[][]) {
    let colSpan = parseInt(item.style.gridColumn.split('span ')[1]) || 1;
    const rowSpan = parseInt(item.style.gridRow.split('span ')[1]) || 1;

    let placed = false;
    
    if (colSpan > this.totalColumns) {
      colSpan = this.totalColumns; // Adjust to fit within available columns
    }

    while (!placed) {
        for (let row = 0; row <= gridArray.length - rowSpan; row++) {
            for (let col = 0; col <= this.totalColumns - colSpan; col++) {
                // Check if the item fits in this position
                let canPlace = true;

                for (let r = 0; r < rowSpan; r++) {
                    for (let c = 0; c < colSpan; c++) {
                        if (gridArray[row + r][col + c] !== '.') {
                            canPlace = false;
                            break;
                        }
                    }
                    if (!canPlace) break;
                }

                // If it fits, place it in the grid
                if (canPlace) {
                    for (let r = 0; r < rowSpan; r++) {
                        for (let c = 0; c < colSpan; c++) {
                            gridArray[row + r][col + c] = `area${index + 1}`;
                        }
                    }

                    // Set the item's grid area
                    item.style.gridArea = `area${index + 1}`;
                    placed = true;
                    break;
                }
            }
            if (placed) break;
        }
        // If we can't place the item, add more rows and try again
        if (!placed) {
            gridArray.push(Array(this.totalColumns).fill('.'));
        }
    }
  }

  private fillEmptyCells(gridArray: string[][]): string[][] {
    const result = Array.from(gridArray).map(items => [...items]);
    
    let index = 0; // Initialize currentRow index
    let freeColumnsAvailable = false;
    this.initItemsMap(gridArray);
    
    while (index < result.length) { // Iterate while currentRow is within bounds
      const items = new Set(result[index].filter(item => item !== '.')); // Get items for the current row
  
      // Calculate remaining empty cells in the current row
      let remainingColumns = result[index].filter(cell => cell === '.').length;

      // Convert the map to an array of [item, count] pairs
      let uniqueItemAreas = Array.from(items);

      // Sort unique items by their counts (ascending)
      uniqueItemAreas.sort((a, b) => this.itemsMap.get(a).colSpan - this.itemsMap.get(b).colSpan);
      
      let offset = 0;  
      while(offset < uniqueItemAreas.length && remainingColumns > 0) {
        let changedThisIteration = false;
        const area = uniqueItemAreas[offset];
        const item = {...this.itemsMap.get(area)};
        let directions = ['left', 'right'];
        let updatedItem = undefined;
        for (const side of directions) {
          if (this.canExpandInDirection(area, result, side as any)) {
              updatedItem = this.expandArea(area, result, side as any);
              if(side === "left" || side === "right") {
                remainingColumns--;
                changedThisIteration = true;
                break;
              }
          } else if(side === "left" || side === "right") {
            if(this.recursivelyShiftItem(area, result, side as any)) {
              updatedItem = this.expandArea(area, result, (side === "right" ? "left": "right") as any);
              if(side === "left" || side === "right") {
                remainingColumns--;
                changedThisIteration = true;
                break;
              }
            }
          }
        }

        if (changedThisIteration) {
          updatedItem && this.itemsMap.set(updatedItem.area, updatedItem);
          uniqueItemAreas.sort((a, b) => this.itemsMap.get(a).colSpan - this.itemsMap.get(b).colSpan);
          offset = 0;
        } else {
          offset++;
        }
      }
      
      if (remainingColumns > 0) {
        freeColumnsAvailable = true
      }

      index++;
    }

    if (freeColumnsAvailable) {
      // Final step: Check for remaining empty cells and expand items up or down
      for (let row = 0; row < result.length; row++) {
          for (let col = 0; col < result[row].length; col++) {
              if (result[row][col] === '.') {
                  // Check for a valid row above and below the current empty cell
                  const aboveItem = row > 0 ? result[row - 1][col] : null;
                  const belowItem = row < result.length - 1 ? result[row + 1][col] : null;
  
                  // Try to expand the item above the empty cell, if it exists
                  if (aboveItem && aboveItem !== '.') {
                      let itemToExpand = this.itemsMap.get(aboveItem);
                      while (itemToExpand && this.canExpandInDirection(itemToExpand.area, result, 'down')) {
                        itemToExpand = this.expandArea(itemToExpand.area, result, 'down');
                        this.itemsMap.set(itemToExpand.area, itemToExpand);
                      }
                  }
                  // Try to expand the item below the empty cell, if it exists and wasn't filled already
                  if (result[row][col] === '.' && belowItem && belowItem !== '.' && result[row][col] === '.') {
                      let itemToExpand = this.itemsMap.get(belowItem);
                      while (itemToExpand && this.canExpandInDirection(itemToExpand.area, result, 'up')) {
                        itemToExpand = this.expandArea(itemToExpand.area, result, 'up');
                        this.itemsMap.set(itemToExpand.area, itemToExpand);
                      }
                  }
              }
          }
      }
    }  
    
    return result;
  }

  private initItemsMap(
    gridArray: string[][],
  ) {
    this.itemsMap.clear();
    // Ensure startRow and rowSpan are within bounds
    const startRow = 0;
    const endRow = gridArray.length;
  
    // Recreate items in the map from the gridArray for the specified rows
    for (let i = startRow; i < endRow; i++) {
      if (gridArray[i]) {
        gridArray[i].forEach((item, colIndex) => {
          if (item !== '.') {
            const existingItem = this.itemsMap.get(item);
  
            if (existingItem) {
              // Update colSpan if the item is in the same row
              if (existingItem.startRow === i) {
                existingItem.colSpan++;
              } 
              
              if  (existingItem.startCol === colIndex) {
                // Update rowSpan if the item is in a new row
                existingItem.rowSpan++;
              }
            } else {
              // Initialize new item data if it doesn't already exist
              this.itemsMap.set(item, {
                area: item,
                colSpan: 1,
                rowSpan: 1,
                startCol: colIndex,
                startRow: i
              });
            }
          }
        });
      }
    }
  }
    
  private canExpandInDirection(itemArea: string, gridArray: string[][], direction: 'left' | 'right' | 'up' | 'down'): boolean {
    const { area, colSpan, rowSpan, startCol, startRow } = {...this.itemsMap.get(itemArea)};
    const currentColumnCount = gridArray[0].length;

    // Initialize target variables
    let targetStartCol = startCol;
    let targetStartRow = startRow;
    let targetColSpan = colSpan;
    let targetRowSpan = rowSpan;

    // Determine the target column and row based on the direction
    if (direction === 'left') {
        targetStartCol--;        // Move start column to the left
        targetColSpan++;         // Expand column span
    } else if (direction === 'right') {
        targetColSpan++;         // Expand column span
    } else if (direction === 'up') {
        targetStartRow--;        // Move start row up
        targetRowSpan++;         // Expand row span
    } else if (direction === 'down') {
        targetRowSpan++;         // Expand row span
    }

    // Check for out of bounds
    if (
        targetStartCol < 0 || 
        targetStartCol + targetColSpan > currentColumnCount || 
        targetStartRow < 0 || 
        targetStartRow + targetRowSpan > gridArray.length
    ) {
        return false; // Out of bounds
    }

    // Check if the expanded area is valid in the gridArray
    for (let rowOffset = 0; rowOffset < targetRowSpan; rowOffset++) {
        const rowIndex = targetStartRow + rowOffset; // Calculate the new row index
        if (rowIndex < 0 || rowIndex >= gridArray.length) break; // Prevent accessing out of bounds

        for (let colOffset = 0; colOffset < targetColSpan; colOffset++) {
            const targetColIndex = targetStartCol + colOffset;

            // Check if the target position is either empty or occupied by the same area
            const currentCell = gridArray[rowIndex][targetColIndex];
            if (currentCell !== '.' && currentCell !== area) {
                return false; // Cannot expand into an occupied cell that is not the same area
            }
        }
    }

    // If all checks are passed, expansion is possible
    return true;
  }

  private expandArea(itemArea: string, gridArray: string[][], direction: 'left' | 'right' | 'up' | 'down'): any {
    const { area, colSpan, rowSpan, startCol, startRow } = {...this.itemsMap.get(itemArea)};
    const totalRows = gridArray.length;
    const totalCols = gridArray[0]?.length || 0;

    // Variables to hold the target starting position and size
    let targetStartCol = startCol;
    let targetStartRow = startRow;
    let targetColSpan = colSpan;
    let targetRowSpan = rowSpan;

    // Determine the target position and size based on the direction
    if (direction === 'right') {
        targetColSpan += 1; // Increase the column span
    } else if (direction === 'left') {
        targetStartCol -= 1; // Move the starting column to the left
        targetColSpan += 1; // Increase the column span
    } else if (direction === 'down') {
        targetRowSpan += 1; // Increase the row span
    } else if (direction === 'up') {
        targetStartRow -= 1; // Move the starting row up
        targetRowSpan += 1; // Increase the row span
    }

    // Expand the area in the gridArray
    for (let rowOffset = 0; rowOffset < targetRowSpan; rowOffset++) {
        const currentRow = targetStartRow + rowOffset;
        if (currentRow < 0 || currentRow >= totalRows) break; // Prevent accessing out of bounds

        for (let colOffset = 0; colOffset < targetColSpan; colOffset++) {
            const currentCol = targetStartCol + colOffset;
            if (currentCol < 0 || currentCol >= totalCols) break; // Prevent accessing out of bounds

            gridArray[currentRow][currentCol] = area; // Expand the area
        }
    }

    // Return the updated item with changed fields
    return {
        area,
        colSpan: targetColSpan,
        rowSpan: targetRowSpan,
        startCol: targetStartCol,
        startRow: targetStartRow,
    };
  }

  private recursivelyShiftItem(
    itemArea: string,
    gridArray: string[][],
    direction: 'left' | 'right'
): boolean {
    const item = {...this.itemsMap.get(itemArea)};
    const shiftAmount = direction === 'right' ? 1 : -1;
    const newStartCol = item.startCol + shiftAmount;
    const newStartRow = item.startRow;

    // Ensure the new position is within the grid boundaries
    if (newStartCol < 0 || newStartCol + item.colSpan > gridArray[0].length) {
        return false; // Cannot move beyond the boundaries
    }

    // Loop over each row the item occupies to check conflicts
    for (let row = item.startRow; row < item.startRow + item.rowSpan; row++) {
        if (row >= gridArray.length) continue; // Ensure row is within bounds

        const currentRow = gridArray[row];
        const newEndCol = newStartCol + item.colSpan;

        // Check if there is a conflict with another item (ignoring dots)
        const conflictingItem = this.findConflictingItem(item, gridArray, newStartCol, newEndCol);

        if (conflictingItem) {
            // If there is a conflicting item, try to shift that item recursively
            const canShiftConflicting = this.recursivelyShiftItem(conflictingItem.area, gridArray, direction);
            if (!canShiftConflicting) {
                return false; // Conflict cannot be resolved, abort the shift
            }
        }
    }

    // Use updateItemPosition to reflect the change across all rows
    this.updateItemPosition(item, gridArray, newStartCol, newStartRow);
    this.itemsMap.set(item.area, {...item, startCol: newStartCol, startRow: newStartRow});
    
    return true; // Successfully shifted the item and its blocking items
  }
  
  private findConflictingItem(
    item: { area: string; colSpan: number; rowSpan: number; startCol: number; startRow: number },
    gridArray: string[][],
    newStartCol: number,
    newEndCol: number
  ): { area: string; colSpan: number; rowSpan: number; startCol: number; startRow: number } | undefined {
    // Loop through the rows the item occupies
    for (let row = item.startRow; row < item.startRow + item.rowSpan; row++) {
        // Access the current row from gridArray
        const currentRow = gridArray[row];

        // Check the range of columns where the item would be
        for (let col = newStartCol; col <= newEndCol; col++) {
            const areaAtPosition = currentRow[col];

            // If there's an item and it's not a dot or the moving item itself
            if (areaAtPosition && areaAtPosition !== '.' && areaAtPosition !== item.area) {
                // Initialize conflicting item attributes
                const conflictingItem: {
                    area: string;
                    colSpan: number;
                    rowSpan: number;
                    startCol: number;
                    startRow: number;
                } = {
                    area: areaAtPosition,
                    colSpan: 1,
                    rowSpan: 1,
                    startCol: col,
                    startRow: row,
                };

                // Calculate colSpan by checking consecutive columns in the same row
                while (col + conflictingItem.colSpan < currentRow.length && currentRow[col + conflictingItem.colSpan] === areaAtPosition) {
                    conflictingItem.colSpan++;
                }

                // Calculate rowSpan by checking consecutive rows in the same column
                let tempRow = row;
                while (tempRow + conflictingItem.rowSpan < gridArray.length && gridArray[tempRow + conflictingItem.rowSpan][col] === areaAtPosition) {
                    conflictingItem.rowSpan++;
                }

                // Ensure the startRow and startCol are the first occurrences of the area
                // Adjust startCol if needed to ensure it reflects the first occurrence in this row
                while (conflictingItem.startCol > 0 && currentRow[conflictingItem.startCol - 1] === areaAtPosition) {
                    conflictingItem.startCol--;
                }
                // Adjust startRow if needed to ensure it reflects the first occurrence in this column
                while (conflictingItem.startRow > 0 && gridArray[conflictingItem.startRow - 1][col] === areaAtPosition) {
                    conflictingItem.startRow--;
                }

                return conflictingItem; // Return the fully filled object for the conflicting item
            }
        }
    }
    return undefined; // No conflict found
  }
  
  private updateItemPosition(
    item: { area: string; colSpan: number; rowSpan: number; startCol: number; startRow: number },
    gridArray: string[][],
    startCol: number,
    startRow: number
  ) {
    // Clear the item's old position
    for (let row = item.startRow; row < item.startRow + item.rowSpan; row++) {
        if (row >= gridArray.length) continue; // Ensure row is within bounds

        const currentRow = gridArray[row];

        // Clear the old position
        for (let col = item.startCol; col < item.startCol + item.colSpan; col++) {
            if (col < currentRow.length) {
                currentRow[col] = '.'; // Use '.' to represent empty space
            }
        }
    }

    // Place the item in its new position
    for (let row = startRow; row < item.startRow + item.rowSpan; row++) {
        if (row >= gridArray.length) continue; // Ensure row is within bounds

        const currentRow = gridArray[row];
        for (let col = startCol; col < startCol + item.colSpan; col++) {
            if (col < currentRow.length) {
                currentRow[col] = item.area; // Place the item in the new position
            }
        }
    }
  }
  
  private applyGridTemplateAreas(container: HTMLElement, gridArray: string[][]) {
    const gridTemplateAreas = gridArray.map(row => `"${row.join(' ')}"`).join('\n');
    this.renderer.setStyle(container, 'gridTemplateAreas', gridTemplateAreas);
  }

  private getContainerWidth(container: HTMLElement) {
    this.renderer.setStyle(container, "display", "none");
    
    const parent = container.parentElement;
    const containerStyle = window.getComputedStyle(container);
    const hasVerticalScrollbar = parent.scrollHeight > parent.clientHeight;
    let scrollbarWidth = 0;
    if (hasVerticalScrollbar) {
      scrollbarWidth = parent.offsetWidth - parent.clientWidth;
    }
    
    const paddingLeft = parseFloat(containerStyle.paddingLeft);
    const paddingRight = parseFloat(containerStyle.paddingRight);
  
    const width = parent.clientWidth - paddingLeft - paddingRight - scrollbarWidth;
  
    this.renderer.setStyle(container, "display", "grid");
    
    return width;
  }
  
  private getContainerHeight(container: HTMLElement): number {
    this.renderer.setStyle(container, "display", "none");
    
    const parent = container.parentElement;
    const containerStyle = window.getComputedStyle(container);
    const hasHorizontalScrollbar = parent.scrollWidth > parent.clientWidth;
    let scrollbarHeight = 0;
    if (hasHorizontalScrollbar) {
      scrollbarHeight = parent.offsetHeight - parent.clientHeight;
    }
    
    const paddingTop = parseFloat(containerStyle.paddingTop);
    const paddingBottom = parseFloat(containerStyle.paddingBottom);
  
    const height = parent.clientWidth - paddingTop - paddingBottom - scrollbarHeight;
  
    this.renderer.setStyle(container, "display", "grid");
    
    return height;
  }

  calculateSpan(item: HTMLElement): { colSpan: number; rowSpan: number } {
    const container = this.el.nativeElement;
    const currentGridTemplateAreas = getComputedStyle(container).getPropertyValue('grid-template-areas').trim();
    const gridRows = currentGridTemplateAreas
        .split('"')
        .filter(row => row.trim().length > 0)
        .map(row => row.trim().split(' '));

    const gridArea = getComputedStyle(item).gridArea;

    // Find the position of the item in the grid
    let startRow: number | undefined;
    let startCol: number | undefined;

    for (let r = 0; r < gridRows.length; r++) {
        const row = gridRows[r];
        const colIndex = row.indexOf(gridArea);
        if (colIndex !== -1) {
            startRow = r;
            startCol = colIndex;
            break;
        }
    }

    if (startRow === undefined || startCol === undefined) {
        return { colSpan: 1, rowSpan: 1 }; // Not found, default span
    }

    // Calculate colSpan
    let colSpan = 0;
    for (let c = startCol; c < gridRows[startRow].length; c++) {
        if (gridRows[startRow][c] === gridArea) {
            colSpan++;
        } else {
            break; // Stop if we hit a different area
        }
    }

    // Calculate rowSpan
    let rowSpan = 0;
    for (let r = startRow; r < gridRows.length; r++) {
        if (gridRows[r][startCol] === gridArea) {
            rowSpan++;
        } else {
            break; // Stop if we hit a different area
        }
    }

    return { colSpan, rowSpan };
  }

  expandElement(item: HTMLElement, expand: boolean, colSpan: number = 1, rowSpan: number = 1) {
    const container = this.el.nativeElement;
    const currentGridTemplateAreas = getComputedStyle(container).getPropertyValue('grid-template-areas').trim();
    const gridArea = getComputedStyle(item).gridArea;

    // Parse the current grid-template-areas into an array
    const gridRows = currentGridTemplateAreas
      .split('"')
      .filter(row => row.trim().length > 0)
      .map(row => row.trim().split(' '));

    // Get the area name based on the item's data attribute
    const expandedItemName = gridArea;

    // Find the rows where the item exists
    const itemRows = gridRows.reduce<number[]>((rows, row, rowIndex) => {
      if (row.includes(expandedItemName)) {
        rows.push(rowIndex);
      }
      return rows;
    }, []);

    // Handle expansion
    if (expand) {
        const lastRowIndex = Math.max(...itemRows);
        const lastRow = gridRows[lastRowIndex];

        // Create a new row for expansion
        const newRow = lastRow.map((area, colIndex) => {
            if (colIndex >= lastRow.indexOf(expandedItemName) && colIndex < lastRow.indexOf(expandedItemName) + colSpan) {
                return expandedItemName; // Keep the expanded item in place
            }
            return '.'; // Other positions remain empty
        });

        // Insert the new row after the last row where the item is found
        gridRows.splice(lastRowIndex + 1, 0, newRow);
    } else {
        const lastRowIndex = Math.max(...itemRows);

        const newRow = gridRows[lastRowIndex].map((area, colIndex) => (area === gridArea ? '.' : area));
        gridRows.splice(lastRowIndex, 1, newRow);

        if (gridRows[lastRowIndex] && gridRows[lastRowIndex].every(area => area === '.')) {
           gridRows.splice(lastRowIndex, 1);
        }
    }

    // Convert gridRows back to the grid-template-areas format
    const updatedGridTemplateAreas = gridRows.map(row => `"${row.join(' ')}"`).join(' ');

    // Apply the updated grid-template-areas to the container
    this.renderer.setStyle(container, 'gridTemplateAreas', updatedGridTemplateAreas);
  }
}
