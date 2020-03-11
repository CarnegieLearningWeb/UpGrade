import { Types } from './identifiers';
export default function getAllExperimentConditions(): Promise<{
    status: boolean;
    message: Types.ResponseMessages;
}>;
