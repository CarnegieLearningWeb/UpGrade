import { Types } from '../identifiers';

export default function validateGroupMembership(sourceObj: any): any {
    let hasError = false;
    Object.keys(sourceObj).forEach(key => {
        if (!Array.isArray(sourceObj[key])) {
            hasError = true;
        }
    });
    return hasError ? {
        status: false,
        message: 'Group Membership data should be in proper form'
    } : {
            status: true,
            message: Types.ResponseMessages.SUCCESS
        }
}