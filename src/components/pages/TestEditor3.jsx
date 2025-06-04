import React, { useCallback } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

// Optional: default state in case doc is empty
import { $getRoot, $createParagraphNode, $createTextNode } from 'lexical';

function $initialEditorState() {
  const root = $getRoot();
  const paragraph = $createParagraphNode();
  paragraph.append($createTextNode('Welcome to collaborative editing!'));
  root.append(paragraph);
}

// Simple in-memory doc manager (can be replaced with context or state mgmt)
const yjsDocMap = new Map();

function getDocFromMap(id, map) {
  if (!map.has(id)) {
    map.set(id, new Y.Doc());
  }
  return map.get(id);
}

export default function TestEditor3() {
  const initialConfig = {
    editorState: null, // Important for CollaborationPlugin
    namespace: 'Demo',
    theme: {}, // Optional: provide a theme object
    nodes: [],
    onError: (error) => {
      throw error;
    },
  };

  const providerFactory = useCallback((id) => {
    //const doc = getDocFromMap(id, yjsDocMap);
    const doc = new Y.Doc();
    return new WebsocketProvider('ws://localhost:1234', id, doc, {
      connect: true,
    });
  }, []);

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <RichTextPlugin
        contentEditable={<ContentEditable className="editor-input" />}
        placeholder={<div className="editor-placeholder">Enter some rich text...</div>}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <CollaborationPlugin
        id="demo-room"
        providerFactory={providerFactory}
        initialEditorState={$initialEditorState}
        shouldBootstrap={true}
      />
    </LexicalComposer>
  );
}
