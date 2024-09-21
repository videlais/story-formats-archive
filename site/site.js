async function fetchDataAsync(folder) {
    const myRequest = new Request(`../${folder}/index.json`);
    const response = await fetch(myRequest);
    const data = await response.json();
    return data;
}

async function loadDB() {
    officialDB = await fetchDataAsync('official');
    unofficialDB = await fetchDataAsync('unofficial');
}

function search() {

    let db = type === 'official' ? officialDB : unofficialDB;
    db = twineVersion === '2' ? db.twine2 : db.twine1;
   
    let results = db.filter(
        item => item.name.toLowerCase().includes(nameSearch.toLowerCase())
    );

    updateResults(results);
}

function updateResults(results) {
    let resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    results.forEach(result => {
        let resultDiv = document.createElement('table');

        let link = `https://videlais.github.io/story-formats-archive/${type}/twine${twineVersion}/${result.name}-${result.version}/`;

         resultDiv.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        <th scope="col">Author</th>
                        <th scope="col">Description</th>
                        <th scope="col">Folder Link</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td scope="row">${result.name}</td>
                        <td>${result.author}</td>
                        <td>${result.description}</td>
                        <td><a href="${link}" target="_blank">${link}</a></td>
                    </tr>
                </tbody>
            </table>`;
        resultsDiv.appendChild(resultDiv);
    });
}

let officialDB = null;
let unofficialDB = null;
let type = 'official';
let twineVersion = '2';
let nameSearch = '';

loadDB();

// Listen for changes to the id "type".
document.getElementById('type').addEventListener('change', function(event) {
    // Update the type variable.
    type = event.target.value;

    search();
});

// Listen for changes to the id "name".
document.getElementById('name').addEventListener('input', function(event) {
    // Update the nameSearch variable.
    nameSearch = event.target.value;
    
    // Only search if the input name is at least 1 characters long.
    if (nameSearch.length >= 1) {
        search();
    }
});

// Listen for changes to the id "twineVersion".
document.getElementById('twineVersion').addEventListener('change', function(event) {
    // Update the twineVersion variable.
    twineVersion = event.target.value

    // Search for results.
    search();
});