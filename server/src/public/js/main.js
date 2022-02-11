class HttpClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    _handleResponse(xhr, resolve, reject) {
        if (xhr.DONE !== xhr.readyState) {
            return;
        }
        const body = xhr.responseText ? JSON.parse(xhr.responseText) : '';
        if ([200, 201, 204].includes(xhr.status)) {
            resolve(body);
        } else {
            reject(body);
        }
    }

    get(endpoint) {
        const that = this;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => that._handleResponse(xhr, resolve, reject);
            xhr.open('GET', `${that.baseUrl}${endpoint}`);
            xhr.send();
        })
    }

    post(endpoint, body) {
        const that = this;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => that._handleResponse(xhr, resolve, reject);
            xhr.open('POST', `${that.baseUrl}${endpoint}`);
            xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.send(JSON.stringify(body));
        })
    }

    delete(endpoint) {
        const that = this;
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => that._handleResponse(xhr, resolve, reject);
            xhr.open('DELETE', `${that.baseUrl}${endpoint}`);
            xhr.send();
        });
    }
}

const httpClient = new HttpClient('http://172.30.90.52:3000/api/objetos');

class TableRow {
    constructor(mobObject) {
        this.mobObject = mobObject;
    }

    _createDeleteButton() {
        const button = document.createElement('button');
        button.classList.add('btn', 'btn-outline-danger');

        const icon = document.createElement('i');
        icon.classList.add('bi', 'bi-trash');
        button.insertAdjacentElement('afterbegin', icon);
        const mobObject = this.mobObject;
        button.onclick = () => {
            const name = mobObject.name;
            deleteObject(name);
        }

        return button;
    }

    _cell(content) {
        const td = document.createElement('td');
        if (typeof content === 'string') {
            td.insertAdjacentText('beforeend', content);
        } else {
            td.insertAdjacentElement('beforeend', content);
        }
        return td;
    }

    _createRow() {
        const mobObject = this.mobObject;
        const row = document.createElement('tr');
        row.id = mobObject.name;
        [mobObject.name, new Date(mobObject.timestamp).toDateString(), this._createDeleteButton()].forEach(element => {
            const td = this._cell(element);
            row.insertAdjacentElement('beforeend', td);
        });

        return row;
    }

    insertIntoTable(table) {
        const body = table.querySelector('tbody');
        const row = this._createRow();
        body.insertAdjacentElement('beforeend', row);
    }
}

function deleteObject(name) {
    const endpoint = `/${encodeURIComponent(name)}`;
    httpClient.delete(endpoint)
        .then(() => {
            reloadTable(document.getElementById('table'));
            showAlert('success', 'Objeto eliminado con éxito');
        }, () => {
            showAlert('danger', 'Ocurrió un error al eliminar');
        });
}

function toggleLoader(visible) {
    const loader = document.getElementById('loader');
    if (!visible) {
        loader.classList.add('invisible');
    } else {
        loader.classList.remove('invisible');
    }
}

function reloadTable(table) {
    table.querySelector('tbody').innerHTML = '';
    httpClient.get('/')
        .then((data) => {
            data.forEach(object => {
                const row = new TableRow(object);
                row.insertIntoTable(table);
            });
        });
}

function showAlert(theme, message) {
    const alert = document.createElement('div');
    alert.classList.add('alert', `alert-${theme}`);
    alert.innerText = message;
    const container = document.getElementById('alert-container');
    container.innerText = '';
    container.insertAdjacentElement('afterbegin', alert);
}

function submitNewObject(name) {
    toggleLoader(true);
    httpClient.post('/', {name})
        .then(() => {
            reloadTable(document.getElementById('table'));
            showAlert('success', 'Objeto creado exitosamente');
            toggleLoader(false);
        })
        .catch((error) => {
            toggleLoader(false);
            showAlert('danger', error.message);
        });
}

function replicate(action){
    toggleLoader(true);
    httpClient.post('/replica',{action})
        .then(()=>{
            reloadTable(document.getElementById('table'))
            showAlert('success', 'Replicación exitosa');
            toggleLoader(false);
        })
        .catch((error)=>{
            toggleLoader(false);
            showAlert('danger', error.message);
        })
}

function restore(){
    toggleLoader(true);
    httpClient.get('/restauracion')
        .then(()=>{
            reloadTable(document.getElementById('table'))
            showAlert('success', 'Restauración exitosa');
            toggleLoader(false);
        })
        .catch((error)=>{
            toggleLoader(false);
            showAlert('danger', error.message);
        })
}
