import { IsString, IsNotEmpty } from 'class-validator';

export class EmailDto {
  @IsString()
  @IsNotEmpty()
  readonly email: string;
}
