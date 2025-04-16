import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc(); // this is what creates the shared Yjs doc.
const ytext = ydoc.getText('lexical-content');  // get shared text field

// creating websocket connection to backend
const provider = new WebsocketProvider('ws://localhost:4000', 'room-1', ydoc); // NOTE: 'room-1' can be dynamic later

const awareness = provider.awareness; // for cursor position, username, colour etc.

export { ydoc, ytext, provider, awareness }; // imported into Editor.jsx for syncing content and stuff.
