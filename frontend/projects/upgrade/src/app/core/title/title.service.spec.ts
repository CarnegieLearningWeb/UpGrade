import { fakeAsync, tick } from "@angular/core/testing";
import { Title } from "@angular/platform-browser";
import { ActivatedRouteSnapshot } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { of } from "rxjs/internal/observable/of";
import { environment } from "../../../environments/environment";
import { TitleService } from "./title.service";

class MockTranslateService {
    get = () => {};
}

class MockTitle {
    setTitle = jest.fn()
}

describe('TitleService', () => {
    let mockTranslateService: any;
    let mockTitle: any;
    let service: TitleService;

    beforeEach(() => {
       mockTranslateService = new MockTranslateService();
       mockTitle = new MockTitle();
       service = new TitleService(mockTranslateService, mockTitle);
    })

    describe('#setTitle', () => {
        const testCases = [
            {
                whenCondition: 'snapshot is valid and title does NOT match the translated title',
                expectedValue: environment.appName + ' - bambino',
                mockTranslatedTitle: 'bambino',
                snapshot: {
                    children: [
                        {
                            children: [],
                            data: { title: 'child' },
                        }
                    ],
                    data: { title: 'root' }
                }
            },
            {
                whenCondition: 'snapshot has no title data',
                expectedValue: environment.appName,
                mockTranslatedTitle: null,
                snapshot: {
                    children: [
                        {
                            children: [],
                            data: { title: undefined },
                        }
                    ],
                    data: { title: 'root' }
                }
            },
            {
                whenCondition: 'title will not get set if translated title matches title data',
                expectedValue: environment.appName,
                mockTranslatedTitle: 'child',
                snapshot: {
                    children: [
                        {
                            children: [],
                            data: { title: 'child' },
                        }
                    ],
                    data: { title: 'root' }
                }
            }
        ];

        testCases.forEach(({
            whenCondition,
            expectedValue,
            mockTranslatedTitle,
            snapshot
        }) => {

            it(`WHEN ${whenCondition}, THEN the expected value is ${expectedValue}`, fakeAsync(() => {
                mockTranslateService.get = jest.fn().mockReturnValue(of(mockTranslatedTitle));

                service.setTitle((snapshot as any));

                tick(0);

                if (mockTranslatedTitle === 'child') {
                    expect(mockTitle.setTitle).not.toHaveBeenCalled();
                } else {
                    expect(mockTitle.setTitle).toHaveBeenCalledWith(expectedValue);
                }
            }))
        })
    })
})