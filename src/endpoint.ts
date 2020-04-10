const BASE_URL = "https://public-ubiservices.ubi.com/";

enum Platform {
  pc = "5172a557-50b5-4665-b7db-e3f2e8c5041d/sandboxes/OSBOR_PC_LNCH_A/",
  xbox = "98a601e5-ca91-4440-b1c5-753f601a2c90/sandboxes/OSBOR_XBOXONE_LNCH_A/",
  playstation = "05bfb3f7-6c21-4c42-be1f-97a33fb5cf66/sandboxes/OSBOR_PS4_LNCH_A/",
}

class Endpoint<Q> {
  protected version: number;
  protected resource: string;
  protected queryString = "";
  /**
   * describes an API endpoint
   *
   * @param version - API version
   * @param resource - API resource
   */
  constructor(version: number, resource: string) {
    this.version = version;
    this.resource = resource;
  }
  /**
   * Returns the url for the endpoint
   */
  url(): string {
    return `${BASE_URL}v${this.version}/${this.resource}${this.queryString}`;
  }
  /**
   * Adds query string parameters to the endpoint
   * @param queryObj - query string parameters
   */
  query(queryObj: Q): this {
    // TODO: probably needs to be URI encoded
    const constructed = Object.entries(queryObj)
      .map(
        ([param, value]) =>
          `${param}=${Array.isArray(value) ? value.join(",") : value}`
      )
      .join("&");
    if (constructed.length > 0) {
      this.queryString = `?${constructed}`;
    }
    return this;
  }
}

class PlatformEndpoint<Q> extends Endpoint<Q> {
  platform = Platform.pc;
  /**
   * Sets the platform for the endpoint
   *
   * @param platform - platform for endpoint
   */
  setPlatform(platform: Platform): this {
    this.platform = platform;
    return this;
  }
  url(): string {
    return `${BASE_URL}v${this.version}/spaces/${this.platform}/${this.resource}${this.queryString}`;
  }
}

export { Endpoint, Platform, PlatformEndpoint };
