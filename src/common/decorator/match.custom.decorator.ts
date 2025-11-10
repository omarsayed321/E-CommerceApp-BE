import { ValidationArguments, ValidationOptions, registerDecorator, ValidatorConstraintInterface, ValidatorConstraint } from 'class-validator';
import { Types }from 'mongoose'

@ValidatorConstraint({name: "check_mongooId-format", async: false})
export class MongoDBIds implements ValidatorConstraintInterface{
  validate(ids: Types.ObjectId[], args: ValidationArguments) {
    for(const id of ids) {
      if(!Types.ObjectId.isValid(id)) {
        return false;
      }
    }
    return true;
 }

  defaultMessage(validationArguments?: ValidationArguments): string {
      return `invalid mongooDBId format`;
  }
}

@ValidatorConstraint({name: "match_between_fields", async: false})
export class MatchBetweenFields<T=any> implements ValidatorConstraintInterface{
  validate(value: T, args: ValidationArguments): Promise<boolean> | boolean {
      return value === args.object[args.constraints[0]];
  }

  defaultMessage(validationArguments?: ValidationArguments): string {
      return `failed to match ${validationArguments?.property} with ${validationArguments?.constraints[0]}`;
  }
}

export function IsMatch<T=any>(constraints: string[], validationOptions?: ValidationOptions,){
  return function (object: object, propertyName: string){
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints,
      validator: MatchBetweenFields<T>
    })
  }
}