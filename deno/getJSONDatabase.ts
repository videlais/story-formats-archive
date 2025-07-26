import axios, { AxiosResponse } from "axios";

export async function getJSONDatabase(path: string): Promise<AxiosResponse<unknown>> {
    // Define a default response.
    let response: AxiosResponse<unknown>;

    try {
        response = await axios.get(path);
    } catch (error) {
        console.error("❌ Error fetching JSON database:");
        throw error;
    }

    return response;
}
