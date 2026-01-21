import { useState, useEffect } from 'react';
console.log("MODULE: useGame.ts loaded");
import { usePeer } from '../network/PeerContext';
import { nodes } from './Board';

interface PlayerState {
    id: string; // Peer ID
    nodeIndex: number;
    color: string;
}

interface GameState {
    players: PlayerState[];
    currentTurnIndex: number;
}

const COLORS = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#00FFFF', '#FF00FF'];

export const useGame = () => {
    const { peerId, connections, isHost, sendMessage, lastMessage } = usePeer();

    // Initial state: just me
    const [players, setPlayers] = useState<PlayerState[]>([
        { id: peerId, nodeIndex: 0, color: COLORS[0] } // Host is always first initially
    ]);
    const [turnIndex, setTurnIndex] = useState(0);

    // State for game flow
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    // Host logic to sync players when connections change
    useEffect(() => {
        if (!isHost) return;

        setPlayers(prev => {
            const connectedIds = connections.map(c => c.peer);
            const allIds = [peerId, ...connectedIds];

            // Map existing players or create new ones
            const newPlayers = allIds.map((id, index) => {
                const existing = prev.find(p => p.id === id);
                return existing || {
                    id,
                    nodeIndex: 0,
                    color: COLORS[index % COLORS.length]
                };
            });

            // Broadcast new state
            sendMessage('GAME_STATE', { players: newPlayers, turnIndex });
            return newPlayers;
        });

    }, [connections, peerId, isHost, sendMessage]);

    const rollDice = () => {
        if (isMoving) return;

        // Ensure it's this player's turn
        const currentPlayer = players[turnIndex];
        if (currentPlayer.id !== peerId) return;

        const rolled = Math.floor(Math.random() * 6) + 1;
        setDiceValue(rolled);

        // Notify everyone about the roll
        sendMessage('DICE_ROLLED', { value: rolled, playerId: peerId });

        // Start movement logic
        movePlayer(peerId, rolled);
    };

    const movePlayer = (playerId: string, steps: number) => {
        setIsMoving(true);
        let stepsRemaining = steps;

        const interval = setInterval(() => {
            setPlayers(prev => {
                const newPlayers = prev.map(p => {
                    if (p.id !== playerId) return p;
                    return { ...p, nodeIndex: (p.nodeIndex + 1) % nodes.length };
                });

                // If Host, broadcast immediate position updates for smoothness (optional, can result in high traffic)
                // For better perf, host broadcasts FINAL state, but for smooth UI, local state updates are key.
                if (isHost) {
                    sendMessage('PLAYER_MOVED', { playerId, nodeIndex: (prev.find(p => p.id === playerId)!.nodeIndex + 1) % nodes.length });
                }

                return newPlayers;
            });

            stepsRemaining--;
            if (stepsRemaining <= 0) {
                clearInterval(interval);
                setIsMoving(false);
                setDiceValue(null);

                // End of turn logic
                if (isHost) {
                    setTurnIndex(prev => {
                        const nextTurn = (prev + 1) % players.length;
                        sendMessage('TURN_CHANGE', { turnIndex: nextTurn });
                        return nextTurn;
                    });
                }
            }
        }, 300); // 300ms per step
    };

    // Listen for updates from Host or other peers
    useEffect(() => {
        if (!lastMessage) return;

        const { type, payload } = lastMessage;

        switch (type) {
            case 'GAME_STATE':
                setPlayers(payload.players);
                setTurnIndex(payload.turnIndex);
                break;
            case 'DICE_ROLLED':
                console.log(`${payload.playerId} rolled ${payload.value}`);
                setDiceValue(payload.value);
                // If we are NOT the one who rolled (client observing host or other client), start visual movement
                // The actual logic is driven locally by movePlayer on the rolling client side? 
                // NO: ideally Host drives Logic, OR the Active Player drives logic and Host validates.
                // Simplified: Active Player drives their own movement visual, Host trusts it for now OR Host calculates it.
                // Let's have the Active Player drive the move locally, and others listen to 'PLAYER_MOVED' or just simulate it too.

                // Better approach for sync: Whoever rolled "simulates" it.
                // If I am NOT the active player, I see the dice roll and should probably wait for position updates OR animate it myself.
                if (payload.playerId !== peerId) {
                    movePlayer(payload.playerId, payload.value);
                }
                break;
            case 'TURN_CHANGE':
                setTurnIndex(payload.turnIndex);
                setDiceValue(null);
                break;
            // case 'PLAYER_MOVED':
            //     // Optional: precise sync if needed, but 'simulation' on each client is smoother
            //     break;
        }
    }, [lastMessage, peerId]); // Add peerId dependency

    return { players, turnIndex, nodes, rollDice, diceValue, isMoving, myId: peerId };
};
