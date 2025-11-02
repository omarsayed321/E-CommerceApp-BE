import { IBrand } from 'src/common/interfaces/brand.interface';
import {MaxLength, MinLength, IsString} from 'class-validator';

export class CreateBrandDto implements Partial<IBrand> {
  @MaxLength(25)
  @MinLength(2)
  @IsString()
  name:string;

  @MaxLength(25)
  @MinLength(2)
  @IsString()
  slogan:string;
}
