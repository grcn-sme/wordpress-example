export class IDB_Example {

    /** @type {IDBDatabase} */
    db;

    constructor(db) {
        this.db = db;
    }

    static open(dbName, version) {
        return new Promise((resolve, fail) => {
            const request = window.indexedDB.open(dbName, version);
            request.onerror = fail;

            request.onsuccess = (event) => {
                /** @type {IDBDatabase} */
                const db = event.target.result;
                console.log({ db });
                const dbw = new IDB_Example(db);
                resolve(dbw);
            };

            // init db structure
            request.onupgradeneeded = function (ev) {
                /** @type {IDBDatabase} */
                const db = ev.target.result;

                const tbl = db.createObjectStore('lsa');
                console.log({ tbl });

            };

            request.onblocked = function (ev) {
                /** @type {IDBDatabase} */
                const db = ev.target.result;

                alert('please close other tabs to allow upgrade');
                fail(ev);
            };
        });
    }

    add() {
        return new Promise((resolve, fail) => {
            const db = this.db;
            const transaction = db.transaction(['lsa'], 'readwrite');
            transaction.oncomplete = resolve;
            transaction.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };;

            const tbl = transaction.objectStore('lsa');
            tbl.add({ 'default item': 'hello ' + Date.now() }, 1);
            tbl.add({ 'haha': 'aas ' + Date.now() }, Date.now());
        });
    }

    update() {
        return new Promise((resolve, fail) => {
            const db = this.db;
            const transaction = db.transaction(['lsa'], 'readwrite');
            transaction.oncomplete = resolve;

            transaction.onerror = (ev) => {
                console.error(ev);
                throw new Error(ev.target.error);
            };

            const tbl = transaction.objectStore('lsa');
            tbl.put({ 'haha': 'updated ' + Date.now() }, 1);
        });

    }

    read() {
        return new Promise((resolve, fail) => {
            const db = this.db;
            const transaction = db.transaction('lsa', 'readonly');
            const request = transaction.objectStore('lsa').get(1);
            request.onerror = fail;
            request.onsuccess = ev => {
                console.log({ event: ev, result: request.result });
                resolve(request.result);
            };
        });
    }

    delete() {
        const db = this.db;
        const request = db.transaction('lsa', "readwrite");
        request.onerror = console.warn;
        request.objectStore('lsa').delete(1);
        console.log('delete');
    }


    readAll() {
        const db = this.db;
        const tbl = db.transaction('lsa', 'readonly').objectStore('lsa');
        const cursor = tbl.openCursor();
        cursor.onerror = console.error;
        cursor.onsuccess = (ev) => {
            /** @type {IDBCursorWithValue} */
            const cursor = ev.target.result;
            if (!cursor) return;
            const k = cursor.key, v = cursor.value;
            console.log({ cursor, k, v });
            cursor.continue();
        };
    }

    /** @param {(key: any, value: any) => boolean} callback */
    listAll(callback) {
        return new Promise((done, fail) => {
            const db = this.db;
            const tbl = db.transaction('lsa', 'readonly').objectStore('lsa');
            const cursor = tbl.openCursor();

            cursor.onerror = (ev) => {
                // console.warn(ev);
                fail(ev.target.error);
            };

            cursor.onsuccess = (ev) => {
                /** @type {IDBCursorWithValue} */
                const cursor = ev.target.result;
                if (!cursor) { done(); return; }
                const doContinue = callback(cursor.key, cursor.value);
                if (doContinue === false) { done(); return; }
                cursor.continue();
            };
        });
    }

}

