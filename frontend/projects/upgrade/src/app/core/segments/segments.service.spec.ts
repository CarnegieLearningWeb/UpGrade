import { BehaviorSubject } from "rxjs/internal/BehaviorSubject";
import { SegmentsService } from './segments.service';
import * as SegmentSelectors from './store/segments.selectors';
import * as SegmentsActions from './store/segments.actions';
import { Segment, UpsertSegmentType } from "./store/segments.model";
import { fakeAsync, tick } from "@angular/core/testing";
import { isEmpty } from "rxjs/operators";

const MockStateStore$ = new BehaviorSubject({});
(MockStateStore$ as any).dispatch = jest.fn();

describe('SegmentService', () => {
    let mockStore: any;
    let service: SegmentsService;
    
    beforeEach(() => {
        mockStore = MockStateStore$;
        service = new SegmentsService(mockStore);
    })

})