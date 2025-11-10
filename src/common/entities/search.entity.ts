
export class GetAllResponse<T = any> {
  result: {
          docsCount?:number; 
          limit?:number; 
          pagesCount?:number; 
          currentPage?:number | undefined; 
          result: T[];
      }
}
