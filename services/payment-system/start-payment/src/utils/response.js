export function ok(data) {
  return { status: "OK", data };
}

export function fail(message) {
  return { status: "ERROR", message };
}
