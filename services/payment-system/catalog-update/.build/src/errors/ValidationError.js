import { HttpError } from "./HttpError.js";

export class ValidationError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}
