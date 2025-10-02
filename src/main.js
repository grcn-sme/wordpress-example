// custom code injector 
// html code to inject dynamically on run time
function injectCustomCode(htmlCode, intoElement) { let addText; if (intoElement === document.head) { const nodeToAdd = []; addText = (TAG) => { nodeToAdd.push(new Text(TAG.textContent)); setTimeout(_ => { document.body.prepend(nodeToAdd.pop()); }); }; } else { addText = (TAG) => { intoElement.appendChild(new Text(TAG.textContent)); }; } const cloneChildNodes = (TAG) => { try { if (TAG.attributes === undefined) { if (TAG.nodeName === "#text") { addText(TAG); return new Text(TAG.textContent); } else if (TAG.nodeName === "#comment") { intoElement.appendChild(new Comment(TAG.textContent)); } else { console.warn("unknown node type, assume as textNode instead: ", TAG); addText(TAG); } } else { const tag = document.createElement(TAG.tagName); for (const a of TAG.attributes) { tag.setAttribute(a.name, a.value); } tag.innerHTML = TAG.innerHTML; intoElement.appendChild(tag); } } catch (err) { console.warn(err); } }; const doc = new DOMParser().parseFromString(htmlCode, "text/html"); doc.head.childNodes.forEach(cloneChildNodes); doc.body.childNodes.forEach(cloneChildNodes); }

const innerHTMLPolicy = trustedTypes.createPolicy("passthrough", {
  createHTML: (html) => html,
});


/** @type {Object<string, (_: any) => Promise<any>} */
const modules = import.meta.glob('./page/**/*.js', { eager: false });

/** @type {Object<string, (_: any) => Promise<any>} */
const pages = import.meta.glob('./page/**/*.html', { eager: false, query: 'raw' });
console.log('pages', pages);


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

  // load page
  const src = `./page${url.pathname === '/' ? '' : url.pathname}/_.html`;
  const page = pages[src];
  console.log({ url, src, page });

  const appBody = document.getElementById('app');
  if (page === undefined) {
    appBody.innerHTML = innerHTMLPolicy.createHTML('<h1>404 page not found =( </h1>');
    return;
  }
  const html = await page();
  // console.log({ html }, html.default);
  appBody.innerHTML = innerHTMLPolicy.createHTML(html.default);


  const lastResource0 = _loadSharedResources(url.pathname, modules);

  injectCustomCode(localStorage['txtCodeHead'] || '', document.head); // for 3rd party code in <head> section

  const lastResource1 = _loadIndividualResources(url.pathname, modules);
  const lastResource2 = _loadSharedResources2(url.pathname, modules);


  setTimeout(_ => {
    injectCustomCode(localStorage['txtCodeBody'] || '', document.body);
  }, 0);

  // emulate page load event, for 3rd party mpa code to run
  const opt = { bubbles: true };
  setTimeout((appBody, opt) => { appBody.dispatchEvent(new Event('readystatechange', opt)); }, 0, appBody, opt);

  try {
    if (lastResource0 !== null) await lastResource0;
    if (lastResource1 !== null) await lastResource1;
    if (lastResource2 !== null) await lastResource2;
  } finally {
    // emulate page load events,
    // for 3rd party mpa code to run
    setTimeout((appBody, opt) => { appBody.dispatchEvent(new Event('DOMContentLoaded', opt)); }, 0, appBody, opt);
    setTimeout((opt) => { window.dispatchEvent(new Event('load', opt)); }, 500);
  }
  console.log({ url, src });
}

/** 
 * @param {string} pathname - absolute path, e.g. `/abcPage`
 * @param {Object<string, (_: any) => Promise<any>} modules
 */
function _loadSharedResources(pathname, modules) {
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
    console.log({ src, module });
    if (!module) continue;
    lastResource0 = module().catch(console.error);
  }
  return lastResource0;
}

/** 
 * @param {string} pathname - absolute path, e.g. `/abcPage`
 * @param {Object<string, (_: any) => Promise<any>} modules
 */
function _loadSharedResources2(pathname, modules) {
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
    console.log({ src, module });
    if (!module) continue;
    lastResource2 = module().catch(console.error);
  }
  return lastResource2;
}

/** 
 * @param {string} pathname - absolute path, e.g. `/abcPage`
 * @param {Object<string, (_: any) => Promise<any>} modules
 * */
function _loadIndividualResources(pathname, modules) {
  // partial page, load individual file specific resources
  // load /src/page/(file.js|/**/file.js) if any
  // console.assert(pathname && pathname.startsWith('/'), `invalid pathname: ${pathname}`);

  if (pathname === '/') return null;
  const src = `./page${pathname}/_.js`; // is to /src/page/**/_.js
  // console.log({ src, modules });
  const module = modules[src];
  if (!module) return null;
  return module().catch(console.error);
}

{ // init page
  if (location.hash !== '' && location.hash !== '#') {
    navigatePage(location.hash);
  }
  else {
    navigatePage('#/');
  }
}

window.onpopstate = async function navigateTo(ev) { // custom route
  // await navigatePage(location.hash); // spa
  window.stop(); this.location.reload();  // mpa
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

  const appBody = document.getElementById('app');
  appBody.innerHTML = '';
  appBody.appendChild(img);
}

if (location.origin.startsWith('https'))
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js', { scope: './' });
  }


import { alert } from '/src/alert.mjs';

