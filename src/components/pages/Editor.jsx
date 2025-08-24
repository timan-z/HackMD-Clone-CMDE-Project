import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from "react-router-dom"; 
import {v4 as uuidv4} from 'uuid';
// standard Lexical imports:
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $getSelection, $isRangeSelection, $isTextNode, $createParagraphNode, $createTextNode} from 'lexical';
// custom imports:
import { btnStyleEd } from "../utility/utilityFuncs.js";
import { parseMarkdown, initComrak, isWasmReady } from "../core-features/MDParser.jsx"; // 8/23/2025: Yeah.
import { findCursorPos } from '../utility/utilityFuncs.js';
import { RemoteCursorOverlay } from '../core-features/RemoteCursorOverlay.jsx';
import Toolbar from "../core-features/Toolbar.jsx";
import UsersListContainer from '../misc-features/UsersListContainer.jsx';
import NotificationBar from '../misc-features/NotificationBar.jsx';
// yjs-related:
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
// Socket.IO-related: 
import { io } from "socket.io-client";
import { throttle } from "lodash";

// NOTE: socket_base string manipulation below has to do with Railway (where I'm hosting backend stuff) and how paths are specified over there.
let socket_base = import.meta.env.VITE_SOCKET_BASE;
if(socket_base.endsWith('/')) {
    socket_base = socket_base.slice(0, -1);
}
//console.log("DEBUG: Value of socket_base => ", socket_base);
//console.log("DEBUG: Value of VITE_YJS_WS_URL =>", import.meta.env.VITE_YJS_WS_URL);

function initialEditorState() {
  const root = $getRoot();
  const paragraph = $createParagraphNode();
  const text = $createTextNode(''); 
  paragraph.append(text);
  root.append(paragraph);
}


/* Using "socket" for the real-time interaction features but also tying RemoteCursorOverlay.jsx
back to my Text Editor (while using <CollaborationPlugin/>). */
//const socket = io("http://localhost:4000");
const socket = io(socket_base, {withCredentials: true}); // <-- DEBUG: Will need to change this when I host on backend (testing now for server.js addition).
//console.log("DEBUG: The value of import.meta.env.VITE_SOCKET_BASE => ", import.meta.env.VITE_SOCKET_BASE);

// NOTE: This is just one of the sample themes offered in the Lexical documentation: https://lexical.dev/docs/getting-started/theming (didn't change anything).
const sampleTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5',
    h6: 'editor-heading-h6',
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem',
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listItem',
    listitemChecked: 'editor-listItemChecked',
    listitemUnchecked: 'editor-listItemUnchecked',
  },
  hashtag: 'editor-hashtag',
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-textBold',
    code: 'editor-textCode',
    italic: 'editor-textItalic',
    strikethrough: 'editor-textStrikethrough',
    subscript: 'editor-textSubscript',
    superscript: 'editor-textSuperscript',
    underline: 'editor-textUnderline',
    underlineStrikethrough: 'editor-textUnderlineStrikethrough',
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable',
  },
};

// Most of the "content" of the LexicalComposer component (Text Editor) will be in this child element here:
function EditorContent({ token, loadUser, loadRoomUsers, roomId, userData, username, userId, setUser, saveRoomData, getRoomData, docRef, hasJoinedRef, loadContent }) {  
  // "Main" state variables:
  const hasLoadedRef = useRef(false);
  const hasConnectedRef = useRef(false);  // This and the one below also relate to the pre-existing doc state loading...
  const hasSyncedRef = useRef(false);
  const [editor] = useLexicalComposerContext();
  const [lineCount, setLineCount] = useState(1);
  const [currentLine, setCurrentLine] = useState(1);
  const [editorContent, setEditorContent] = useState(""); // Stores raw markdown. (This, and the one below, are mainly for the MD rendering effect).
  const [parsedContent, setParsedContent] = useState(""); // Stores parsed HTML.
  const [viewMode, setViewMode] = useState("split"); // For toggling the "view mode" of the webpage (wrt Text Editor and Preview Panel).
  const [editorWidth, setEditorWidth] = useState(50); // This, and the one below, are for the "draggable" divider line that lets you adjust Editor and Preview Panel width (in split view).
  const isResizing = useRef(false);
  const [isDraggingMD, setIsDraggingMD] = useState(false); // For the "drag-and-drop .md files" feature.
  const [otherCursors, setOtherCursors] = useState([]); // This, and the one below, are for rendering the cursors of foreign clients during real-time collaboration.
  const cursorPos = useRef(0); // Needed for maintaining cursor position post-changes in collaborative editing.
  const [kicked, setKicked] = useState(false);

  // Mostly cosmetic ("Secondary") state variables:
  const [editorFont, setEditorFont] = useState("Arial");
  const [previewFont, setPreviewFont] = useState("Arial");
  const [edFontSize, setEdFontSize] = useState(16);
  const [prevFontSize, setPrevFontSize] = useState(16);
  const [editorBColour, setEditorBColour] = useState("#FFFFFF");
  const [previewBColour, setPreviewBColour] = useState("#FFFFFF");
  const [editorTColour, setEditorTColour] = useState("#000000");
  const [previewTColour, setPreviewTColour] = useState("#000000");
  const [usersList, setUsersList] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [showUsersList, setShowUsersList] = useState(false);  
  const [showNotifs, setShowNotifs] = useState(false);

  // Additions for Railway and Netlify (mostly the former) deployment:
  const providersById = useRef(new Map());
  const [hydrated, setHydrated] = useState(false);
  // Additions for the RUST-powered markdown renderer (Comrak) that I'll now be relying on primarily:
  const initRustParser = useRef(false);
  const providerRef = useRef(null);
  const [wasmReady, setWasmReady] = useState(isWasmReady());

  // useEffect hook that will run once (guards set in place) on page load to initialize Comrak (our RUST-powered MD renderer):
  useEffect(() => {
    if(!initRustParser.current) {
      let mounted = true;
      initComrak().then(() => {
        if(mounted) setWasmReady(true);
      });
      initRustParser.current = true;
      return () => {mounted = false};
    }
  }, []);

  // Function for returning to the dashboard (invoked when the Dashboard Icon button is clicked):
  const navigate = useNavigate();
  const goToDashboard = () => {
    hasJoinedRef.current = false;
    navigate("/dashboard");
  };

  // Function for triggering the Users List popup and "shadowing" the Users List button when clicked:
  const toggleUsersList = () => {
    let usersListBtn = document.getElementById('users-list-button');
    if(!showUsersList) {
      usersListBtn.classList.add('users-l-add-shadow');
    } else {
      usersListBtn.classList.remove('users-l-add-shadow');
    }
    setShowUsersList(prev => !prev);
  };
  
  // Function for triggering the Notifications popup and "shadowing" the Notifications button when clicked:
  const toggleNotifs = () => {
    let notifsBtn = document.getElementById('notifs-button');
    if(!showNotifs) {
      notifsBtn.classList.add('users-l-add-shadow');
      // If the Notifs Icon is currently red (implying new notifications), clicking it will get rid of the applied red:
      if(notifsBtn.style.backgroundColor === 'red') {
        notifsBtn.style.backgroundColor = '#00FF41';
      }
    } else {
      notifsBtn.classList.remove('users-l-add-shadow');
    }
    setShowNotifs(prev => !prev);
  };
  
  // Function for handling the webpage view toggle between the Text Editor and Preview Panel (Split, Editor, Preview):
  const handleViewChange = (mode) => {
    setViewMode(mode);
    let textEdSpace = document.getElementById("text-editor-space");
    let prevPanSpace = document.getElementById("preview-panel-space");

    if(mode === "split") {
      setEditorWidth(50); // Needed for resetting the Text Editor and Preview Panel dimensions after potential adjustments with the slider. 

      if(prevPanSpace) {
        prevPanSpace.classList.remove("preview-panel-space-full");
        prevPanSpace.classList.add("preview-panel-space-split");
      }
      if(textEdSpace) {
        textEdSpace.classList.remove("text-editor-space-full");
        textEdSpace.classList.add("text-editor-space-split");
      }
    } else if(mode === "editor-only") {
      setEditorWidth(100); // Make sure the Text Editor takes up the whole thing (by scaling it up to 100%)
      textEdSpace.classList.remove("text-editor-space-split");
      textEdSpace.classList.add("text-editor-space-full");
    } else {
      setEditorWidth(0); // Make sure the Preview Panel takes up the whole thing (by reducing the Text Editor to nothing).
      prevPanSpace.classList.remove("preview-panel-space-split");
      prevPanSpace.classList.add("preview-panel-space-full");
    }
  };

  // Function for handling the [1] "Upload File" and [2] "Download File" (both .md) functionality:
  // 1a. This function is for the actual .md file reading (opening it up, reading it, pasting to the Text Editor):
  const handleFileUploadMD = (file) => {
    // If invalid file:
    if(file.type !== "text/markdown" && !file.name.endsWith(".md")) {
      alert("Please upload a valid Markdown (.md) file."); // TO-DO: Just have an Alert for now..., but I want to change this to something more professional later on. (Pop-up -> click anywhere on screen to nullify).
      return;
    }
    
    // If there's existing text in the Text Editor, prompt asking if it should be replaced (Again, default "window.confirm" for now... TO-DO: Something more professional later on).
    if(editorContent.trim() === "" || (editorContent.trim() !== "" && window.confirm("Replace existing content?"))) {
      const reader = new FileReader();
      // Need to define the process here and then invoke it afterwards:
      reader.onload = () => {
        // This will get it.
        const text = reader.result;
        editor.update(() => {
          const root = $getRoot();
          root.clear(); // gets rid of current existing text.
          const selection = $getSelection();
          selection.insertText(text);
        });
      }
      // Invocation:
      reader.readAsText(file);
    }
  }
  // 1b. This function is for uploading the .md file via button:
  const handleFileUploadBtn = (event) => {
    if(!(event.target.files && event.target.files.length > 0)) {
      alert("NOTE: Something went wrong with the .md file upload.");
      return;
    }

    const fileInput = event.target;
    const file = fileInput.files[0];
    handleFileUploadMD(file);
    fileInput.value="";
  }
  // 1c. This function is for uploading the .md file via drag-and-drop into the Text Editor:
  const handleFileUploadDD = (event) => {
    event.preventDefault();
    setIsDraggingMD(false);
    const file = event.dataTransfer.files?.[0];
    if(file) handleFileUploadMD(file);
  }
  // 2. This function is for handling the download Text Editor content as .md file:
  const handleDownloadMD = () => {
    editor.update(() => {
      const root = $getRoot();
      const textEditorContent = root.getTextContent();
      if(!textEditorContent.trim()) {
        alert("The Text Editor is empty. Nothing to download at this moment!"); // TO-DO: I've a generic alert right now, but change this to something more formal later.
        return;
      }

      // Create a blob and use that to download:
      const blob = new Blob([textEditorContent]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "my_markdown.md";  // DEBUG: Maybe give the option to name it? Or maybe I can add something later where you can *name* this session and that'll be the file name. (not high priority).
      document.body.appendChild(a);
      a.click();
      // Get rid of the stuff after:
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  // Function for sending the current cursor position within the Editor to the Socket.IO server (with throttling for a slight delay in the rendering):
  const sendCursorToServer = throttle((cursorPos, username) => {
    socket.emit("send-cursor-pos", cursorPos, socket.id, username);
  }, 100);

  // Function for manually saving the Text Editor document state to the backend server:
  /*const saveDocState = () => {
    let docData = null;
    if(!token) return;

    editor.update(() => {
      const editorState = editor.getEditorState();
      docData = JSON.stringify(editorState);
      socket.emit("send-latest-doc", roomId, docData, token);
    });

    if(!docData) return;
    saveRoomData(roomId, docData, token);
  };*/

  // useEffect Hook #0: The one I want to run on mount (for requesting and retrieving the list of current users tied to this Room):
  const callLoadRoomUsers = async(roomId) => {
    const usersData = await loadRoomUsers(roomId);

    /* When this list of Users is exported, it takes "user_id" from my table user_rooms (for linking users to rooms).
    To prevent naming inconsistency headaches with setting state var "usersList" w/ usersData, I'm going to slightly
    tweak the returned array so that its user_id item is renamed to userId (and same w/ room_id => roomId): */
    const tweakedArr = usersData.map(user => ({
      userId: user.user_id,
      username: user.username,
      displayname: user.displayname,
      role: user.role,
      roomId: user.room_id,
    }));
    setUsersList(tweakedArr);
  };
  useEffect(() => {
    callLoadRoomUsers(roomId);
  }, []);

  // useEffect Hook #1: Listens for emits from the Socket.IO server:
  useEffect(()=> {
    // Handle notifications:
    const handleNotif = (notif) => {
      // Changing the colour of the Notifications Bar Icon to let the user know that they've received a notification:
      let notifBarCheck = document.getElementById('notification-bar');

      if(!notifBarCheck) {
        let notifsBtn = document.getElementById('notifs-button');
        notifsBtn.style.backgroundColor = 'red';
      }
      const id = uuidv4();
      const newNotif = { id, message: notif.message || notif, timestamp: Date(), };
      const stored = localStorage.getItem(`notifs-${roomId}`);
      const prev = stored ? JSON.parse(stored) : [];
      const updated = [...prev, newNotif];
      localStorage.setItem(`notifs-${roomId}`, JSON.stringify(updated));
    }
    socket.on("notification", handleNotif);

    // Listen to see if the current user gets kicked from the editing room:
    socket.on("you-have-been-kicked", () => {
      setKicked(true);
    });

    // Listen for an updated list of Active Users:
    socket.on("active-users-list", (activeUsers) => {
      setActiveUsersList(activeUsers);
    });

    // Stuff to be done if the user exits the Editor Room (to the Dashboard or just closes the tab or browser):
    const handleBeforeUnload = () => {
      if(hasLoadedRef.current) {
        editor.update(() => {
          //const editorState = editor.getEditorState();          
          //const jsonString = JSON.stringify(editorState); 
          // send copy of the latest Lexical editor document state:
          //socket.emit("send-latest-doc", roomId, jsonString, token);
          socket.off("active-cursors");
          socket.off("update-cursors");
          hasJoinedRef.current = false;
        });
        //socket.emit("leave-room", roomId, userData.id);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      socket.off("notification", handleNotif);
      socket.off("you-have-been-kicked");
      socket.off("active-users-list");
      //socket.off("load-existing");
      socket.off("notification", handleNotif);

      window.removeEventListener("beforeunload", handleBeforeUnload);
      handleBeforeUnload(); // If user navigates away within SPA, still save.
    };
  }, []);

  // useEffect Hook #2 - For client-instance text editor/state changes/emitting changes to server etc.
  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const textContent = $getRoot().getTextContent();
        const lines = textContent.split("\n").length; // Count total editor lines.
        setLineCount(lines);

        // Detecting current line of the Text Editor (that the cursor is positioned on):
        const paraNodes = $getRoot().getChildren();
        const selection = $getSelection();
        if(!selection) return;        
        let {anchor} = selection;
        let anchorNode = anchor.getNode();
        let anchorOffset = anchor.offset;
        let absoluteCursorPos = findCursorPos(paraNodes, anchorNode, anchorOffset); // let's see!
        cursorPos.current = absoluteCursorPos;
        let textContentTrunc = textContent.slice(0, absoluteCursorPos);
        let currentLine = textContentTrunc.split("\n").length;
        setCurrentLine(currentLine);
        sendCursorToServer(cursorPos.current, userData.username); // Let the Socket.IO server know this client's cursor position (important for my custom foreign cursor rendering).

        setEditorContent(textContent);  // This and the one below are for the Markdown renderer.
        if(wasmReady) {
          setParsedContent(parseMarkdown(textContent));
        }
      });
    });

    // Clean up the listener when the component unmounts:
    return () => {
      unregister();
    };
  }, [editor]);

  // useEffect Hook #3 - For clientCursors updates (letting us know when to update the RemoteCursorOverlay rendering):
  useEffect(() => {
    // Receiving clientCursors (the cursor positions and IDs of all *other* clients editing the document):
    socket.on("update-cursors", (cursors) => {
      setOtherCursors(cursors.filter(cursor => cursor.id !== socket.id)); // The "=> cursor.id !== socket.id" part is for not including *this* client's ID.
    });
    return () => {
      socket.off("update-cursors");
    };
  }, []);

  // The three following const functions are for the "draggable" divider line between the Text Editor and Preview Panel:
  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const handleMouseMove = (event) => {
    if (isResizing.current) {
      const newWidth = (event.clientX / window.innerWidth) * 100;
      const clampedWidth = Math.max(30, Math.min(70, newWidth));
      setEditorWidth(clampedWidth);
    }
  };
  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Configuring event listeners for certain keys:
  const handleKeyInput = (event) => {
    // Making sure that pressing the "tab" key in the text editor will work as intended (multiple spaces instead of selecting stuff in browser):
    if (event.key === "Tab") {
      event.preventDefault();
      // Code to manually add the tab space:
      editor.update(() => {
        const selection = $getSelection();
        const tabSpace = "\t";

        if($isRangeSelection(selection)) {
          const selectedText = selection.getTextContent();
          const wrappedText = `${selectedText}${tabSpace}`;
          selection.insertText(wrappedText);
        }
      });
    }
    
    /* Special handling needed for "Enter" relating to Quote, Generic List, Numbered List, 
    and Check List formatting (i.e., Making sure if I click enter after line "1. something", the next line begins with "2. "): */
    if (event.key === "Enter") {
      event.preventDefault();
      editor.update(() => {
        const selection = $getSelection();
        const {anchor} = selection;
        const selectedText = selection.getTextContent();
        const paraNodes = $getRoot().getChildren();
        let wrappedText = null;
        let symbolToPrepend = null;
        let numberToPrepend = null;

        /* Logic here: I know that when the cursor is on an empty-line post-newline insertion, anchorNode.getKey() will always have value of 2
        and anchor.offset will basically correspond to all of the combined lineBreakNodes and textNodes preceding this empty line that
        the cursor currently rests on. 
        - So I can get the children of the parent node, iterate through all of them and have a counter record up to (anchor.offset - 1)
        so I know when I reach the textNode that I want to inspect (and determine if this current line should have #. prepended to it etc). */
        let prevTextNodePos = anchor.offset - 2;
        if(prevTextNodePos >= 0) {

          for(const paragraph of paraNodes) {
            if(paragraph.getChildren()) {
              const paraChildren = paragraph.getChildren();
              const paraChild = paraChildren[anchor.offset - 2];  // The prior text node will always be anchor.offset - 2 away. (post newline).

              if($isTextNode(paraChild)) {
                /* paraChild.getTextContent() will contain the text content of the previous text node.
                I want to now inspect its content to see if it's a string that begins with "> ", "* ", "{any number} ", or "- [ ] "
                (and from there it will be seen if there's any additional string following this starting substring, from which
                further action will be taken). */
                const isNumeric = (str) => !isNaN(str) && str.trim() !== "";
                let extractStart1 = paraChild.getTextContent().substring(0, 2);
                let extractStart2Char = paraChild.getTextContent().charAt(0);
                let startsWNumber = isNumeric(extractStart2Char);
                let extractStart2 = paraChild.getTextContent().substring(1,3);
                let extractStart3 = paraChild.getTextContent().substring(0,6);

                if(extractStart1 === "> " || extractStart1 === "* ") {
                  // If the prefix is equivalent to the whole line content, then I'm nuking that line's text content:
                  if(paraChild.getTextContent().trim() === ">" || paraChild.getTextContent().trim() === "*") {
                    paraChild.setTextContent("");
                  } else {
                    // There's something here past the prefix, so I need to make sure the current line has "> " or "* " prepended to it:
                    if(extractStart1 === "> ") {
                      symbolToPrepend = "> ";
                    } else {
                      symbolToPrepend = "* ";
                    }
                  }
                } else if(startsWNumber && extractStart2 === ". " ) {
                  if(paraChild.getTextContent().trim().length === 2) {
                    paraChild.setTextContent("");
                  } else {
                    // There's something here past the prefix, so I need to make sure the current line has "{this line's # + 1} " prepended to it: 
                    numberToPrepend = +extractStart2Char + 1;
                    symbolToPrepend = numberToPrepend + ". ";
                  }
                } else if(extractStart3 === "- [ ] ") {
                  if(paraChild.getTextContent().trim() === "- [ ]") {
                    // nuke that line's text content:
                    paraChild.setTextContent("");
                  } else {
                    symbolToPrepend = "- [ ] ";
                  }
                } else {
                  // do nothing:
                }
              }
            }
          }
          // No point of prepending "> ", "* " etc if the previous line didn't have anything related to that:
          if(symbolToPrepend) {
            // Over here, I want to prepend the symbol to the subsequent node...
            wrappedText = `${symbolToPrepend}${selectedText}`;
            selection.insertText(wrappedText);
          }
        }
      });
    }
  }

  /* NOTE: This useEffect hook is one of the guards I had put in place to fight against the edge case I was facing where
  a minority (maybe ~20-30% tabs I'd open of an existing Editor page w/ content would not sync). After days of debugging
  and research, the issue seemed to be this: https://github.com/yjs/y-websocket/issues/81#issuecomment-1453185788 
  This guard and any related code I added reduced the frequency of that edge case from ~20-30% to maybe 5% at most!
  */
  useEffect(() => {
    const provider = providerRef.current;
    if (!provider) return;
    const doc = provider.doc;
    if (!doc) return;

    let gotRemoteUpdate = false;
    const markIfRemote = (update, origin) => {
      if (origin === provider) {
        gotRemoteUpdate = true;
        doc.off("update", markIfRemote);
        console.log("[WS remote update observed]", roomId);
      }
    };
    doc.on("update", markIfRemote);

    let cancelled = false;
    const checkReady = () => {
      const root = doc.share.has("root") ? doc.share.get("root") : null;
      const meta = doc.getMap("meta");
      const bootstrapped = meta.get("bootstrapped") === true;
      if (gotRemoteUpdate || (provider.synced && root && (root.length > 0 || bootstrapped))) {
        if (!cancelled) setHydrated(true);
        return true;
      }
      return false;
    };

    if (checkReady()) return;

    const t = setTimeout(() => {
      if (!checkReady()) {
        console.warn("[WS] Still no remote update; proceeding with hydrated anyway");
        setHydrated(true);
      }
    }, 1200);

    return () => {
      cancelled = true;
      clearTimeout(t);
      doc.off("update", markIfRemote);
    };
  }, [roomId]);

  // providerFactory for <CollaborationPlugin/>:
  const providerFactory = useCallback((id, yjsDocMap) => {
    // console.log("RAILWAY-DEBUG: providerFactory START", { id, VITE: import.meta.env.VITE_YJS_WS_URL, ts: Date.now() });
    // Reuse doc if it exists
    let doc = yjsDocMap.get(id);
    if (!doc) {
      doc = new Y.Doc();
      yjsDocMap.set(id, doc);
      //console.log("RAILWAY-DEBUG: providerFactory: created new Y.Doc for", id);
    } /*else {
      console.log("RAILWAY-DEBUG: providerFactory: reusing existing Y.Doc for", id);
    }*/

    let provider = providersById.current.get(id);
    if(!provider) {
      provider = new WebsocketProvider(import.meta.env.VITE_YJS_WS_URL, id, doc, { connect: false }); // NOTE: Not directly connecting to the server is intentional (related to edge case I was facing).
      providerRef.current = provider;

      provider.on("status", (evt) => {
        console.log("[WS status]", id, evt, "wsconnected?", provider.wsconnected);
      });
      provider.on("sync", (isSynced) => {
        console.log("[WS sync]", id, { isSynced, providerSyncedFlag: provider.synced });
      });
      // recovery for suspended tabs
      const onVis = () => {
        if (!provider.wsconnected && provider.shouldConnect) provider.connect();
      };
      document.addEventListener("visibilitychange", onVis);
      providersById.current.set(id, provider);
    }
    // Defer connect so Lexical can bind its listeners first
    queueMicrotask(() => {
      if (!provider.wsconnected && !provider.wsconnecting) provider.connect();
    });
    return provider; 
  }, [socket, userData]);

  return(
    <div id="the-editor-wrapper" className="editor-wrapper">
      {/* Going to have something loaded here that boots the user when they get kicked: 
      [1] - Dark overlay background (clicking anywhere on it returns you to the Dashboard).
      [2] - <div> centered in the middle of screen with a "You have been kicked" notice. */}
      {kicked && (
        <div
          style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 99998,
          }}
          onClick={() => {goToDashboard();}}
        />
      )}
      {kicked && (
        <div
          style={{
            position: 'fixed',
            top:'20%',
            right:'27.5%',
            height:'55%',
            width:'40%',
            backgroundColor: '#0D0208',
            color: '#00FF41',
            fontFamily: 'monospace',
            border: '2px solid #00FF41',
            borderRadius: '8px',
            boxShadow: '0 0 10px #00FF41',
            padding: '10px',
            zIndex: 99999,        
        }} onClick={()=>{goToDashboard();}}>
          YOU HAVE BEEN KICKED.
        </div>
      )} {/* "Main" return code below: */}

      {/* The horizontal bar at the top of the webpage (where the site title is, "Text Editor|Split|Preview Panel" toggles are, etc): */}
      <div className="editor-preview-overhead">
        {/* The "Upload File" (.md) and "Download File" (.md) buttons: */}
        <div className="editor-upload-download">
          {/* The Upload .md File Button: */}
          <input type="file" accept=".md" onChange={handleFileUploadBtn} style={{display:"none"}} id="fileInput"/>
          <label htmlFor="fileInput" className="upload-md-button">
            Upload Markdown File
          </label>

          {/* The Download Text Editor Content -> .md File Button: */}
          <button onClick={handleDownloadMD} className="download-md-button" style={{fontFamily:"monospace"}}>Download as .md</button>
        </div>

        {/* The "Text Editor|Split|Preview Panel" toggles: */}
        <div className="editor-preview-toggle">
          <button onClick={()=> handleViewChange("editor-only")} disabled={viewMode==="editor-only"}>Text Editor</button>
          <button onClick={()=> handleViewChange("split")} disabled={viewMode==="split"}>Split-View</button>
          <button onClick={()=> handleViewChange("preview-only")} disabled={viewMode==="preview-only"}>Preview Panel</button>
        </div>

        {/* NOTE: Added this parent <div> for the stuff inbetween to add in-between spacing... */}
        <div style={{display:"flex", flexDirection:"row", gap:"5px", padding:"10px", paddingLeft:"15px", paddingRight:"15px", backgroundColor:"#003B00", borderRadius:"10px", marginTop:"15px"}}>

          {/* This will be the "Notifications" button on the top-right of the T.E. room webpage (will be extremely primitive): */}
          <div id="notifs-button" onClick={()=> toggleNotifs()} >
            <img id="notifs-button-icon" src="../../images/notif-icon.png" alt="Stock Notification Bell Icon"></img>
          </div>

          {/* Code to have the Notifications component appear: */}
          {showNotifs && (
            <NotificationBar roomId={roomId} notifsOpen={showNotifs} socket={socket} onClose={()=>toggleNotifs()} />
          )}

          {/* This will be the "Users-List" button on the top-right of the T.E. room webpage: */}
          <div id="users-list-button" onClick={()=> toggleUsersList()}>
            <img id="users-list-icon" src="../../images/users-icon.png" alt="Stock Users Icon"></img>
          </div>

          {/* Code to have the Users List appear (can be placed anywhere since I have "createPortal" in 
          UsersListContainer.jsx, which should append it to the document.body regardless): */}
          {showUsersList && (
            <UsersListContainer userData={userData} activeUsersList={activeUsersList} usersList={usersList} socket={socket} onClose={()=>toggleUsersList()} token={token} roomId={roomId}/>
          )}

          {/* This will be the "Home" (Return to Dashboard) button on the top-right of the T.E. room webpage: */}
          <div id="to-dashboard-button" onClick={()=> goToDashboard()}>
            <img id="go-to-dashb-icon" src="../../images/house-icon.png" alt="Stock Home Icon"></img>
          </div>

        </div>
      </div>

      {/* The <div> below will encase the "main body" of the webpage (the Text Editor and Preview Panel, or just one of them isolated).
      The default view will be "Split View" (both Text Editor and Preview Panel present): */}
      <div className={`editor-layout ${viewMode === "split" ? "split-view" : "full-view"}`}>

        {/* This is the wrapping for the Text Editor space: */}
        {(viewMode === "split" || viewMode === "editor-only") && (<div id="text-editor-space" className="text-editor-space-split" style={{ width: `${editorWidth}%`}}>

          <h3>Text Editor</h3>

          {/* "editor-overhead" <div> is for the horizontal bar above the Text Editor (and Toolbar) where customization options
          will be (mainly dropboxes for letting the user choose font, font-size, background-color etc): */}
          <div className="editor-overhead" style={{gap:"5px"}}>
            {/* 1. Font: */}
            <label>Editor Font:
              <select style={{fontFamily:"monospace", fontSize:"12px"}} onChange={(e) => setEditorFont(e.target.value)} value={editorFont}>
                <option value="Arial">Arial</option>
                <option value="Brush Script MT">Brush Script MT</option>
                <option value="Courier New">Courier New</option>
                <option value="Garamond">Garamond</option>
                <option value="Georgia">Georgia</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>

            {/* 2. Zoom Controls (for Text Editor) */}
            <button style={btnStyleEd} onClick={() => setEdFontSize((prev) => prev + 2)}>Zoom In</button>
            <button style={btnStyleEd} onClick={() => setEdFontSize((prev) => Math.max(prev - 2, 12))}>Zoom Out</button>

            {/* 3. Adding controls for changing Background Colour: */}
            <label>Background:
              <select style={{fontFamily:"monospace", fontSize:"12px"}} onChange={(e) => setEditorBColour(e.target.value)} value={editorBColour}>
                <option value="#FFFFFF">White</option>
                <option value="#d3d3d3">Light Gray</option>
                <option value="#1E1E1E">Soft Black</option>
                <option value="#F5E1C0">Paper-like</option>
                <option value="#2E3B4E">Midnight Blue</option>
                <option value="#233D2C">Forest Green</option>
              </select>
            </label>

            {/* 4. Adding controls for changing Text Colour: */}
            <label>Text:
              <select style={{fontFamily:"monospace", fontSize:"12px"}} onChange={(e) => setEditorTColour(e.target.value)} value={editorTColour}>
                <option value="#000000">Black</option>
                <option value="#D4D4D4">Light Gray</option>
                <option value="#5B4636">Deep Brown</option>
                <option value="#333333">Dark Gray</option>
                <option value="#E0E6F0">Ice Blue</option>
                <option value="#C8E6C9">Soft Green</option>
              </select>
            </label>

            {/* 5. Button manually save the state of the Editor document to the backend server: */}
            {/*<button style={btnStyleEd} onClick={()=> saveDocState()}>SAVE</button>*/}

          </div>
          
          <div className="main-text-editor" style={{fontFamily: editorFont}}>
            {/* The actual Text Editor + configurations so I can drag and drop .md files... */}
            <div className={`editor-container ${isDraggingMD ? "dragging" : ""}`} 
            onDragOver={(e) => {e.preventDefault(); setIsDraggingMD(true);}} 
            onDragLeave={()=>setIsDraggingMD(false)}
            onDrop={handleFileUploadDD}>
                <Toolbar />

                {/* NOTE: This <div> below I have wrapping the <PlainTextPlugin/> etc is the overlay on which the foreign cursor markers
                will be dynamically rendered when multiple people are editing the same editor. I want it to be the same dimensions and
                everything as the contentEditable (which is why it has the same class), just want it to positioned relatively instead, which
                is why I have the "style={{position:"relative"}} tossed in (it overrides that one aspect). */}
                <div className={'content-editable'} style={{position:"relative"}}>

                  {/* {ready && providerReady ? (<CollaborationPlugin */}
                  <CollaborationPlugin
                    //key={`${roomId}:${shouldBootstrap ? 1 : 0}`}
                    key={roomId}
                    id={roomId}
                    providerFactory={providerFactory}
                    initialEditorState={initialEditorState}
                    shouldBootstrap={false}
                    /* ^ Supposed to be very important. From the Lexical documentation page (their example of a fleshed-out collab editor):
                    "Unless you have a way to avoid race condition between 2+ users trying to do bootstrap simultaneously
                    you should never try to bootstrap on client. It's better to perform bootstrap within Yjs server." (should always be false basically) 
                    (NOTE: Would've needed to temporarily set it to true on first Yjs-Lexical sync had I gone that route, but I couldn't get it to work so whatever). */
                  />
                  {/* NOTE: Well-aware that <CollaborationPlugin> allows for foreign cursor markers/overlay here.
                  I could have username={} cursorColor={} and all that jazz over here, but I want to use my RemoteCursorOverlay.jsx
                  since it would feel like a waste otherwise... (and I get more customization with it) */}  
                  {hydrated ? (<PlainTextPlugin
                    contentEditable={
                      <ContentEditable className={`content-editable black-outline ${isDraggingMD ? "dragging" : ""}`} onKeyDown={handleKeyInput} 
                      style={{
                        backgroundColor:editorBColour, 
                        color:editorTColour, 
                        fontSize:`${edFontSize}px`,
                      }} data-placeholder="Write your Markdown here..."/>
                    }
                    placeholder={<div className="placeholder">Write your Markdown here...</div>}
                    ErrorBoundary={LexicalErrorBoundary}
                  />) : (<div>Connecting...</div>)}
                  <RemoteCursorOverlay editor={editor} otherCursors={otherCursors} fontSize={edFontSize}/> 
                </div>
                
                <div style={{paddingTop:'6px',fontSize:'16px',fontWeight:'bold', color:'#00FF41', backgroundColor:'black', border:'2px solid #00FF41' }} >Line Count: {lineCount} | Current Line: {currentLine}</div>
            </div>
          </div>
        </div>)}

        {/* This is the "resizable divider" between the Text Editor and the Preview Panel that can be dragged left and right
        to increase the Text Editor width/decrease the Preview Panel width and vice versa (pretty much exactly like how HackMD does it): */}
        {viewMode === "split" && <div className="resizeTEPP" onMouseDown={handleMouseDown}></div>}

        {(viewMode === "split" || viewMode === "preview-only") && (<div id="preview-panel-space" className="preview-panel-space-split" style={{ width: `${100 - editorWidth}%`}}>
          <h3>Preview</h3>
          {/* Customization bar for the Preview Panel (same as what's offered with the Text Editor): */}
          <div className="preview-overhead" style={{gap:"5px"}}>
            {/* 1. For the user to toggle font selection for the Preview Panel: */}
            <label>Preview Font:
              <select style={{fontFamily:"monospace", fontSize:"12px"}} onChange={(e) => setPreviewFont(e.target.value)} value={previewFont}>
                <option value="Arial">Arial</option>
                <option value="Brush Script MT">Brush Script MT</option>
                <option value="Courier New">Courier New</option>
                <option value="Garamond">Garamond</option>
                <option value="Georgia">Georgia</option>
                <option value="Tahoma">Tahoma</option>
                <option value="Trebuchet MS">Trebuchet MS</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>

            {/* 2. Zoom Controls (for Preview Panel) */}
            <button style={btnStyleEd} onClick={() => setPrevFontSize((prev) => prev + 2)}>Zoom In</button>
            <button style={btnStyleEd} onClick={() => setPrevFontSize((prev) => Math.max(prev - 2, 12))}>Zoom Out</button>
            {/* 3. Background Colour:*/}
            <label>Background:
              <select style={{fontFamily:"monospace", fontSize:"12px"}} onChange={(e) => setPreviewBColour(e.target.value)} value={previewBColour}>
                <option value="#FFFFFF">White</option>
                <option value="#d3d3d3">Light Gray</option>
                <option value="#1E1E1E">Soft Black</option>
                <option value="#F5E1C0">Paper-like</option>
                <option value="#2E3B4E">Midnight Blue</option>
                <option value="#233D2C">Forest Green</option>
              </select>
            </label>
            {/* 4. Text Colour: */}
            <label>Text:
              <select style={{fontFamily:"monospace", fontSize:"12px"}} onChange={(e) => setPreviewTColour(e.target.value)} value={previewTColour}>
                <option value="#000000">Black</option>
                <option value="#D4D4D4">Light Gray</option>
                <option value="#5B4636">Deep Brown</option>
                <option value="#333333">Dark Gray</option>
                <option value="#E0E6F0">Ice Blue</option>
                <option value="#C8E6C9">Soft Green</option>
              </select>
            </label>
          </div>

          {/* The actual Preview Panel itself: */}
          <div className="markdown-preview">
            <div className="md-preview-panel black-outline" dangerouslySetInnerHTML={{ __html: parsedContent }} style={{fontFamily: previewFont, fontSize:`${prevFontSize}px`, backgroundColor:previewBColour, color:previewTColour}}/>
          </div>
        </div>)}

      </div>
    </div>
  );
}

/* Laying down some groundwork in Editor(...): */
function Editor({ loadUser, loadRoomUsers, roomId, userData, username, userId, setUser, saveRoomData, getRoomData }) {
  const hasJoinedRef = useRef(false); // guard against React 18 strict mode (preventing things from executing twice).
  const docRef = useRef(null);
  //const [fetchedDoc, setFetchedDoc] = useState(false);
  //const [shouldBootstrap, setShouldBootstrap] = useState(false);
  //const [loadContent, setLoadContent] = useState(null);
  const loadContent = useRef(null);
  
  const [token, setToken] = useState(null);

  const initialConfig = {
    editorState: null, // According to Lexical doc, this line is critical for CollaborationPlugin (lets it know CollabPlug will set the defualt state).
    namespace: 'BaseMarkdownEditor',
    sampleTheme,
    onError: (error) => {
      console.error('Lexical Error:', error);
    },
  };

  /* Parameter values {roomId} and {userData} are both important for this Editor page's real-time interaction SocketIO features.
  They should come in preset from the Dashboard page, but in-case the user accesses this room through manual URL type and search, 
  then I should quickly re-retrieve them during rendering: */
  if(roomId === null) {
    roomId = useParams().roomId;
  }

  // Editor() useEffect Hook #0: For getting userData on mount if I don't have it:
  useEffect(() => {
    if(!userData) {
      const storedUser = localStorage.getItem("userData");
      if(storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } else {
        loadUser();
      }
    }
  }, []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {/* Everything's pretty much just in EditorContent(...) */}
      <EditorContent token={token} loadUser={loadUser} loadRoomUsers={loadRoomUsers} roomId={roomId} userData={userData} setUser={setUser} username={username} userId={userId} saveRoomData={saveRoomData} getRoomData={getRoomData} docRef={docRef} hasJoinedRef={hasJoinedRef} loadContent={loadContent} />
    </LexicalComposer>
  );
}

export default Editor;