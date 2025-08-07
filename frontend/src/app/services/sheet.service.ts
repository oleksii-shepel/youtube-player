import { ApplicationRef, ComponentRef, Injectable, Injector, Type, createComponent, EnvironmentInjector } from "@angular/core";
import { SheetConfig, SheetDirective } from "../directives/sheet/sheet.directive";

// This interface now only describes the required properties for the service to function.
export interface SheetComponentWithDirective {
  sheetDirectiveInstance: SheetDirective;
}

@Injectable({ providedIn: 'root' })
export class SheetService {
  private componentRef?: ComponentRef<any>;
  private hostElement?: HTMLElement;

  constructor(
    private appRef: ApplicationRef,
    private environmentInjector: EnvironmentInjector
  ) {}

  async open<T>(
    component: Type<T & SheetComponentWithDirective>, // The component must expose the directive
    config: SheetConfig,
    componentInputs: Partial<T> = {}
  ): Promise<ComponentRef<T>> {
    // 1. Cleanup existing sheet
    if (this.componentRef) {
      await this.close();
    }

    // 2. Create host element
    this.hostElement = document.createElement('div');
    document.querySelector('ion-app')?.appendChild(this.hostElement);

    // 3. Create the component
    this.componentRef = createComponent(component, {
      environmentInjector: this.environmentInjector,
      hostElement: this.hostElement
    });
    Object.assign(this.componentRef.instance, componentInputs);
    this.componentRef.setInput('appSheet', config);

    // 4. Attach to app
    this.appRef.attachView(this.componentRef.hostView);

    // Wait for the directive to be ready and present the sheet
    // The component's @ViewChild setter should populate the sheetDirectiveInstance
    await new Promise<void>(resolve => {
        // We'll need a different way to await the directive, as the component has no ready output.
        // For a simple fix, a small delay can work, but it's not ideal.
        // A better approach is to use a Subject on the component to signal readiness.
        setTimeout(() => resolve(), 50); // Small delay to allow Angular to process the view
    });

    if (this.componentRef.instance.sheetDirectiveInstance) {
        await this.componentRef.instance.sheetDirectiveInstance.present();
    } else {
        console.error('SheetDirective instance not found on component after initialization.');
    }

    return this.componentRef as ComponentRef<T>;
  }

  async close(): Promise<void> {
    if (!this.componentRef) return;

    // Dismiss the sheet and wait for the animation to finish
    await this.componentRef.instance.sheetDirectiveInstance.dismiss();

    // Clean up
    this.appRef.detachView(this.componentRef.hostView);
    this.componentRef.destroy();
    this.hostElement?.remove();
    this.componentRef = undefined;
    this.hostElement = undefined;
  }
}
