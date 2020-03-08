import { useContainer as classValidatorUseContainer } from 'class-validator';
import { MicroframeworkLoader, MicroframeworkSettings } from 'microframework';
import { useContainer as routingUseContainer } from 'routing-controllers';
import { Container } from 'typedi';
import { useContainer as ormUseContainer } from 'typeorm';

export const iocLoader: MicroframeworkLoader = (settings: MicroframeworkSettings | undefined) => {
  /**
   * Setup routing-controllers to use typedi container.
   */
  routingUseContainer(Container);
  ormUseContainer(Container);

  // TODO why do we need class validator and not for class transformer
  classValidatorUseContainer(Container);
};
