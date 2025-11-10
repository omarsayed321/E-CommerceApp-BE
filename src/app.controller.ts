import { BadRequestException, Controller, Get, Param, Query, Res } from '@nestjs/common';
import { S3Service } from './common/services/s3.service';

import { promisify } from 'util';
import { pipeline } from 'stream';
import type { Response } from 'express';

const s3WriteStreamPipeline = promisify(pipeline);

// localhost:3000/
@Controller()
export class AppController {
  constructor(
    private readonly s3Service: S3Service,
  ) {}

    // get assets
  @Get("/upload/pre-signed/*path")
  async getPresignedAssetUrl(
    @Query() query: {download?: "true" | "false"; filename?: string},
    @Param() params: { path: string[] },
  ){
    const {filename, download } = query;
    const { path } = params;
    const Key = path.join("/");
    const url = await this.s3Service.createGetPreSignedLink({ 
      Key, 
      filename,
      download
    });
    return { message: "pre-signed url", data: { url } };

  }

  @Get("/upload/*path")
    async getAsset(
    @Query() query: {download?: "true" | "false"; filename?: string},
    @Param() params: { path: string[] },
    @Res({passthrough: true}) res: Response,
  ){
        const {filename, download } = query;
    const { path } = params;
    const Key = path.join("/");
    const s3Response = await this.s3Service.getFile({Key});

     if (!s3Response?.Body) {
        throw new BadRequestException("failed to fetch this asset");
      }

      res.set("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader(
        "Content-Type",
        `${s3Response.ContentType}` || "application/octet-stream"
      );
      if (download === "true") {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename || Key.split("/").pop()}`
        );
      }

      return await s3WriteStreamPipeline(
        s3Response.Body as NodeJS.ReadableStream,
        res
      );
  }



}
