// GOING TO BE SWITCHING BACK TO USING y-websocket NOW.
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export const ydoc = new Y.Doc();
export const provider = new WebsocketProvider('ws://localhost:1234', 'room-1', ydoc); // <-- NOTE-TO-SELF: This thing is insanely powerful.
export const ytext = ydoc.getText('content');
export const awareness = provider.awareness;
