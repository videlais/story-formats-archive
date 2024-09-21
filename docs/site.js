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

        let link = `https://videlais.github.io/story-formats-archive/${type}/twine${twineVersion}/${result.name}/${result.version}/`;

        let files = result.files.map(file => {
            return `<li><a href="${link}${file}" target="_blank">${file}</a></li>`;
        });

        // Twine 1 has repo and basedOn and doesn't have version.
         resultDiv.innerHTML = `
            <table>
                <thead>
                    <tr>
                        <th scope="col">Name</th>
                        ${result.version !== undefined ? '<th scope="col">Version</th>' : ''}
                        <th scope="col">Author</th>
                        <th scope="col">Description</th>
                        ${result.basedOn !== undefined ? '<th scope="col">Based On</th>' : ''}
                        ${result.repo !== undefined ? '<th scope="col">Repository</th>' : ''}
                        <th scope="col">Files</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td scope="row">${result.name}</td>
                        ${result.version !== undefined ? `<td scope="row">${result.version}</td>` : ''}
                        <td>${result.author !== undefined ? result.author : "(No value.)"}</td>
                        <td>${result.description !== "" ? result.description : "(No value.)"}</td>
                        ${result.basedOn !== undefined ? `<td scope="row">${result.basedOn}</td>` : ''}
                        ${result.repo !== undefined ? `<td scope="row"><a href="${result.repo}" target="_blank">${result.repo}</a></td>` : ''}
                        <td><ul>${files.join('')}</ul></td>
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