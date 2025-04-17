import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness.js'

export const ydoc = new Y.Doc(); // this will be the shared document.
export const ytext = ydoc.getText('content'); // shared text.
export const awareness = new Awareness(ydoc); // for cursor/presence tracking.


console.log("[INIT] ydoc ID:", ydoc.clientID);
