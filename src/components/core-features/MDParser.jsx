import init, { parse_markdown } from "rust-markdown";   // <-- new "main" parser.
//import {parse_markdown} from "../../rust-markdown/pkg/rust_markdown.js";
import MarkdownIt from "markdown-it";
import markdownItTaskLists from "markdown-it-task-lists";
/* ^ Not sure why I'm getting the "... Could not find a declaration file..." prefix here,
it does seem to work and if I remove it the emote for the checkbox dissapears. [!] */

// EDIT: Markdown-It is now the "fall-back" parser, a backup to the Comrak RUST parser that will be used from now on.
const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true
}).use(markdownItTaskLists);

// Placeholder var for Comrak parse_markdown function, the RUST-powered Markdown Parser (and condition var to check when WASM is ready):
let comrakParser = null;
let wasmReady = false;

// Async init wrapper:
export async function initComrak() {
    if(wasmReady) return;
    console.log("8/23/2025-DEBUG: Inside function initComrak()...");

    try {
        await init();
        comrakParser = (markdownText) => parse_markdown(markdownText);
        wasmReady = true;
        console.log("[MDParser]: Comrak (RUST) Markdown Parser initialized and ready to go!");
    } catch(err) {
        console.error("[ERROR][MDParser]: Failed to initialize Comrak, fallback parser Markdown-It will be used for rendering instead. Err: ", err);
    }
}
//initComrak();

// 8/23/2025-DEBUG: Below.
export function isWasmReady() {
    return wasmReady;
}
// 8/23/2025-DEBUG: Above.

// This function below is supposed to take Markdown text and convert it to HTML:
export const parseMarkdown = (markdownText) => {
    if(comrakParser && wasmReady) {
        try {
            //console.log("DEBUG: Using comrakParser...");
            return comrakParser(markdownText);
        } catch(err) {
            console.error("[ERROR][MDParser]: Comrak parsing failed, falling back to Markdown-It.", err);
        }
    }
    return md.render(markdownText);
};
