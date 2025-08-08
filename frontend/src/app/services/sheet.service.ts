import { ApplicationRef, ComponentRef, Injectable, Type, createComponent, EnvironmentInjector, Renderer2, RendererFactory2 } from "@angular/core";
import { SheetConfig, SheetDirective } from "../directives/sheet/sheet.directive";

@Injectable({ providedIn: 'root' })
export class SheetService {
  private componentRef?: ComponentRef<any>;
  private directive?: SheetDirective;
  private modalContainer?: HTMLElement;
  private modalBackdrop?: HTMLElement;
  private renderer: Renderer2;

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector,
    private rendererFactory: RendererFactory2
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
  }

  async open<T>(
    component: Type<T>,
    config: SheetConfig,
    componentInputs: Partial<T> = {}
  ): Promise<ComponentRef<T>> {
    // 1. Cleanup existing sheet
    if (this.componentRef) {
      await this.close();
    }

    // 2. Create modal structure
    this.createModalStructure(config);

    // 3. Create the component inside modal-container
    this.componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
      hostElement: this.modalContainer
    });

    // Apply component inputs
    Object.assign(this.componentRef.instance, componentInputs);

    // 4. Create and manually instantiate the SheetDirective
    const elementRef = { nativeElement: this.componentRef.location.nativeElement };

    // Manually create directive instance
    this.directive = new SheetDirective(
      elementRef as any,
      this.renderer,
      document
    );

    // Set directive inputs
    this.directive.appSheet = config;

    // Initialize the directive manually
    this.directive.ngOnInit();

    // 5. Attach component to app
    this.appRef.attachView(this.componentRef.hostView);

    // 6. Wait for initialization and present
    await new Promise<void>(resolve => {
      setTimeout(() => resolve(), 50); // Allow Angular to process
    });

    if (this.directive) {
      await this.directive.present();
    } else {
      console.error('SheetDirective instance not found after initialization.');
    }

    return this.componentRef as ComponentRef<T>;
  }

  async close(): Promise<void> {
    if (!this.directive) return;

    // Dismiss the sheet and wait for the animation to finish
    await this.directive.dismiss();

    // Clean up directive
    if (this.directive) {
      this.directive.ngOnDestroy();
      this.directive = undefined;
    }

    // Clean up component
    if (this.componentRef) {
      this.appRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = undefined;
    }

    // Clean up DOM elements
    this.cleanupModalStructure();
  }

  private createModalStructure(config?: SheetConfig): void {
    // Create modal-backdrop
    this.modalBackdrop = document.createElement('div');
    this.modalBackdrop.className = 'modal-backdrop';

    // Create modal-container
    this.modalContainer = document.createElement('div');
    this.modalContainer.className = 'modal-container';

    // Apply width/height/max constraints
    if (config) {
      if (config.width) this.modalContainer.style.width = config.width;
      if (config.height) this.modalContainer.style.height = config.height;
      if (config.maxWidth) this.modalContainer.style.maxWidth = config.maxWidth;
      if (config.maxHeight) this.modalContainer.style.maxHeight = config.maxHeight;
    }

    // Append both as siblings to ion-app
    const ionApp = document.querySelector('ion-app');
    if (ionApp) {
      ionApp.appendChild(this.modalBackdrop);
      ionApp.appendChild(this.modalContainer);
    }
  }

  private cleanupModalStructure(): void {
    this.modalBackdrop?.remove();
    this.modalContainer?.remove();
    this.modalBackdrop = undefined;
    this.modalContainer = undefined;
  }

  // Optional: Method to get direct access to the directive if needed
  getDirectiveInstance(): SheetDirective | undefined {
    return this.directive;
  }
}
