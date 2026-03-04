
// 1. Handle the CORS Preflight (Mandatory for browser POSTs)
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "86400",
        },
    });
}

// 2. Handle the actual POST request
export async function onRequestPost(context) {
    /** @type {Request} */
    const request = context.request;
    const url = transformURL(request.url);

    const requestHeader = new Headers(request.headers);
    requestHeader.set('Host', url.host);
    return await fetch(url.toString(), {
        method: "POST",
        headers: requestHeader,
        body: request.body, // Stream the POST body directly
        redirect: "manual",
    });
}


/** change host to `.fps.goog`
 * @param {string} link
 */
function transformURL(link) {
    const url = new URL(link);
    const ga4Id = url.searchParams.get('tid');
    url.host = `${ga4Id}.fps.goog`;
    return url;
}