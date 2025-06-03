// Trying to see if I can hook Yjs and Lexical together with a test file:
import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import {
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import {ContentEditable} from '@lexical/react/LexicalContentEditable';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

const TestEditor = () => {
  const [docReady, setDocReady] = useState(false);
  const [shouldBootstrap, setShouldBootstrap] = useState(true);
  const docRef = useRef(null);

  useEffect(() => {
    // Create a new Yjs document
    const doc = new Y.Doc();
    docRef.current = doc;
    setDocReady(true);
  }, []);

  const initialConfig = {
    namespace: 'demo',
    onError: (error) => console.error(error),
  };

  const providerFactory = (id, yjsDocMap) => {
    const doc = docRef.current;
    yjsDocMap.set(id, doc);

    const provider = new WebsocketProvider('ws://localhost:1234', id, doc, {
      connect: true,
    });

    provider.on('status', (event) =>
      console.log('WebSocket status:', event.status)
    );

    provider.on('sync', (isSynced) => {
      console.log('Yjs sync status:', isSynced);

      const root = doc.get('root');
      const isLexicalReady = root instanceof Y.XmlFragment;
      console.log('isLexicalReady:', isLexicalReady, '| root type:', root?.constructor?.name);

      if (isSynced && shouldBootstrap && isLexicalReady) {
        console.log('Lexical is ready — you could save the doc now');
      }
    });

    return provider;
  };

  if (!docReady) return <div>Loading editor...</div>;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container" style={{ padding: '1rem', border: '1px solid #ccc' }}>
        <CollaborationPlugin
          id="demo-room"
          providerFactory={providerFactory}
          shouldBootstrap={shouldBootstrap}
          initialEditorState={null}
        />

        <PlainTextPlugin
          contentEditable={
            <ContentEditable className="editor" style={{ minHeight: '150px', outline: '1px solid #aaa' }} />
          }
          placeholder={<div>Start typing...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </LexicalComposer>
  );
};

export default TestEditor;


