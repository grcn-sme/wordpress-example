
const sanatizer = document.createElement('body');
const safeHTMLtext = trustedTypes.createPolicy("html-sanatizer", {
    createHTML: function (html_string) {
        sanatizer.textContent = html_string;
        return sanatizer.innerHTML;
    }
});

export function html(strings, ...variableVal) {
    const cleaned = variableVal.map(x => {
        return safeHTMLtext.createHTML(x);
    });
    return String.raw({ raw: strings }, ...cleaned);
}




// const body = document.createElement('body');
// export function html(strings, ...variableVal) {
//     const cleaned = variableVal.map(x=>{
//         body.textContent = x;
//         return body.innerHTML;
//     });
//     console.log({cleaned});

//     return String.raw({ raw: strings }, ...cleaned);
// }
