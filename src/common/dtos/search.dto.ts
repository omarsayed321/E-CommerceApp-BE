import {IsNumber, IsOptional, IsPositive, IsString} from 'class-validator';
import { Type } from 'class-transformer';


export class SearchDto {
  @Type(()=> Number)
  @IsPositive()
  @IsNumber()
  @IsOptional()
  page: number;
  
  @Type(()=> Number)
  @IsPositive()
  @IsNumber()
  @IsOptional()
  size: number;

  @IsString()
  @IsOptional()
  search: string;
}