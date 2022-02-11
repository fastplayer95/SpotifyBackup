import { JsonDB } from "node-json-db";

export class TokenManager {


  private db

  private static instance: TokenManager
  constructor() {
    this.db = new JsonDB("SpotifyBackup.json", true, true)
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }

    return TokenManager.instance;
  }

  getRefreshToken(): string {
    return this.db.getData("/refreshToken")
  }

  setRefreshToken(token: string): void {
    this.db.push("/refreshToken", token, true)
  }

  getAccessToken(): string {
    return this.db.getData("/accessToken")
  }

  setAccessToken(token: string): void {
    this.db.push("/accessToken", token, true)
  }
}