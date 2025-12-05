import { ValidationError } from "../errors/ValidationError.js";

export class CatalogFileEventDto {
  constructor({ bucket, key }) {
    this.bucket = bucket;
    this.key = key;
  }

  static fromS3Record(record) {
    if (!record?.s3) {
      throw new ValidationError("Evento S3 inválido");
    }

    const bucket = record.s3.bucket.name;
    const key = record.s3.object.key;

    if (!bucket || !key) {
      throw new ValidationError("bucket y key requeridos");
    }

    return new CatalogFileEventDto({ bucket, key });
  }
}
