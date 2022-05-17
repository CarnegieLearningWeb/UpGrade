import { fakeAsync, tick } from "@angular/core/testing";
import { NotificationType } from "angular2-notifications";
import { of, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { HttpErrorInterceptor } from "./http-error.interceptor";

class MockAuthService {

}

class MockNotificationService {
    create = jest.fn()
}

describe('HttpErrorInterceptor', () => {
    let mockAuthService: any = new MockAuthService();
    let mockNotificationService: any = new MockNotificationService();
    let env = { ...environment };
    let mockTemp = {
        type: NotificationType.Error,
        title: 'Network call failed.',
        content: 'test.html',
        animate: 'fromRight'
    }

    let service = new HttpErrorInterceptor(mockAuthService, mockNotificationService)

    describe('#openPopup', () => {
        it('should call notification service with an error of "Network call failed. See console for details." when not in production and not 401', () => {
            const mockError = { status: 400, url: 'test.html' } as any;
            const expectedValue = { ...mockTemp };
            expectedValue.title = 'Network call failed. See console for details.';
            env.production = false;
    
            service.openPopup(mockError);
    
            expect(mockNotificationService.create)
               .toHaveBeenCalledWith(expectedValue.title, expectedValue.content, expectedValue.type, expectedValue);
        })
    
        it('should not call notification service with an error when not in production and is 401', () => {
            const mockError = { status: 401, url: 'test.html' } as any;
            const expectedValue = { ...mockTemp };
            expectedValue.title = 'Network call failed. See console for details.';
            env.production = false;
    
            service.openPopup(mockError);
    
            expect(mockNotificationService.create)
               .toHaveBeenCalledWith(expectedValue.title, expectedValue.content, expectedValue.type, expectedValue);
        })
    
        it('should not call when in production mode and 401', () => {
            const mockError = { status: 401, url: 'test.html' } as any;
            const expectedValue = { ...mockTemp };
            expectedValue.title =  'Network call failed. See console for details.';
            env.production = true;
    
            service.openPopup(mockError);
    
            expect(mockNotificationService.create)
               .toHaveBeenCalledWith(expectedValue.title, expectedValue.content, expectedValue.type, expectedValue);
        })
    })

    describe('#intercept', () => {
        it('should logout if a 401 error is caught and open popup', fakeAsync(() => {
            const mockError = {
                status: 401
            }
            const mockRequest: any = {};
            const mockNextHandler = {
                handle: jest.fn().mockReturnValue(throwError(mockError))
            }
            mockAuthService.authLogout = jest.fn();
            service.openPopup = jest.fn();

            service.intercept(mockRequest, mockNextHandler).subscribe()

            tick(0);

            expect(service.openPopup).toHaveBeenCalledWith(mockError)
            expect(mockAuthService.authLogout).toHaveBeenCalled();
        }))

        it('should NOT logout if error is not 401, and open popup', fakeAsync(() => {
            const mockError = {
                status: 400
            }
            const mockRequest: any = {};
            const mockNextHandler = {
                handle: jest.fn().mockReturnValue(throwError(mockError))
            }
            mockAuthService.authLogout = jest.fn();
            service.openPopup = jest.fn();

            service.intercept(mockRequest, mockNextHandler).subscribe()

            tick(0);

            expect(service.openPopup).toHaveBeenCalledWith(mockError)
            expect(mockAuthService.authLogout).not.toHaveBeenCalled();
        }))

        it('should NOT logout or open popup if no error', fakeAsync(() => {
            const mockError = {
                status: 400
            }
            const mockRequest: any = {};
            const mockNextHandler = {
                handle: jest.fn().mockReturnValue(of(null))
            }
            mockAuthService.authLogout = jest.fn();
            service.openPopup = jest.fn();

            service.intercept(mockRequest, mockNextHandler).subscribe()

            tick(0);

            expect(service.openPopup).not.toHaveBeenCalled()
            expect(mockAuthService.authLogout).not.toHaveBeenCalled();
        }))
    })
})