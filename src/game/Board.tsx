import React, { useMemo } from 'react';
import { Vector3, CatmullRomCurve3 } from 'three';
import { Text, Extrude, Sphere } from '@react-three/drei';

// Complex board path generation
const generatePath = () => {
    const points = [];
    // Create a winding path that is much longer
    // We use a figure-8-ish or winding loop pattern
    points.push(new Vector3(-15, 0, -10));
    points.push(new Vector3(-5, 0, -15));
    points.push(new Vector3(5, 0, -10));
    points.push(new Vector3(15, 0, 0));
    points.push(new Vector3(5, 0, 10));
    points.push(new Vector3(-5, 0, 15));
    points.push(new Vector3(-15, 0, 10));
    points.push(new Vector3(-20, 0, 0));

    // Close the loop
    points.push(points[0]);

    return new CatmullRomCurve3(points, true); // true = closed
};

const curve = generatePath();
const NUM_NODES = 50;

// Sample points along the curve for nodes
export const nodes = Array.from({ length: NUM_NODES }).map((_, i) => {
    const t = i / NUM_NODES;
    return curve.getPointAt(t);
});

export const Board: React.FC = () => {
    const extrudeSettings = useMemo(() => ({
        steps: 100,
        bevelEnabled: false,
        extrudePath: curve
    }), []);

    // Create a shape for the tube
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.absarc(0, 0, 0.4, 0, Math.PI * 2, false);
        return s;
    }, []);

    return (
        <group>
            {/* The Path Track */}
            <Extrude args={[shape, extrudeSettings]} castShadow receiveShadow>
                <meshStandardMaterial color="#0ea5e9" roughness={0.3} metalness={0.8} />
            </Extrude>

            {/* Nodes */}
            {nodes.map((pos, i) => {
                const isSpecial = i % 5 === 0;
                return (
                    <group key={i} position={pos}>
                        {/* Node Base */}
                        <mesh position={[0, 0.2, 0]} receiveShadow castShadow>
                            <cylinderGeometry args={[0.6, 0.6, 0.3, 32]} />
                            <meshStandardMaterial
                                color={isSpecial ? "#f97316" : "#3b82f6"}
                                emissive={isSpecial ? "#f97316" : "#3b82f6"}
                                emissiveIntensity={0.5}
                            />
                        </mesh>

                        {/* Inner Highlight */}
                        <mesh position={[0, 0.36, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                            <ringGeometry args={[0.3, 0.4, 32]} />
                            <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
                        </mesh>

                        <Text
                            position={[0, 1.5, 0]}
                            fontSize={0.6}
                            color="white"
                            anchorX="center"
                            anchorY="middle"
                            font="https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxM.woff" // Use a standard font if possible or rely on default
                        >
                            {i + 1}
                        </Text>
                    </group>
                )
            })}

            {/* Ground Plane with Grid */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
                <planeGeometry args={[100, 100]} />
                <meshStandardMaterial color="#0f172a" />
            </mesh>
            <gridHelper args={[100, 50, 0x1e293b, 0x1e293b]} position={[0, -0.4, 0]} />
        </group>
    );
};

import * as THREE from 'three';
