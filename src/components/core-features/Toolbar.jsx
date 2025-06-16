// Toolbar.jsx, the file for defining the Editor's Toolbar (modeled after the one HackMD uses):
import React, { useState } from 'react';
import cloudinary from "cloudinary-core";
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $createRangeSelection, $getSelection, $isRangeSelection, $setSelection, $isTextNode, $isRootNode, $createLineBreakNode, $getRoot, $createTextNode, $isParagraphNode, $createParagraphNode } from "lexical";
import {UNDO_COMMAND, REDO_COMMAND} from "lexical"; // For the "UNDO" and "REDO" functionality of the site.
import { findCursorPos } from '../utility/utilityFuncs.js';
import { btnStyleEd } from '../utility/utilityFuncs.js';

// The following three consts are for the "Insert Image" functionality (using Cloudinary as a server to store uploads):
const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const cloudAPIKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
const cloudUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

function Toolbar() {
    // The line below is for applying the styling changes in the toolbar:
    const[editor] = useLexicalComposerContext();

    // Function for finding substring (start and end) indices in a string given an "anchor" value:
    function subStrIndices(anchorVal, stringVal, subStrVal) {
        let startIndex = stringVal.indexOf(subStrVal);
        let endIndex = null;

        while(startIndex !== -1) {
            endIndex = startIndex + subStrVal.length;
            if(startIndex <= anchorVal && anchorVal <= endIndex) {
                return { startIndexFinal: startIndex, endIndexFinal: endIndex }; 
            }
            // Finding the next occurrence (if there is any):
            startIndex = stringVal.indexOf(subStrVal, startIndex + 1);
        }
        return null;
    }

    // Function for applying the UNDO functionality:
    const applyMarkdownFormatUndo = (editor) => {
        editor.update(() => {
            editor.dispatchCommand(UNDO_COMMAND, undefined);
        });
    };

    // Function for applying the REDO functionality:
    const applyMarkdownFormatRedo = (editor) => {
        editor.update(()=> {
            editor.dispatchCommand(REDO_COMMAND, undefined);
        });
    };

    // Function for inserting the [B]"Bold", [I]"Italics", [S]"Strikethrough", [C]"Code" and [L]"Create Link" Markdown formatting:
    /* With the toolbar I create for the text entry area, I don't want the "bold", "italic", "strikethrough", "code", and "create link"
    buttons to apply the styling directly over the text being typed, instead I want the Markdown formatting for those
    stylings to be applied over the space. This function does that: */ 
    const applyMarkdownFormatBISCL = (wrapper1, wrapper2) => {
        editor.update(() => {
            let selection = $getSelection();
            if (!$isRangeSelection(selection)) return;  // $isRangeSelection(...) is a type-checking function, ensuring "selection" (cursor area) exists within the editor.

            let reposValue = null;
            if (wrapper2 === "**" || wrapper2 === "~~") {
                reposValue = 2;
            } else if (wrapper2 === "*") {
                reposValue = 1;
            } else if (wrapper1 === "[") {
                reposValue = 11;
            } else {
                if(wrapper1 === "```\n") {
                    reposValue = 4;
                }
            }

            // DEBUG: Beginning to mimic applyMarkdownFormatcode here.
            // NOTE: ^ Come back and see if I recycle more of this into re-usable utility functions...
            const selectedText = selection.getTextContent();
            let {anchor} = selection;
            let anchorNode = anchor.getNode();
            let editorTextFull = $getRoot().getTextContent();
            let anchorOffset = anchor.offset;

            /* NOTE: Calculating the current editor cursor position, at the time that this .update(...) function was invoked, is tricky.
            Despite what some sources online will say, anchor.offset *alone* won't cut it if multiple \n characters are present in your 
            text editor or if the cursor position is on an empty line. (This has to do with how Lexical partitions its text-editor text
            into seperate nodes, see more in function "findCursorPos"). */
            const paraNodes = $getRoot().getChildren();
            let absoluteCursorPos = findCursorPos(paraNodes, anchorNode, anchorOffset); // This var is mainly relevant if cursor selection is "" (empty).
            let cursorPosChar = editorTextFull.charAt(Math.max(absoluteCursorPos-1, 0)); 
            let wrappedText = null;
            let updatedSelection = null;
            let updatedAnchorNode = null;
            let updatedSelectedText = null;
            let newEditorTextFull = null;
            let newCursorPos = null;
            let newSelection = null;

            // the actual stuff:
            if(selectedText.includes("\n") || (selectedText === "" && (selectedText === editorTextFull || cursorPosChar === "\n" || absoluteCursorPos === 0))) {
                // Scenario 1. If the current line is empty -> {wrapper1}cursor{wrapper2} OR multi-line text highlighted -> {wrapper1}text{wrapper2}: 
                wrappedText = `${wrapper1}${selectedText}${wrapper2}`;
                selection.insertText(wrappedText);

                updatedSelection = $getSelection();
                updatedAnchorNode = updatedSelection.anchor.getNode();
                updatedSelectedText = String(updatedAnchorNode.getTextContent());
                newEditorTextFull = $getRoot().getTextContent();

                if(selectedText === "") {
                    /* NOTE: These subsequent two lines, while they may appear redundant, are necessary for the empty string scenario.
                    Otherwise, I will face the "Lexical Error: TypeError: anchorNode.selectionTransform is not a function" error. Despite
                    what I've read on the internet about not being able to "refresh" the editor content until the update function finishes,
                    the three steps below (mostly the first two) will infact "re-get" the selection content post-insertText(). */

                    if (updatedSelectedText === `${wrapper1}${wrapper2}`) {
                        newCursorPos = wrapper1.length;
                    } else {
                        /* Repositioning the cursor index when the insertText is invoked on a line that is *not* the latest empty line
                        in the text editor is tricky. My solution is verbose but works: The text editor content is broken up into nodes 
                        (the full text content is partitioned) and I need to reposition the cursor within the specific node that is being
                        dealt with. I can do this by finding the start and end indices of said node's string within the complete editor text,
                        figuring out if it's correct via absoluteCursorPosition, and then repositioning the cursor based on those values alone. */
                        // EDIT: ^ I re-use this a few times, so created an external function for it... [subStringIndices(...)]

                        const sStrIndices = subStrIndices(absoluteCursorPos, newEditorTextFull, updatedSelectedText);
                        newCursorPos = (absoluteCursorPos + wrapper1.length) - sStrIndices.startIndexFinal;
                    }
                } else {
                    // Scenario 1b (multi-line highlighted):
                    let absCursorPosAdjust = absoluteCursorPos + wrapper1.length;
                    const sStrIndices = subStrIndices(absCursorPosAdjust, newEditorTextFull, updatedSelectedText);
                    newCursorPos = absCursorPosAdjust - sStrIndices.startIndexFinal + 1;
                }
            } else {
                // This "else" branch will catch all scenarios where the line is NOT empty.

                if(wrapper1 === "```\n" && wrapper2 === "\n```") {
                    // Adjustments need to be made for the Code format here:
                    wrapper1 = "`";
                    wrapper2 = "`";
                    reposValue = 1;
                }

                if(selectedText !== "") {
                    // Scenario 2. There is highlighted text ->{wrapper1}highlighted_text{wrapper2} (also NOTE: cursor would be moved prior to the second wrapper):
                    wrappedText = `${wrapper1}${selectedText}${wrapper2}`;  
                } else {
                    // Scenario 3. No highlighted text but the line is NOT empty (and cursor is not at the start) -> existing_line{`cursor_pos`}:
                    wrappedText = `${wrapper1}${wrapper2}`;
                }
                selection.insertText(wrappedText);

                newCursorPos = anchorOffset + wrapper1.length;
            }
            newSelection = $createRangeSelection();

            // Ensure updatedAnchorNode is a valid TextNode
            const nodeForCursor = updatedAnchorNode ?? anchorNode;
            if (!$isTextNode(nodeForCursor)) {
                const fallback = nodeForCursor.getFirstDescendant();
                if ($isTextNode(fallback)) {
                    updatedAnchorNode = fallback;
                } else {
                    const newTextNode = $createTextNode("");
                    nodeForCursor.append(newTextNode);
                    updatedAnchorNode = newTextNode;
                }
            }

            newSelection.setTextNodeRange(updatedAnchorNode ?? anchorNode, newCursorPos, updatedAnchorNode ?? anchorNode, newCursorPos);
            $setSelection(newSelection);
        });
    };

    // Sep Function for applying "Heading" since it works differently than the others (prepends a "# " string and "builds" on repeated clicks):
    const applyMarkdownFormatHead = (editor) => {
        editor.update(() => {
            const selection = $getSelection();
            if(!$isRangeSelection(selection)) return;
           
            let {anchor} = selection;
            let anchorNode = anchor.getNode();
            console.log("DEBUG: the value of anchorNode => [", anchorNode, "]");

            // EDIT: These two if-conditions below were added after tweaks to my <CollaborationPlugin> setup kind of bricked the function.
            if($isRootNode(anchorNode)) {
                const root = $getRoot();
                root.clear();
                const paragraph = $createParagraphNode();
                root.append(paragraph);
                anchorNode = paragraph;
            }
            if($isParagraphNode(anchorNode)) {
                const textNode = $createTextNode();
                anchorNode.append(textNode);
                anchorNode = textNode;
            }

            const selectedText = selection.getTextContent(); 
            const selectionNodes = selection.getNodes();
            let anchorNodeKey = anchorNode.getKey();
            let wrappedText = null;
            let currentLineT = null;
            let updatedLineT = null;
            let newSelection = null;

            // NOTE: We *do* want to use "==" for the anchorNodeKey value comp...
            if(anchorNodeKey == 2 && selectedText === "") {
                // Scenario 1. When the Header button is invoked for a single empty line (getKeyValue will always be 2).
                console.log("Empty line targeted with adding of header symbol.");
                wrappedText = `${"# "}${selectedText}`;
                selection.insertText(wrappedText);
            } else {
                // Scenario 2. When the Header button is invoked for single or multi-line highlighted selection.
                selectionNodes.forEach((sNode) => {

                    if($isTextNode(sNode)) {
                        // For applying the actual "Header" format insertion:
                        /* So I want to count the number of "#" characters at the start of this line.
                        And I only want to truly consider them if the substring of # characters is followed by a whitespace.
                        If it's followed by anything else -- as per how it functions on HackMD -- they aren't counted as part of the heading config.
                        Also HackMD only counts the first 6 # characters "stacked" together (so that's the deepest depth).
                        - So if it's "###### text" on the line and the user selects "H" button, then it wipes those #s entirely.
                        - If there is <6 #s, it "stacks" and if there are >6 #s, it prepends "# "
                        - Something like #######text is treated as any arbitrary string (we prepend "# "). */
                        currentLineT = sNode.getTextContent();
                        const hashMatch = currentLineT.match(/^(#+)(\s?)/);
                        const hashCount = hashMatch ? hashMatch[1].length: 0;
                        const wSpaceSuffix = hashMatch ? hashMatch[2] === " " : false;
                        console.log("Line \"" + currentLineT + "\" targeted with adding of Header symbol. There are " + hashCount + " #s and whitespace suffix status: " + wSpaceSuffix);            

                        if(!wSpaceSuffix) {
                            updatedLineT = "# " + currentLineT;         // "# " is prepended to the line.
                            console.log("Line targeted for adding Header symbol will have \"# \" prepended. (No discernable whitespace prefix following possible #s).");
                        }else if(wSpaceSuffix && hashCount < 6) {
                            updatedLineT = "#" + currentLineT;          // "#" is prepended to the line.
                            console.log("Line targeted for adding Header symbol will have \"#\" prepended. (Existing #(s)whitespace detected).");
                        } else if (wSpaceSuffix && hashCount === 6) {
                            updatedLineT = currentLineT.slice(7);       // trim out the "###### " line prefix.
                            console.log("Line targeted for adding Header symbol will trim its #+ prefix. (Maximum depth of #s is 6).");
                        } else {
                            updatedLineT = "# " + currentLineT;         // >6 #s with whitespace will be treated as an irrelevant string.
                            console.log("Line targeted for adding Header symbol will have \"#\" prepended. (No pre-existing #+whitespace present).");
                        }

                        // Reposition cursor by reconfiguring selection (loop will inevitably end at the line we were on in the editor): 
                        newSelection = $createRangeSelection();
                        newSelection.anchor.set(sNode.getKey(), updatedLineT.length, "text");
                        newSelection.focus.set(sNode.getKey(), updatedLineT.length, "text");
                        $setSelection(newSelection);
                        sNode.setTextContent(updatedLineT); // set new text content!
                    }
                });
            }
        });  
    };

    // Sep Function for applying "Quote", "Generic List", "Numbered List", or "Check List" (just adds "[symbol] " to the start of the current line)...
    // NOTE: What separates the "Heading" function from this one is that the symbols will "stack" in the "Heading" function (unlike here).
    const applyMarkdownFormatQGNC = (editor, whichOne) => {

        // Function will determine what string should be inserted into the text editor based on the function arguments:
        /* NOTE: arg "multiLine" is mostly relevant if whichOne === "numbered" (so that multi-line insertions will be numbered ascendingly).
        "multiLine" will be a boolean value and multiLineS will be the symbol to prepend (these will be passed in by the calling code. 
        NOTE: When multiLine is false, multiLineS will have 1 passed in by default... */
        function calcUpdatedLineT(whichOne, lineText, multiLine, multiLineS) {

            let updatedLineT = null;
            if ((whichOne === "quote" && (lineText.length >=2 && lineText[0] === ">" && lineText[1] === " ")) ||
                (whichOne === "generic" && (lineText.length >= 2 && lineText[0] === "*" && lineText[1] === " ")) ||
                (whichOne === "numbered" && (lineText.length >= 3 && lineText[0] === String(multiLineS) && lineText[1] === "." && lineText[2] === " ")) ||
                (whichOne === "checkList" && (lineText.length >= 6 && lineText[0] === "-" && lineText[1] === " " && lineText[2] === "[" && lineText[3] === " " && lineText[4] === "]" && lineText[5] === " "))) {

                if(whichOne === "quote") {
                    if(lineText.length === 2) {
                        updatedLineT = "";
                    } else {
                        updatedLineT = lineText.substring(2, lineText.length);
                    }
                } else if (whichOne === "generic") {
                    if(lineText.length === 2) {
                        updatedLineT = "";
                    } else {
                        updatedLineT = lineText.substring(2, lineText.length);
                    }
                } else if (whichOne === "numbered") {
                    if(lineText.length === 3) {
                        updatedLineT = "";
                    } else {
                        updatedLineT = lineText.substring(3, lineText.length);
                    }
                } else {
                    // checkList:
                    if(lineText.length === 6) {
                        updatedLineT = "";
                    } else {
                        updatedLineT = lineText.substring(6, lineText.length);
                    }
                }
            } else {
                if(whichOne === "quote") {
                    updatedLineT = "> " + lineText;
                } else if (whichOne === "generic") {
                    updatedLineT = "* " + lineText;
                } else if (whichOne === "numbered") {
                    if(multiLine === false) {
                        updatedLineT = "1. " + lineText;
                    } else {
                        updatedLineT = String(multiLineS) + ". " + lineText;
                    }
                } else {
                    updatedLineT = "- [ ] " + lineText;
                }
            }
            return updatedLineT;
        }

        editor.update(() => {
            let selection = $getSelection();
            if(!$isRangeSelection(selection)) return;

            let selectedText = selection.getTextContent();
            let {anchor} = selection;
            let anchorNode = anchor.getNode();

            // EDIT: Need this if-branch below because of adjustments I made to the <CollaborationPlugin> setup that kind of bricked things!!!
            if($isRootNode(anchorNode)) {
                const root = $getRoot();
                root.clear();
                const paragraph = $createParagraphNode();
                root.append(paragraph);
                anchorNode = paragraph;
                // update these:
                selection = $getSelection();
                selectedText = selection.getTextContent();
                anchor = selection.anchor;
            }
            let anchorNodeKey = anchorNode.getKey();
            let anchorOffset = anchor.offset;

            const paraNodes = $getRoot().getChildren();
            let lineText = null;
            let updatedLineT = null;
            let wrappedText = null;
            let absoluteCursorPos = findCursorPos(paraNodes, anchorNode, anchorOffset);
            
            // NOTE: Must use "==" here for the equivalence when using anchorNodeKey.
            if(absoluteCursorPos == 0 && selectedText === "") {
                // Scenario 1. When the Quote button is invoked for a single empty line (getKey value will always be 2):
                if(whichOne === "quote") {
                    wrappedText = `${"> "}${selectedText}`;
                } else if(whichOne === "generic") {
                    wrappedText = `${"* "}${selectedText}`;
                } else if(whichOne === "numbered") {
                    wrappedText = `${"1. "}${selectedText}`; // NOTE: "1." is always being prepended even on single lines that follow something like "2. something\n" (when clicking the button).
                } else {
                    // this branch will be for checkList...
                    wrappedText = `${"- [ ] "}${selectedText}`;
                }

                selection.insertText(wrappedText);
            } else if (!selectedText.includes("\n")) {
                // Scenario 2. When the Quote button is invoked for a single line but it's not empty.

                // Finding the text content of the current line:
                for(const paragraph of paraNodes) {
                    if(paragraph.getChildren()) {
                        const paraChildren = paragraph.getChildren();

                        for(let i = 0; i < paraChildren.length; i++) {
                            const paraChild = paraChildren[i];
                                
                            if($isTextNode(paraChild)) {
                                if(anchorNodeKey === paraChild.getKey()) {
                                    lineText = paraChild.getTextContent(); 
                                    break;
                                }
                            }
                        }
                    }
                }

                /* To insert "[symbol] " before the current line text (or the Alt), I am going to need the value of anchor.offset but I'm also going to
                have to apply the deleteLine() function, which will alter anchor.offset, so I must preserve its value somehow (or at least,
                preserve the fact that it potentially had a value that is significant to how the logic progresses): */  
                // NOTE: selectedText === lineText needed for a bizarre bug that occurs where offset is different when you slide the cursor right-to-left to highlight full line text rather than double-clicking.              
                let anchorOffsetFreeze = null;
                if(anchor.offset === 0 || selectedText === lineText) {
                    anchorOffsetFreeze = 0;
                }

                // If "[symbol] " is already at the start of the line, then it's just undone (NOTE: This is how it's done in HackMD).
                // NOTE: ^ It'll be undone in this situation but not if multiple lines are highlighted... (so I'll follow that too).
                // EDIT: Ported all the code below into external function "calcUpdatedLineT"...
                updatedLineT = calcUpdatedLineT(whichOne, lineText, false, 1);

                selection.deleteLine();
                // When anchor.offset pre-deleteLine() is 0, I don't want to have those two following lines (but otherwise I do).
                if(anchorOffsetFreeze !== 0) {
                    selection.deleteLine(false);
                    selection.deleteLine(true);
                }

                selection.insertText(updatedLineT);
            } else {
                // Scenario 3. When the Quote button is invoked for a multi-line selection...
               
                // selection.getNodes() retrieves all the nodes affected by the highlighted text (and from there I can alter their content):
                let multiLineS = 1;
                const selectionNodes = selection.getNodes();
                selectionNodes.forEach((sNode) => {
                    if($isTextNode(sNode)) {
                        updatedLineT = calcUpdatedLineT(whichOne, sNode.getTextContent(), true, multiLineS);
                        sNode.setTextContent(updatedLineT);
                        multiLineS += 1;
                    }
                });
            }
        })
    };

    // Sep Function for applying the Horizontal Line insertion:
    const applyMarkdownFormatHLine = (editor) => {

        editor.update(() => {
            const selection = $getSelection();
            // invalid selection (cursor not present in the text editor space):
            if(!$isRangeSelection(selection)) {
                return;
            }

            /* This should be fairly obvious, I'm just inserting \n\n---\n (and cursor is just placed *after* the line, which is one of the
            stylistic deviations I will be taking away from HackMD). */
            let selectionText = selection.getTextContent();
            let wrappedText = `${selectionText}${"\n\n---"}`;
            selection.insertText(wrappedText);

            /* wrappedText should really be "\n\n---\n" but ending the insertion text with "\n" causes strange behavior, 
            so a manual linebreak will have to do here: */
            const updatedSelection = $getSelection();
            const lineBreakNode = $createLineBreakNode();
            updatedSelection.insertNodes([lineBreakNode]);
        });
    }

    // Sep Function for applying the Image insertion:
    const applyMarkdownFormatImage = (editor) => {    
        // So I'm using Cloudinary here. I'll be uploading files to the server via their widget...
        window.cloudinary.openUploadWidget(
            {
                cloudName: cloudName,
                uploadPreset: cloudUploadPreset,
                sources: ["local", "url", "camera"],
                multiple:false,
                theme: "minimal",
            },
            (error, result) => {
                if(result && result.event === "success") {
                    // When the upload is successful, handle the result:
                    const uploadedImageURL = result.info.secure_url;
                    console.log("IMAGE HAS BEEN SUCCESSFULLY SENT TO THE CLOUDINARY SERVER!!!");

                    // Adding the uploaded image URL into the Text Editor space:
                    editor.update(() => {
                        const selection = $getSelection();

                        if(!$isRangeSelection(selection)) {
                            return;
                        }
                        let selectionText = selection.getTextContent();
                        const imageMDFormat = `![Image](${uploadedImageURL})`;
                        selection.insertText(`${selectionText}${imageMDFormat}`);

                        console.log("IMAGE SUCCESSFULLY INSERTED INTO THE EDITOR!!!");

                        // Add a line break after the image
                        const updatedSelection = $getSelection();
                        const lineBreakNode = $createLineBreakNode();
                        updatedSelection.insertNodes([lineBreakNode]);
                    });
                } else {
                    // console.error will trigger here even if the upload is successful with an undefined error, so only log if it's intelligible. 
                    if(error) {
                        console.error("ERROR: Upload Failed => ", error);
                    }
                }
            }
        );
    };

    return (<div style={{backgroundColor:"#003B00"}}>
        {/* NOTE: Added these two buttons below (UNDO and REDO) well after finishing the ones below... */}
        {/* UNDO BUTTON: */}
        <button style={btnStyleEd} onClick={()=>{
            applyMarkdownFormatUndo(editor);
        }}>UNDO</button>

        {/* REDO BUTTON: */}
        <button style={btnStyleEd} onClick={()=>{
            applyMarkdownFormatRedo(editor);
        }}>REDO</button>

        {/*--------------------------------------------------------- */}
        {/* Creating the button that responds to "bold" */}
        <button style={btnStyleEd} onClick={()=>{
            applyMarkdownFormatBISCL("**","**")
        }}>B</button>
        {/* Creating the button that responds to "italic" */}
        <button style={btnStyleEd} onClick={()=>{
            applyMarkdownFormatBISCL("*","*")
        }}>I</button>
        {/* Creating the button that responds to "strikethrough" */}
        <button style={btnStyleEd} onClick={()=>{
            applyMarkdownFormatBISCL("~~","~~")
        }}>S</button>

        {/* Creating the button that responds to "header" (will require a separate function than those above) */}
        <button style={btnStyleEd} onClick={()=>{
            applyMarkdownFormatHead(editor)
        }}>H</button>

        {/* Creating the button that responds to "code" (adding the ```code``` etc block thing, which will require a seperate function) */}
        <button style={btnStyleEd} onClick={()=>{
            //applyMarkdownFormatCode(editor)
            applyMarkdownFormatBISCL("```\n", "\n```");
        }}>&#60;/&#62;</button>

        {/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        DO NOT FORGET THAT THE FOUR BUTTONS BELOW NEED SOME EXTRA FUNCTIONALITY
        THAT IS PROBABLY TO BE WRITTEN OUTSIDE OF THIS Toolbar.jsx FILE. (SEE DEBUG COMMENT BELOW THEM). */}

        {/* #1 - Creating the button that responds to "quote" */}
        <button style={btnStyleEd} onClick={()=>{
            const applyQuote = "quote";
            applyMarkdownFormatQGNC(editor, applyQuote)
        }}>" "</button>

        {/* #2 - Creating the button that responds to "generic" */}
        <button style={btnStyleEd} onClick={()=> {
            const applyGeneric = "generic";
            applyMarkdownFormatQGNC(editor, applyGeneric)
        }}>*</button>

        {/* #3 - Creating the button that responds to "numbered list" */}
        <button style={btnStyleEd} onClick={()=> {
            const applyNumbered = "numbered";
            applyMarkdownFormatQGNC(editor, applyNumbered)
        }}>1.</button>

        {/* #4 - Creating the button that responds to "check list" */}
        <button style={btnStyleEd} onClick={()=> {
            const applyCheckList = "checkList";
            applyMarkdownFormatQGNC(editor, applyCheckList)
        }}>-[]</button>

        {/* Creating the button that responds to "create link" */}
        <button style={btnStyleEd} onClick={()=> {
            applyMarkdownFormatBISCL("[", "](https://)")
        }}>LINK</button>

        {/* Creating the button that responds to "insert table" */}
        <button style={btnStyleEd} onClick={()=> {
            applyMarkdownFormatTable(editor)
        }}>TABLE</button>

        {/* Creating the button that responds to "insert horizontal line" */}
        <button style={btnStyleEd} onClick={()=> {
            applyMarkdownFormatHLine(editor)
        }}>LINE</button>

        {/* Creating the button that responds to "Insert image" */}
        <button style={btnStyleEd} onClick={()=> {
            applyMarkdownFormatImage(editor)
        }}>IMAGE</button>

    </div>);
}

export default Toolbar;
