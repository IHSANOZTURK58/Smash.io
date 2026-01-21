import React, { useState } from 'react';
import { PeerProvider, usePeer } from './network/PeerContext';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Board } from './game/Board';
import { Player } from './game/Player';
import { useGame } from './game/useGame';

const Lobby = () => {
  const { peerId, connectToPeer, connections, remoteStreams, isHost } = usePeer();
  const { players, turnIndex, rollDice, diceValue, isMoving, myId } = useGame();
  const [targetId, setTargetId] = useState('');

  const isMyTurn = players[turnIndex]?.id === peerId;

  return (
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 flex flex-col justify-between p-6">
      {/* Top Bar: Game Info & Connection */}
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-xl">
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600 mb-2 filter drop-shadow-lg">
            Smash.io
          </h1>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-400 uppercase">My ID</span>
              <code className="bg-black/50 px-2 py-1 rounded text-cyan-400 font-mono text-sm border border-cyan-500/30">
                {peerId || "Connecting..."}
              </code>
              {peerId && <button onClick={() => navigator.clipboard.writeText(peerId)} className="text-xs hover:text-white text-gray-400">COPY</button>}
            </div>

            <div className="flex gap-2 items-center mt-2">
              <input
                type="text"
                placeholder="HOST ID..."
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="bg-black/50 text-white border border-gray-700 px-3 py-1 rounded text-sm w-32 focus:border-cyan-500 outline-none placeholder-gray-600"
              />
              <button
                onClick={() => connectToPeer(targetId)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-1 rounded text-sm font-bold transition-all shadow-lg hover:shadow-cyan-500/20"
              >
                JOIN
              </button>
            </div>

            <div className="mt-2 text-xs space-y-1 text-gray-300">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isHost ? 'bg-yellow-400' : 'bg-blue-400'}`}></div>
                <span>{isHost ? "HOST" : "CLIENT"}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{connections.length + 1} Connected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Turn Indicator */}
        <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white text-right">
          <h2 className="text-sm text-gray-400 uppercase font-bold tracking-widest mb-1">Current Turn</h2>
          <div className="text-2xl font-bold flex items-center gap-3 justify-end">
            <div style={{ backgroundColor: players[turnIndex]?.color }} className="w-4 h-4 rounded-full shadow-[0_0_10px_currentColor]"></div>
            {isMyTurn ? <span className="text-cyan-400">YOU</span> : <span className="text-gray-200">Player {turnIndex + 1}</span>}
          </div>
          {diceValue && (
            <div className="mt-2 text-6xl font-black text-white animate-bounce">
              {diceValue}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Bar: Actions */}
      <div className="flex justify-center mb-8 pointer-events-auto">
        {isMyTurn && !isMoving && !diceValue && (
          <button
            onClick={rollDice}
            className="group relative px-8 py-4 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl font-black text-2xl text-white shadow-2xl hover:scale-105 transition-transform active:scale-95 overflow-hidden border border-white/20"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:bg-transparent transition-colors"></div>
            ROLL DICE
          </button>
        )}
      </div>

      {/* Hidden Audio Elements for Voice Chat */}
      {Object.entries(remoteStreams).map(([id, stream]) => (
        <AudioPlayer key={id} stream={stream} />
      ))}
    </div>
  );
};

const AudioPlayer = ({ stream }: { stream: MediaStream }) => {
  const audioRef = React.useRef<HTMLAudioElement>(null);
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
    }
  }, [stream]);
  return <audio ref={audioRef} />;
}

const GameScene = () => {
  const { players, turnIndex, nodes } = useGame();

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

      <Board />

      {players.map((player, index) => {
        const pos = nodes[player.nodeIndex];
        return (
          <Player
            key={player.id}
            position={pos}
            color={player.color}
            isCurrentTurn={index === turnIndex}
          />
        );
      })}

      <gridHelper args={[50, 50, 0x444444, 0x222222]} position={[0, -0.1, 0]} />
    </group>
  );
};

function App() {
  return (
    <PeerProvider>
      <div className="relative w-full h-full bg-gray-900">
        <Lobby />
        <Canvas shadows camera={{ position: [0, 15, 10], fov: 45 }}>
          <OrbitControls minDistance={5} maxDistance={30} />
          <GameScene />
        </Canvas>
      </div>
    </PeerProvider>
  )
}

export default App;
