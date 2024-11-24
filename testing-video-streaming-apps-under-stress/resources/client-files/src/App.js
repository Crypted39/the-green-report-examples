import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Peer from "peerjs";

const App = () => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  const videoRef = useRef();
  const remoteVideoRef = useRef();
  const socketRef = useRef();
  const peerRef = useRef();
  const streamRef = useRef();

  useEffect(() => {
    // Initialize Socket.io connection
    socketRef.current = io("http://localhost:3000");

    // Initialize PeerJS
    peerRef.current = new Peer();

    peerRef.current.on("open", (peerId) => {
      socketRef.current.emit("peerInfo", { peerId });
    });

    // Handle incoming calls
    peerRef.current.on("call", async (call) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;

        call.answer(stream);
        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
        });
      } catch (err) {
        setError("Failed to access media devices");
      }
    });

    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.destroy();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const startSearching = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      setStatus("searching");
      socketRef.current.emit("startSearching");

      socketRef.current.on("matched", async ({ peerId }) => {
        setStatus("connected");
        const call = peerRef.current.call(peerId, stream);

        call.on("stream", (remoteStream) => {
          remoteVideoRef.current.srcObject = remoteStream;
        });
      });
    } catch (err) {
      setError("Failed to access media devices");
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <h1 className="text-2xl mb-4">Video Chat App</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="flex gap-4 mb-4">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="w-64 h-48 bg-gray-200"
        />
        <video
          ref={remoteVideoRef}
          autoPlay
          className="w-64 h-48 bg-gray-200"
        />
      </div>

      {status === "idle" && (
        <button
          onClick={startSearching}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Start Searching
        </button>
      )}

      {status === "searching" && <div>Searching for a partner...</div>}

      {status === "connected" && <div>Connected!</div>}
    </div>
  );
};

export default App;
