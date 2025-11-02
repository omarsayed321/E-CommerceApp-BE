import { IResponse } from '../interfaces/response.interface';

export const successResponse = <T = any>({
  data,
  message = 'Done',
  status = 200,
}: IResponse<T> = {}): IResponse<T> => {
  return {
    message,
    data,
    status,
  };
};
