// custom code injector 
// html code to inject dynamically on run time
// function injectCustomCode(htmlCode, intoElement) { let addText; if (intoElement === document.head) { const nodeToAdd = []; addText = (TAG) => { nodeToAdd.push(new Text(TAG.textContent)); setTimeout(_ => { document.body.prepend(nodeToAdd.pop()); }); }; } else { addText = (TAG) => { intoElement.appendChild(new Text(TAG.textContent)); }; } const cloneChildNodes = (TAG) => { try { if (TAG.attributes === undefined) { if (TAG.nodeName === "#text") { addText(TAG); return new Text(TAG.textContent); } else if (TAG.nodeName === "#comment") { intoElement.appendChild(new Comment(TAG.textContent)); } else { console.warn("unknown node type, assume as textNode instead: ", TAG); addText(TAG); } } else { const tag = document.createElement(TAG.tagName); for (const a of TAG.attributes) { tag.setAttribute(a.name, a.value); } tag.innerHTML = TAG.innerHTML; intoElement.appendChild(tag); } } catch (err) { console.warn(err); } }; const doc = new DOMParser().parseFromString(htmlCode, "text/html"); doc.head.childNodes.forEach(cloneChildNodes); doc.body.childNodes.forEach(cloneChildNodes); }

/** 
 * @param {string} htmlCode
 * @param {HTMLElement} intoElement
 */
function injectCustomCode(htmlCode, intoElement) {
  const b = document.createElement('template');
  b.innerHTML = htmlCode;
  const nodes = [...(b.content.cloneNode(true).childNodes)];
  const len = nodes.length;
  for (let i = 0; i < len; ++i) {
    const x = nodes[i];
    if (x.nodeName === 'SCRIPT') {
      const sc = document.createElement('script');
      if (x.attributes) for (const a of x.attributes) {
        sc.setAttribute(a.name, a.value);
      };
      sc.textContent = x.textContent;
      intoElement.appendChild(sc);
      nodes[i] = sc;
      continue;
    }
    else if (x.nodeName === '#text') {
      if (intoElement === document.head) {
        document.body.prepend(x);
        nodes[i] = x;
        continue;
      }
    }
    intoElement.appendChild(x);
    nodes[i] = x;
  }
  window.addEventListener('popstate', function cleanup() {
    const len = nodes.length;
    for (let i = 0; i < len; ++i) {
      nodes[i].remove();
    }
  }, { once: true, capture: true });
  return nodes;
}


const innerHTMLPolicy = trustedTypes.createPolicy("passthrough", {
  createHTML: (html) => html,
});


/** @type {Object<string, (_: any) => Promise<any>} */
const modules = import.meta.glob('./page/**/*.js', { eager: false });

/** @type {Object<string, (_: any) => Promise<any>} */
const pages = import.meta.glob('./page/**/*.html', { eager: false, query: 'raw' });
// console.log('pages', pages);


/** @param {string} hash - should begin with '#/xxx' */
async function navigatePage(hash) {
  // fetch resources
  // #/pathname/xxx/yyy
  const path = hash.substring(1);
  console.assert(path && path.startsWith('/'), `invalid path: ${path}`);

  // virtual url for SPA
  const url = new URL(`${location.origin}${path}`);

  // load img
  const pathname = url.pathname;
  if (pathname.endsWith('.png')
    || pathname.endsWith('.jpg')
    || pathname.endsWith('.jpeg')
    || pathname.endsWith('.gif')
    || pathname.endsWith('.webp')
    || pathname.endsWith('.avif')
    || pathname.endsWith('.apng')
  ) {
    return loadImageFile(url);
  }

  processSearchParams(url.searchParams);

  // load page
  const src = `./page${url.pathname === '/' ? '' : url.pathname}/_.html`;
  const page = pages[src];
  // console.log({ url, src, page });

  const appBody = _resetAppBody();
  if (page === undefined) {
    appBody.innerHTML = innerHTMLPolicy.createHTML('<h1>404 page not found =( </h1>');
    return;
  }

  const html = await page();
  // // console.log({ html }, html.default);

  try { // 1. inject dynamic head code 1st
    try {
      const codeInjected = await injectRemoteCode();
      if (codeInjected)
        setTimeout(showRemoteCodeStatus, 0, true);
    } catch (err) {
      console.error(err);
      setTimeout(showRemoteCodeStatus, 0, false);
    }

    injectCustomCode(localStorage['txtCodeHead'] || '', document.head); // for 3rd party code in <head> section
  } catch (err) { console.error(err); }

  appBody.innerHTML = innerHTMLPolicy.createHTML(html.default); // 2. then load html body

  const lastResource0 = _loadSharedResources(url.pathname, modules, appBody);
  const lastResource1 = _loadIndividualResources(url.pathname, modules, appBody);
  const lastResource2 = _loadSharedResources2(url.pathname, modules, appBody);


  // emulate page load event, for 3rd party mpa code to run
  const opt = { bubbles: true };
  try {
    if (lastResource0 !== null) await lastResource0;
    if (lastResource1 !== null) await lastResource1;
    if (lastResource2 !== null) await lastResource2;

    setTimeout(_ => {
      injectCustomCode(localStorage['txtCodeBody'] || '', document.body);
    }, 0);
    setTimeout((appBody, opt) => { appBody.dispatchEvent(new Event('readystatechange', opt)); }, 0, appBody, opt);
  }
  finally {
    // emulate page load events,
    // for 3rd party mpa code to run
    setTimeout((appBody, opt) => { appBody.dispatchEvent(new Event('DOMContentLoaded', opt)); }, 0, appBody, opt);
    setTimeout((window, opt) => {
      window.dispatchEvent(new Event('load', opt));
      window.dispatchEvent(new PageTransitionEvent('pageshow', opt));
    }, 0, window, opt);
    setTimeout(injectStaticRemoteCode, 0);
  }
  // console.log({ url, src });
}

/** 
 * @param {string} pathname - absolute path, e.g. `/abcPage`
 * @param {Object<string, (_: any) => Promise<any>} modules
 * @param {HTMLElement} appBody - the main body of app
 */
function _loadSharedResources(pathname, modules, appBody) {
  // partial page, load dir general shared resources
  // console.assert(pathname && pathname.startsWith('/'), `invalid pathname: ${pathname}`);

  // import _shared.js file of each dir (if any)
  // from top to bottom (deepest) dir
  let lastResource0 = null;
  const paths = pathname.split('/').reverse();
  for (let path = paths.pop(); paths.length > 0;) {
    const src = `./page/${path}_shared.js`;
    path += `${paths.pop()}/`;
    const module = modules[src];
    // console.log({ src, module });
    if (!module) continue;
    lastResource0 = module().then(m => m.default(appBody)).catch(console.error);
  }
  return lastResource0;
}

/** 
 * @param {string} pathname - absolute path, e.g. `/abcPage`
 * @param {Object<string, (_: any) => Promise<any>} modules
 * @param {HTMLElement} appBody - the main body of app
 */
function _loadSharedResources2(pathname, modules, appBody) {
  // partial page, load dir general shared resources
  // console.assert(pathname && pathname.startsWith('/'), `invalid pathname: ${pathname}`);

  // import _onload.js file of each dir (if any)
  // from bottom to top; deepest | closest to top
  // for shared cleanup and reactive actions
  let lastResource2 = null;
  for (let path = pathname; path !== '';) {
    const h = path.lastIndexOf('/');
    path = path.substring(0, h);
    const src = `./page${path}/_onload.js`;
    const module = modules[src];
    // console.log({ src, module });
    if (!module) continue;
    lastResource2 = module().then(m => m.default(appBody)).catch(console.error);
  }
  return lastResource2;
}

/** 
 * @param {string} pathname - absolute path, e.g. `/abcPage`
 * @param {Object<string, (_: any) => Promise<any>} modules
 * @param {HTMLElement} appBody - the main body of app
 * */
function _loadIndividualResources(pathname, modules, appBody) {
  // partial page, load individual file specific resources
  // load /src/page/(file.js|/**/file.js) if any
  // console.assert(pathname && pathname.startsWith('/'), `invalid pathname: ${pathname}`);

  if (pathname === '/') return null;
  const src = `./page${pathname}/_.js`; // is to /src/page/**/_.js
  // // console.log({ src, modules });
  const module = modules[src];
  if (!module) return null;
  return module().then(m => m.default(appBody)).catch(console.error);
}

function _resetAppBody() {
  // this reset and remove all eventListeners on app body too
  const div2 = document.createElement('div');

  const div = document.getElementById('app');
  div2.setAttribute('id', 'app'),
    div.textContent = '',
    document.body.replaceChild(div2, div);
  return div2;
}


{ // init page
  if (location.hash !== '' && location.hash !== '#') {
    navigatePage(location.hash);
  }
  else {
    navigatePage('#/');
  }
}

function isMPA() {
  return !!localStorage['txtRemoteCodeUrl'] || !!localStorage['txtCodeHead'] || !!localStorage['txtCodeBody'];
}

window.onpopstate = async function navigateTo(ev) { // custom route
  if (isMPA()) { // behave as mpa if remote code is in used
    // reload on pages change can reset and avoid many global variables, listeners, and state bugs
    location.reload();
    return;
  }

  await navigatePage(location.hash); // spa
  // window.stop(), this.location.reload();  // mpa
};



/** @param {URL} url */
async function loadImageFile(url) {
  const img = document.createElement('img');

  // minimum size before loading
  img.setAttribute('width', '128'),
    img.setAttribute('height', '128');

  img.onload = function () {
    img.setAttribute('width', img.naturalWidth);
    img.setAttribute('height', img.naturalHeight);
  };
  img.setAttribute('src', `page${url.pathname}${url.search}`);

  const appBody = _resetAppBody();
  appBody.appendChild(img);
}

/** @param {URLSearchParams} searchParams */
function processSearchParams(searchParams) {
  const gdocsId = searchParams.get('serverUrlId');
  // console.log({ searchParams, gdocsId });
  if (gdocsId) {
    localStorage['txtRemoteCodeUrl'] = `https://docs.google.com/document/d/${gdocsId}/preview`;
  }

}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js', { scope: './' });

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    setTimeout(showInstallAppButton, 1000, e);
  }, { once: true });

  /** @param {BeforeInstallPromptEvent} deferredPrompt */
  function showInstallAppButton(deferredPrompt) {
    const btnInstallApp = document.getElementById('btnInstallApp');
    btnInstallApp.addEventListener('click', function (e) {
      if (e.isTrusted === false) return;
      deferredPrompt.prompt();
      btnInstallApp.style['display'] = 'none';
    });
    btnInstallApp.style['display'] = '';
  }

}

import { alert } from '/src/alert.mjs';


{ // error alert
  let qid = 0, d = false;
  window.onerror = function (e) {
    if (d) return;
    clearTimeout(qid);
    qid = setTimeout(_ => {
      alert('Ops... app got some unknown error');
      d = true;
    }, 1500);
  };
}

window.addEventListener('load', function (ev) {
  if (ev.isTrusted === false) return;
  if (isMPA() === false) return;
  setTimeout(async function preLoadModule() {
    for (const key of Object.keys(pages)) {
      await pages[key]().catch(console.error);
    }
    for (const key of Object.keys(modules)) {
      await modules[key]().catch(console.error);
    }

    // console.log('all modules are loaded, offline experience is ready');
  }, 2000);
});



/** 
 * @param {string} link 
 * @returns {boolean} - is any remote code injected
 * */
async function injectRemoteCode() {
  const link = localStorage['txtRemoteCodeUrl'];
  // console.log({ link });

  if (!link) return false;
  if (false === link.startsWith('https://docs.google.com/document/d/')) return false;

  const url = new URL(link);
  const dirs = url.pathname.split('/');
  if (/^$|edit|preview|copy|export/i.test(dirs.pop()) === false) return false;

  url.pathname = dirs.join('/') + '/export';
  url.searchParams.set('format', 'txt');
  // console.log({ url });

  // DOC_URL/export?format=txt
  // const qq = await fetch('https://docs.google.com/document/d/1_xPg9-MzjfJ9Xv10nuQo9fc-NWq8G_e4pF1xvpADDxU/export?tab=t.0&format=txt', { mode: 'cors' });
  const qq = await fetch(url.toString(), { mode: 'cors' });
  const htmlContent = await qq.text();
  // console.log({ htmlContent });
  injectCustomCode(htmlContent, document.head);
  return true;
}


import { getRemoteStaticCode } from '/src/remote.mjs';
async function injectStaticRemoteCode() {
  // DOC_URL/export?format=txt
  try {
    const htmlContent = await getRemoteStaticCode();
    injectCustomCode(htmlContent, document.body);
  } catch (err) {
    console.warn(err);
  }
}

function showRemoteCodeStatus(success) {
  const div = document.getElementById('remote-setting__status');
  const urlId = localStorage['txtRemoteCodeUrl'].split('').reduce((a, x) => a ^ x.charCodeAt(0), 31);
  if (success) {
    div.textContent = `Online server: ${urlId}`;
  } else {
    div.textContent = `Connection error! Online server: ${urlId}`;
    div.classList.add('error');
  }
}
