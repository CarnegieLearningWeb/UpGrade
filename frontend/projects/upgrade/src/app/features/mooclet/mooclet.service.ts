import { Injectable } from '@angular/core';
import { MOOCLET_SUPPORTED_ASSIGNMENT_ALGORITHMS } from './mooclet.constants';
import { ASSIGNMENT_ALGORITHM } from '../../../../../../../types/src';

@Injectable({
  providedIn: 'root',
})
export class MoocletService {
  getMoocletSupportAssignmentAlgorithms(): ASSIGNMENT_ALGORITHM[] {
    return MOOCLET_SUPPORTED_ASSIGNMENT_ALGORITHMS;
  }
}
