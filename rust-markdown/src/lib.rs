use wasm_bindgen::prelude::*;
use comrak::{markdown_to_html, ComrakOptions};

#[wasm_bindgen]
pub fn parse_markdown(input: &str) -> String {
    let mut options = ComrakOptions::default();
    // All the specs I'll need to match markdown-it:
    options.extension.strikethrough = true;
    options.extension.table = true;
    options.extension.tasklist = true;
    options.render.hardbreaks = true;   // I manually specify this for markdown-it too.

    markdown_to_html(input, &options)
}

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    alert(&format!("Hello, {}!", name));
}
