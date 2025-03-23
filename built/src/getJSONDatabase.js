import axios from 'axios';
export async function getJSONDatabase(path) {
    // Define a default response.
    let response;
    try {
        response = await axios.get(path);
    }
    catch (error) {
        console.error('❌ Error fetching JSON database:');
        throw error;
    }
    return response;
}
//# sourceMappingURL=getJSONDatabase.js.map