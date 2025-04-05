import axios from 'axios';
import { getJSONDatabase } from '../src/getJSONDatabase';
jest.mock('axios');
describe('getJSONDatabase', () => {
    const path = 'https://example.com/data.json';
    it('should return data when the request is successful', async () => {
        const mockData = { data: { key: 'value' } };
        axios.get.mockResolvedValue(mockData);
        const result = await getJSONDatabase(path);
        expect(result).toEqual(mockData);
    });
    it('should throw an error when the request fails', async () => {
        const errorMessage = 'Network Error';
        axios.get.mockRejectedValue(new Error(errorMessage));
        await expect(getJSONDatabase(path)).rejects.toThrow(errorMessage);
    });
});
