import { OfficialDatabase } from "./OfficialDatabase.js";

// Define a server response interface.
export interface ServerResponse {
    data: unknown | string | OfficialDatabase;
    status: number;
    statusText: string;
    headers: object;
    config: {
        url: string | undefined;
        method: string;
        headers: object;
        transformRequest: <U>(data: unknown) => U;
        transformResponse: <U>(data: unknown) => U;
        timeout: number;
        xsrfCookieName: string;
        xsrfHeaderName: string;
        maxContentLength: number;
        maxBodyLength: number;
        data: string;
        validateStatus: (status: number) => boolean;
    };
}