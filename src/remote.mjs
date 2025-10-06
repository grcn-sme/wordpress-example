/** @type {AbortController} */
let controller = { abort: _ => { /** no-op */ } };

export async function getRemoteStaticCode() {
    controller.abort('request is called again');
    controller = new AbortController();

    // DOC_URL/export?format=txt
    const url = 'https://docs.google.com/document/d/1_xPg9-MzjfJ9Xv10nuQo9fc-NWq8G_e4pF1xvpADDxU/export?tab=t.0&format=txt';
    const response = await fetch(url, {
        mode: 'cors',
        signal: controller.signal
    });
    const htmlContent = await response.text();
    console.log({ htmlContent });
    return htmlContent;
}