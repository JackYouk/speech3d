import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Text3D, shaderMaterial } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import * as THREE from 'three';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const HashShaderMaterial = shaderMaterial(
  // Uniforms
  { time: 0, color: new THREE.Color() },
  // Vertex Shader
  `void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,
  // Fragment Shader
  `uniform float time;
  uniform vec3 color;

  void main() {
    float pattern = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453 + time);
    gl_FragColor = vec4(vec3(pattern) * color, 1.0);
  }`
);
extend({ HashShaderMaterial });

function WordMaterial() {
  const shaderRef = useRef();

  useFrame(({ clock }) => {
    shaderRef.current.uniforms.time.value = clock.getElapsedTime();
  });

  const color = useMemo(() => new THREE.Color(Math.random(), Math.random(), Math.random()), []);

  return <hashShaderMaterial ref={shaderRef} color={color} />;
}


function WordGenerator({ word }) {
  console.log(word)
  return (
    <RigidBody colliders={'hull'} position={[Math.random()*10 - Math.random()*10, 6, Math.random()*10 - Math.random()*10]} rotation={[-Math.PI/2, 0, 0]}>
      <Text3D font="./Black_Han.json" scale={3} >
        {word}
        <WordMaterial />
      </Text3D>
    </RigidBody>
  );
}


export default function App() {
  const [spokenWords, setSpokenWords] = useState([]);

  useEffect(() => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = event => {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const transcript = event.results[i][0].transcript.trim();
            const words = transcript.split(' ');
            words.forEach(word => {
              if(word) {
                setSpokenWords(prevWords => [...prevWords, word]);
              }
            });
          } else {
            const transcript = event.results[i][0].transcript.trim();
            setSpokenWords(prevWords => [...prevWords, transcript]);
          }
        }
      };      
      recognition.onerror = (event) => {
        console.error('Speech Recognition Error: ', event.error);
      };
      recognition.onnomatch = (event) => {
        console.log('No match for speech input');
      };      
      recognition.start();
  }, []);

  return (
    <>
        <Canvas 
          style={{ position: 'absolute', width: '100%', height: '100vh' }}
          camera={{ position: [0, 5, 0], rotation: [-Math.PI / 2, 0, 0] }}
        >
          <Suspense fallback={null}>
            <pointLight position={[-10, -10, -5]} />
            <ambientLight intensity={0.4} />
            <Physics gravity={[0,-1.2,0]}>
              {spokenWords.map((word, index) => (
                <WordGenerator key={index} word={word} />
              ))}
            </Physics>
          </Suspense>
        </Canvas>
    </>
  );
}
