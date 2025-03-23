import axios from 'axios';
import { getJSONDatabase } from '../src/getJSONDatabase';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

interface ServerResponse {
    data: string;
    status: number;
    statusText: string;
    headers: object;
    config: {
        url: string;
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

describe('getJSONDatabase', () => {
    const path = 'https://example.com/data.json';

    it('should return data when the request is successful', async () => {
        const mockData: ServerResponse = { data: 'mock data', status: 200, statusText: 'OK', headers: {}, config: { url: path, method: 'GET', headers: {}, transformRequest: jest.fn(), transformResponse: jest.fn(), timeout: 0, xsrfCookieName: '', xsrfHeaderName: '', maxContentLength: 0, maxBodyLength: 0, data: '', validateStatus: jest.fn() } };
        mockedAxios.get.mockResolvedValue(mockData);

        const result = await getJSONDatabase(path);

        expect(result).toEqual(mockData);
        expect(mockedAxios.get).toHaveBeenCalledWith(path);
    });

    it('should throw an error when the request fails', async () => {
        const errorMessage = 'Network Error';
        mockedAxios.get.mockRejectedValue(new Error(errorMessage));

        await expect(getJSONDatabase(path)).rejects.toThrow(errorMessage);
        expect(mockedAxios.get).toHaveBeenCalledWith(path);
    });
});