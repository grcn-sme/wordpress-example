import { IDB_Example } from '../../idb_example.mjs';
import { IdbWrapper } from '/src/IdbWrapper.mjs';

export default async function main(appBody) {
    // /** @type {IDB_Example} */
    // const idbExample = await IDB_Example.open('haha');
    // window.idbExample = idbExample;
    // setupUIexample(idbExample, appBody);


    /** @type {IdbWrapper} */
    const idbWrapper = await IdbWrapper.open('haha', 2, (db, existingStores) => {
        if (db.objectStoreNames.contains('exampleStore') === false) {
            const exampleStore = db.createObjectStore('exampleStore', { keyPath: 'uname' });
            exampleStore.createIndex('userEmail', 'email', { unique: true });
        }

        const ost = IdbWrapper.createObjectStore(db, 'lsa', { keyPath: 'ssn' });
        ost?.createIndex('indexName1', 'keyedName1', { unique: true });
    });
    window.idbWrapper = idbWrapper;
    setupUI(idbWrapper, appBody);
}

/** 
 * @param {IdbWrapper} idbWrapper 
 * @param {HTMLElement} appBody
*/
function setupUI(idbWrapper, appBody) {
    const div = document.getElementById('dbDisplay');

    document.getElementById('btnRead').addEventListener('click', async function (e) {
        const result = await idbWrapper.read('lsa', 1);
        console.log(result);

        idbWrapper.readAll('lsa', (k, v) => {
            console.log({ k, v });
        });
    });

    document.getElementById('btnAdd').addEventListener('click', async function (e) {
        idbWrapper.add('lsa', [
            {
                ssn: 'inline key: ' + Math.random(),
                keyedName1: 'indexed_key_' + Date.now()
            }
        ]);

        idbWrapper.add('exampleStore', [
            {
                uname: 'inline key: ' + Date.now(),
                email: 'addon_index_key__' + Math.random() + '@gmail.com',
                name: 'test'
            }
        ]);
    });

    document.getElementById('btnUpdate').addEventListener('click', function (e) {
        idbWrapper.set('lsa', [
            { ssn: Date.now() }
        ]);
    });

    document.getElementById('btnDelete').addEventListener('click', function (e) {
        idbWrapper.delete('lsa', [
            1,
            1761463513658
        ]);
    });


    document.getElementById('txtIndexedKey').addEventListener('change', function (e) {
        e.target.setCustomValidity('');
        document.getElementById('txtReadByIndexedKey').dispatchEvent(new InputEvent('input'));
    });

    document.getElementById('txtReadByIndexedKey').addEventListener('input', async function (e) {
        /** @type {HTMLInputElement} */
        const txtIndexName = document.getElementById('txtIndexedKey');
        try {
            const indexName = txtIndexName.value;
            await idbWrapper.readByIndex('lsa', indexName,
                e.target.value
            );
        } catch (err) {
            txtIndexName.setCustomValidity(err.toString());
            txtIndexName.reportValidity();
        }
    });
}

/** 
 * @param {IDB_Example} idbExample 
 * @param {HTMLElement} appBody
*/
function setupUIexample(idbExample, appBody) {
    const div = document.getElementById('dbDisplay');

    document.getElementById('btnRead').addEventListener('click', async function (e) {
        const result = await idbExample.read();
        console.log(result);

        // idbExample.readAll();
        idbExample.listAll((k, v) => {
            console.log({ k, v });
        });
    });

    document.getElementById('btnAdd').addEventListener('click', async function (e) {
        idbExample.add();
    });

    document.getElementById('btnUpdate').addEventListener('click', function (e) {
        idbExample.update();
    });

    document.getElementById('btnDelete').addEventListener('click', function (e) {
        idbExample.delete();
    });
}