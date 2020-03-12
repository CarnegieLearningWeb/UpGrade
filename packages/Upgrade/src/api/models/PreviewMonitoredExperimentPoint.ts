import { Entity } from 'typeorm';
import { BaseMonitoredExperimentPoint } from './base/BaseMonitoredExperimentPoint';

@Entity()
export class PreviewMonitoredExperimentPoint extends BaseMonitoredExperimentPoint {}
