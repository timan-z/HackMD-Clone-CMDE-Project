import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

const ydoc = new Y.Doc();
const ytext = ydoc.getText('lexical-content');

const provider = new WebsocketProvider('ws://localhost:4000', 'room-1', ydoc); // NOTE: 'room-1' can be dynamic later

const awareness = provider.awareness;

export { ydoc, ytext, provider, awareness };
