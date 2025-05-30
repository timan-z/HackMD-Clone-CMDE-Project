// custom client to replace WebSocket:
import { useEffect, useRef } from "react";
import * as Y from "yjs";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useYjsBinding } from "@lexical/yjs";

export default function CollaborativeBinding({ roomId }) {
  const [editor] = useLexicalComposerContext();
  const ydocRef = useRef(new Y.Doc());
  const wsRef = useRef(null);

  useEffect(() => {
    const ydoc = ydocRef.current;
    const ws = new WebSocket(`ws://localhost:1234/${roomId}`);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const update = new Uint8Array(event.data);
      try {
        Y.applyUpdate(ydoc, update);
      } catch (err) {
        console.error("[WS] Error applying update:", err);
      }
    };

    ydoc.on("update", (update) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(update);
      }
    });

    ws.onclose = () => console.log("[WS] Closed");
    ws.onerror = (e) => console.error("[WS] Error", e);

    return () => ws.close();
  }, [roomId]);

  useYjsBinding(ydocRef.current.getText("root"), editor);

  return null;
}
