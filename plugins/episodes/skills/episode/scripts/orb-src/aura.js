// The energy field: one shared WebGL context renders a flowing plasma aura for every orb (GPU, one quad); each orb copies it
// into its own 2D canvas and paints the thinking-orbs dots on top. null when WebGL isn't available (the orb draws its dots only).
export const Aura=(()=>{
  const MAX=512, cv=document.createElement("canvas"); cv.width=cv.height=MAX;
  const gl=cv.getContext("webgl",{premultipliedAlpha:true,alpha:true,preserveDrawingBuffer:true,antialias:false});
  if(!gl) return null;
  const vs=`attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}`;
  const fs=`precision highp float;varying vec2 uv;uniform float t,energy,seed,dark;uniform vec3 c,spark;
  vec3 hash3(vec3 p){p=vec3(dot(p,vec3(127.1,311.7,74.7)),dot(p,vec3(269.5,183.3,246.1)),dot(p,vec3(113.5,271.9,124.6)));return -1.+2.*fract(sin(p)*43758.5453);}
  float noise(vec3 p){vec3 i=floor(p),f=fract(p),u=f*f*(3.-2.*f);
    return mix(mix(mix(dot(hash3(i),f),dot(hash3(i+vec3(1,0,0)),f-vec3(1,0,0)),u.x),mix(dot(hash3(i+vec3(0,1,0)),f-vec3(0,1,0)),dot(hash3(i+vec3(1,1,0)),f-vec3(1,1,0)),u.x),u.y),
               mix(mix(dot(hash3(i+vec3(0,0,1)),f-vec3(0,0,1)),dot(hash3(i+vec3(1,0,1)),f-vec3(1,0,1)),u.x),mix(dot(hash3(i+vec3(0,1,1)),f-vec3(0,1,1)),dot(hash3(i+vec3(1,1,1)),f-vec3(1,1,1)),u.x),u.y),u.z);}
  float fbm(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*noise(p);p=p*2.02+vec3(1.7,9.2,4.1);a*=.5;}return v;}
  void main(){
    vec2 q=uv*1.12; float r=length(q);
    float ang=atan(q.y,q.x);
    float tt=t*(.18+.5*energy);
    vec3 P=vec3(q*1.35,tt+seed);
    vec2 w=vec2(fbm(P),fbm(P+vec3(5.2,1.3,2.8)));
    float f=fbm(vec3(q*1.6+1.8*w,tt*1.3+seed));
    float swirl=fbm(vec3(cos(ang+tt*.6)*r*2.,sin(ang+tt*.6)*r*2.,tt*.7+seed*2.));
    float sphere=smoothstep(1.02,.35,r);
    float core=exp(-r*r*(5.5-2.5*energy));
    float plasma=smoothstep(.02,.55,f+.25*swirl)*sphere;
    float rim=smoothstep(.55,.86,r)*smoothstep(1.,.84,r)*(.55+.45*sin(ang*3.+tt*2.+f*6.));
    float fil=pow(1.-abs(fbm(vec3(q*3.2+w*2.,tt*.9+seed*3.))*2.),6.)*sphere*smoothstep(.1,.7,r);
    float halo=exp(-max(r-.7,0.)*6.)*smoothstep(1.35,.7,r)*.35;
    vec3 hot=mix(c,vec3(1.),.55), deep=c*vec3(.5,.62,.85)+vec3(.0,.02,.06), shift=c*.72+spark*.28;   // the shift is a spark of the character's warm color, not a hue rotation (that read as violet)
    vec3 col=deep*halo+c*plasma*(.6+.5*energy)+hot*core*(.45+.4*energy)+shift*rim*energy*.9+hot*fil*(.35+.6*energy);
    float a=clamp(halo+plasma*(.5+.3*energy)+core*.7+rim*energy*.6+fil*(.3+.5*energy),0.,1.);
    if(dark<.5){
      // paper: light can't be added, only ink laid down, so the mood's dark ink mixed toward white read as gray mud. Here every
      // layer is its own premultiplied wash in a vivid version of the mood (c scaled to full brightness), the core warm, the halo thin.
      float mx=max(max(c.r,c.g),c.b), chroma=mx-min(min(c.r,c.g),c.b);
      vec3 viv=c/max(mx,.001), warm=spark;   // on paper spark carries the orb's paper color (character.json → orb.paper)
      vec3 glow=mix(mix(spark,vec3(1.),.47),viv,smoothstep(.04,.2,chroma));                 // neutral ink (rest) glows warm instead of gray
      vec3 hotL=mix(glow,warm,.35), inkL=mix(mix(glow,warm,.6),c,.45*smoothstep(.04,.2,chroma));   // filaments: deeper mood, never gray
      float ap=plasma*(.16+.1*energy), ac=core*(.45+.2*energy), ah=halo*.12, ar=rim*energy*.4, af=fil*(.32+.4*energy);
      vec3 pm=glow*ap+hotL*ac+glow*ah+mix(glow,warm,.5)*ar+inkL*af;
      a=clamp(ap+ac+ah+ar+af,0.,1.);
      gl_FragColor=vec4(min(pm,vec3(a)),a);
      return;
    }
    gl_FragColor=vec4(col*a,a);
  }`;
  const sh=(type,src)=>{const x=gl.createShader(type);gl.shaderSource(x,src);gl.compileShader(x);if(!gl.getShaderParameter(x,gl.COMPILE_STATUS)){console.warn(gl.getShaderInfoLog(x));return null}return x};
  const pr=gl.createProgram(),v=sh(gl.VERTEX_SHADER,vs),f=sh(gl.FRAGMENT_SHADER,fs); if(!v||!f) return null;
  gl.attachShader(pr,v);gl.attachShader(pr,f);gl.linkProgram(pr);gl.useProgram(pr);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,"p");gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U={};["t","energy","seed","dark","c","spark"].forEach(k=>U[k]=gl.getUniformLocation(pr,k));
  gl.clearColor(0,0,0,0);
  return{render(ctx,px,{t,energy,seed,dark,tint,spark}){
    const n=Math.min(MAX,Math.max(64,Math.round(px*.5))); // half resolution: the aura is soft, the dots stay crisp
    gl.viewport(0,0,n,n);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(U.t,t);gl.uniform1f(U.energy,energy);gl.uniform1f(U.seed,seed);gl.uniform1f(U.dark,dark?1:0);gl.uniform3f(U.c,tint.r/255,tint.g/255,tint.b/255);gl.uniform3f(U.spark,spark.r/255,spark.g/255,spark.b/255);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingQuality="high";ctx.drawImage(cv,0,MAX-n,n,n,0,0,px,px);
  }};
})();
