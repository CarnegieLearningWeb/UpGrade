import { HttpClient } from "@angular/common/http";
import { of } from "rxjs/internal/observable/of";
import { environment } from "../../../environments/environment";
import { SegmentsDataService } from "./segments.data.service";
import { Segment, SegmentsPaginationParams } from "./store/segments.model";

class MockHTTPClient {
    get = jest.fn().mockReturnValue(of());
    post = jest.fn().mockReturnValue(of());
    delete = jest.fn().mockReturnValue(of());
    put = jest.fn().mockReturnValue(of());
}
