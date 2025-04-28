// GOING TO BE SWITCHING BACK TO USING y-websocket NOW.
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export const ydoc = new Y.Doc();
// NOTE: Need this line below for CollaborationPlugin (which I use to use UseYjsCollaboration and all that stuff):
export const yjsDocMap = new Map([['room-1', ydoc]]);

export const provider = new WebsocketProvider('ws://localhost:1234', 'room-1', ydoc); // <-- NOTE-TO-SELF: This thing is insanely powerful.

yjsDocMap.set('room-1', ydoc); // Set the initial doc into the map.

export const ytext = ydoc.getText('content');
export const awareness = provider.awareness;
