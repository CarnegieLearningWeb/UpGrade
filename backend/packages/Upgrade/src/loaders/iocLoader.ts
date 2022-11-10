import { useContainer as classValidatorUseContainer } from 'class-validator';
import { MicroframeworkLoader } from 'microframework';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { useContainer as ormUseContainer } from 'typeorm';

export const iocLoader: MicroframeworkLoader = () => {
  /**
   * Setup routing-controllers to use typedi container.
   */
  routingUseContainer(Container);
  ormUseContainer(Container);
  classValidatorUseContainer(Container);
};
