import { diskStorage } from 'multer';
import type { Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import type { IMulterFile } from './../../interfaces/multer.interface';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface.js';

export const localFileUpload = ({
  folder = 'public',
  validation = [],
  fileSize = 2,
}: {
  folder?: string;
  validation: string[];
  fileSize?: number;

}): MulterOptions => {
  let bathePath = `uploads/${folder}`;
  return {
    storage: diskStorage({
      destination(req: Request, file: Express.Multer.File, callback: Function) {
        const fullPath = path.resolve(`./${bathePath}`);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
        callback(null, fullPath);
      },

      filename(req: Request, file: IMulterFile, callback: Function) {
        const fileName =
          randomUUID() + '_' + Date.now() + '_' + file.originalname;
        file.finalPath = bathePath + `/${fileName}`;
        callback(null, fileName);
      },
    }),

    fileFilter(req:Request, file: Express.Multer.File, callback: Function) {
      if(validation.includes(file.mimetype)) {
        return callback(null, true);
      }
        return callback(new BadRequestException('invalid file format'), true);
    },

    limits: {
      fileSize: fileSize *1024 * 1024,
    },


  };
};
