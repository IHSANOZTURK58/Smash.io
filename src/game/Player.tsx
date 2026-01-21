import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh } from 'three';
import { useSpring, animated } from '@react-spring/three';

interface PlayerProps {
    position: Vector3;
    color: string;
    isCurrentTurn: boolean;
}

export const Player: React.FC<PlayerProps> = ({ position, color, isCurrentTurn }) => {
    const meshRef = useRef<Mesh>(null);

    // Smooth movement animation
    const { pos } = useSpring({
        pos: [position.x, position.y + 1, position.z],
        config: { mass: 1, tension: 170, friction: 26 }
    });

    useFrame((state) => {
        if (isCurrentTurn && meshRef.current) {
            // Bobbing animation for active player
            meshRef.current.position.y = (position.y + 1) + Math.sin(state.clock.elapsedTime * 5) * 0.2;
        }
    });

    return (
        <animated.group position={pos as any}>
            <mesh ref={meshRef} castShadow>
                <capsuleGeometry args={[0.3, 1, 4, 8]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Name Tag or Indicator could go here */}
            {isCurrentTurn && (
                <pointLight position={[0, 2, 0]} intensity={1} distance={5} color="white" />
            )}
        </animated.group>
    );
};
