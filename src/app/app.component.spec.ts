import { describe, expect, it } from 'vitest';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  it('exposes the application title', () => {
    const component = new AppComponent();

    expect(component.title).toBe('fintrack');
  });
});
