
import { IsString, IsInt, IsOptional, Min, MaxLength, Max } from 'class-validator';

export class CreateCatDto {

  @IsString()
  @MaxLength(20)
  name!: string;


  @IsInt()
  @Min(1)
  @Max(30)
  age!: number;

  @IsString()
  @IsOptional()
  breed?: string; 
}