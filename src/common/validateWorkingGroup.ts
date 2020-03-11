import { Types } from '../identifiers';

export default function validateWorkingGroup(sourceObj: any): any {
    let hasError = false;
    Object.keys(sourceObj).forEach(key => {
        if (typeof sourceObj[key] !== 'string') {
            hasError = true;
        }
    });
    return hasError ? {
        status: false,
        message: 'Working Group data should be in proper form'
    } : {
            status: true,
            message: Types.ResponseMessages.SUCCESS
        }
}