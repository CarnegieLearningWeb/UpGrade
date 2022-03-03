import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ScrollDirective } from './scroll.directive';

@Component({
    template: `<div scroll></div>`
})
class TestComponent {}

describe('Directive: scroll', () => {
    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;
    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [ScrollDirective, TestComponent]
        });
        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
    });

    it('should create component', () => {
        expect(component).toBeDefined();
    });
});
