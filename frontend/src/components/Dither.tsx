/* eslint-disable react/no-unknown-property */
import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import './Dither.css';

const vertexShader = `
precision highp float;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;
uniform float waveSpeed;
uniform float waveFrequency;
uniform float waveAmplitude;
uniform vec3 waveColor;
uniform float colorNum;
uniform float pixelSize;
uniform int enableMouseInteraction;
uniform float mouseRadius;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(in vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.0 + 0.13;
    a *= 0.52;
  }
  return v;
}

float bayer8(vec2 fragCoord) {
  vec2 p = mod(floor(fragCoord), 8.0);
  float x = p.x;
  float y = p.y;
  float idx = x + y * 8.0;
  float m = 0.0;
  if (idx == 0.0) m = 0.0; else if (idx == 1.0) m = 48.0; else if (idx == 2.0) m = 12.0; else if (idx == 3.0) m = 60.0;
  else if (idx == 4.0) m = 3.0; else if (idx == 5.0) m = 51.0; else if (idx == 6.0) m = 15.0; else if (idx == 7.0) m = 63.0;
  else if (idx == 8.0) m = 32.0; else if (idx == 9.0) m = 16.0; else if (idx == 10.0) m = 44.0; else if (idx == 11.0) m = 28.0;
  else if (idx == 12.0) m = 35.0; else if (idx == 13.0) m = 19.0; else if (idx == 14.0) m = 47.0; else if (idx == 15.0) m = 31.0;
  else if (idx == 16.0) m = 8.0; else if (idx == 17.0) m = 56.0; else if (idx == 18.0) m = 4.0; else if (idx == 19.0) m = 52.0;
  else if (idx == 20.0) m = 11.0; else if (idx == 21.0) m = 59.0; else if (idx == 22.0) m = 7.0; else if (idx == 23.0) m = 55.0;
  else if (idx == 24.0) m = 40.0; else if (idx == 25.0) m = 24.0; else if (idx == 26.0) m = 36.0; else if (idx == 27.0) m = 20.0;
  else if (idx == 28.0) m = 43.0; else if (idx == 29.0) m = 27.0; else if (idx == 30.0) m = 39.0; else if (idx == 31.0) m = 23.0;
  else if (idx == 32.0) m = 2.0; else if (idx == 33.0) m = 50.0; else if (idx == 34.0) m = 14.0; else if (idx == 35.0) m = 62.0;
  else if (idx == 36.0) m = 1.0; else if (idx == 37.0) m = 49.0; else if (idx == 38.0) m = 13.0; else if (idx == 39.0) m = 61.0;
  else if (idx == 40.0) m = 34.0; else if (idx == 41.0) m = 18.0; else if (idx == 42.0) m = 46.0; else if (idx == 43.0) m = 30.0;
  else if (idx == 44.0) m = 33.0; else if (idx == 45.0) m = 17.0; else if (idx == 46.0) m = 45.0; else if (idx == 47.0) m = 29.0;
  else if (idx == 48.0) m = 10.0; else if (idx == 49.0) m = 58.0; else if (idx == 50.0) m = 6.0; else if (idx == 51.0) m = 54.0;
  else if (idx == 52.0) m = 9.0; else if (idx == 53.0) m = 57.0; else if (idx == 54.0) m = 5.0; else if (idx == 55.0) m = 53.0;
  else if (idx == 56.0) m = 42.0; else if (idx == 57.0) m = 26.0; else if (idx == 58.0) m = 38.0; else if (idx == 59.0) m = 22.0;
  else if (idx == 60.0) m = 41.0; else if (idx == 61.0) m = 25.0; else if (idx == 62.0) m = 37.0; else m = 21.0;
  return m / 64.0;
}

vec3 quantize(vec3 col, float levels) {
  float stepv = 1.0 / max(levels - 1.0, 1.0);
  return floor(col / stepv + 0.5) * stepv;
}

void main() {
  vec2 uv = gl_FragCoord.xy / resolution;
  vec2 p = uv - 0.5;
  p.x *= resolution.x / resolution.y;

  float t = time * waveSpeed;
  float n = fbm(p * waveFrequency + vec2(t, -t * 0.7));
  n += 0.002 * sin((p.x + t) * 7.0) + 0.06 * cos((p.y - t) * 8.0);
  n = smoothstep(0.2, 1.2, n * (1.0 + waveAmplitude));

  if (enableMouseInteraction == 1) {
    vec2 m = mouse / resolution - 0.5;
    m.y *= -1.0;
    m.x *= resolution.x / resolution.y;
    float d = length(p - m);
    float influence = 1.0 - smoothstep(0.0, mouseRadius, d);
    n += influence * 0.18;
  }

  vec3 deep = vec3(0.005, 0.01, 0.03);
  vec3 bright = waveColor*0.5;
  vec3 col = mix(deep, bright, n*0.9);

  vec2 px = floor(gl_FragCoord.xy / max(pixelSize, 1.0)) * max(pixelSize, 1.0);
  float threshold = bayer8(px) - 0.5;
  col += threshold * (1.0 / max(colorNum, 2.0));
  col = quantize(clamp(col, 0.0, 1.0), colorNum);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface DitherProps {
  waveSpeed?: number;
  waveFrequency?: number;
  waveAmplitude?: number;
  waveColor?: [number, number, number];
  colorNum?: number;
  pixelSize?: number;
  disableAnimation?: boolean;
  enableMouseInteraction?: boolean;
  mouseRadius?: number;
}

function ShaderPlane({
  waveSpeed,
  waveFrequency,
  waveAmplitude,
  waveColor,
  colorNum,
  pixelSize,
  disableAnimation,
  enableMouseInteraction,
  mouseRadius,
}: Required<DitherProps>) {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, gl, viewport } = useThree();
  const mouse = useRef(new THREE.Vector2(0, 0));

  const uniforms = useMemo(
    () => ({
      resolution: { value: new THREE.Vector2(1, 1) },
      time: { value: 0 },
      mouse: { value: new THREE.Vector2(0, 0) },
      waveSpeed: { value: waveSpeed },
      waveFrequency: { value: waveFrequency },
      waveAmplitude: { value: waveAmplitude },
      waveColor: { value: new THREE.Color(...waveColor) },
      colorNum: { value: colorNum },
      pixelSize: { value: pixelSize },
      enableMouseInteraction: { value: enableMouseInteraction ? 1 : 0 },
      mouseRadius: { value: mouseRadius },
    }),
    [
      colorNum,
      enableMouseInteraction,
      mouseRadius,
      pixelSize,
      waveAmplitude,
      waveColor,
      waveFrequency,
      waveSpeed,
    ]
  );

  useEffect(() => {
    const dpr = gl.getPixelRatio();
    uniforms.resolution.value.set(size.width * dpr, size.height * dpr);
  }, [gl, size, uniforms]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!enableMouseInteraction) return;
      const rect = gl.domElement.getBoundingClientRect();
      const dpr = gl.getPixelRatio();
      mouse.current.set((e.clientX - rect.left) * dpr, (e.clientY - rect.top) * dpr);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [enableMouseInteraction, gl]);

  useFrame(({ clock }) => {
    uniforms.waveSpeed.value = waveSpeed;
    uniforms.waveFrequency.value = waveFrequency;
    uniforms.waveAmplitude.value = waveAmplitude;
    uniforms.waveColor.value.set(...waveColor);
    uniforms.colorNum.value = colorNum;
    uniforms.pixelSize.value = pixelSize;
    uniforms.enableMouseInteraction.value = enableMouseInteraction ? 1 : 0;
    uniforms.mouseRadius.value = mouseRadius;
    uniforms.mouse.value.copy(mouse.current);
    if (!disableAnimation) uniforms.time.value = clock.elapsedTime;
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader} />
    </mesh>
  );
}

export default function Dither({
  waveSpeed = 0.02,
  waveFrequency = 2,
  waveAmplitude = 0.34,
  waveColor = [0.3, 0.3, 0.5],
  colorNum = 12.1,
  pixelSize = 4,
  disableAnimation = false,
  enableMouseInteraction = true,
  mouseRadius = 0.05,
}: DitherProps) {
  return (
    <Canvas
      className="dither-container"
      dpr={[1, 1.5]}
      gl={{ antialias: false, alpha: false }}
      camera={{ position: [0, 0, 3] }}
    >
      <color attach="background" args={['#02030a']} />
      <ShaderPlane
        waveSpeed={waveSpeed}
        waveFrequency={waveFrequency}
        waveAmplitude={waveAmplitude}
        waveColor={waveColor}
        colorNum={colorNum}
        pixelSize={pixelSize}
        disableAnimation={disableAnimation}
        enableMouseInteraction={enableMouseInteraction}
        mouseRadius={mouseRadius}
      />
    </Canvas>
  );
}
