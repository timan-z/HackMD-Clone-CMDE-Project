import React, { useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer'; 
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState, useRef } from 'react';
import { $getRoot, $getSelection, $isRangeSelection, $isTextNode, $setSelection, $isParagraphNode, $createRangeSelection, $createTextNode, $createParagraphNode } from 'lexical';
import { parseMarkdown } from "../core-features/MDParser.jsx";
import { findCursorPos } from '../utility/utilityFuncs.js';

// NOTE: Following lines are for Phase 3 (Introducing Real-Time Collaboration).
import { RemoteCursorOverlay } from '../core-features/RemoteCursorOverlay.jsx';

// PART-2-ADDITIONS:
import * as Y from 'yjs';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { useMemo } from 'react';
import { WebsocketProvider } from 'y-websocket';
// BRINGING THESE 3 BELOW BACK!!!:
import { io } from "socket.io-client"; // <-- Bringing this one back.
import { throttle } from "lodash"; // Throttling needed to limit rate of function calls (specifically emits to the server).
const socket = io("http://localhost:4000"); // <-- bringing this back for tying RemoteCursorOverlay.jsx back over my Text Editor (while using <CollaborationPlugin/>). 

import { useParams, useNavigate } from "react-router-dom"; 
import Toolbar from "../core-features/Toolbar.jsx";
import UsersListContainer from '../misc-features/UsersListContainer.jsx';
import NotificationBar from '../misc-features/NotificationBar.jsx';


/* NOTE-TO-SELF:
  - LexicalComposer initializes the editor with the [theme], [namespace], and [onError] configs. (Additional plug-ins go within its tags).
  - ContentEditable is the area where the user types.
  - PlainTextPlugin is a plugin for plain-text input (better suited here for a markdown editor as opposed to something like RichTextPlugin).
  - LexicalErrorBoundary, embedded within PlainTextPlugin, will be for catching errors and preventing LexicalComposer from exploding basically.
*/













// NOTE: This is just one of the sample themes offered in the Lexical documentation: https://lexical.dev/docs/getting-started/theming
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

/*const initialConfig = {
  //editorState: null, // According to Lexical doc, this line is critical for CollaborationPlugin (lets it know CollabPlug will set the defualt state).
  editorState: null,
  namespace: 'BaseMarkdownEditor',
  sampleTheme,
  onError: (error) => {
    console.error('Lexical Error:', error);
  },
};*/

// Most of the "content" of the LexicalComposer component (Text Editor) will be in this child element here:
function EditorContent({ loadUser, loadRoomUsers, roomId, userData, username, userId, setUser, saveRoomData, getRoomData, docRef, hasJoinedRef, shouldBootstrap, setShouldBootstrap, testUint8 }) {
  //const hasJoinedRef = useRef(false); // guard against React 18 strict mode (preventing things from executing twice).
  const [editor] = useLexicalComposerContext();
  const [lineCount, setLineCount] = useState(1); // 1 line is the default.
  const [currentLine, setCurrentLine] = useState(1);
  // The following two const are (mainly) for the Markdown rendering effect:
  const [editorContent, setEditorContent] = useState(""); // Stores raw markdown.
  const [parsedContent, setParsedContent] = useState(""); // Stores parsed HTML.
  // The following const is for the "view mode" toggling of the webpage (regarding Text Editor and Preview Panel):
  const [viewMode, setViewMode] = useState("split"); // default state.
  // The following two const are for the "draggable" divider line I have between the Text Editor and Preview Panel in split view:
  const [editorWidth, setEditorWidth] = useState(50); // 50 is the initial width percentage...
  const isResizing = useRef(false);
  // The following consts are for Text Editor and Preview Panel customization (text zoom percentage, font and background colour):
  const [editorFont, setEditorFont] = useState("Arial"); // default font for text editor.
  const [previewFont, setPreviewFont] = useState("Arial"); // default font for preview panel.
  const [edFontSize, setEdFontSize] = useState(16); // default font size.
  const [prevFontSize, setPrevFontSize] = useState(16);
  const [editorBColour, setEditorBColour] = useState("#d3d3d3");
  const [previewBColour, setPreviewBColour] = useState("#b0c4de");
  const [editorTColour, setEditorTColour] = useState("#000000");
  const [previewTColour, setPreviewTColour] = useState("#000000");
  // The following const is for the "drag-and-drop .md files" feature for the Text Editor: 
  const [isDraggingMD, setIsDraggingMD] = useState(false);
  // The following const(s) is for rendering the cursors of the *other* clients in the Text Editor during real-time collaboration:
  const [otherCursors, setOtherCursors] = useState([]);
  const cursorPos = useRef(0); // NOTE: This is needed for maintaining cursor position post-changes in collaborative editing.
  
  // USERSLIST-DEBUG:
  const [usersList, setUsersList] = useState([]);
  const [activeUsersList, setActiveUsersList] = useState([]);
  const [showUsersList, setShowUsersList] = useState(false);  
  const [showNotifs, setShowNotifs] = useState(false);
  const [kicked, setKicked] = useState(false);



  

  //const doc = new Y.Doc(); // <-- moving this outside of the <contenteditable> (yeah this is definitely better).
  //const docRef = useRef(null);
  //const [fetchedDoc, setFetchedDoc] = useState(false);

  const docRef2 = useRef(null);


  /* Parameter values {roomId} and {userData} are both important for this Editor page's real-time interaction SocketIO features.
  They should come in preset from the Dashboard page, but in-case the user accesses this room through manual URL type and search, 
  then I should quickly re-retrieve them during rendering: */
  /*if(roomId === null) {
    roomId = useParams().roomId;
  }

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
  }, []);*/

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






  // useEffect Hook #0.5: Another one I want to run on mount (sending Active User status to the Socket.IO server). Listener in there too:
  /*useEffect(() => {
    // Guard against React 18 Strict Mode making this useEffect run twice:
    if(hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    // Function to grab any pre-existing document state from the backend.
    const fetchAndInit = async() => {
      const doc = new Y.Doc();
      try {
        const result = await getRoomData(roomId);
        if(result.success && result.docData) {
          const uint8 = new Uint8Array(result.docData);
          Y.applyUpdate(doc, uint8);
        }
      } catch(err) {
        console.warn("No saved doc on the PostgreSQL backend. If this is a new Editor Room, there is no issue. Otherwise, server issue: ", err);
      }
      docRef.current = doc;
      setFetchedDoc(true);  // condition for <CollaborationPlugin> to render.
    };
    fetchAndInit();

    console.log("Sending Room ID:(", roomId, ") User ID:(", userData.id, "), and username:(", userData.username, ") over to the Socket.IO server.");
    // Because this site handles the capacity for multiple distinct Editor Rooms, I need Socket.IO to do the same to keep real-time interaction isolated:
    socket.emit("join-room", roomId, userData.id, userData.username); // Join the specific Socket.IO room for this Editor Room.
  }, [userData]);*/










  // useEffect hook that just listens for when notifications are sent (so the Notification Icon background can turn red):
  // DEBUG: ^ Definitely organize this better -- it's so minor that it can probably be stuffed into another useEffect hook...
  useEffect(()=> {
    const handleNotif = () => {
      let notifBarCheck = document.getElementById('notification-bar');

      if(!notifBarCheck) {
        let notifsBtn = document.getElementById('notifs-button');
        notifsBtn.style.backgroundColor = 'red';
      }
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

    return () => {
      socket.off("notification", handleNotif);
      socket.off("you-have-been-kicked");
      socket.off("active-users-list");
    };
  }, []);






  // Function for returning to the dashboard:
  const navigate = useNavigate();
  const goToDashboard = () => {
    hasJoinedRef.current = false;

    socket.emit("leave-room", roomId, userData.id);
    socket.off("active-users-list");
    socket.off("active-cursors");
    socket.off("update-cursors");

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
      // Going to make it so that the Notifs Icon turns red when new notifications are received (clicking it will get rid of the applied red):
      if(notifsBtn.style.backgroundColor === 'red') {
        notifsBtn.style.backgroundColor = '#00FF41';
      }
    } else {
      notifsBtn.classList.remove('users-l-add-shadow');
    }

    // NOTE:+DEBUG: Need to have a thing where if the Notifs button background is Red, it gets turned back to Green.
    // DEBUG: ^ I need to set this whole thing up in general... 

    setShowNotifs(prev => !prev);
  };
  















  // Function for handling the webpage view toggle between the Text Editor and Preview Panel (Split, Editor, Preview):
  const handleViewChange = (mode) => {
    setViewMode(mode);
    let textEdSpace = document.getElementById("text-editor-space");
    let prevPanSpace = document.getElementById("preview-panel-space");

    if(mode === "split") {
      setEditorWidth(50); // Needed for resetting the Text Editor and Preview Panel dimensions after potential adjustments with the slider. 
      prevPanSpace.classList.remove("preview-panel-space-full"); // NOTE:+DEBUG: Maybe cast this in a JS try-block or whatever (i get console errors for doesnt exist)
      prevPanSpace.classList.add("preview-panel-space-split");
      textEdSpace.classList.remove("text-editor-space-full");
      textEdSpace.classList.add("text-editor-space-split");
    } else if(mode === "editor-only") {
      setEditorWidth(100); // Needed to make sure the Text Editor takes up the whole thing (by scaling it up to 100%)
      textEdSpace.classList.remove("text-editor-space-split");
      textEdSpace.classList.add("text-editor-space-full");
    } else {
      setEditorWidth(0); // Needed to make sure the Preview Panel takes up the whole thing (by reducing the Text Editor to nothing).
      prevPanSpace.classList.remove("preview-panel-space-split");
      prevPanSpace.classList.add("preview-panel-space-full");
    }
  };

  // Function for handling the [1] "Upload File" and [2] "Download File" (both .md) functionality:
  // 1a. This function is for the actual .md file reading (opening it up, reading it, pasting to the Text Editor):
  const handleFileUploadMD = (file) => {
    // If invalid file:
    if(file.type !== "text/markdown" && !file.name.endsWith(".md")) {
      alert("Please upload a valid Markdown (.md) file."); // NOTE:+DEBUG: Just have an Alert for now..., but I want to change this to something more professional later on. (Pop-up -> click anywhere on screen to nullify).
      return;
    }
    
    // If there's existing text in the Text Editor, prompt asking if it should be replaced (Again, default "window.confirm" for now...)
    if(editorContent.trim() === "" || (editorContent.trim() !== "" && window.confirm("Replace existing content?"))) {
      /* Now I want to read the contents of file and replace the actual Text Editor content with the file contents
      (so I'm going to need to do an update() function or something like that here). */

      // Reading file contents:
      const reader = new FileReader();
      // Need to define the process here and then invoke it afterwards...
      reader.onload = () => {
        // This will get it.
        const text = reader.result;
        // Inserting it into the Lexical Text Editor:
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
        alert("The Text Editor is empty. Nothing to download at this moment!"); // NOTE:+DEBUG: I've a generic alert right now, but change this to something more formal later.
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

  const sendCursorToServer = throttle((cursorPos, username) => {
    socket.emit("send-cursor-pos", cursorPos, socket.id, username);
  }, 100); // <-- throttle causes a slight delay in the rendering (it'll trail behind the actual typing pos, but I think that's okay and good).

  // "useEffect(()=>{...})" Hook #1 - "The original one", for client-instance text editor/state changes/emitting changes to server etc.
  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        /* From the Lexical documentation:
        "There is only ever a single RootNode in an EditorState and it is always at the top and it represents the contenteditable itself. 
        This means that the RootNode does not have a parent or siblings. To get the text content of the entire editor, you should use 
        rootNode.getTextContent()." <-- and by "using rootNode", seems like I'd have to invoke "$getRoot()" */
        const textContent = $getRoot().getTextContent();

        // NOTE: The stuff below is for the text editor line counter...
        const lines = textContent.split("\n").length;
        setLineCount(lines);
        //console.log("Current line count in text editor: ", lines);

        // Okay and now I'm going to write some code to detect the current line of the Text Editor!
        const paraNodes = $getRoot().getChildren();
        const selection = $getSelection();

        if(!selection) return;  // Originally added this line to prevent errors with a scrapped feature. Keeping it for good practice!

        let {anchor} = selection;
        let anchorNode = anchor.getNode();
        let anchorOffset = anchor.offset;
        let absoluteCursorPos = findCursorPos(paraNodes, anchorNode, anchorOffset); // let's see!
        cursorPos.current = absoluteCursorPos;

        //console.log("DEBUG: The value of cursorPos.current is = ", cursorPos.current);

        let textContentTrunc = textContent.slice(0, absoluteCursorPos);
        let currentLine = textContentTrunc.split("\n").length;
        //console.log("DEBUG: The current line is: ", currentLine);
        setCurrentLine(currentLine);

        sendCursorToServer(cursorPos.current, userData.username); // emit current Text Editor cursor pos to the server (in external function so throttling can be applied).

        // NOTE: The stuff below is for the Markdown renderer... 
        setEditorContent(textContent);
        setParsedContent(parseMarkdown(textContent));
      });
    });

    // Clean up the listener when the component unmounts:
    return () => {
      unregister();
    };
  }, [editor]);

  // "useEffect(()=>{...})" Hook #2 - For clientCursors updates (letting us know when to update the RemoteCursorOverlay rendering):
  useEffect(() => {
    // Receiving clientCursors (the cursor positions and IDs of all *other* clients editing the document):
    socket.on("update-cursors", (cursors) => {
      //console.log("DEBUG: Received clientCursors update! cursors = [", cursors, "]");
      //console.log("Debug: Also btw the value of socket.id is: ", socket.id);
      setOtherCursors(cursors.filter(cursor => cursor.id !== socket.id)); // The "=> cursor.id !== socket.id" part is for not including *this* client's ID.
      /* otherCursors won't automatically update to "cursors" immediately, will need to wait for the next time
      the Editor renders (which I can catch with another useEffect hook dedicated to detecting when otherCursors changes). */  

    });
    return () => {
      socket.off("update-cursors");
    };
  }, []);
























  // NOTE: THIS BELOW IS MY DEBUG BUTTON <-- DEBUG: Should have it removed when I'm finished everything else in the site.
  const debugFunction = (editor, id, color, label, offset) => {
    editor.update(() => {
      console.log("DEBUG: ************************************************************");
      console.log("DEBUG: debugFunction entered...");
      console.log("DEBUG: ************************************************************");
      /*editor.update(() => {
        const selection = $getSelection();
        const tabSpace = "\t";

        if($isRangeSelection(selection)) {
          const selectedText = selection.getTextContent();
          const wrappedText = `${selectedText}${tabSpace}`;
          selection.insertText(wrappedText);
        }
      });*/

      //const binaryState = Y.encodeStateAsUpdate(docRef.current);
      //saveRoomData(roomId, binaryState);
      
      
    
      /*const root = docRef.current.share.get('root');
      if (root instanceof Y.XmlText) {
        console.log("debug: TEXT CONTENT (ignore the [object Object]) => [", root.toString(), "]");
      }
      console.log("debug: The value of $getRoot().getTextContent() => [", $getRoot().getTextContent(), "]");
      console.log("debug: ABOUT TO TRY SOMETHING:");
      $getSelection().insertText(root.toString());

      const root2 = docRef.current.share.get('root');
      if (root2 instanceof Y.XmlText) {
        console.log("POST-ROOT2: TEXT CONTENT (ignore the [object Object]) => [", root2.toString(), "]");
      }*/
      //console.log("DEBUG: The value of docRef2.current => [", docRef2.current, "]");
      //console.log("The value of testUint8 => [", testUint8, "]");
      //Y.applyUpdate(docRef2.current, testUint8);


      /*const yText = docRef.current.get('root');
      if (yText instanceof Y.XmlText) {
        const plainText = yText.toString();
        console.log('✅ Extracted text from Yjs:', plainText);
      } else {
        console.warn('❌ Y.Doc root is not Y.XmlText. Got:', yText?.constructor?.name);
      }*/

      console.log("The value of docRef2.current => [", docRef2.current, "]");
      const yText = docRef.current.get('root', Y.XmlText);
      console.log("The value of yText.toString() is => [", yText.toString(), "]");
      console.log("something-DEBUG: The value of xmlText => [", docRef2.current.get('root', Y.XmlText).toString(), "]");





      console.log("please work...");
      const root = $getRoot();
      root.clear();
      const paragraph = $createParagraphNode();
      const textNode = $createTextNode(yText.toString());
      paragraph.append(textNode);
      root.append(paragraph);













      /*try {
        const result = await getRoomData(roomId);
        const binaryData = result.docData.data;
        if(result.success && result.docData) {
          const uint8 = new Uint8Array(binaryData);
          Y.applyUpdate(doc, uint8);

          console.log("fetchAndInit-DEBUG: Yeah. The value of doc => [", doc, "]");
          console.log("fetchAndInit-DEBUG: The value of xmlText => [", doc.get('root', Y.XmlText), "]");
          let buffer = doc.get('root', Y.XmlText);
          console.log("fetchAndInit-DEBUG: The value of xmlText.toString() => [", buffer.toString(), "]");
          console.log("fetchAndInit-DEBUG: The value of doc.share.has('root') => [", doc.share.has('root'), "]");
          
          setShouldBootstrap(false);
          const keys = [...doc.share.keys()];
          console.log("Doc keys after applyUpdate:", keys);
        }
      } catch(err) {
        console.warn("No saved doc on the PostgreSQL backend. If this is a new Editor Room, there is no issue. Otherwise, server issue: ", err);
        setShouldBootstrap(true);
      }
      docRef.current = doc;
      setFetchedDoc(true);  // condition for <CollaborationPlugin> to render.*/

      //console.log("debug: The value of $getRoot().getTextContent() => [", $getRoot().getTextContent(), "]");
      /*const root = docRef.current.share.get('root');
      if (root instanceof Y.XmlText) {
        console.log("debug: TEXT CONTENT (ignore the [object Object]) => [", root.toString(), "]");
      }
      console.log("DEBUG: About to run the saveRoomData function...");
      const binaryState = Y.encodeStateAsUpdate(docRef.current);
      saveRoomData(roomId, binaryState);*/

      //console.log("Debug: The value of ydoc.getText('default'); => ", docRef.current.getText('default'));
      /*const root = docRef.current.share.get('root');
      if (root instanceof Y.XmlText) {
        console.log("debug: TEXT CONTENT (ignore the [object Object]) => [", root.toString(), "]");
      }
      const binaryState = Y.encodeStateAsUpdate(docRef.current); // should come out as an Uint8Array...
      console.log("debug: The value of binaryState => [", binaryState, "]");
      //console.log("DEBUG: saveRoomData...");
      console.log("DEBUG: getRoomData...");
      //saveRoomData(roomId, binaryState);
      const data = getRoomData(roomId);
      console.log("The value of data => [", data, "]");
      const testDoc = new Y.Doc();
      Y.applyUpdate(testDoc, new Uint8Array(data));
      const text = testDoc.getText('default').toString();
      console.log(text);*/

      console.log("DEBUG: ************************************************************");
      console.log("DEBUG: debugFunction exited...");
      console.log("DEBUG: ************************************************************");
    });
  }
  // NOTE: THIS ABOVE IS MY DEBUG BUTTON <-- DEBUG: Should have it removed when I'm finished everything else in the site.




















  




  // The three following const functions are for the "draggable" divider line between the Text Editor and Preview Panel:
  const handleMouseDown = () => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
  const handleMouseMove = (event) => {
    if (isResizing.current) {
      const newWidth = (event.clientX / window.innerWidth) * 100; // debug: Convert px to %
      const clampedWidth = Math.max(30, Math.min(70, newWidth));
      setEditorWidth(clampedWidth); // debug: Clamp width between 30% - 70%
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
      event.preventDefault(); // DEBUG: <-- does not seem to do anything lol 
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
                    // nuke that line's text content:
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
      )}

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
          <button onClick={handleDownloadMD} className="download-md-button">Download as .md</button>
        </div>

        {/* The "Text Editor|Split|Preview Panel" toggles: */}
        <div className="editor-preview-toggle">
          <button onClick={()=> handleViewChange("editor-only")} disabled={viewMode==="editor-only"}>Text Editor</button>
          <button onClick={()=> handleViewChange("split")} disabled={viewMode==="split"}>Split-View</button>
          <button onClick={()=> handleViewChange("preview-only")} disabled={viewMode==="preview-only"}>Preview Panel</button>
        </div>
        {/*<h1>HACKMD CLONE!!!</h1>*/}  {/* DEBUG:+NOTE: Change this to something proper eventually... */}

        {/* NOTE: Added this parent <div> for the stuff inbetween to add in-between spacing... */}
        <div style={{display:"flex", flexDirection:"row", gap:"5px"}}>

          {/* This will be the "Notifications" button on the top-right of the T.E. room webpage (will be extremely primitive): */}
          <div id="notifs-button" onClick={()=> toggleNotifs()} >
            <img id="notifs-button-icon" src="../../images/notif-icon.png" alt="Stock Notification Bell Icon"></img>
          </div>

          {/* Code to have the Notifications component appear: */}
          {showNotifs && (
            <NotificationBar notifsOpen={showNotifs} socket={socket} onClose={()=>toggleNotifs()} />
          )}

          {/* This will be the "Users-List" button on the top-right of the T.E. room webpage: */}
          <div id="users-list-button" onClick={()=> toggleUsersList()}>
            <img id="users-list-icon" src="../../images/users-icon.png" alt="Stock Users Icon"></img>
          </div>

          {/* Code to have the Users List appear (can be placed anywhere since I have "createPortal" in 
          UsersListContainer.jsx, which should append it to the document.body regardless): */}
          {showUsersList && (
            <UsersListContainer userData={userData} activeUsersList={activeUsersList} usersList={usersList} socket={socket} onClose={()=>toggleUsersList()}/>
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
          <div className="editor-overhead">
            {/* 1. Font: */}
            <label>Editor Font:
              <select onChange={(e) => setEditorFont(e.target.value)} value={editorFont}>
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
            <button onClick={() => setEdFontSize((prev) => prev + 2)}>Zoom In</button>
            <button onClick={() => setEdFontSize((prev) => Math.max(prev - 2, 12))}>Zoom Out</button>

            {/* 3. Adding controls for changing Background Colour: */}
            <label>Background:
              <select onChange={(e) => setEditorBColour(e.target.value)} value={editorBColour}>
                <option value="#d3d3d3">Light Gray</option>
                <option value="#FFFFFF">White</option>
                <option value="#1E1E1E">Soft Black</option>
                <option value="#F5E1C0">Paper-like</option>
                <option value="#2E3B4E">Midnight Blue</option>
                <option value="#233D2C">Forest Green</option>
              </select>
            </label>

            {/* 4. Adding controls for changing Text Colour: */}
            <label>Text:
              <select onChange={(e) => setEditorTColour(e.target.value)} value={editorTColour}>
                <option value="#000000">Black</option>
                <option value="#D4D4D4">Light Gray</option>
                <option value="#5B4636">Deep Brown</option>
                <option value="#333333">Dark Gray</option>
                <option value="#E0E6F0">Ice Blue</option>
                <option value="#C8E6C9">Soft Green</option>
              </select>
            </label>

            {/* PHASE-3-DEBUG: Test button below for inserting DecoratorNode. */}
            <button onClick={() => debugFunction(editor)}>DEBUG BUTTON</button>

          </div>
          
          {/* "main-text-editor" is basically the wrapping for the actual editable text editor -- it exists mostly so that the line numbers 
          can align with the rows of the text editor (style=flex). 
          NOTE:+DEBUG: ^ Make note of this when determining if I keep or get rid of the horizontal line numbers (might be too difficult
          to incorporate the what happens when you type one continous line of text thing)... */}
          <div className="main-text-editor" style={{fontFamily: editorFont}}>

            {/* The block of code below was for the "Line Numbers" column to the left of the Text Editor: */}
            {/*<div className="line-numbers">
              {Array.from({length: lineCount}, (_,i) => (
                <div key={i+1}>{i + 1}</div>
              ))}
            </div>*/}

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


                  

                  {/*<PlainTextPlugin
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
                  />
                  <RemoteCursorOverlay editor={editor} otherCursors={otherCursors} fontSize={edFontSize}/>*/}


                  <CollaborationPlugin
                    id={roomId}
                    providerFactory={(id, yjsDocMap) => {
                      const doc = new Y.Doc();

                      //const doc = docRef.current;
                      
                      docRef2.current = doc;

                      /*console.log("CPlugin-DEBUG: The value of shouldBootstrap => [", shouldBootstrap, "]");
                      console.log("CPlugin-DEBUG: The value of doc => [", doc, "]");
                      let buffer = doc.get('root', Y.XmlText);
                      console.log("CPlugin-DEBUG: The value of doc.get('root', Y.XmlText); => [", buffer, "]");
                      console.log("CPlugin-DEBUG: The value of [doc.get('root', Y.XmlText)].toString() => [", buffer.toString(), "]");
                      const root = doc.share.get('root');*/

                      yjsDocMap.set(id, doc);
                      const provider = new WebsocketProvider('ws://localhost:1234', id, doc, {connect:true});
                      //docRef.current = doc;

                      provider.on('status', (event) => console.log('DEBUG: WebSocket status:', event.status)) // DEBUG:
                      //provider.on('sync', (isSynced) => console.log(`DEBUG: Doc synced? => ${isSynced} and Y.Doc keys => ${doc.share.keys()}`)) // DEBUG:

                      provider.on('sync', (isSynced) => {
                        console.log(`sync-DEBUG: isSynced = ${isSynced}, shouldBootstrap = ${shouldBootstrap}`);
                        const keys = [...doc.share.keys()];
                        console.log(`sync-DEBUG: Doc synced? => ${isSynced} and Y.Doc keys =>`, keys);

                        if (isSynced) {
                          console.log("About to isLexicalREady");
                          const isLexicalReady = root instanceof Y.XmlText;
                          console.log("Lexical Ready? => [", isLexicalReady, "]");
                          if(isLexicalReady) {
                            console.log("YEAH IT IS READY!!!");
                          }
                        }

                        if (isSynced && shouldBootstrap) {
                          console.log("sync-DEBUG: isSynced && shouldBootstrap ENTERED!!!");
                          const root = doc.get('root');
                          if(root instanceof Y.XmlText) {
                            console.log("sync-DEBUG: Lexical has populated the document with XmlText.");
                            const binary = Y.encodeStateAsUpdate(doc);
                            saveRoomData(roomId, binary);
                          } else {
                            console.warn("sync-DEBUG: Lexical has not finished populating the document. Delaying save.");
                          }
                          //const binary = Y.encodeStateAsUpdate(doc);
                          //saveRoomData(roomId, binary); // persist it to PostgreSQL
                        }
                      });
                      
                      return provider;
                    }}
                    //shouldBootstrap={false}
                    shouldBootstrap={shouldBootstrap}
                    /* ^ Supposed to be very important. From the Lexical documentation page (their example of a fleshed-out collab editor):
                    "Unless you have a way to avoid race condition between 2+ users trying to do bootstrap simultaneously
                    you should never try to bootstrap on client. It's better to perform bootstrap within Yjs server." (should always be false basically) */
                    // ^ looking like I need it temporarily (for Yjs).
                  />


                  {/* NOTE-TO-SELF: Well-aware that <CollaborationPlugin> allows for foreign cursor markers/overlay here.
                  I could have username={} cursorColor={} and all that jazz over here, but I want to use my RemoteCursorOverlay.jsx
                  since it would feel like a waste otherwise... (and I get more customization with it) */}

                  {/* Need to wrap the ContentEditable inside the PlainTextPlugin (I didn't do this originally, that's why the Placeholder wasn't working). */}
                  <PlainTextPlugin
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
                  />
                  <RemoteCursorOverlay editor={editor} otherCursors={otherCursors} fontSize={edFontSize}/> {/* <-- PHASE-3-DEBUG: Testing some stuff... 

                  {/*<HistoryPlugin/>**/} {/* <-- Needed for Undo/Redo functionality in the Toolbar... (enables tracking or smth) */}
                  {/* UPDATE: ^ Seems like <HistoryPlugin/> is something I should NOT use in conjunction with <CollaborationPlugin/> acc to the Lexical documentation! */}
                </div>
                
                <div>Line Count: {lineCount} | Current Line: {currentLine}</div>
            </div>

          </div>
        </div>)}

        {/* This is the "resizable divider" between the Text Editor and the Preview Panel that can be dragged left and right
        to increase the Text Editor width/decrease the Preview Panel width and vice versa (pretty much exactly like how HackMD does it): */}
        {viewMode === "split" && <div className="resizeTEPP" onMouseDown={handleMouseDown}></div>}

        {(viewMode === "split" || viewMode === "preview-only") && (<div id="preview-panel-space" className="preview-panel-space-split" style={{ width: `${100 - editorWidth}%`}}>
          <h3>Preview</h3>
          {/* Customization bar for the Preview Panel (same as what's offered with the Text Editor): */}
          <div className="preview-overhead">
            {/* 1. For the user to toggle font selection for the Preview Panel: */}
            <label>Preview Font:
              <select onChange={(e) => setPreviewFont(e.target.value)} value={previewFont}>
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
            <button onClick={() => setPrevFontSize((prev) => prev + 2)}>Zoom In</button>
            <button onClick={() => setPrevFontSize((prev) => Math.max(prev - 2, 12))}>Zoom Out</button>
            {/* 3. Background Colour:*/}
            <label>Background:
              <select onChange={(e) => setPreviewBColour(e.target.value)} value={previewBColour}>
                <option value="#d3d3d3">Light Gray</option>
                <option value="#FFFFFF">White</option>
                <option value="#1E1E1E">Soft Black</option>
                <option value="#F5E1C0">Paper-like</option>
                <option value="#2E3B4E">Midnight Blue</option>
                <option value="#233D2C">Forest Green</option>
              </select>
            </label>
            {/* 4. Text Colour: */}
            <label>Text:
              <select onChange={(e) => setPreviewTColour(e.target.value)} value={previewTColour}>
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

function Editor({ loadUser, loadRoomUsers, roomId, userData, username, userId, setUser, saveRoomData, getRoomData }) {
  // DEBUG: Maybe it'd be better to have the fetch previous document function over here???
  const hasJoinedRef = useRef(false); // guard against React 18 strict mode (preventing things from executing twice).
  const docRef = useRef(null);
  const [fetchedDoc, setFetchedDoc] = useState(false);
  const [shouldBootstrap, setShouldBootstrap] = useState(false);




  const [testUint8, setTestUint8] = useState(null); // completely debug: purposed state variable.



  const initialConfig = {
    editorState: null, // According to Lexical doc, this line is critical for CollaborationPlugin (lets it know CollabPlug will set the defualt state). <-- yeah def need this or my collab editing thing is done.
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

  // useEffect Hook #0: Another one I want to run on mount (sending Active User status to the Socket.IO server). Listener in there too:
  useEffect(() => {
    // Guard against React 18 Strict Mode making this useEffect run twice:
    if(hasJoinedRef.current) return;
    hasJoinedRef.current = true;

    // Function to grab any pre-existing document state from the backend.
    const fetchAndInit = async() => {
      const doc = new Y.Doc();
      
      try {
        const result = await getRoomData(roomId);
        const binaryData = result.docData.data;
        if(result.success && result.docData) {
          const uint8 = new Uint8Array(binaryData);
          Y.applyUpdate(doc, uint8);


          setTestUint8(uint8);

          
          console.log("fetchAndInit-DEBUG: Yeah. The value of doc => [", doc, "]");
          console.log("fetchAndInit-DEBUG: The value of xmlText => [", doc.get('root', Y.XmlText), "]");
          let buffer = doc.get('root', Y.XmlText);
          console.log("fetchAndInit-DEBUG: The value of xmlText.toString() => [", buffer.toString(), "]");
          console.log("fetchAndInit-DEBUG: The value of doc.share.has('root') => [", doc.share.has('root'), "]");
          



          
          setShouldBootstrap(false);
          const keys = [...doc.share.keys()];
          console.log("Doc keys after applyUpdate:", keys);
        }
      } catch(err) {
        console.warn("No saved doc on the PostgreSQL backend. If this is a new Editor Room, there is no issue. Otherwise, server issue: ", err);
        setShouldBootstrap(true);
      }
      docRef.current = doc;
      setFetchedDoc(true);  // condition for <CollaborationPlugin> to render.
    };
    fetchAndInit();

    console.log("Sending Room ID:(", roomId, ") User ID:(", userData.id, "), and username:(", userData.username, ") over to the Socket.IO server.");
    // Because this site handles the capacity for multiple distinct Editor Rooms, I need Socket.IO to do the same to keep real-time interaction isolated:
    socket.emit("join-room", roomId, userData.id, userData.username); // Join the specific Socket.IO room for this Editor Room.
  }, [userData]);
  // DEBUG:[ABOVE] Maybe it'd be better to have the fetch previous document function over here???

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {/* Everything's pretty much just in EditorContent(...) */}

      {fetchedDoc ? (
        <EditorContent loadUser={loadUser} loadRoomUsers={loadRoomUsers} roomId={roomId} userData={userData} setUser={setUser} username={username} userId={userId} saveRoomData={saveRoomData} getRoomData={getRoomData} docRef={docRef} hasJoinedRef={hasJoinedRef} shouldBootstrap={shouldBootstrap} setShouldBootstrap={setShouldBootstrap} testUint8={testUint8} />
      ):(<div>LOADING...</div>)}

    </LexicalComposer>
  );
}

export default Editor;
