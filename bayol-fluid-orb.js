/*
 * BAYOL CELL — Fluid Orb nativo
 * Inspirado en Rare UI / fluid-orb (MIT). Adaptado a vanilla HTML/JS para BAYOL CELL.
 * API global: window.BayolFluidOrb.mount(target, options)
 */
(function(){
  'use strict';
  if(window.BayolFluidOrb) return;

  const VERT=`
    attribute vec2 a_position;
    void main(){
      gl_Position=vec4(a_position,0.0,1.0);
    }
  `;

  const FRAG=`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform vec3 u_color;

    float rand(vec2 p){
      return fract(sin(dot(p,vec2(93.9898,67.345))) * 43758.5453);
    }

    float valueNoise(vec2 p){
      vec2 i=floor(p);
      vec2 f=fract(p);
      vec2 s=f*f*(3.0-2.0*f);
      float a=rand(i);
      float b=rand(i+vec2(1.0,0.0));
      float c=rand(i+vec2(0.0,1.0));
      float d=rand(i+vec2(1.0,1.0));
      return mix(mix(a,b,s.x),mix(c,d,s.x),s.y);
    }

    float fbm(vec2 p){
      float v=0.0;
      float amp=0.58;
      for(int i=0;i<4;i++){
        v+=amp*valueNoise(p);
        p=p*2.05+0.11;
        amp*=0.48;
      }
      return v;
    }

    void main(){
      vec2 uv=gl_FragCoord.xy/u_resolution.xy;
      vec2 centered=uv-0.5;
      float t=u_time*0.19;

      vec2 drift=vec2(
        sin(t*1.13)+0.45*cos(t*1.81+1.2),
        cos(t*0.91)+0.42*sin(t*1.47+2.0)
      );

      vec2 p=vec2(uv.x*1.75,uv.y*1.08)+drift*0.56;
      vec2 warp=vec2(
        fbm(p+vec2(1.7,-0.4)),
        fbm(p+vec2(-1.2,2.1))
      );
      float n=fbm(p+warp*1.35);

      float vertical=clamp(1.0-uv.y,0.0,1.0);
      float shade=clamp(vertical*0.76+(n-0.43)*0.95,0.0,1.0);

      vec3 white=vec3(0.995,1.0,1.0);
      vec3 soft=mix(white,u_color,0.42);
      vec3 rich=mix(u_color,vec3(0.03,0.08,0.18),0.10);
      vec3 col=mix(white,soft,smoothstep(0.22,0.56,shade));
      col=mix(col,rich,smoothstep(0.55,0.92,shade));

      float dist=length(centered);
      float alpha=1.0-smoothstep(0.485,0.505,dist);
      float inner=1.0-smoothstep(0.40,0.50,dist);
      col+=inner*0.035;

      gl_FragColor=vec4(col,alpha);
    }
  `;

  function hexToRgb01(hex){
    let h=String(hex||'#1A73F2').replace('#','').trim();
    if(h.length===3) h=h.split('').map(x=>x+x).join('');
    const n=parseInt(h,16);
    if(h.length!==6 || Number.isNaN(n)) return [0.10,0.45,0.95];
    return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255];
  }

  function compile(gl,type,source){
    const shader=gl.createShader(type);
    if(!shader) return null;
    gl.shaderSource(shader,source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
      console.error('[BayolFluidOrb] shader:',gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function resolveTarget(target){
    if(typeof target==='string') return document.querySelector(target);
    return target instanceof Element ? target : null;
  }

  function mount(target,options={}){
    const host=resolveTarget(target);
    if(!host) throw new Error('BayolFluidOrb: target no encontrado');

    const size=Math.max(24,Number(options.size||host.dataset.orbSize||240));
    const color=options.color||host.dataset.orbColor||'#1A73F2';
    const speed=Math.max(0,Number(options.speed ?? host.dataset.orbSpeed ?? 1));
    const glow=options.glow ?? host.dataset.orbGlow !== 'false';

    host.classList.add('bayol-fluid-orb');
    host.dataset.orbGlow=String(!!glow);
    host.style.width=size+'px';
    host.style.height=size+'px';

    const old=host.querySelector(':scope > canvas[data-bayol-fluid-orb]');
    if(old) old.remove();

    const canvas=document.createElement('canvas');
    canvas.dataset.bayolFluidOrb='1';
    host.appendChild(canvas);

    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true});
    if(!gl){
      host.classList.add('bayol-fluid-orb-fallback');
      host.style.background=`radial-gradient(circle at 40% 32%, #fff 0 18%, ${color}88 48%, ${color} 100%)`;
      return {destroy(){canvas.remove();}};
    }

    const program=gl.createProgram();
    const vs=compile(gl,gl.VERTEX_SHADER,VERT);
    const fs=compile(gl,gl.FRAGMENT_SHADER,FRAG);
    if(!program || !vs || !fs) return {destroy(){canvas.remove();}};

    gl.attachShader(program,vs);
    gl.attachShader(program,fs);
    gl.linkProgram(program);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){
      console.error('[BayolFluidOrb] link:',gl.getProgramInfoLog(program));
      return {destroy(){canvas.remove();}};
    }
    gl.useProgram(program);

    const buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const aPos=gl.getAttribLocation(program,'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos,2,gl.FLOAT,false,0,0);

    const uResolution=gl.getUniformLocation(program,'u_resolution');
    const uTime=gl.getUniformLocation(program,'u_time');
    const uColor=gl.getUniformLocation(program,'u_color');
    const rgb=hexToRgb01(color);
    gl.uniform3f(uColor,rgb[0],rgb[1],rgb[2]);

    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf=0;
    let disposed=false;
    const started=performance.now();

    function resize(){
      const dpr=Math.min(window.devicePixelRatio||1,2);
      const rect=host.getBoundingClientRect();
      const w=Math.max(1,Math.round(rect.width*dpr));
      const h=Math.max(1,Math.round(rect.height*dpr));
      if(canvas.width!==w || canvas.height!==h){
        canvas.width=w; canvas.height=h;
        gl.viewport(0,0,w,h);
        gl.uniform2f(uResolution,w,h);
      }
    }

    function draw(now){
      if(disposed) return;
      resize();
      gl.uniform1f(uTime,reduced?0:((now-started)/1000)*speed);
      gl.clearColor(0,0,0,0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES,0,6);
      if(!reduced) raf=requestAnimationFrame(draw);
    }

    draw(started);

    const ro=('ResizeObserver' in window)?new ResizeObserver(resize):null;
    ro?.observe(host);

    return {
      canvas,
      destroy(){
        disposed=true;
        cancelAnimationFrame(raf);
        ro?.disconnect();
        try{
          gl.deleteBuffer(buffer);
          gl.deleteProgram(program);
          gl.deleteShader(vs);
          gl.deleteShader(fs);
        }catch{}
        canvas.remove();
      }
    };
  }

  function autoMount(root=document){
    root.querySelectorAll('[data-bayol-fluid-orb]').forEach(el=>{
      if(el.dataset.orbMounted==='1') return;
      el.dataset.orbMounted='1';
      try{ el.__bayolFluidOrb=mount(el); }catch(e){ console.warn(e); }
    });
  }

  window.BayolFluidOrb={mount,autoMount,version:'20260913a'};

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>autoMount(),{once:true});
  }else autoMount();
})();
