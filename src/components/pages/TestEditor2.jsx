import React, { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import {
  LexicalComposer,
} from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';

const TestEditor2 = () => {
  const [docReady, setDocReady] = useState(false);
  const [shouldBootstrap, setShouldBootstrap] = useState(true);
  const docRef = useRef(null);

  // Step 1: Initialize Y.Doc
  useEffect(() => {
    const doc = new Y.Doc();

    console.log("DEBUG: The value of doc (FIRST INITIALIZATION) => [", doc, "]");


    docRef.current = doc;
    setDocReady(true);
  }, []);

  // Step 2: "root" mutation watcher & auto-delete if invalid
  useEffect(() => {
    const doc = docRef.current;
    if (!doc || !shouldBootstrap) return;

    const observer = (events, transaction) => {
      const root = doc.get('root');
      const isValid = root instanceof Y.XmlText;

      if (!isValid) {
        console.warn('👀 Detected non-fragment root. Deleting:', root?.constructor?.name);
        doc.share.delete('root'); // Prevent invalid structure
      }
    };

    doc?.on('update', observer);
    return () => {
      doc?.off('update', observer);
    };
  }, [docRef, shouldBootstrap]);

  const initialConfig = {
    namespace: 'demo',
    onError: (error) => console.error(error),
  };

  const providerFactory = (id, yjsDocMap) => {
    const doc = docRef.current;



    console.log("DEBUG: The value of doc => [", doc, "]");



    yjsDocMap.set(id, doc);

    const provider = new WebsocketProvider('ws://localhost:1234', id, doc);

    provider.on('status', (event) =>
      console.log('🔌 WebSocket status:', event.status),
    );

    provider.on('sync', (isSynced) => {
      const root = doc.get('root');
      const isLexicalReady = root instanceof Y.XmlText;
      console.log('🧠 isLexicalReady:', isLexicalReady, '| root type:', root?.constructor?.name);

      if (isSynced && shouldBootstrap && isLexicalReady) {
        console.log('✅ Lexical is ready — you could save the doc now');
        setShouldBootstrap(false);
      }
    });

    return provider;
  };

  if (!docReady) return <div>Loading editor...</div>;

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-container" style={{ padding: '1rem', border: '1px solid #ccc' }}>
        <CollaborationPlugin
          id="root-watcher-room"
          providerFactory={providerFactory}
          shouldBootstrap={shouldBootstrap}
          initialEditorState={null}
        />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="editor"
              style={{ minHeight: '150px', outline: '1px solid #aaa' }}
            />
          }
          placeholder={<div>Start typing...</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </LexicalComposer>
  );
};

export default TestEditor2;
