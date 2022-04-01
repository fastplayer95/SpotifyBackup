import { fstat, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const filename = ".refereshToken"
const filepath = resolve(__dirname, "..", "config", filename)

export function getRefreshToken(): string {
  return readFileSync(filepath, { encoding: "utf-8" }).toString().trim();
}

export function saveRefreshToken(token: string): void {
  writeFileSync(filepath, token, { encoding: "utf-8" })
  return;
}
