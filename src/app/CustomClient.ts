import { WebResourceLike, CompatResponse, HttpHeadersLike } from "@azure/core-http-compat";
import { IHttpClient } from "@azure/storage-blob";

export class CustomClient implements IHttpClient {

  constructor() { }
  
  async sendRequest(httpRequest: WebResourceLike): Promise<CompatResponse> {
    // Convert request headers to plain object
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(httpRequest.headers.rawHeaders())) {
      headers[key] = value as string;
    }
    
    // Make the fetch request with credentials: 'include'
    const response = await fetch(httpRequest.url, {
      method: httpRequest.method,
      headers: headers,
      body: httpRequest.body,
      //credentials: 'include' // Include cookies/credentials with cross-origin requests
    });
    
    // Read the response body
    const bodyText = await response.text();
    
    // Create a headers object with the required methods
    const responseHeaders: HttpHeadersLike = {
      rawHeaders: () => {
        const raw: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          raw[key] = value;
        });
        return raw;
      },
      toJson: () => {
        const json: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          json[key] = value;
        });
        return json;
      },
      get: (headerName: string) => response.headers.get(headerName) || undefined,
      set: (headerName: string, headerValue: string) => {},
      contains: (headerName: string) => response.headers.has(headerName),
      remove: (headerName: string) => false,
      clone: () => responseHeaders,
      headersArray: () => {
        const array: Array<{ name: string; value: string }> = [];
        response.headers.forEach((value, key) => {
          array.push({ name: key, value });
        });
        return array;
      },
      headerNames: () => Array.from(response.headers.keys()),
      headerValues: () => Array.from(response.headers.values())
    };
    
    // Return CompatResponse
    return {
      request: httpRequest,
      status: response.status,
      headers: responseHeaders,
      bodyAsText: bodyText,
      readableStreamBody: response.body
    } as CompatResponse;
  }

}
