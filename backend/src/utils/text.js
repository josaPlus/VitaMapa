"use strict";

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// búsqueda parcial, sin mayúsculas y sin acentos: "clinica" encuentra "Clínica"
function buildSearchRegex(text) {
    const accents = { a: "aá", e: "eé", i: "ií", o: "oó", u: "uúü", n: "nñ" };

    const pattern = escapeRegex(
        text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    ).replace(/[aeioun]/g, (letter) => `[${accents[letter]}]`);

    return new RegExp(pattern, "i");
}

module.exports = { escapeRegex, buildSearchRegex };
