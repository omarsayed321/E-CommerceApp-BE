import { Lean } from 'src/DB/repository/database.repository.js';
import { IBrand } from './../../../common/interfaces/brand.interface';

export class GetAllBrandsResponse {
  result: {
          docsCount?:number; 
          limit?:number; 
          pagesCount?:number; 
          currentPage?:number | undefined; 
          result: IBrand[];
      }
}
