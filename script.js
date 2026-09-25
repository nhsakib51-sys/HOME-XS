const firebaseConfig = {
    apiKey: "AIzaSyDtWVn92ftCcrznTkPitPDb-n-zt7XLy8g",
    authDomain: "ms-fix-4e05f.firebaseapp.com",
    databaseURL: "https://ms-fix-4e05f-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "ms-fix-4e05f",
    storageBucket: "ms-fix-4e05f.firebasestorage.app",
    messagingSenderId: "830615298933",
    appId: "1:830615298933:web:78e02c5b5a40d14b1ee93c",
    measurementId: "G-20GDG9E5MQ"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Auth boot gate: keep login/signup hidden until Firebase finishes restoring the session.
let authBootResolved = false;
function resolveAuthBoot(){
    if(authBootResolved) return;
    authBootResolved = true;
    document.body.classList.remove('auth-booting');
    document.getElementById('auth-boot-screen')?.classList.add('hidden');
}
document.addEventListener('DOMContentLoaded',()=>document.body.classList.add('auth-booting'));


// Premium settings button animation
function animateSettings(el){
    if(!el) return;
    el.classList.remove('settings-rotate-click');
    void el.offsetWidth;
    el.classList.add('settings-rotate-click');
    setTimeout(()=>el.classList.remove('settings-rotate-click'), 650);
}

// ================= X AI CONFIG =================
// Gemini AI settings. The key is stored locally in this browser only.
const AI_API_KEY = ''; // Gemini key is entered from Settings & Privacy > X AI and stored locally only.
const AI_MODEL_STORAGE = 'messenger_pro_skm_ai_model_v1';
const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.1-flash-lite'];
const GEMINI_IMAGE_MODELS = ['gemini-3.1-flash-image','gemini-2.5-flash-image'];
const GEMINI_ENDPOINT = (model, stream=false) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:${stream?'streamGenerateContent':'generateContent'}${stream?'?alt=sse':''}`;
const AI_LOCAL_KEY = 'messenger_pro_skm_ai_chat_v3';
const AI_SYSTEM_INSTRUCTION = `You are X AI, a friendly premium chat assistant inside Messenger Pro BD.
Speak naturally. Match the user's language: Bangla/Banglish -> natural Bangla/Banglish; English -> English.
Be useful, concise, and conversational. Use clean Markdown when helpful. Never pretend to access private device/account data or perform actions you cannot perform.`;
let aiBusy = false;
let aiAbortController = null;

const AI_KEY_STORAGE = 'messenger_pro_x_ai_gemini_key_v1';
function getAIKey(){ try{return (localStorage.getItem(AI_KEY_STORAGE)||AI_API_KEY||'').trim()}catch(_){return AI_API_KEY.trim()} }
function getAIModel(){ try{return localStorage.getItem(AI_MODEL_STORAGE)||GEMINI_MODELS[0]}catch(_){return GEMINI_MODELS[0]} }
function saveAISettings(key,model){
 try{
   if(typeof key==='string'){
     const clean=key.trim();
     if(clean)localStorage.setItem(AI_KEY_STORAGE,clean); else localStorage.removeItem(AI_KEY_STORAGE);
   }
   if(model)localStorage.setItem(AI_MODEL_STORAGE,model);
 }catch(_){}
}
function openAISettings(){
 const screen=document.getElementById('settings-screen');
 if(screen?.classList.contains('hidden')) openSettings();
 setTimeout(()=>document.getElementById('ai-api-key-input')?.focus(),180);
}
async function testAIConnection(){
    const key=getAIKey(); if(!key){showAlert('আগে Gemini API key সেট করুন।');return false;}
    showAlert('AI connection test চলছে…');
    try{const r=await fetch(GEMINI_ENDPOINT(getAIModel()),{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},body:JSON.stringify({contents:[{role:'user',parts:[{text:'Reply with exactly: X AI connected.'}]}],generationConfig:{maxOutputTokens:20}})}); const d=await r.json().catch(()=>({})); if(!r.ok)throw new Error(d?.error?.message||`HTTP ${r.status}`); showAlert('✅ X AI connected successfully.'); return true;}catch(e){console.error(e);showAlert('❌ AI connection failed: '+(e.message||'Unknown error'));return false;}
}
function getAIHistory(){try{const raw=localStorage.getItem(AI_LOCAL_KEY);const arr=raw?JSON.parse(raw):[];return Array.isArray(arr)?arr:[]}catch(_){return[]}}
function saveAIHistory(h){try{localStorage.setItem(AI_LOCAL_KEY,JSON.stringify(h.slice(-80)))}catch(_){} }
function renderAIText(text){
    let raw=String(text??'');
    const codeBlocks=[];
    raw=raw.replace(/```(?:[a-zA-Z0-9_+-]+)?\s*([\s\S]*?)```/g,(_,code)=>{
      const token=`@@AICODE${codeBlocks.length}@@`;
      codeBlocks.push(code.replace(/^\n|\n$/g,''));
      return token;
    });
    let s=escapeAIText(raw);
    s=s.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/\*([^*]+)\*/g,'<em>$1</em>');
    s=s.replace(/`([^`]+)`/g,'<code class="ai-inline-code">$1</code>');
    s=s.replace(/@@AICODE(\d+)@@/g,(_,i)=>{
      const code=escapeAIText(codeBlocks[Number(i)]||'');
      return `<div class="ai-code-wrap"><div class="ai-code-head"><span><i class="fa-solid fa-code"></i> Code</span><button class="ai-code-copy" onclick="copyAICode(this)"><i class="fa-regular fa-copy"></i> Copy</button></div><pre class="ai-code"><code>${code}</code></pre></div>`;
    });
    s=s.replace(/\n/g,'<br>');
    return s;
}
function copyAICode(btn){
  const code=btn.closest('.ai-code-wrap')?.querySelector('code');
  if(!code)return;
  const value=code.textContent||'';
  const done=()=>{btn.innerHTML='<i class="fa-solid fa-check"></i> Copied';setTimeout(()=>{btn.innerHTML='<i class="fa-regular fa-copy"></i> Copy'},1200)};
  if(navigator.clipboard?.writeText){navigator.clipboard.writeText(value).then(done).catch(()=>fallbackCopyAI(value,done));}
  else fallbackCopyAI(value,done);
}
function fallbackCopyAI(value,done){
  try{const ta=document.createElement('textarea');ta.value=value;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();done();}catch(_){showAlert('Copy failed.');}
}
function escapeAIText(s){return String(s??'').replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));}
function renderAIHistory(){
 const box=document.getElementById('ai-chat-messages');if(!box)return;box.innerHTML='';const h=getAIHistory();
 if(!h.length){const w=document.createElement('div');w.className='ai-msg model';w.innerHTML='<div class="ai-msg-label">X AI</div><div>হাই! আমি X AI 👋<br>যেকোনো প্রশ্ন করো, অথবা ছবি পাঠিয়ে বলো কী পরিবর্তন করতে হবে।</div>';box.appendChild(w);}
 h.forEach((m,i)=>{
   const el=document.createElement('div');el.className=`ai-msg ${m.role==='user'?'user':'model'}`;el.dataset.index=i;
   let content=(m.role==='model'?'<div class="ai-msg-label">X AI</div>':'');
   if(m.image)content+=`<div class="ai-image-bubble"><img src="${m.image}" alt="AI image" loading="lazy"></div>`;
   if(m.text)content+=renderAIText(m.text);
   el.innerHTML=content;
   if(m.role==='model'){
     const a=document.createElement('div');a.className='ai-msg-actions';
     a.innerHTML='<button title="Copy" onclick="copyAIMessage(this)"><i class="fa-regular fa-copy"></i></button><button title="Regenerate" onclick="regenerateAIMessage(this)"><i class="fa-solid fa-rotate"></i></button>';
     el.appendChild(a);
   }
   box.appendChild(el)
 });
 box.scrollTop=box.scrollHeight;
}
async function regenerateAIMessage(btn){if(aiBusy)return;const el=btn.closest('.ai-msg');const idx=Number(el?.dataset.index);let h=getAIHistory();if(!Number.isFinite(idx)||idx<1)return;while(h.length>idx)h.pop();saveAIHistory(h);renderAIHistory();const last=h[h.length-1];if(last?.role==='user'){document.getElementById('ai-message-input').value=last.text;await sendAIMessage(true)}}
function setAIFabVisible(v){document.getElementById('ai-fab')?.classList.toggle('hidden',!v)}
function openAIChat(){mpPushView('ai');const s=document.getElementById('ai-chat-screen');if(!s)return;s.classList.remove('hidden');s.setAttribute('aria-hidden','false');renderAIHistory();setTimeout(()=>document.getElementById('ai-message-input')?.focus(),120)}
function closeAIChat(){const s=document.getElementById('ai-chat-screen');if(!s)return;s.classList.add('hidden');s.setAttribute('aria-hidden','true');if(!mpNav.inPop&&mpNav.depth>0){mpNav.depth--;try{mpNav.view='home';history.replaceState({mp:true,view:'home'},'',location.href.split('#')[0])}catch(_){}}}
async function clearAIChat(){const ok=await openPremiumDialog({title:'Clear X AI History',message:'This will permanently delete your X AI chat history from this browser. This action cannot be undone.',icon:'fa-brain',mode:'confirm',confirmText:'Clear History',danger:true});if(!ok)return;localStorage.removeItem(AI_LOCAL_KEY);renderAIHistory();showAlert('X AI chat history cleared.','success')}
function handleAIKeydown(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendAIMessage()}}
function setAITyping(on){document.getElementById('ai-typing')?.classList.toggle('hidden',!on);document.getElementById('ai-stop-btn')?.classList.toggle('hidden',!on)}
function stopAIResponse(){aiAbortController?.abort();aiAbortController=null}
function aiErrorMessage(status,msg){if(status===400)return 'API request ভুল হয়েছে। Model/key configuration check করুন.';if(status===401||status===403)return 'API key invalid বা permission নেই।';if(status===404)return 'Selected Gemini model পাওয়া যায়নি। Settings থেকে অন্য model select করুন.';if(status===429)return 'API rate limit হয়েছে। একটু পরে আবার চেষ্টা করুন.';if(status>=500)return 'Gemini server temporarily unavailable.';return msg||'AI request failed.'}

let aiImageAttachment = null;

function openAIImagePicker(){
  document.getElementById('ai-image-input')?.click();
}
function clearAIImage(){
  aiImageAttachment=null;
  const input=document.getElementById('ai-image-input'); if(input) input.value='';
  const preview=document.getElementById('ai-image-preview'); if(preview) preview.classList.add('hidden');
}
async function handleAIImage(event){
  const file=event.target.files?.[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){showAlert('শুধু ছবি নির্বাচন করুন।');event.target.value='';return;}
  if(file.size>15*1024*1024){showAlert('ছবির সাইজ 15MB-এর মধ্যে রাখুন।');event.target.value='';return;}
  try{
    // Keep the AI image small enough for API + localStorage history.
    const bitmap=await createImageBitmap(file);
    const maxSide=1600, scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(bitmap.width*scale)); canvas.height=Math.max(1,Math.round(bitmap.height*scale));
    canvas.getContext('2d',{alpha:false}).drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
    const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg',.82));
    if(!blob)throw new Error('Image compression failed');
    const reader=new FileReader();
    reader.onload=()=>{
      aiImageAttachment={mimeType:'image/jpeg',dataUrl:String(reader.result),name:(file.name||'image').replace(/\.[^.]+$/,'')+'.jpg'};
      const img=document.getElementById('ai-image-preview-img');
      const preview=document.getElementById('ai-image-preview');
      if(img)img.src=aiImageAttachment.dataUrl;
      preview?.classList.remove('hidden');
    };
    reader.readAsDataURL(blob);
  }catch(err){
    console.error(err);
    showAlert('ছবিটি প্রস্তুত করা যায়নি। অন্য ছবি চেষ্টা করুন।');
    event.target.value='';
  }
}
function aiImageDataPart(){
  if(!aiImageAttachment?.dataUrl)return null;
  const comma=aiImageAttachment.dataUrl.indexOf(',');
  return {inlineData:{mimeType:aiImageAttachment.mimeType,data:aiImageAttachment.dataUrl.slice(comma+1)}};
}
async function generateAIImageEdit(text,imagePart){
  const key=getAIKey(); if(!key)throw new Error('NO_KEY');
  const models=[...GEMINI_IMAGE_MODELS,...GEMINI_MODELS.filter(m=>!GEMINI_IMAGE_MODELS.includes(m))];
  let lastErr=null;
  for(const model of models){
    try{
      const r=await fetch(GEMINI_ENDPOINT(model),{
        method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},
        body:JSON.stringify({
          systemInstruction:{parts:[{text:'You are X AI image editor. When the user asks to edit the supplied image, follow the requested visual edit. If the selected model supports image generation/editing, return the edited image. If it cannot edit images, clearly say so instead of pretending.'}]},
          contents:[{role:'user',parts:[{text:text||'Edit this image as requested.'},imagePart]}],
          generationConfig:{responseModalities:['TEXT','IMAGE'],maxOutputTokens:2048,temperature:.7}
        })
      });
      const d=await r.json().catch(()=>({}));
      if(!r.ok)throw Object.assign(new Error(d?.error?.message||`HTTP ${r.status}`),{status:r.status});
      const parts=d?.candidates?.[0]?.content?.parts||[];
      const imagePartOut=parts.find(p=>p?.inlineData?.data);
      if(imagePartOut?.inlineData?.data){
        return {type:'image',mimeType:imagePartOut.inlineData.mimeType||'image/png',data:imagePartOut.inlineData.data};
      }
      const textOut=parts.map(p=>p.text||'').join('').trim();
      if(textOut)return {type:'text',text:textOut};
      throw new Error('Empty AI response');
    }catch(e){lastErr=e;if([400,401,403,404].includes(e.status))continue;throw e;}
  }
  throw lastErr||new Error('AI image edit unavailable');
}
async function streamGemini(contents,onChunk){
 const key=getAIKey();if(!key)throw new Error('NO_KEY');
 let lastErr=null;const preferred=getAIModel();const models=[preferred,...GEMINI_MODELS.filter(m=>m!==preferred)];
 for(const model of models){
  try{
   aiAbortController=new AbortController();
   const r=await fetch(GEMINI_ENDPOINT(model,true),{method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':key},signal:aiAbortController.signal,body:JSON.stringify({systemInstruction:{parts:[{text:AI_SYSTEM_INSTRUCTION}]},contents,generationConfig:{maxOutputTokens:2048,temperature:.7}})});
   if(!r.ok){const d=await r.json().catch(()=>({}));throw Object.assign(new Error(aiErrorMessage(r.status,d?.error?.message)),{status:r.status})}
   if(!r.body)throw new Error('Streaming unavailable');
   const reader=r.body.getReader(),decoder=new TextDecoder();let buffer='';let full='';
   while(true){const {value,done}=await reader.read();if(done)break;buffer+=decoder.decode(value,{stream:true});const lines=buffer.split(/\r?\n/);buffer=lines.pop()||'';for(const line of lines){const t=line.trim();if(!t.startsWith('data:'))continue;try{const d=JSON.parse(t.slice(5).trim());const chunk=(d?.candidates?.[0]?.content?.parts||[]).map(p=>p.text||'').join('');if(chunk){full+=chunk;onChunk(full)}}catch(_){} }}
   if(full.trim())return full.trim();throw new Error('Empty AI response');
  }catch(e){if(e.name==='AbortError')throw e;lastErr=e;if(e.status===400||e.status===401||e.status===403||e.status===404)continue;}
 }
 throw lastErr||new Error('AI unavailable');
}
async function sendAIMessage(regenerate=false){
 if(aiBusy)return;
 const input=document.getElementById('ai-message-input');
 const text=(input?.value||'').trim();
 if(!text && !aiImageAttachment)return;
 if(!getAIKey()){openAISettings();return}

 const attached=aiImageAttachment;
 const h=getAIHistory();
 if(!regenerate){
   h.push({role:'user',text:text||'Please analyze this image.',image:attached?.dataUrl||null,time:Date.now()});
 }
 saveAIHistory(h);
 if(input){input.value='';input.style.height='auto'}
 clearAIImage();
 renderAIHistory();
 aiBusy=true;setAITyping(true);

 const box=document.getElementById('ai-chat-messages');
 const el=document.createElement('div');el.className='ai-msg model';
 el.innerHTML='<div class="ai-msg-label">X AI</div><div class="ai-streaming"></div>';
 box?.appendChild(el);box&&(box.scrollTop=box.scrollHeight);

 try{
   let answer;
   if(attached && /\b(edit|change|modify|remove|add|fix|crop|background|style|color|make|turn|transform|এডিট|পরিবর্তন|যোগ|বাদ|বদল|করে দাও|সাজাও)\b/i.test(text)){
     const result=await generateAIImageEdit(text,aiImageDataPartFrom(attached));
     if(result.type==='image'){
       const dataUrl=`data:${result.mimeType};base64,${result.data}`;
       answer='আপনার অনুরোধ অনুযায়ী ছবিটি এডিট করা হয়েছে।';
       const updated=getAIHistory();updated.push({role:'model',text:answer,image:dataUrl,time:Date.now()});saveAIHistory(updated);
       renderAIHistory();
     }else{
       answer=result.text;
       const updated=getAIHistory();updated.push({role:'model',text:answer,time:Date.now()});saveAIHistory(updated);renderAIHistory();
     }
   }else{
     const history=getAIHistory().slice(-20).map(m=>{
       const parts=[];
       if(m.text)parts.push({text:m.text});
       if(m.image){
         const comma=m.image.indexOf(',');
         if(comma>0)parts.push({inlineData:{mimeType:(m.image.match(/^data:([^;]+);/)||[])[1]||'image/jpeg',data:m.image.slice(comma+1)}});
       }
       return {role:m.role==='user'?'user':'model',parts};
     });
     answer=await streamGemini(history,full=>{
       const target=el.querySelector('.ai-streaming');if(target)target.innerHTML=renderAIText(full);
       if(box)box.scrollTop=box.scrollHeight;
     });
     const updated=getAIHistory();updated.push({role:'model',text:answer,time:Date.now()});saveAIHistory(updated);renderAIHistory();
   }
 }catch(err){
   if(err.name!=='AbortError'){
     console.error('X AI:',err);
     const msg=err.message==='NO_KEY'?'API key সেট করা হয়নি।':aiErrorMessage(err.status,err.message);
     const updated=getAIHistory();updated.push({role:'model',text:'⚠️ '+msg,time:Date.now()});saveAIHistory(updated);renderAIHistory();
   }else{
     const target=el.querySelector('.ai-streaming');if(target)target.innerHTML='<em>Generation stopped.</em>';
   }
 }finally{aiBusy=false;aiAbortController=null;setAITyping(false)}
}
function aiImageDataPartFrom(attached){
 const comma=attached.dataUrl.indexOf(',');
 return {inlineData:{mimeType:attached.mimeType,data:attached.dataUrl.slice(comma+1)}};
}

const auth = firebase.auth();
const db = firebase.database();

// Cloudinary unsigned media storage (no API key/secret required in the browser).
// Only the Cloud Name and Upload Preset are public client-side configuration.
const CLOUDINARY_CLOUD_NAME = "zmwewrbf";
const CLOUDINARY_UPLOAD_PRESET = "massenger";
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`;

function getCloudinaryUploadUrl(file) {
  const kind = (file?.type || '').toLowerCase();
  const resource = kind.startsWith('video/') ? 'video' : kind.startsWith('image/') ? 'image' : 'raw';
  return `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resource}/upload`;
}

function uploadMediaToCloudinary(file, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No media file selected.'));
    const xhr = new XMLHttpRequest();
    xhr.open('POST', getCloudinaryUploadUrl(file));
    xhr.responseType = 'json';
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded, e.total);
    };
    xhr.onload = () => {
      const data = xhr.response || {};
      if (xhr.status >= 200 && xhr.status < 300 && data.secure_url) {
        resolve(data);
      } else {
        reject(new Error(data?.error?.message || `Cloudinary upload failed (${xhr.status}).`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error while uploading media.'));
    xhr.onabort = () => reject(new Error('Media upload was cancelled.'));
    const form = new FormData();
    form.append('file', file);
    form.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    xhr.send(form);
  });
}


// Deploy the included Cloud Function and replace this URL with its HTTPS URL.
// Example: https://us-central1-ms-fix-4e05f.cloudfunctions.net
const PASSWORD_OTP_API_BASE = 'https://us-central1-ms-fix-4e05f.cloudfunctions.net';
let passwordOtpEmail = '';
let passwordOtpToken = '';


let currentUser = null;
let authUser = null;
let activeFriend = null;
let typingTimer = null;
let signupPicBase64 = "";
let editPicBase64 = "";
let profileCropTarget = null;
let profileCropImage = null;
let profileCropScale = 1;
let profileCropOffsetX = 0;
let profileCropOffsetY = 0;
let profileCropDragging = false;
let profileCropDragStartX = 0;
let profileCropDragStartY = 0;
let profileCropStartOffsetX = 0;
let profileCropStartOffsetY = 0;
let localStream = null;
let remoteStream = null;
let peerConnection = null;
let isMuted = false;
let isSpeakerOn = false;
let localVideoExpanded = false;
let usingFrontCamera = true;
let currentCallType = 'audio';
let incomingCallData = null;
let activeCallId = null;
let activeCallRef = null;
let callCandidateQueue = [];
let callListenersAttached = false;
let isCallEnding = false;
let callTimerInterval = null;
let callConnectedAt = null;
let callTimerAnimation = null;
let notificationReady = false;
let notificationRoomListeners = new Set();
let notificationInitializedRooms = new Set();
let soundContext = null;
let ringtoneTimer = null;
let ringtoneOscillators = [];
let notificationAudio = null;
let webPushMessaging = null;
let webPushRegistration = null;
let webPushMessageListenerAttached = false;
// Firebase Console -> Project settings -> Cloud Messaging -> Web configuration -> Web Push certificates.
// Paste the public VAPID key here to enable true background push when the site is closed.
const WEB_PUSH_VAPID_KEY = 'YOUR_FIREBASE_WEB_PUSH_VAPID_KEY';
let ringtoneAudio = null;
let callConnectionGraceTimer = null;
let iceRestartTimer = null;
let iceRestartInProgress = false;
let lastRemoteOfferSdp = null;
let lastRestartOfferSdp = null;
let lastRestartAnswerSdp = null;
let callWasConnected = false;
let callHistoryWritten = false;
let callStartedAt = null;
let callPeerUsername = null;
let callPeerName = null;
let callDirection = null;
let callHistoryStatus = null;
let callSetupTimer = null;
let incomingCallWatchTimer = null;
let callBusyLock = false;
let incomingCallProcessing = false;
let callEndedByUser = false;

const TURN_CONFIG = window.MESSENGER_TURN_CONFIG || {};
const configuredTurn = [];
if (TURN_CONFIG.url && TURN_CONFIG.username && TURN_CONFIG.credential) {
    configuredTurn.push({ urls: TURN_CONFIG.url, username: TURN_CONFIG.username, credential: TURN_CONFIG.credential });
}
if (Array.isArray(TURN_CONFIG.urls) && TURN_CONFIG.username && TURN_CONFIG.credential) {
    TURN_CONFIG.urls.forEach(url => configuredTurn.push({ urls: url, username: TURN_CONFIG.username, credential: TURN_CONFIG.credential }));
}
if (TURN_CONFIG.server && TURN_CONFIG.username && TURN_CONFIG.credential) {
    configuredTurn.push({ urls: TURN_CONFIG.server, username: TURN_CONFIG.username, credential: TURN_CONFIG.credential });
}
// V45.6: TURN is intentionally optional/disabled. Public STUN is used for direct P2P calls.
const turnCredentialsReady = true;
const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
        ...configuredTurn
    ],
    iceCandidatePoolSize: 10,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
};

function getMediaRoomId(u1, u2) {
    const ids = [String(u1 || ''), String(u2 || '')].sort();
    return ids.join('/');
}

async function ensureChatMembership(friend) {
    if (!currentUser || !authUser || !friend || !friend.uid) return;
    const roomId = getRoomId(currentUser.username, friend.username);
    const ref = db.ref(`chatMembersByUid/${roomId}`);
    await ref.child(authUser.uid).set(true);
}

let replyingTo = null;
let selectedMessageKey = null;
let messageRoomRef = null;
let messageLiveQuery = null;
let messageChildListener = null;
let messageChangedListener = null;
let messageKeys = new Set();
let renderedCallHistoryIds = new Set();
let incomingCallQuery = null;
let oldestMessageKey = null;
let messageHasMore = false;
let messagePageLoading = false;
const MESSAGE_PAGE_SIZE = 100;
let blockedProfileState = { mine: false, theirs: false };
let soundUnlocked = false;
let callScreenMinimized = false;

let mediaRecorder = null;
let audioChunks = [];
let recordTimerInterval = null;
let recordSeconds = 0;
let recordingStream = null;

// Premium notification helper: error/file = red, success/done = green, normal = blue.
function detectAlertType(message) {
    const t = String(message || '').toLowerCase();
    if (/error|failed|failure|could not|cannot|invalid|expired|incorrect|unable|problem|wrong|not found|too many|please wait/.test(t)) return 'error';
    if (/file|upload|download|document|attachment|photo|video|voice|audio/.test(t)) return 'file';
    if (/success|successful|done|completed|complete|added|accepted|sent|saved|updated|created|verified|unblocked|pinned|changed successfully/.test(t)) return 'success';
    return 'normal';
}

function openPremiumDialog(opts={}) {
    return new Promise(resolve => {
        const old=document.getElementById('premium-dialog-overlay');
        if(old) old.remove();
        const mode=opts.mode==='confirm'?'confirm':'input';
        const overlay=document.createElement('div');
        overlay.id='premium-dialog-overlay'; overlay.className='premium-dialog-overlay';
        overlay.dataset.dialogType=opts.danger?'danger':'normal';
        const card=document.createElement('div'); card.className='premium-dialog-card';
        const iconWrap=document.createElement('div'); iconWrap.className='premium-dialog-icon';
        iconWrap.innerHTML=`<i class="fa-solid ${opts.icon||'fa-sparkles'}"></i>`;
        const head=document.createElement('div'); head.className='premium-dialog-head';
        const title=document.createElement('h3'); title.textContent=opts.title||'Confirm';
        const close=document.createElement('button'); close.type='button'; close.className='premium-dialog-close'; close.setAttribute('aria-label','Close'); close.innerHTML='<i class="fa-solid fa-xmark"></i>';
        head.append(title,close);
        const message=document.createElement('p'); message.className='premium-dialog-message'; message.textContent=opts.message||'';
        card.append(iconWrap,head,message);
        let input=null;
        if(mode==='input'){
            input=document.createElement(opts.multiline?'textarea':'input');
            input.className='premium-dialog-input'; input.value=opts.defaultValue??''; input.placeholder=opts.placeholder||'';
            if(opts.maxLength) input.maxLength=opts.maxLength;
            input.setAttribute('aria-label',opts.title||'Input');
            card.appendChild(input);
            if(opts.maxLength){const counter=document.createElement('div');counter.className='premium-dialog-counter';const update=()=>counter.textContent=`${input.value.length}/${opts.maxLength}`;input.addEventListener('input',update);update();card.appendChild(counter)}
        }
        const actions=document.createElement('div'); actions.className='premium-dialog-actions';
        const cancel=document.createElement('button'); cancel.type='button'; cancel.className='premium-dialog-btn secondary'; cancel.textContent='Cancel';
        const confirm=document.createElement('button'); confirm.type='button'; confirm.className='premium-dialog-btn primary'+(opts.danger?' danger':''); confirm.textContent=opts.confirmText||'OK';
        actions.append(cancel,confirm); card.appendChild(actions); overlay.appendChild(card); document.body.appendChild(overlay);
        let settled=false;
        const finish=(value)=>{if(settled)return;settled=true;overlay.classList.add('closing');setTimeout(()=>overlay.remove(),180);resolve(value)};
        close.onclick=()=>finish(null); cancel.onclick=()=>finish(null); confirm.onclick=()=>finish(mode==='input'?(input?.value??''):true);
        overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null)});
        const onKey=e=>{if(!document.body.contains(overlay))return;if(e.key==='Escape'){e.preventDefault();finish(null)}else if(e.key==='Enter'&&!opts.multiline&&mode==='input'){e.preventDefault();finish(input?.value??'')}};
        overlay._keyHandler=onKey; document.addEventListener('keydown',onKey);
        const cleanupObserver=new MutationObserver(()=>{if(!document.body.contains(overlay)){document.removeEventListener('keydown',onKey);cleanupObserver.disconnect()}}); cleanupObserver.observe(document.body,{childList:true});
        setTimeout(()=>{if(input){input.focus();input.select()}else confirm.focus()},80);
    });
}

function showAlert(message, type) {
    const box = document.getElementById('custom-alert-box');
    const text = document.getElementById('custom-alert-text');
    if (!box || !text) return;
    const kind = type || detectAlertType(message);
    box.dataset.alertType = kind;
    text.innerText = message;
    box.classList.remove('hidden');
    clearTimeout(window.__mpAlertTimer);
    window.__mpAlertTimer = setTimeout(() => closeCustomAlert(), kind === 'error' ? 4200 : 3000);
}

function closeCustomAlert() {
    const box = document.getElementById('custom-alert-box');
    if (box) box.classList.add('hidden');
}

// Browsers block autoplay until the user interacts with the page. Prime the ringtone
// on the first gesture so incoming calls can ring normally afterwards.
['pointerdown','touchstart','keydown'].forEach(evt => document.addEventListener(evt, () => {
    if (!soundUnlocked) unlockSound();
}, { once: false, passive: true }));

window.onload = function() {
    monitorNetworkStatus();
    auth.onAuthStateChanged(async user => {
        authUser = user || null;
        if (!user) {
            currentUser = null;
            localStorage.removeItem('pro_user_session');
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('signup-screen').classList.add('hidden');
            resolveAuthBoot();
            return;
        }

        const providerIds = (user.providerData || []).map(p => p.providerId);
        const isSocial = providerIds.some(id => id === 'google.com' || id === 'facebook.com' || id === 'apple.com');
        if (!isSocial && !user.emailVerified) {
            currentUser = null;
            localStorage.removeItem('pro_user_session');
            document.getElementById('login-screen').classList.remove('hidden');
            document.getElementById('signup-screen').classList.add('hidden');
            resolveAuthBoot();
            return;
        }

        try {
            let snap = await db.ref('users').orderByChild('uid').equalTo(user.uid).once('value');
            let profile = null;
            snap.forEach(child => { profile = child.val(); });

            if (!profile && isSocial) {
                profile = await createSocialProfile(user);
            }
            if (!profile) {
                await auth.signOut();
                showAlert("Your Messenger profile was not found.");
                return;
            }

            currentUser = { ...profile, uid: user.uid, emailVerified: isSocial ? true : !!user.emailVerified };
            localStorage.setItem('pro_user_session', JSON.stringify(currentUser));
            document.getElementById('login-screen').classList.add('hidden');
            document.getElementById('signup-screen').classList.add('hidden');
            initApp();
            resolveAuthBoot();
        } catch (e) {
            console.error("Secure session bootstrap failed:", e);
            await auth.signOut().catch(() => {});
            showAlert("Could not load your Messenger profile.");
            resolveAuthBoot();
        }
    });
};

function monitorNetworkStatus() {
    const offlineBanner = document.getElementById('offline-banner');
    db.ref('.info/connected').on('value', snap => {
        if (snap.val() === false) {
            offlineBanner.style.display = 'block';
        } else {
            offlineBanner.style.display = 'none';
        }
    });
}

function showSignup() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('signup-screen').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

function openProfileCrop(file, target) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
        const img = new Image();
        img.onload = () => {
            profileCropTarget = target;
            profileCropImage = img;
            profileCropScale = 1;
            profileCropOffsetX = 0;
            profileCropOffsetY = 0;
            document.getElementById('profile-crop-zoom').value = '1';
            document.getElementById('profile-crop-modal').classList.remove('hidden');
            drawProfileCrop();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function drawProfileCrop() {
    const canvas = document.getElementById('profile-crop-canvas');
    if (!canvas || !profileCropImage) return;
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, size, size);

    const img = profileCropImage;
    const baseScale = Math.max(size / img.width, size / img.height);
    const scale = baseScale * profileCropScale;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2 + profileCropOffsetX;
    const y = (size - h) / 2 + profileCropOffsetY;
    ctx.drawImage(img, x, y, w, h);

    ctx.save();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, size - 2, size - 2);
    ctx.restore();
}

function resetProfileCrop() {
    profileCropScale = 1;
    profileCropOffsetX = 0;
    profileCropOffsetY = 0;
    const z = document.getElementById('profile-crop-zoom');
    if (z) z.value = '1';
    drawProfileCrop();
}

function cancelProfileCrop() {
    document.getElementById('profile-crop-modal').classList.add('hidden');
    profileCropTarget = null;
    profileCropImage = null;
}

function applyProfileCrop() {
    if (!profileCropImage || !profileCropTarget) return;
    const canvas = document.getElementById('profile-crop-canvas');
    const out = document.createElement('canvas');
    out.width = 400;
    out.height = 400;
    const ctx = out.getContext('2d');
    const size = canvas.width;
    const img = profileCropImage;
    const baseScale = Math.max(size / img.width, size / img.height);
    const scale = baseScale * profileCropScale;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2 + profileCropOffsetX;
    const y = (size - h) / 2 + profileCropOffsetY;

    // Render exactly what is inside the square crop area.
    ctx.drawImage(img, x * (400 / size), y * (400 / size), w * (400 / size), h * (400 / size));
    const base64 = out.toDataURL('image/jpeg', 0.88);

    if (profileCropTarget === 'signup') {
        signupPicBase64 = base64;
        const el = document.getElementById('su-preview-container');
        if (el) el.innerHTML = `<img src="${base64}" alt="Profile preview">`;
    } else {
        editPicBase64 = base64;
        const el = document.getElementById('edit-preview-container');
        if (el) el.innerHTML = `<img src="${base64}" alt="Profile preview">`;
        // Crop & Save is now automatic: persist the adjusted picture immediately.
        saveProfilePictureAuto(base64);
    }
    cancelProfileCrop();
}


async function saveProfilePictureAuto(base64, options = {}) {
    if (!base64 || !currentUser || !currentUser.username) return false;
    const oldPic = currentUser.profilePic || '';
    try {
        currentUser.profilePic = base64;
        editPicBase64 = base64;
        // Persist immediately so no separate "Save Profile" click is required.
        await db.ref('users/' + currentUser.username).update({ profilePic: base64 });
        localStorage.setItem('pro_user_session', JSON.stringify(currentUser));
        updateMyAvatar();

        // Keep any visible profile/settings avatar in sync immediately.
        const avatar = document.querySelector('.settings-profile-avatar');
        if (avatar) {
            avatar.innerHTML = `<img src="${base64}" alt="Profile picture"><div class="settings-avatar-edit"><i class="fa-solid fa-camera"></i></div>`;
        }
        const preview = document.getElementById('edit-preview-container');
        if (preview) preview.innerHTML = `<img src="${base64}" alt="Profile preview">`;

        if (!options.silent) showAlert('Profile picture saved automatically.');
        return true;
    } catch (err) {
        console.error('Auto profile picture save failed:', err);
        currentUser.profilePic = oldPic;
        editPicBase64 = oldPic;
        localStorage.setItem('pro_user_session', JSON.stringify(currentUser));
        updateMyAvatar();
        showAlert('Profile picture could not be saved. Please check your connection and try again.');
        return false;
    }
}

function compressProfileImage(file, maxSize = 600) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error || new Error('Could not read image.'));
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.86));
            };
            img.onerror = () => reject(new Error('Invalid image.'));
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    });
}

function handleSignupImage(event) {
    const file = event.target.files && event.target.files[0];
    if (file) openProfileCrop(file, 'signup');
    event.target.value = '';
}

async function handleEditImage(event) {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;

    // Save immediately on selection. The crop editor remains available for
    // optional adjustment; applying a crop auto-saves the adjusted picture too.
    try {
        const instantPic = await compressProfileImage(file);
        await saveProfilePictureAuto(instantPic);
        openProfileCrop(file, 'edit');
    } catch (err) {
        console.error('Profile image selection failed:', err);
        showAlert('Could not load that profile picture. Please choose another image.');
    }
}

function initProfileCropControls() {
    const canvas = document.getElementById('profile-crop-canvas');
    const zoom = document.getElementById('profile-crop-zoom');
    if (!canvas || !zoom) return;
    zoom.addEventListener('input', () => {
        profileCropScale = parseFloat(zoom.value) || 1;
        drawProfileCrop();
    });
    const getPoint = e => {
        const r = canvas.getBoundingClientRect();
        return { x: (e.clientX - r.left) * canvas.width / r.width, y: (e.clientY - r.top) * canvas.height / r.height };
    };
    canvas.addEventListener('pointerdown', e => {
        if (!profileCropImage) return;
        profileCropDragging = true;
        canvas.setPointerCapture(e.pointerId);
        const p = getPoint(e);
        profileCropDragStartX = p.x;
        profileCropDragStartY = p.y;
        profileCropStartOffsetX = profileCropOffsetX;
        profileCropStartOffsetY = profileCropOffsetY;
    });
    canvas.addEventListener('pointermove', e => {
        if (!profileCropDragging) return;
        const p = getPoint(e);
        profileCropOffsetX = profileCropStartOffsetX + (p.x - profileCropDragStartX);
        profileCropOffsetY = profileCropStartOffsetY + (p.y - profileCropDragStartY);
        drawProfileCrop();
    });
    const stop = () => { profileCropDragging = false; };
    canvas.addEventListener('pointerup', stop);
    canvas.addEventListener('pointercancel', stop);
    canvas.addEventListener('pointerleave', stop);
}

window.addEventListener('DOMContentLoaded', initProfileCropControls);

function isValidGmail(email) {
    return /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@gmail\.com$/i.test(email);
}

function isStrongPassword(pass) {
    // Firebase already handles password hashing securely. For this app,
    // require a minimum of 8 characters without forcing special character
    // rules, so an exactly 8-character password is accepted.
    return typeof pass === 'string' && pass.length >= 8;
}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    const icon = button && button.querySelector('i');
    if (icon) {
        icon.classList.toggle('fa-eye', !isHidden);
        icon.classList.toggle('fa-eye-slash', isHidden);
    }
    if (button) {
        button.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
        button.setAttribute('title', isHidden ? 'Hide password' : 'Show password');
    }
}

function normalizeUsername(value) {
    return value.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
}


function socialProvider(kind) {
    if (kind === 'google') return new firebase.auth.GoogleAuthProvider();
    if (kind === 'facebook') return new firebase.auth.FacebookAuthProvider();
    if (kind === 'apple') return new firebase.auth.OAuthProvider('apple.com');
    throw new Error('Unsupported sign-in provider.');
}

function socialProviderLabel(kind) {
    return kind === 'google' ? 'Google' : kind === 'facebook' ? 'Facebook' : 'Apple';
}

async function createSocialProfile(user) {
    const displayName = (user.displayName || '').trim();
    const email = (user.email || '').trim().toLowerCase();
    const baseSource = displayName || (email ? email.split('@')[0] : 'user');
    const base = normalizeUsername(baseSource).slice(0, 20) || 'user';
    let username = base;

    // Keep usernames unique while remaining readable. The UID suffix also prevents
    // collisions without exposing credentials or storing provider tokens.
    let attempt = 0;
    while (true) {
        const existing = await db.ref('users/' + username).once('value');
        if (!existing.exists()) break;
        attempt += 1;
        username = (base.slice(0, Math.max(3, 20 - String(attempt).length - 1)) + '_' + attempt).slice(0, 30);
        if (attempt > 9999) {
            username = 'user_' + user.uid.slice(0, 12);
            break;
        }
    }

    const providerId = (user.providerData && user.providerData[0] && user.providerData[0].providerId) || 'social';
    const profile = {
        uid: user.uid,
        name: displayName || username,
        username,
        profilePic: user.photoURL || '',
        email,
        emailVerified: true,
        authProvider: providerId,
        createdAt: firebase.database.ServerValue.TIMESTAMP
    };
    await db.ref('users/' + username).set(profile);
    return profile;
}

async function socialLogin(kind) {
    try {
        const provider = socialProvider(kind);
        if (kind === 'google') {
            provider.setCustomParameters({ prompt: 'select_account' });
        }
        if (kind === 'facebook') {
            provider.addScope('email');
        }
        const result = await auth.signInWithPopup(provider);
        // onAuthStateChanged handles profile creation/session bootstrap.
        return result;
    } catch (err) {
        console.error(`${socialProviderLabel(kind)} sign-in failed:`, err);
        let msg = `${socialProviderLabel(kind)} sign-in failed.`;
        if (err.code === 'auth/popup-closed-by-user') msg = 'Sign-in window was closed.';
        else if (err.code === 'auth/popup-blocked') msg = 'Your browser blocked the sign-in popup. Allow popups for this site and try again.';
        else if (err.code === 'auth/account-exists-with-different-credential') msg = 'This email is already registered with another sign-in method.';
        else if (err.code === 'auth/operation-not-allowed') msg = `${socialProviderLabel(kind)} sign-in is not enabled in Firebase Authentication.`;
        else if (err.code === 'auth/unauthorized-domain') msg = 'This website domain is not authorized in Firebase Authentication.';
        else if (err.code === 'auth/invalid-credential') msg = `The ${socialProviderLabel(kind)} credential is invalid or expired.`;
        showAlert(msg);
    }
}

async function registerUser() {
    const name = document.getElementById('su-name').value.trim();
    const username = normalizeUsername(document.getElementById('su-username').value);
    const email = document.getElementById('su-email').value.trim().toLowerCase();
    const pass = document.getElementById('su-pass').value;

    if (!name || !username || !email || !pass) {
        showAlert("Please fill all required fields!");
        return;
    }
    if (username.length < 3 || username.length > 30) {
        showAlert("Username must be 3-30 characters and use only letters, numbers, dot, underscore or hyphen.");
        return;
    }
    if (!isValidGmail(email)) {
        showAlert("Please enter a valid Gmail address ending with @gmail.com.");
        return;
    }
    if (!isStrongPassword(pass)) {
        showAlert("Password must be at least 8 characters long.");
        return;
    }

    try {
        // Create the Firebase Auth identity first. Database rules can therefore
        // require an authenticated user even during signup.
        const credential = await auth.createUserWithEmailAndPassword(email, pass);
        const user = credential.user;

        const profile = {
            uid: user.uid,
            name,
            username,
            profilePic: signupPicBase64 || '',
            email,
            emailVerified: false,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        };
        const result = await db.ref('users/' + username).transaction(current => current == null ? profile : undefined);
        if (!result.committed) {
            await user.delete().catch(() => {});
            await auth.signOut().catch(() => {});
            showAlert("Username already taken!");
            return;
        }

        await user.sendEmailVerification();
        await auth.signOut();

        showAlert("Account created. Check your Gmail and verify your email before logging in.");
        document.getElementById('su-pass').value = '';
        showLogin();
    } catch (err) {
        console.error(err);
        let msg = "Could not create account.";
        if (err.code === 'auth/email-already-in-use') msg = "This Gmail is already registered.";
        else if (err.code === 'auth/invalid-email') msg = "Please enter a valid Gmail address.";
        else if (err.code === 'auth/weak-password') msg = "Password is too weak.";
        else if (err.code === 'auth/operation-not-allowed') msg = "Email/Password sign-in is not enabled in Firebase Authentication.";
        showAlert(msg);
    }
}

async function loginUser() {
    const email = document.getElementById('li-email').value.trim().toLowerCase();
    const pass = document.getElementById('li-pass').value;

    if (!email || !pass) {
        showAlert("Enter Gmail and password!");
        return;
    }
    if (!isValidGmail(email)) {
        showAlert("Please enter your Gmail address ending with @gmail.com.");
        return;
    }
    if (pass.length < 8) {
        showAlert("Password must be at least 8 characters long.");
        return;
    }

    try {
        const credential = await auth.signInWithEmailAndPassword(email, pass);
        const user = credential.user;
        await user.reload();

        if (!user.emailVerified) {
            await auth.signOut();
            showAlert("Please verify your Gmail first. Check your inbox/spam folder.");
            return;
        }

        const snap = await db.ref('users').orderByChild('uid').equalTo(user.uid).once('value');
        let userVal = null;
        snap.forEach(child => { userVal = child.val(); });

        if (!userVal) {
            await auth.signOut();
            showAlert("Authentication succeeded, but your Messenger profile was not found.");
            return;
        }

        userVal.emailVerified = true;
        userVal.uid = user.uid;
        await db.ref('users/' + userVal.username).update({
            uid: user.uid,
            emailVerified: true
        });

        currentUser = userVal;
        localStorage.setItem('pro_user_session', JSON.stringify(currentUser));
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('signup-screen').classList.add('hidden');
        initApp();
    } catch (err) {
        console.error(err);
        let msg = "Incorrect Gmail or password.";
        if (err.code === 'auth/user-not-found') msg = "No account found with this Gmail.";
        else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = "Incorrect Gmail or password.";
        else if (err.code === 'auth/too-many-requests') msg = "Too many attempts. Please try again later.";
        showAlert(msg);
    }
}

function setForgotStep(step) {
    ['email','otp','newpass'].forEach(name => {
        const el = document.getElementById('forgot-step-' + name);
        if (el) el.classList.toggle('hidden', name !== step);
    });
    const text = document.getElementById('forgot-step-text');
    if (text) {
        text.textContent = step === 'email'
            ? 'Enter your Gmail address and we will send a 6-digit verification code.'
            : step === 'otp'
                ? 'Enter the 6-digit code sent to your Gmail address.'
                : 'Create a new password. It must contain at least 8 characters.';
    }
}

function openForgotPasswordFlow() {
    const loginEmail = (document.getElementById('li-email')?.value || '').trim().toLowerCase();
    const fpEmail = document.getElementById('fp-email');
    if (fpEmail) fpEmail.value = loginEmail;
    passwordOtpEmail = '';
    passwordOtpToken = '';
    setForgotStep('email');
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('signup-screen').classList.add('hidden');
    document.getElementById('forgot-password-screen').classList.remove('hidden');
}

function cancelForgotPasswordFlow() {
    passwordOtpEmail = '';
    passwordOtpToken = '';
    document.getElementById('forgot-password-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

async function requestPasswordOtp(resend = false) {
    const email = (document.getElementById('fp-email')?.value || '').trim().toLowerCase();
    if (!isValidGmail(email)) {
        showAlert('Please enter a valid Gmail address.');
        return;
    }
    try {
        const response = await fetch(PASSWORD_OTP_API_BASE + '/sendPasswordOtp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email})
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not send verification code.');
        passwordOtpEmail = email;
        setForgotStep('otp');
        showAlert(resend ? 'A new verification code was sent to your Gmail.' : 'Verification code sent to your Gmail. Check Inbox and Spam/Junk.');
    } catch (err) {
        console.error('OTP request failed:', err);
        try {
            await auth.sendPasswordResetEmail(email);
            document.getElementById('li-email').value = email;
            document.getElementById('forgot-password-screen').classList.add('hidden');
            document.getElementById('login-screen').classList.remove('hidden');
            showAlert('Password reset link sent to your Gmail. Check Inbox and Spam/Junk.');
        } catch (fallbackErr) {
            console.error('Firebase reset-email fallback failed:', fallbackErr);
            showAlert(fallbackErr.message || 'Could not send password reset email.');
        }
    }
}

async function verifyPasswordOtp() {
    const email = passwordOtpEmail || (document.getElementById('fp-email')?.value || '').trim().toLowerCase();
    const code = (document.getElementById('fp-otp')?.value || '').trim();
    if (!isValidGmail(email)) { showAlert('Please enter your Gmail address again.'); return; }
    if (!/^\d{6}$/.test(code)) { showAlert('Enter the 6-digit code from your Gmail.'); return; }
    try {
        const response = await fetch(PASSWORD_OTP_API_BASE + '/verifyPasswordOtp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, code})
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Invalid verification code.');
        passwordOtpEmail = email;
        passwordOtpToken = data.resetToken || '';
        if (!passwordOtpToken) throw new Error('The server did not return a reset token.');
        setForgotStep('newpass');
    } catch (err) {
        console.error('OTP verification failed:', err);
        showAlert(err.message || 'Invalid or expired verification code.');
    }
}

async function completePasswordReset() {
    const newPass = document.getElementById('fp-new-pass')?.value || '';
    const confirmPass = document.getElementById('fp-confirm-pass')?.value || '';
    if (!isStrongPassword(newPass)) { showAlert('New password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass) { showAlert('Passwords do not match.'); return; }
    if (!passwordOtpEmail || !passwordOtpToken) { showAlert('Please verify the Gmail code first.'); return; }
    try {
        const response = await fetch(PASSWORD_OTP_API_BASE + '/resetPasswordWithOtp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email: passwordOtpEmail, resetToken: passwordOtpToken, newPassword: newPass})
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not change password.');
        showAlert('New password created successfully. You can now log in with your new password.');
        document.getElementById('li-email').value = passwordOtpEmail;
        document.getElementById('li-pass').value = '';
        document.getElementById('forgot-password-screen').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        passwordOtpEmail = '';
        passwordOtpToken = '';
    } catch (err) {
        console.error('Password reset failed:', err);
        showAlert(err.message || 'Could not change password.');
    }
}

async function resendVerificationEmail() {
    const email = document.getElementById('li-email').value.trim().toLowerCase();
    const pass = document.getElementById('li-pass').value;
    if (!isValidGmail(email) || !pass) {
        showAlert("Enter your Gmail and password first.");
        return;
    }
    try {
        const credential = await auth.signInWithEmailAndPassword(email, pass);
        await credential.user.sendEmailVerification();
        await auth.signOut();
        showAlert("Verification email sent again. Check your Gmail and spam folder.");
    } catch (err) {
        showAlert("Could not resend verification email. Check your Gmail and password.");
    }
}

async function logout() {
    if (currentUser) {
        const updates = {};
        updates[`presence/${currentUser.username}`] = false;
        updates[`presenceMeta/${currentUser.username}/online`] = false;
        updates[`presenceMeta/${currentUser.username}/lastSeen`] = firebase.database.ServerValue.TIMESTAMP;
        await db.ref().update(updates).catch(() => {});
    }
    currentUser = null;
    localStorage.removeItem('pro_user_session');
    await auth.signOut().catch(() => {});
    location.reload();
}

let appInitialized = false;

function initApp() {
    // Firebase auth can call this function more than once (for example, the
    // manual Gmail login handler and onAuthStateChanged can both fire).
    // Starting the app twice creates duplicate Firebase listeners and therefore
    // renders every friend twice. Keep a single app listener set alive.
    if (appInitialized) {
        console.debug('initApp skipped: app is already initialized');
        return;
    }
    appInitialized = true;

    applySavedAppearance();
    updateMyAvatar();
    setupPresenceSystem();
    loadFriendRequests();
    loadConversations();
    listenForIncomingCalls();
    syncNativeCallPushToken().catch(() => {});
    initNotifications();
}

function initNotifications() {
    // Browser notifications need permission; request it from the first user gesture when possible.
    const prime = () => {
        if (!notificationReady) {
            notificationReady = true;
            if ('Notification' in window && Notification.permission === 'default') {
                Notification.requestPermission().catch(() => {});
            }
        }
        // If a VAPID key is configured, silently prepare the FCM web-push token.
        if (currentUser) {
            setupWebPushNotifications().catch(() => {});
            syncNativeCallPushToken().catch(() => {});
        }
        window.removeEventListener('click', prime);
        window.removeEventListener('keydown', prime);
    };
    window.addEventListener('click', prime, { once: false });
    window.addEventListener('keydown', prime, { once: false });
    attachMessageNotificationListeners();
}

async function syncNativeCallPushToken() {
    if (!currentUser || !window.AndroidApp || typeof window.AndroidApp.getFcmToken !== 'function') return false;
    try {
        const token = String(window.AndroidApp.getFcmToken() || '').trim();
        if (!token) return false;
        await db.ref(`fcmTokens/${currentUser.username}`).set(token);
        return true;
    } catch (err) {
        console.warn('Native call push token sync failed:', err);
        return false;
    }
}

async function setupWebPushNotifications() {
    if (!currentUser || WEB_PUSH_VAPID_KEY === 'YOUR_FIREBASE_WEB_PUSH_VAPID_KEY') return false;
    if (!('serviceWorker' in navigator) || !('Notification' in window) || !window.isSecureContext) return false;
    if (!firebase.messaging) return false;
    if (Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission().catch(() => 'denied');
        if (permission !== 'granted') return false;
    }
    try {
        webPushRegistration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
        if (!webPushMessaging) webPushMessaging = firebase.messaging();
        const token = await webPushMessaging.getToken({ vapidKey: WEB_PUSH_VAPID_KEY, serviceWorkerRegistration: webPushRegistration });
        if (!token) return false;
        await db.ref(`webFcmTokens/${currentUser.username}/${encodeURIComponent(token)}`).set({
            token, platform: 'web', updatedAt: firebase.database.ServerValue.TIMESTAMP
        });
        localStorage.setItem('mpbd_web_push_enabled', 'true');
        if (!webPushMessageListenerAttached) {
            webPushMessageListenerAttached = true;
            webPushMessaging.onMessage(payload => {
                const d = payload?.data || {};
                if (d.sender === currentUser.username) return;
                const title = d.title || 'Messenger Pro BD';
                const body = d.body || 'New message';
                playMessageSound();
                showBrowserNotification(title, body, d.tag || 'messenger-web-push');
            });
        }
        return true;
    } catch (err) {
        console.warn('Web push setup failed:', err);
        return false;
    }
}

async function enableWebPush() {
    if (WEB_PUSH_VAPID_KEY === 'YOUR_FIREBASE_WEB_PUSH_VAPID_KEY') {
        showAlert('Push setup needs your Firebase Web Push VAPID key. Browser notifications will still work.', 'normal');
        return;
    }
    const ok = await setupWebPushNotifications();
    showAlert(ok ? 'Push notifications enabled successfully.' : 'Could not enable push notifications. Check permission and HTTPS.', ok ? 'success' : 'error');
}

function playMessageSound() {
    if (localStorage.getItem('mpbd_sound') === 'false') return;
    try { if(!notificationAudio){notificationAudio=new Audio('./notification.mp3');notificationAudio.preload='auto';notificationAudio.volume=.75;} notificationAudio.currentTime=0; const p=notificationAudio.play(); if(p&&p.catch)p.catch(()=>playMessageSoundFallback()); } catch(_){playMessageSoundFallback();}
}
function playMessageSoundFallback(){try{const Ctx=window.AudioContext||window.webkitAudioContext;if(!Ctx)return;if(!soundContext)soundContext=new Ctx();if(soundContext.state==='suspended')soundContext.resume().catch(()=>{});const now=soundContext.currentTime;[{f:784,start:0,dur:.1},{f:988,start:.12,dur:.11},{f:1175,start:.25,dur:.16}].forEach(t=>{const o=soundContext.createOscillator(),g=soundContext.createGain();o.type='sine';o.frequency.value=t.f;g.gain.setValueAtTime(.0001,now+t.start);g.gain.exponentialRampToValueAtTime(.12,now+t.start+.01);g.gain.exponentialRampToValueAtTime(.0001,now+t.start+t.dur);o.connect(g).connect(soundContext.destination);o.start(now+t.start);o.stop(now+t.start+t.dur+.02);});}catch(_){} }

function showBrowserNotification(title, body, tag) {
    if (localStorage.getItem('mpbd_notify') === 'false') return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
        const n = new Notification(title, { body, tag: tag || 'messenger-message', renotify: true, silent: true });
        n.onclick = () => { window.focus(); n.close(); };
        setTimeout(() => n.close(), 7000);
    } catch (_) {}
}

let messageNotificationSystemAttached = false;
function attachMessageNotificationListeners() {
    if (!currentUser || messageNotificationSystemAttached) return;
    messageNotificationSystemAttached = true;
    db.ref(`friends/${currentUser.username}`).once('value').then(snapshot => {
        snapshot.forEach(friendSnap => attachRoomNotification(friendSnap.key));
    }).catch(() => {});
    db.ref(`friends/${currentUser.username}`).on('child_added', snap => attachRoomNotification(snap.key));
}

async function attachRoomNotification(friendUsername) {
    if (!friendUsername || friendUsername === currentUser.username) return;
    const roomId = getRoomId(currentUser.username, friendUsername);
    if (notificationRoomListeners.has(roomId)) return;
    notificationRoomListeners.add(roomId);
    // IMPORTANT: never download the entire chat just to initialize notifications.
    // Watching only the latest child makes login fast even when a chat has thousands of messages.
    const query = db.ref(`chats/${roomId}`).limitToLast(1);
    let latestExistingKey = null;
    try {
        const snap = await query.once('value');
        snap.forEach(s => { latestExistingKey = s.key; });
    } catch (_) {}
    notificationInitializedRooms.add(roomId);
    query.on('child_added', async snap => {
        if (snap.key === latestExistingKey) { latestExistingKey = null; return; }
        const m = snap.val();
        if (!m || m.sender === currentUser.username) return;
        let friendName = friendUsername;
        const cached = document.querySelector(`.chat-item[data-username=\"${CSS.escape(friendUsername)}\"] h4`);
        if (cached && cached.textContent) friendName = cached.textContent;
        const body = m.type === 'audio' ? '🎤 Voice message' : m.type === 'image' ? '📷 Photo' : m.type === 'video' ? '🎥 Video' : m.type === 'file' ? '📎 File' : (m.type === 'location' || m.type === 'liveLocation') ? '📍 Location' : (m.text || 'New message');
        const chatOpen = activeFriend && activeFriend.username === friendUsername && !document.getElementById('chat-room').classList.contains('hidden') && document.visibilityState === 'visible';
        if (!chatOpen) {
            playMessageSound();
            showBrowserNotification(`@${friendUsername} • ${friendName}`, body, `chat-${roomId}`);
        }
    });
}

function unlockSound(){
    try {
        const Ctx=window.AudioContext||window.webkitAudioContext;
        if(Ctx){ if(!soundContext) soundContext=new Ctx(); if(soundContext.state==='suspended') soundContext.resume().catch(()=>{}); }
        if(!ringtoneAudio){ ringtoneAudio=new Audio('./ringtone.mp3'); ringtoneAudio.preload='auto'; ringtoneAudio.loop=true; ringtoneAudio.volume=.95; }
        ringtoneAudio.load(); soundUnlocked=true;
    } catch(_) {}
}
function startRingtone(){
    stopRingtone();
    try {
        if(!ringtoneAudio){ ringtoneAudio=new Audio('./ringtone.mp3'); ringtoneAudio.preload='auto'; ringtoneAudio.loop=true; ringtoneAudio.volume=.95; }
        ringtoneAudio.currentTime=0;
        const p=ringtoneAudio.play();
        if(p&&p.catch) p.catch(()=>startRingtoneFallback());
    } catch(_) { startRingtoneFallback(); }
}
function startRingtoneFallback(){
    try {
        const Ctx=window.AudioContext||window.webkitAudioContext; if(!Ctx)return;
        if(!soundContext) soundContext=new Ctx();
        if(soundContext.state==='suspended') soundContext.resume().catch(()=>{});
        const ring=()=>{ const now=soundContext.currentTime; [440,554.37].forEach((f,i)=>{ const o=soundContext.createOscillator(),g=soundContext.createGain(),st=now+i*.22; o.type='sine';o.frequency.value=f;g.gain.setValueAtTime(.0001,st);g.gain.exponentialRampToValueAtTime(.2,st+.02);g.gain.exponentialRampToValueAtTime(.0001,st+.42);o.connect(g).connect(soundContext.destination);o.start(st);o.stop(st+.45);ringtoneOscillators.push(o); }); };
        ring(); ringtoneTimer=setInterval(ring,1800);
    } catch(_) {}
}
function stopRingtone(){ if(ringtoneTimer)clearInterval(ringtoneTimer); ringtoneTimer=null; ringtoneOscillators.forEach(o=>{try{o.stop();}catch(_){}}); ringtoneOscillators=[]; if(ringtoneAudio){try{ringtoneAudio.pause();ringtoneAudio.currentTime=0;}catch(_){}} }

function setupPresenceSystem() {
    // Robust presence: a user is ONLINE while the Firebase connection is alive.
    // Do not use focus/blur/visibility as an offline signal: switching tabs,
    // opening a chat, or entering Settings must not make friends see OFFLINE.
    const username = currentUser.username;
    const userStatusRef = db.ref(`presence/${username}`);
    const metaRef = db.ref(`presenceMeta/${username}`);
    const connectedRef = db.ref('.info/connected');
    let heartbeat = null;
    let connected = false;

    const shouldShowOnline = () => localStorage.getItem('mpbd_online') !== 'false';

    const markStatus = (isOnline) => {
        if (!connected) return;
        const online = !!isOnline && shouldShowOnline() && navigator.onLine;
        const now = firebase.database.ServerValue.TIMESTAMP;
        db.ref().update({
            [`presence/${username}`]: online,
            [`presenceMeta/${username}/online`]: online,
            [`presenceMeta/${username}/lastSeen`]: now
        }).catch(() => {});
    };

    connectedRef.on('value', snap => {
        connected = snap.val() === true;
        clearInterval(heartbeat);
        heartbeat = null;

        if (!connected) return;

        // Firebase handles the actual disconnect, including sudden browser/network loss.
        userStatusRef.onDisconnect().set(false);
        metaRef.onDisconnect().update({
            online: false,
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });

        markStatus(true);

        // Keep the status fresh while connected. This intentionally does NOT depend
        // on tab focus or visibility, so background tabs still appear online.
        heartbeat = setInterval(() => {
            if (connected && navigator.onLine) markStatus(true);
        }, 15000);
    });

    // Network changes are the only browser-side events that directly affect presence.
    window.addEventListener('online', () => {
        if (connected) markStatus(true);
    });
    window.addEventListener('offline', () => markStatus(false));

    // Do not mark offline on blur/visibilitychange.
    // Users can switch tabs, open Settings, minimize the browser, etc. and remain online.

    window.addEventListener('beforeunload', () => {
        // onDisconnect is the reliable fallback for page/browser termination.
        // This immediate write helps normal page navigation where possible.
        try { markStatus(false); } catch (_) {}
    });
}

function updateMyAvatar() {
    const myAv = document.getElementById('my-top-avatar');
    document.getElementById('top-username-title').innerText = 'Messenger Pro BD';
    if(currentUser.profilePic && currentUser.profilePic.trim() !== "") {
        myAv.innerHTML = `<img src="${currentUser.profilePic}" alt="Profile">`;
    } else {
        myAv.innerText = currentUser.name[0].toUpperCase();
    }
}

async function getFriendRelationship(targetUsername) {
    const [mineSnap, theirsSnap, outgoingSnap, incomingSnap] = await Promise.all([
        db.ref(`friends/${currentUser.username}/${targetUsername}`).once('value'),
        db.ref(`friends/${targetUsername}/${currentUser.username}`).once('value'),
        db.ref(`friendRequests/${targetUsername}/${currentUser.username}`).once('value'),
        db.ref(`friendRequests/${currentUser.username}/${targetUsername}`).once('value')
    ]);
    if (mineSnap.exists() || theirsSnap.exists()) return 'friend';
    if (outgoingSnap.exists()) return 'pending';
    if (incomingSnap.exists()) return 'incoming';
    return 'none';
}

async function searchUser() {
    const targetUsername = document.getElementById('friend-input').value.trim().toLowerCase();
    const searchSection = document.getElementById('search-results-section');
    const searchContainer = document.getElementById('search-results-container');
    if (!targetUsername) { clearSearch(); return; }
    if (targetUsername === currentUser.username) { showAlert("You cannot search yourself!"); return; }

    searchContainer.innerHTML = '<p style="padding:15px;color:#b0b3b8;text-align:center;">Searching…</p>';
    searchSection.style.display = "block";
    try {
        const snap = await db.ref('users/' + targetUsername).once('value');
        searchContainer.innerHTML = "";
        if (!snap.exists()) {
            searchContainer.innerHTML = `<p style="padding:15px; color:#b0b3b8; text-align:center;">User not found!</p>`;
            return;
        }
        const user = snap.val() || {};
        const relationship = await getFriendRelationship(targetUsername);
        const row = document.createElement('div');
        row.className = 'tiktok-user-row';
        const imgHtml = (user.profilePic && user.profilePic.trim() !== "")
            ? `<img src="${escapeHtml(user.profilePic)}">`
            : escapeHtml((user.name || user.username || 'U').charAt(0).toUpperCase());
        let buttonHtml = '';
        if (relationship === 'friend') {
            buttonHtml = `<button class="btn-tiktok-follow friend-status-btn" disabled><i class="fa-solid fa-check"></i> Already Friend</button>`;
        } else if (relationship === 'pending') {
            buttonHtml = `<button class="btn-tiktok-follow friend-status-btn" disabled><i class="fa-solid fa-clock"></i> Request Sent</button>`;
        } else if (relationship === 'incoming') {
            buttonHtml = `<button class="btn-tiktok-follow" onclick="acceptRequest('${escapeHtmlAttr(user.username)}')"><i class="fa-solid fa-user-check"></i> Accept</button>`;
        } else {
            buttonHtml = `<button class="btn-tiktok-follow" onclick="sendFriendRequestFromCard('${escapeHtmlAttr(user.username)}')"><i class="fa-solid fa-user-plus"></i> Add Friend</button>`;
        }
        row.innerHTML = `
            <div class="tiktok-user-info">
                <div class="tiktok-avatar">${imgHtml}</div>
                <div class="tiktok-text"><h4>${escapeHtml(user.name || user.username)}</h4><p>@${escapeHtml(user.username)}</p></div>
            </div>${buttonHtml}`;
        searchContainer.appendChild(row);
    } catch (e) {
        console.error('User search failed:', e);
        searchContainer.innerHTML = '<p style="padding:15px;color:#ff7676;text-align:center;">Could not search right now.</p>';
    }
}

async function sendFriendRequestFromCard(targetUsername) {
    targetUsername = String(targetUsername || '').trim().toLowerCase();
    if (!targetUsername || targetUsername === currentUser.username) return;
    try {
        const relationship = await getFriendRelationship(targetUsername);
        if (relationship === 'friend') { showAlert('Already Friend'); return; }
        if (relationship === 'pending') { showAlert('Friend request already sent.'); return; }
        if (relationship === 'incoming') { showAlert('This user already sent you a request. Accept it below.'); return; }
        await db.ref(`friendRequests/${targetUsername}/${currentUser.username}`).set({
            name: currentUser.name,
            username: currentUser.username,
            profilePic: currentUser.profilePic || "",
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        showAlert("Friend request sent!");
        await searchUser();
    } catch (e) {
        console.error('Friend request failed:', e);
        showAlert('Could not send friend request.');
    }
}

function clearSearch() {
    document.getElementById('search-results-section').style.display = "none";
    document.getElementById('search-results-container').innerHTML = "";
    document.getElementById('friend-input').value = "";
}

function loadFriendRequests() {
    const reqSection = document.getElementById('requests-section');
    const reqContainer = document.getElementById('requests-container');
    db.ref(`friendRequests/${currentUser.username}`).on('value', snapshot => {
        reqContainer.innerHTML = "";
        if (!snapshot.exists()) { reqSection.style.display = "none"; return; }
        reqSection.style.display = "block";
        snapshot.forEach(childSnap => {
            const reqUser = childSnap.val() || {};
            const row = document.createElement('div');
            row.className = 'tiktok-user-row';
            const imgHtml = (reqUser.profilePic && reqUser.profilePic.trim() !== "")
                ? `<img src="${escapeHtml(reqUser.profilePic)}">`
                : escapeHtml((reqUser.name || reqUser.username || 'U').charAt(0).toUpperCase());
            row.innerHTML = `
                <div class="tiktok-user-info">
                    <div class="tiktok-avatar">${imgHtml}</div>
                    <div class="tiktok-text"><h4>${escapeHtml(reqUser.name || reqUser.username)}</h4><p>@${escapeHtml(reqUser.username)}</p></div>
                </div>
                <div class="request-actions">
                    <button class="btn-tiktok-follow" onclick="acceptRequest('${escapeHtmlAttr(reqUser.username)}')">Follow back</button>
                    <button class="btn-tiktok-reject" onclick="rejectRequest('${escapeHtmlAttr(reqUser.username)}')">Reject</button>
                </div>
            `;
            reqContainer.appendChild(row);
        });
    });
}

async function acceptRequest(fromUsername) {
    fromUsername = String(fromUsername || '').trim().toLowerCase();
    if (!fromUsername || fromUsername === currentUser.username) return;
    try {
        // Multi-location update adds this friend without replacing the existing friend map.
        // No friends/${currentUser.username} root .set() is used, so existing friends cannot be deleted here.
        const updates = {};
        updates[`friends/${currentUser.username}/${fromUsername}`] = true;
        updates[`friends/${fromUsername}/${currentUser.username}`] = true;
        updates[`friendRequests/${currentUser.username}/${fromUsername}`] = null;
        await db.ref().update(updates);
        showAlert('Friend added successfully. Existing friends were kept.');
        await searchUser();
    } catch (e) {
        console.error('Accept friend request failed:', e);
        showAlert('Could not accept friend request.');
    }
}

function rejectRequest(fromUsername) {
    db.ref(`friendRequests/${currentUser.username}/${fromUsername}`).remove()
      .then(() => showAlert('Request rejected.'))
      .catch(() => showAlert('Could not reject request.'));
}

function getRoomId(u1, u2) {
    return u1 < u2 ? `${u1}_${u2}` : `${u2}_${u1}`;
}

let conversationsInitialized = false;

function loadConversations() {
    if (conversationsInitialized) {
        console.debug('loadConversations skipped: already initialized');
        return;
    }
    conversationsInitialized = true;

    const convContainer = document.getElementById('conversations-container');
    const friendsRef = db.ref(`friends/${currentUser.username}`);

    // Keep one DOM row per friend. Rebuilding the whole container on every Firebase
    // `value` event could make an existing friend disappear while another friend was
    // being added. Reconcile the list instead, so every friend stays visible.
    const rowMap = new Map();
    const loadingMap = new Map();

    // Messenger-style ordering: the friend with the newest message is always first.
    // We keep the Firebase friend list intact, but sort the rendered rows by the
    // timestamp of the latest chat message whenever that message changes.
    const reorderFriendRows = () => {
        const rows = Array.from(rowMap.values()).filter(row => row && row.isConnected);
        rows.sort((a, b) => {
            const ta = Number(a.dataset.lastMessageTime || 0);
            const tb = Number(b.dataset.lastMessageTime || 0);
            if (tb !== ta) return tb - ta;
            const an = String(a.dataset.username || '').toLowerCase();
            const bn = String(b.dataset.username || '').toLowerCase();
            return an.localeCompare(bn);
        });
        const frag = document.createDocumentFragment();
        rows.forEach(row => frag.appendChild(row));
        convContainer.appendChild(frag);
    };

    const createFriendRow = (username) => {
        const div = document.createElement('div');
        div.className = 'chat-item friend-loading-row';
        div.dataset.username = username;
        div.dataset.lastMessageTime = '0';
        div.innerHTML = `
            <div class="avatar-container"><div class="avatar friend-skeleton-avatar"></div><div class="online-dot"></div></div>
            <div class="friend-row-content" style="flex:1;min-width:0;cursor:pointer">
                <h4 class="friend-skeleton-line">Loading…</h4>
                <p class="friend-user-id">@${escapeHtml(username)}</p>
                <p class="friend-last-sender-id"></p>
                <p class="friend-last-message friend-skeleton-line short">Loading latest message…</p>
            </div>`;
        div.querySelector('.friend-row-content').onclick = () => {
            const cached = div._friendUser;
            if (cached) openChat(cached);
            else showAlert('Opening profile… please try again in a moment.');
        };
        return div;
    };

    const addFriendRow = (username) => {
        if (!username || rowMap.has(username)) return rowMap.get(username);
        const div = createFriendRow(username);
        rowMap.set(username, div);
        convContainer.appendChild(div);
        if (!loadingMap.has(username)) {
            const task = hydrateFriendRow(username, div).finally(() => loadingMap.delete(username));
            loadingMap.set(username, task);
        }
        return div;
    };

    friendsRef.on('value', snapshot => {
        const friends = [];
        snapshot.forEach(childSnap => {
            if (childSnap.key) friends.push(childSnap.key);
        });

        const countEl = document.getElementById('friends-count');
        if (countEl) countEl.textContent = `${friends.length} friend${friends.length === 1 ? '' : 's'}`;

        if (!friends.length) {
            convContainer.innerHTML = '<div class="friends-empty-state">No friends yet.</div>';
            rowMap.clear();
            loadingMap.clear();
            return;
        }

        // Remove the empty-state placeholder only when we actually have friends.
        const empty = convContainer.querySelector('.friends-empty-state');
        if (empty) empty.remove();

        // Add every Firebase child without clearing existing rows.
        friends.forEach(addFriendRow);

        // Rows are intentionally NOT kept in Firebase friend order here.
        // reorderFriendRows() places the most recently active conversation first.
        reorderFriendRows();

        // Remove rows that no longer exist in Firebase.
        const friendSet = new Set(friends);
        Array.from(rowMap.entries()).forEach(([username, row]) => {
            if (!friendSet.has(username)) {
                row.remove();
                rowMap.delete(username);
                loadingMap.delete(username);
            }
        });
    });

    // Also handle an individual friend being added immediately, without waiting for
    // a full-list redraw.
    friendsRef.on('child_added', snap => addFriendRow(snap.key));
}

async function hydrateFriendRow(username, div) {
    if (!div) return;
    try {
        const userSnap = await db.ref(`users/${username}`).once('value');
        if (!userSnap.exists()) { div.remove(); return; }
        const user = userSnap.val();
        user.friendNickname = await loadFriendNickname(username);
        // Render the friend immediately. Membership bootstrap must never block or hide the row.
        ensureChatMembership(user).catch(e => console.warn('Conversation membership bootstrap failed:', e));
        div._friendUser = user;
        const avatarHTML = (user.profilePic && user.profilePic.trim() !== '')
            ? `<div class="avatar"><img src="${escapeHtml(user.profilePic)}" alt=""></div>`
            : `<div class="avatar">${escapeHtml((user.name || username).charAt(0).toUpperCase())}</div>`;
        div.innerHTML = `<div class="avatar-container">${avatarHTML}<div class="online-dot"></div></div>
            <div style="flex:1;min-width:0;cursor:pointer"><h4>${escapeHtml(user.friendNickname || user.name || username)}</h4>
            <p class="friend-user-id">@${escapeHtml(username)}</p><p class="friend-last-sender-id"></p><p class="friend-last-message">Start a conversation</p></div>`;
        div.querySelector('div[style*="cursor:pointer"]').onclick = () => openChat(user);

        // Presence and last message are independent lightweight listeners. They don't block rendering.
        let friendBooleanPresence = false;
        let friendMeta = null;
        const updateFriendPresence = () => {
            const dot = div.querySelector('.online-dot');
            if (!dot) return;
            if (friendMeta) {
                dot.classList.toggle('active', friendMeta.online === true);
            } else {
                dot.classList.toggle('active', friendBooleanPresence);
            }
        };
        db.ref(`presence/${username}`).on('value', snap => {
            friendBooleanPresence = snap.val() === true;
            updateFriendPresence();
        });
        db.ref(`presenceMeta/${username}`).on('value', snap => {
            friendMeta = snap.exists() ? (snap.val() || {}) : null;
            updateFriendPresence();
        });
        const roomId = getRoomId(currentUser.username, username);
        const lastMessageRef = db.ref(`lastMessages/${currentUser.username}/${username}`);
        const roomMessagesRef = db.ref(`chats/${roomId}`).limitToLast(1);

        // The room itself is the source of truth. This fixes cases where an older
        // "New message" placeholder remains because the lastMessages cache was
        // missing or stale. It also gives us the exact timestamp needed for sorting.
        roomMessagesRef.on('value', chatSnap => {
            let lastKey = null, lastVal = null;
            chatSnap.forEach(x => { lastKey = x.key; lastVal = x.val(); });
            if (lastKey && lastVal) {
                div.dataset.lastMessageTime = String(Number(lastVal.time) || 0);
                renderConversationLastMessageValue(div, lastVal);
                cacheLastMessage(username, lastKey, lastVal);
            } else {
                div.dataset.lastMessageTime = '0';
                renderConversationLastMessageValue(div, null);
            }
            reorderFriendRows();
        });

        // Keep the cached last-message path as a fast fallback while the room query
        // is loading, and also support updates written by another device.
        lastMessageRef.on('value', snap => {
            if (!snap.exists()) return;
            let last = null;
            snap.forEach(s => { last = s.val(); });
            if (!last) return;
            const cachedTime = Number(last.time) || 0;
            const currentTime = Number(div.dataset.lastMessageTime || 0);
            if (cachedTime >= currentTime) {
                div.dataset.lastMessageTime = String(cachedTime);
                renderConversationLastMessage(div, snap);
                reorderFriendRows();
            }
        });
    } catch (err) {
        console.warn('Could not load friend row', username, err);
        const msg = div.querySelector('.friend-last-message');
        if (msg) msg.textContent = 'Could not load profile';
    }
}

function renderConversationLastMessage(div, chatSnap) {
    if (!chatSnap || !chatSnap.exists()) {
        renderConversationLastMessageValue(div, null);
        return;
    }
    let last = null;
    chatSnap.forEach(s => { last = s.val(); });
    renderConversationLastMessageValue(div, last);
}

function renderConversationLastMessageValue(div, last) {
    const senderEl = div.querySelector('.friend-last-sender-id');
    const textEl = div.querySelector('.friend-last-message');
    if (!senderEl || !textEl) return;
    if (!last) {
        senderEl.textContent = '';
        textEl.textContent = 'Start a conversation';
        return;
    }
    const sender = last.sender || '';
    senderEl.textContent = sender ? `Last message by @${sender}` : '';
    const lastText = last.type === 'call'
        ? (last.status === 'missed' ? '📞 Missed call' : last.status === 'rejected' ? '📞 Declined call' : (last.callType === 'video' ? '📹 Video call' : '📞 Audio call') + (last.duration ? ` • ${last.duration}` : ''))
        : last.type === 'image' ? '📷 Photo'
        : last.type === 'video' ? '🎥 Video'
        : last.type === 'audio' ? '🎤 Voice Note'
        : last.type === 'file' ? `📎 ${last.fileName || 'File'}`
        : last.type === 'sticker' ? `Sticker ${last.sticker || ''}`.trim()
        : (last.text || 'New message');
    textEl.textContent = lastText;
}

function loadAISettingsUI(){
  const keyInput=document.getElementById('ai-api-key-input');
  const model=document.getElementById('ai-model-select');
  if(keyInput)keyInput.value=getAIKey();
  if(model)model.value=getAIModel();
}
function saveAISettingsFromUI(){
  const key=document.getElementById('ai-api-key-input')?.value?.trim()||'';
  const model=document.getElementById('ai-model-select')?.value||GEMINI_MODELS[0];
  saveAISettings(key,model);
  showAlert(key?'✅ X AI key saved in this browser.':'AI key cleared.');
}
function toggleAIKeyVisibility(){
  const input=document.getElementById('ai-api-key-input');
  const btn=document.querySelector('.ai-key-row button');
  if(!input)return;
  input.type=input.type==='password'?'text':'password';
  if(btn)btn.innerHTML=input.type==='password'?'<i class="fa-solid fa-eye"></i>':'<i class="fa-solid fa-eye-slash"></i>';
}

function openSettings() {
    mpPushView('settings');
    setAIFabVisible(false);
    const screen = document.getElementById('settings-screen');
    const content = document.getElementById('profile-edit-content');
    screen.classList.remove('hidden');

    editPicBase64 = currentUser.profilePic || '';
    const providerIds = (authUser?.providerData || []).map(p => p.providerId);
    const canChangePassword = providerIds.includes('password');
    const avatarHtml = editPicBase64
        ? `<img src="${editPicBase64}" alt="Profile picture">`
        : `<span>${(currentUser.name || currentUser.username || 'U').charAt(0).toUpperCase()}</span>`;

    content.innerHTML = `
        <div class="settings-page-shell">
          <div class="settings-hero-card">
            <div class="settings-hero-glow"></div>
            <div class="settings-profile-avatar" onclick="document.getElementById('edit-file').click()" title="Change profile picture">
            ${avatarHtml}
            <div class="settings-avatar-edit"><i class="fa-solid fa-camera"></i></div>
        </div>
            <div class="settings-identity">
              <div class="settings-username">@${escapeHtml(currentUser.username || 'user')}</div>
              <div class="settings-premium"><i class="fa-solid fa-crown"></i> Premium Experience</div>
              <div class="settings-hint">Tap your photo to change it • changes save automatically</div>
            </div>
          </div>
          <input type="file" id="edit-file" style="display:none;" accept="image/*" onchange="handleEditImage(event)">

          <div class="settings-options-grid">
          <button type="button" class="settings-section-toggle" onclick="toggleSettingsSection('profile-section', this)" aria-expanded="false">
            <span><i class="fa-solid fa-user"></i> Profile</span><i class="fa-solid fa-chevron-down"></i>
        </button>
        <div id="profile-section" class="settings-section-panel hidden">
            <input type="text" id="edit-name" class="auth-input" value="${escapeHtmlAttr(currentUser.name || '')}" placeholder="Name">
            <input type="text" id="edit-username" class="auth-input" value="${escapeHtmlAttr(currentUser.username || '')}" placeholder="Username">
            <textarea id="edit-bio" class="auth-input settings-textarea" placeholder="Short bio (optional)" maxlength="120">${escapeHtmlAttr(currentUser.bio || '')}</textarea>
            <button class="auth-btn" onclick="updateProfile()">Save Profile</button>
        </div>

        <button type="button" class="settings-section-toggle" onclick="toggleSettingsSection('appearance-section', this)" aria-expanded="false">
            <span><i class="fa-solid fa-palette"></i> Appearance</span><i class="fa-solid fa-chevron-down"></i>
        </button>
        <div id="appearance-section" class="settings-section-panel hidden">
            <label class="settings-label">Theme</label>
            <div class="theme-choice-row"><button type="button" class="theme-choice" onclick="setTheme('dark')">🌙 Dark</button><button type="button" class="theme-choice" onclick="setTheme('light')">☀️ Light</button><button type="button" class="theme-choice" onclick="setTheme('amoled')">⬛ AMOLED</button></div>
            <label class="settings-label">Accent</label>
            <div class="accent-row"><button class="accent-dot blue" onclick="setAccent('#0084ff')"></button><button class="accent-dot purple" onclick="setAccent('#7c5cff')"></button><button class="accent-dot green" onclick="setAccent('#22c55e')"></button><button class="accent-dot pink" onclick="setAccent('#ec4899')"></button><button class="accent-dot orange" onclick="setAccent('#f97316')"></button></div>
            <label class="settings-switch"><span>Message sounds</span><input id="setting-sound" type="checkbox" onchange="saveLocalSetting('sound',this.checked)"></label>
            <label class="settings-switch"><span>Browser notifications</span><input id="setting-notify" type="checkbox" onchange="saveLocalSetting('notify',this.checked); requestBrowserNotifications(); if(this.checked) enableWebPush()"></label>
            <button type="button" class="settings-tool-btn push-enable-btn" onclick="enableWebPush()"><i class="fa-solid fa-bell"></i> Enable Push Notifications <span class="push-status-dot" title="Web push status"></span></button>
        </div>

        <button type="button" class="settings-section-toggle" onclick="toggleSettingsSection('privacy-section', this)" aria-expanded="false">
            <span><i class="fa-solid fa-user-shield"></i> Privacy & Chat</span><i class="fa-solid fa-chevron-down"></i>
        </button>
        <div id="privacy-section" class="settings-section-panel hidden">
            <label class="settings-switch"><span>Show online status</span><input id="setting-online" type="checkbox" checked onchange="saveLocalSetting('online',this.checked)"></label>
            <button class="settings-tool-btn" onclick="openSavedMessages()"><i class="fa-regular fa-bookmark"></i> Saved messages <span id="saved-count-badge">0</span></button>
            <button class="settings-tool-btn" onclick="openBlockHistory()"><i class="fa-solid fa-ban"></i> Block history <span id="blocked-count-badge">0</span></button>
            <div id="block-history-panel" class="block-history-panel hidden"></div>
            <button class="settings-tool-btn" onclick="clearChatCaches()"><i class="fa-solid fa-broom"></i> Clear local chat cache</button>
        </div>

        <button type="button" class="settings-section-toggle" onclick="toggleSettingsSection('devices-section', this)" aria-expanded="false">
            <span><i class="fa-solid fa-mobile-screen-button"></i> Devices & Security</span><i class="fa-solid fa-chevron-down"></i>
        </button>
        <div id="devices-section" class="settings-section-panel hidden">
            <div class="device-card"><i class="fa-solid fa-desktop"></i><div><strong>This device</strong><small>Current browser session</small></div><span class="device-online">Active</span></div>
            <button class="settings-tool-btn danger-tool" onclick="logout()"><i class="fa-solid fa-right-from-bracket"></i> Log out this device</button>
        </div>
        <div class="settings-mini-footer">Messenger Pro BD • Premium</div>

        <button type="button" class="settings-section-toggle" onclick="toggleSettingsSection('security-section', this)" aria-expanded="false">
            <span><i class="fa-solid fa-shield-halved"></i> Security</span><i class="fa-solid fa-chevron-down"></i>
        </button>
        <div id="security-section" class="settings-section-panel hidden">
            ${canChangePassword ? `
            <div class="password-wrap">
                <input type="password" id="settings-current-pass" class="auth-input password-input" placeholder="Current Password" autocomplete="current-password">
                <button type="button" class="password-toggle" onclick="togglePassword('settings-current-pass', this)" aria-label="Show password" title="Show password"><i class="fa-solid fa-eye"></i></button>
            </div>
            <div class="password-wrap">
                <input type="password" id="settings-new-pass" class="auth-input password-input" placeholder="New Password (8+ characters)" minlength="8" autocomplete="new-password">
                <button type="button" class="password-toggle" onclick="togglePassword('settings-new-pass', this)" aria-label="Show password" title="Show password"><i class="fa-solid fa-eye"></i></button>
            </div>
            <div class="password-wrap">
                <input type="password" id="settings-confirm-pass" class="auth-input password-input" placeholder="Confirm New Password" minlength="8" autocomplete="new-password">
                <button type="button" class="password-toggle" onclick="togglePassword('settings-confirm-pass', this)" aria-label="Show password" title="Show password"><i class="fa-solid fa-eye"></i></button>
            </div>
            <button class="auth-btn settings-secondary-btn" onclick="changePasswordFromSettings()">Change Password</button>
            ` : `<p class="settings-note">Password change is available for email/password accounts only. Your social-login provider manages its password.</p>`}
          </div>
          </div>
        </div>
    `;
    saveAppearanceControls();
}
    const aiCard=document.querySelector('.ai-settings-card');
    const privacy=document.getElementById('privacy-section');
    if(aiCard && privacy && !privacy.contains(aiCard)) privacy.insertBefore(aiCard,privacy.firstChild);
    loadAISettingsUI();



async function openBlockHistory() {
    const panel = document.getElementById('block-history-panel');
    const badge = document.getElementById('blocked-count-badge');
    if (!panel || !currentUser) return;
    panel.classList.remove('hidden');
    panel.innerHTML = '<div class="block-history-loading"><i class="fa-solid fa-spinner fa-spin"></i> Loading blocked users…</div>';
    try {
        const snap = await db.ref(`blocked/${currentUser.username}`).once('value');
        const data = snap.val() || {};
        const usernames = Object.keys(data).filter(u => data[u] === true);
        if (badge) badge.textContent = String(usernames.length);
        if (!usernames.length) {
            panel.innerHTML = '<div class="block-history-empty"><i class="fa-regular fa-circle-check"></i><span>No blocked users</span><small>People you block will appear here.</small></div>';
            return;
        }

        const results = await Promise.all(usernames.map(async username => {
            try {
                const userSnap = await db.ref(`users/${username}`).once('value');
                return { username, user: userSnap.val() || {} };
            } catch (_) {
                return { username, user: {} };
            }
        }));

        panel.innerHTML = results.map(({username, user}) => {
            const name = user.name || username;
            const pic = user.profilePic
                ? `<img src="${escapeHtmlAttr(user.profilePic)}" alt="">`
                : `<span>${escapeHtmlAttr(name.charAt(0).toUpperCase())}</span>`;
            return `<div class="block-history-row" data-block-user="${escapeHtmlAttr(username)}">
                <div class="block-history-avatar">${pic}</div>
                <div class="block-history-info"><strong>${escapeHtmlAttr(name)}</strong><small>@${escapeHtmlAttr(username)}</small></div>
                <button type="button" class="block-history-unblock" onclick="unblockFromHistory('${escapeHtmlAttr(username)}')"><i class="fa-solid fa-unlock"></i> Unblock</button>
            </div>`;
        }).join('');
    } catch (e) {
        console.error('Block history error:', e);
        if (badge) badge.textContent = '0';
        panel.innerHTML = '<div class="block-history-empty"><i class="fa-solid fa-triangle-exclamation"></i><span>Could not load block history</span><small>Check your connection and try again.</small></div>';
    }
}

async function unblockFromHistory(username) {
    username = normalizeUsername(username);
    if (!username || !currentUser) return;
    try {
        await db.ref(`blocked/${currentUser.username}/${username}`).remove();
        showAlert(`@${username} has been unblocked.`);
        await openBlockHistory();
    } catch (e) {
        console.error('Unblock history error:', e);
        showAlert('Could not unblock this user. Please try again.');
    }
}

function toggleSettingsSection(sectionId, button) {
    const panel = document.getElementById(sectionId);
    if (!panel) return;
    const opening = panel.classList.contains('hidden');
    panel.classList.toggle('hidden', !opening);
    button?.setAttribute('aria-expanded', String(opening));
    button?.classList.toggle('open', opening);
    const chevron = button?.querySelector('.fa-chevron-down');
    if (chevron) chevron.style.transform = opening ? 'rotate(180deg)' : 'rotate(0deg)';
}

function escapeHtmlAttr(value) {
    return String(value || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function updateProfile() {
    const newName = document.getElementById('edit-name').value.trim();
    const newBio = (document.getElementById('edit-bio')?.value || '').trim().slice(0,120);
    const requestedUsername = normalizeUsername(document.getElementById('edit-username').value);
    if (!newName) { showAlert('Name cannot be empty!'); return; }
    if (requestedUsername.length < 3 || requestedUsername.length > 30) { showAlert('Username must be 3-30 characters.'); return; }
    if (requestedUsername !== currentUser.username && requestedUsername.length < 3) { showAlert('Username is too short.'); return; }

    const oldUsername = currentUser.username;
    const newUsername = requestedUsername;
    try {
        if (newUsername !== oldUsername) {
            const existing = await db.ref('users/' + newUsername).once('value');
            if (existing.exists()) { showAlert('That username is already taken.'); return; }
            await migrateUsername(oldUsername, newUsername);
        }
        currentUser.username = newUsername;
        currentUser.name = newName;
        currentUser.bio = newBio;
        currentUser.profilePic = editPicBase64;
        await db.ref('users/' + newUsername).update({name:newName, username:newUsername, profilePic:editPicBase64, bio:newBio});
        localStorage.setItem('pro_user_session', JSON.stringify(currentUser));
        updateMyAvatar();
        showAlert('Profile updated successfully!');
        closeSettings();
    } catch (err) {
        console.error(err);
        showAlert('Could not update profile. ' + (err.message || 'Please try again.'));
    }
}

async function migrateUsername(oldUsername, newUsername) {
    const multi = {};
    const userSnap = await db.ref('users/' + oldUsername).once('value');
    if (!userSnap.exists()) throw new Error('Current profile was not found.');
    const profile = userSnap.val();
    profile.username = newUsername;
    multi['users/' + newUsername] = profile;
    multi['users/' + oldUsername] = null;

    const friendsSnap = await db.ref('friends/' + oldUsername).once('value');
    if (friendsSnap.exists()) {
        multi['friends/' + newUsername] = friendsSnap.val();
        for (const friend of Object.keys(friendsSnap.val() || {})) {
            multi['friends/' + friend + '/' + oldUsername] = null;
            multi['friends/' + friend + '/' + newUsername] = true;
            const oldRoom = getRoomId(oldUsername, friend);
            const newRoom = getRoomId(newUsername, friend);
            if (oldRoom !== newRoom) {
                const chatSnap = await db.ref('chats/' + oldRoom).once('value');
                if (chatSnap.exists()) multi['chats/' + newRoom] = chatSnap.val();
            }
        }
    }
    multi['presence/' + oldUsername] = null;
    multi['presence/' + newUsername] = false;

    const incoming = await db.ref('friendRequests/' + oldUsername).once('value');
    if (incoming.exists()) multi['friendRequests/' + newUsername] = incoming.val();
    multi['friendRequests/' + oldUsername] = null;
    // Outgoing request records are migrated where the old username appears as a request key.
    const requestsSnap = await db.ref('friendRequests').once('value');
    requestsSnap.forEach(targetSnap => {
        if (targetSnap.child(oldUsername).exists()) {
            const requestValue = targetSnap.child(oldUsername).val() || {};
            requestValue.username = newUsername;
            multi['friendRequests/' + targetSnap.key + '/' + oldUsername] = null;
            multi['friendRequests/' + targetSnap.key + '/' + newUsername] = requestValue;
        }
    });
    await db.ref().update(multi);
}

async function changePasswordFromSettings() {
    if (!authUser || !authUser.email) { showAlert('No authenticated account found.'); return; }
    const currentPass = document.getElementById('settings-current-pass')?.value || '';
    const newPass = document.getElementById('settings-new-pass')?.value || '';
    const confirmPass = document.getElementById('settings-confirm-pass')?.value || '';
    if (!currentPass) { showAlert('Enter your current password.'); return; }
    if (!isStrongPassword(newPass)) { showAlert('New password must be at least 8 characters.'); return; }
    if (newPass !== confirmPass) { showAlert('New passwords do not match.'); return; }
    try {
        const credential = firebase.auth.EmailAuthProvider.credential(authUser.email, currentPass);
        await authUser.reauthenticateWithCredential(credential);
        await authUser.updatePassword(newPass);
        showAlert('Password changed successfully.');
        document.getElementById('settings-current-pass').value = '';
        document.getElementById('settings-new-pass').value = '';
        document.getElementById('settings-confirm-pass').value = '';
    } catch (err) {
        console.error('Change password failed:', err);
        if (err.code === 'auth/wrong-password') showAlert('Current password is incorrect.');
        else if (err.code === 'auth/weak-password') showAlert('New password is too weak.');
        else showAlert('Could not change password: ' + (err.message || err.code || 'Unknown error'));
    }
}

/* V31 premium navigation: hardware/browser back, Escape, and edge-swipe on touch. */
const mpNav = { depth: 0, ignorePop: false, inPop: false, touchX: 0, touchY: 0, tracking: false, view: 'home' };
function mpTopLayer() {
    const sticker=document.getElementById('sticker-tray');
    if (sticker && sticker.classList.contains('show')) return 'sticker-tray';
    const ids = ['media-editor-overlay','media-viewer-modal','delete-message-modal','friend-profile-modal','incoming-call-screen','ai-chat-screen','settings-screen','chat-room'];
    for (const id of ids) { const el=document.getElementById(id); if (el && !el.classList.contains('hidden') && getComputedStyle(el).display !== 'none') return id; }
    return null;
}
function mpPushView(name) {
    try {
        const next = name || 'home';
        // Do not create duplicate history entries when the same screen is opened repeatedly.
        if (mpNav.view === next && mpNav.depth > 0) return;
        mpNav.view = next;
        history.pushState({mp:true, view:mpNav.view}, '', location.href.split('#')[0] + '#'+mpNav.view);
        mpNav.depth++;
    } catch (_) {}
}
function mpCloseTopLayer() {
    const top=mpTopLayer();
    if (!top) return false;
    if (top==='media-editor-overlay' && typeof closeMediaEditor==='function') { closeMediaEditor(); return true; }
    if (top==='media-viewer-modal') { document.getElementById('media-viewer-modal')?.querySelector('.media-viewer-close')?.click(); return true; }
    if (top==='delete-message-modal' && typeof closeDeleteModal==='function') { closeDeleteModal(); return true; }
    if (top==='friend-profile-modal' && typeof closeFriendProfile==='function') { closeFriendProfile(); return true; }
    if (top==='incoming-call-screen') { typeof rejectIncomingCall==='function' ? rejectIncomingCall() : document.getElementById(top).classList.add('hidden'); return true; }
    if (top==='ai-chat-screen' && typeof closeAIChat==='function') { closeAIChat(); return true; }
    if (top==='settings-screen' && typeof closeSettings==='function') { closeSettings(); return true; }
    if (top==='chat-room' && typeof closeChat==='function') { closeChat(); return true; }
    return false;
}
function mpBack() {
    const top = mpTopLayer();
    // Modals/editors are overlays, not navigation pages: close them first.
    if (top && !['chat-room','settings-screen','ai-chat-screen'].includes(top)) {
        mpCloseTopLayer();
        return;
    }
    if (mpNav.depth > 0) { history.back(); return; }
    if (mpCloseTopLayer()) return;
    if (window.parent !== window) return;
}
window.addEventListener('popstate', (event) => {
    const top = mpTopLayer();
    if (top && !['chat-room','settings-screen','ai-chat-screen'].includes(top)) {
        // A browser/Android Back while an overlay is open should close only the overlay,
        // then restore the current page state so the chat/settings screen remains open.
        mpNav.inPop = true;
        mpCloseTopLayer();
        mpNav.inPop = false;
        const base = location.href.split('#')[0];
        const view = mpNav.view || (event.state && event.state.view) || 'home';
        try { history.pushState({mp:true, view}, '', base + (view === 'home' ? '' : '#'+view)); } catch (_) {}
        return;
    }
    if (mpNav.depth > 0) mpNav.depth--;
    mpNav.inPop = true;
    if (event.state && event.state.view) mpNav.view = event.state.view;
    mpCloseTopLayer();
    mpNav.inPop = false;
});
window.addEventListener('keydown', e => {
    if (e.key === 'Escape') { if (mpCloseTopLayer()) { e.preventDefault(); } }
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); mpBack(); }
});
window.addEventListener('touchstart', e => {
    const t=e.touches[0]; mpNav.touchX=t.clientX; mpNav.touchY=t.clientY;
    mpNav.tracking=t.clientX < 28 && !e.target.closest('input,textarea,button,video,[contenteditable="true"]');
}, {passive:true});
window.addEventListener('touchend', e => {
    if (!mpNav.tracking) return; mpNav.tracking=false;
    const t=e.changedTouches[0], dx=t.clientX-mpNav.touchX, dy=Math.abs(t.clientY-mpNav.touchY);
    if (dx > 78 && dy < 70) mpBack();
}, {passive:true});
try { mpNav.view='home'; history.replaceState({mp:true,view:'home'}, '', location.href.split('#')[0]); } catch (_) {}

function closeSettings() {
    document.getElementById('settings-screen').classList.add('hidden');
    if (!mpNav.inPop && mpNav.depth > 0) { mpNav.depth--; try { mpNav.view='home'; history.replaceState({mp:true,view:'home'}, '', location.href.split('#')[0]); } catch (_) {} }
    if (document.getElementById('chat-room')?.classList.contains('hidden') && document.getElementById('ai-chat-screen')?.classList.contains('hidden')) setAIFabVisible(true);
}


async function openChat(friend) {
    activeFriend = friend;
    mpPushView('chat');
    try {
        const [mineSnap, theirsSnap] = await Promise.all([
            db.ref(`blocked/${currentUser.username}/${friend.username}`).once('value'),
            db.ref(`blocked/${friend.username}/${currentUser.username}`).once('value')
        ]);
        blockedProfileState = { mine: mineSnap.val() === true, theirs: theirsSnap.val() === true };
        if (blockedProfileState.mine || blockedProfileState.theirs) {
            openFriendProfile();
            return;
        }
    } catch (_) {}

    setAIFabVisible(false);
    document.getElementById('chat-room').classList.remove('hidden');
    friend.friendNickname = await loadFriendNickname(friend.username);
    document.getElementById('room-user-name').innerText = friend.friendNickname || friend.name || friend.username;
    document.getElementById('room-user-id').innerText = `@${friend.username}`;

    const av = document.getElementById('room-user-avatar');
    if(friend.profilePic && friend.profilePic.trim() !== '') {
        av.innerHTML = `<img src="${escapeHtml(friend.profilePic)}" style="width:100%; height:100%; object-fit:cover;">`;
    } else {
        av.innerHTML = '';
        av.innerText = (friend.name || 'U')[0].toUpperCase();
    }

    if (window._roomPresenceRef) window._roomPresenceRef.off();
    if (window._roomPresenceMetaRef) window._roomPresenceMetaRef.off();
    let friendOnline = false;
    let friendLastSeen = 0;
    let hasPresenceMeta = false;
    const renderRoomPresence = () => {
        const isOnline = hasPresenceMeta ? friendOnline === true : friendOnline === true;
        document.getElementById('room-online-dot').classList.toggle('active', isOnline);
        document.getElementById('room-status-text').innerText = isOnline ? 'Active Now' : 'Offline';
    };
    window._roomPresenceRef = db.ref(`presence/${friend.username}`);
    window._roomPresenceRef.on('value', snap => {
        friendOnline = snap.val() === true;
        renderRoomPresence();
    });
    window._roomPresenceMetaRef = db.ref(`presenceMeta/${friend.username}`);
    window._roomPresenceMetaRef.on('value', snap => {
        const meta = snap.val();
        hasPresenceMeta = snap.exists();
        friendLastSeen = Number((meta && meta.lastSeen) || 0);
        friendOnline = meta && meta.online === true;
        renderRoomPresence();
    });

    loadMessages();
    loadTypingStatus();
}


async function changeFriendNickname() {
    if (!currentUser || !activeFriend || !activeFriend.username) return;
    const ref = db.ref(`friendNicknames/${currentUser.username}/${activeFriend.username}`);
    let current = '';
    try {
        const snap = await ref.once('value');
        current = String(snap.val() || '');
    } catch (_) {}
    const nickname = await openPremiumDialog({
        title: `Change Nickname`,
        message: `Enter a nickname for @${activeFriend.username}. Leave empty to remove the nickname.`,
        icon: 'fa-pen', mode: 'input', defaultValue: current, placeholder: 'Enter nickname…',
        confirmText: 'Save', maxLength: 40
    });
    if (nickname === null) return;
    const clean = String(nickname || '').trim().slice(0, 40);
    try {
        if (clean) await ref.set(clean);
        else await ref.remove();
        activeFriend.friendNickname = clean || null;
        applyFriendNicknameToOpenChat();
        showAlert(clean ? `Nickname changed to "${clean}".` : 'Nickname removed.');
        if (typeof window.refreshFriendNicknames === 'function') window.refreshFriendNicknames();
    } catch (e) {
        console.error('Nickname update failed:', e);
        showAlert('Could not change nickname.');
    }
}

function applyFriendNicknameToOpenChat() {
    if (!activeFriend) return;
    const title = document.getElementById('room-user-name');
    if (title) title.innerText = activeFriend.friendNickname || activeFriend.name || activeFriend.username;
}

async function loadFriendNickname(username) {
    if (!currentUser || !username) return '';
    try {
        const snap = await db.ref(`friendNicknames/${currentUser.username}/${username}`).once('value');
        return String(snap.val() || '');
    } catch (_) { return ''; }
}

async function openFriendProfile() {
    if (!activeFriend) return;
    mpPushView('friend-profile');
    const modal = document.getElementById('friend-profile-modal');
    const avatar = document.getElementById('friend-profile-avatar');
    const name = document.getElementById('friend-profile-name');
    const username = document.getElementById('friend-profile-username');
    const status = document.getElementById('friend-profile-status');
    const blockBtn = document.getElementById('friend-block-btn');
    if (!modal) return;
    name.textContent = activeFriend.name || activeFriend.username;
    username.textContent = `@${activeFriend.username}`;
    avatar.innerHTML = activeFriend.profilePic ? `<img src="${escapeHtml(activeFriend.profilePic)}" alt="">` : escapeHtml((activeFriend.name || 'U')[0].toUpperCase());
    try {
        const [mineSnap, theirsSnap] = await Promise.all([
            db.ref(`blocked/${currentUser.username}/${activeFriend.username}`).once('value'),
            db.ref(`blocked/${activeFriend.username}/${currentUser.username}`).once('value')
        ]);
        blockedProfileState = { mine: mineSnap.val() === true, theirs: theirsSnap.val() === true };
    } catch (_) {}
    if (blockedProfileState.mine) { status.textContent = 'You blocked this friend'; blockBtn.innerHTML = '<i class="fa-solid fa-unlock"></i> Unblock'; blockBtn.classList.remove('danger'); }
    else if (blockedProfileState.theirs) { status.textContent = 'This user has blocked you'; blockBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Block'; blockBtn.classList.add('danger'); }
    else { status.textContent = 'Friend'; blockBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Block'; blockBtn.classList.add('danger'); }
    modal.classList.remove('hidden');
}

function closeFriendProfile() {
    const m=document.getElementById('friend-profile-modal');
    if(m) m.classList.add('hidden');
}

async function toggleBlockFriend() {
    if (!activeFriend || !currentUser) return;
    const path = `blocked/${currentUser.username}/${activeFriend.username}`;
    const isBlocked = blockedProfileState.mine === true;
    try {
        await db.ref(path).set(!isBlocked);
        blockedProfileState.mine = !isBlocked;
        if (isBlocked) showAlert(`@${activeFriend.username} has been unblocked.`);
        else {
            showAlert(`@${activeFriend.username} has been blocked.`);
            closeFriendProfile();
            if (!document.getElementById('chat-room').classList.contains('hidden')) closeChat();
        }
        if (!isBlocked) {
            const row = document.querySelector(`.chat-item[data-username="${CSS.escape(activeFriend.username)}"]`);
            if (row) row.classList.add('blocked-row');
        }
    } catch (e) { showAlert('Could not update block status.'); }
}

async function deleteFriend() {
    if (!activeFriend || !currentUser) return;
    const ok = await openPremiumDialog({title:'Delete Friend',message:`Are you sure you want to delete @${activeFriend.username} from your friends? You will no longer see them in your friends list.`,icon:'fa-user-minus',mode:'confirm',confirmText:'Delete Friend',danger:true});
    if (!ok) return;
    try {
        const updates = {};
        updates[`friends/${currentUser.username}/${activeFriend.username}`] = null;
        updates[`friends/${activeFriend.username}/${currentUser.username}`] = null;
        await db.ref().update(updates);
        closeFriendProfile();
        closeChat();
        showAlert('Friend deleted.');
    } catch (e) { showAlert('Could not delete friend.'); }
}

function closeChat() {
    if (messageLiveQuery && messageChildListener) messageLiveQuery.off('child_added', messageChildListener);
    if (messageLiveQuery && messageChangedListener) messageLiveQuery.off('child_changed', messageChangedListener);
    messageLiveQuery = null; messageChildListener = null; messageChangedListener = null;
    messageKeys = new Set();
    if(activeFriend) {
        const roomId = getRoomId(currentUser.username, activeFriend.username);
        db.ref(`typing/${roomId}/${currentUser.username}`).remove();
    }
    document.getElementById('chat-room').classList.add('hidden');
    if (!mpNav.inPop && mpNav.depth > 0) { mpNav.depth--; try { mpNav.view='home'; history.replaceState({mp:true,view:'home'}, '', location.href.split('#')[0]); } catch (_) {} }
    if (document.getElementById('settings-screen')?.classList.contains('hidden') && document.getElementById('ai-chat-screen')?.classList.contains('hidden')) setAIFabVisible(true);
    activeFriend = null;
    cancelReply();
    hideActionMenu();
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>'"]/g, ch => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;'
    }[ch]));
}

function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB'];
    let n = bytes / 1024;
    let i = 0;
    while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
    return `${n.toFixed(n >= 10 ? 1 : 2)} ${units[i]}`;
}

function setMediaUploadProgress(percent, loaded, total, label = 'Uploading media…') {
    const wrap = document.getElementById('media-upload-progress');
    const bar = document.getElementById('media-upload-progress-bar');
    const text = document.getElementById('media-upload-progress-text');
    if (!wrap || !bar || !text) return;
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    wrap.classList.remove('hidden');
    bar.style.width = `${p}%`;
    text.textContent = `${label} ${p}% • ${formatBytes(loaded)} / ${formatBytes(total)}`;
}

function hideMediaUploadProgress() {
    const wrap = document.getElementById('media-upload-progress');
    if (wrap) wrap.classList.add('hidden');
}

function refreshRenderedMessage(mKey, m) {
    const row = document.querySelector(`.msg-row[data-message-key="${CSS.escape(mKey)}"]`);
    if (!row) return false;
    // Re-render the message row in place so reactions/status/media changes appear instantly.
    const box = document.getElementById('room-messages');
    const wasNearBottom = box ? (box.scrollHeight - box.scrollTop - box.clientHeight < 160) : false;
    const old = row;
    const oldNextSibling = old.nextElementSibling;
    // Temporarily remove the key from the set so renderMessageRow can rebuild it.
    // Re-insert the rebuilt row at the exact same DOM position so a reaction,
    // edit, or read-status update never moves the message to the bottom.
    messageKeys.delete(mKey);
    renderMessageRow(mKey, m, false);
    const rows = box ? Array.from(box.querySelectorAll(`.msg-row[data-message-key="${CSS.escape(mKey)}"]`)) : [];
    const replacement = rows.length ? rows[rows.length - 1] : null;
    if (replacement && old !== replacement) {
        if (oldNextSibling && oldNextSibling.parentNode === box) oldNextSibling.before(replacement);
        else if (old.parentNode === box) old.parentNode.appendChild(replacement);
        old.remove();
    }
    if (wasNearBottom && box) box.scrollTop = box.scrollHeight;
    return true;
}

function openMediaViewer(url, type, fileName = 'media') {
    if (!url) return;
    const old = document.getElementById('media-viewer-modal');
    if (old) old.remove();
    const modal = document.createElement('div');
    modal.id = 'media-viewer-modal';
    modal.className = 'media-viewer-modal';
    modal.innerHTML = `<div class="media-viewer-backdrop" data-close-media-viewer="1"></div><div class="media-viewer-card"><button class="media-viewer-close" type="button" title="Close"><i class="fa-solid fa-xmark"></i></button>${type === 'video' ? `<video controls autoplay playsinline src="${escapeHtml(url)}"></video>` : `<img src="${escapeHtml(url)}" alt="${escapeHtml(fileName)}">`}<div class="media-viewer-bottom"><span>${escapeHtml(fileName)}</span><button type="button" class="media-action-btn media-viewer-download"><i class="fa-solid fa-download"></i><span>Download</span></button></div></div>`;
    document.body.appendChild(modal);
    const close = () => { const v = modal.querySelector('video'); if (v) v.pause(); modal.remove(); };
    modal.querySelector('.media-viewer-close').onclick = close;
    modal.querySelector('[data-close-media-viewer]').onclick = close;
    modal.querySelector('.media-viewer-download').onclick = () => downloadMediaFile(url, fileName);
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape' && document.getElementById('media-viewer-modal') === modal) { document.removeEventListener('keydown', esc); close(); } });
}

function downloadMediaFile(url, fileName = 'media') {
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = fileName || 'media'; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
}

function renderMessageRow(mKey, m, prepend = false) {
    const box = document.getElementById('room-messages');
    if (!box || messageKeys.has(mKey)) return false;
    // Older versions wrote call history with push() from both participants, which
    // created duplicate call cards. Hide legacy duplicates by callId as a safety net.
    if (m && m.type === 'call' && m.callId) {
        if (renderedCallHistoryIds.has(String(m.callId))) return false;
        renderedCallHistoryIds.add(String(m.callId));
    }
    messageKeys.add(mKey);

    const isSent = m.sender === currentUser.username;
    const deletedForMe = !!(m.deletedFor && m.deletedFor[currentUser.username]);
    const deletedForEveryone = !!m.deletedForEveryone || m.type === 'deleted';
    const senderPic = isSent ? currentUser.profilePic : activeFriend.profilePic;
    const senderName = isSent ? currentUser.name : activeFriend.name;
    const avatarHtml = (senderPic && senderPic.trim() !== '')
        ? `<div class="msg-avatar"><img src="${escapeHtml(senderPic)}" alt=""></div>`
        : `<div class="msg-avatar">${escapeHtml((senderName || 'U').charAt(0).toUpperCase())}</div>`;

    let contentHtml = '';
    if (deletedForMe) {
        contentHtml = `<div class="deleted-message"><i class="fa-solid fa-eye-slash"></i><span>You deleted this message</span></div>`;
    } else if (deletedForEveryone) {
        contentHtml = `<div class="deleted-message"><i class="fa-solid fa-ban"></i><span>This message was deleted</span></div>`;
    } else {
        if (m.replyTo) {
            contentHtml += `<div class="quoted-msg-box"><span style="font-weight:bold;">${escapeHtml(m.replyTo.senderName)}</span><br>${escapeHtml(m.replyTo.text)}</div>`;
        }

        if (m.type === 'call') {
            const icon = m.callType === 'video' ? 'fa-video' : 'fa-phone';
            const label = m.status === 'missed' ? 'Missed call' : m.status === 'rejected' ? 'Declined call' : m.status === 'cancelled' ? 'Cancelled call' : 'Call';
            const duration = m.duration ? ` • ${escapeHtml(m.duration)}` : '';
            contentHtml += `<div class="call-history-message" role="button" tabindex="0" title="Call back" data-call-back="1"><i class="fa-solid ${icon}"></i><div><strong>${label}</strong><div>${m.callType === 'video' ? 'Video call' : 'Audio call'}${duration}</div></div></div>`;
        } else if (m.type === 'image') {
            const sizeText = m.size ? `<div class="media-size-label">${formatBytes(Number(m.size))}</div>` : '';
            const mediaUrl = escapeHtml(m.url || '');
            const fileName = escapeHtml(m.fileName || 'photo.jpg');
            contentHtml += `<div class="media-message"><img src="${mediaUrl}" alt="Photo" loading="lazy"><div class="media-actions"><button type="button" class="media-action-btn" data-media-action="view" title="View photo"><i class="fa-solid fa-expand"></i><span>View</span></button><button type="button" class="media-action-btn" data-media-action="download" title="Download photo"><i class="fa-solid fa-download"></i><span>Download</span></button></div>${sizeText}<div class="media-filename" title="${fileName}">${fileName}</div></div>`;
        } else if (m.type === 'video') {
            const sizeText = m.size ? `<div class="media-size-label">${formatBytes(Number(m.size))}</div>` : '';
            const mediaUrl = escapeHtml(m.url || '');
            const fileName = escapeHtml(m.fileName || 'video.mp4');
            contentHtml += `<div class="media-message"><video controls preload="metadata" playsinline src="${mediaUrl}"></video><div class="media-actions"><button type="button" class="media-action-btn" data-media-action="view" title="Open video"><i class="fa-solid fa-up-right-from-square"></i><span>View</span></button><button type="button" class="media-action-btn" data-media-action="download" title="Download video"><i class="fa-solid fa-download"></i><span>Download</span></button></div>${sizeText}<div class="media-filename" title="${fileName}">${fileName}</div></div>`;
        } else if (m.type === 'sticker') {
            contentHtml += `<div class="sticker-message" aria-label="Sticker">${escapeHtml(m.sticker || '🙂')}</div>`;
        } else if (m.type === 'audio') {
            contentHtml += `<div class="voice-message"><div class="voice-bars" aria-hidden="true">${'<span></span>'.repeat(18)}</div><audio class="voice-message-player" controls preload="metadata" src="${escapeHtml(m.url)}"></audio></div>`;
        } else if (m.type === 'file') {
            const fname=escapeHtml(m.fileName||'File'); const size=m.size?formatBytes(Number(m.size)):'';
            contentHtml += `<div class="file-message"><i class="fa-solid fa-file"></i><div class="file-message-info"><strong title="${fname}">${fname}</strong><small>${escapeHtml(size)}</small></div><a class="file-download-btn" href="${escapeHtml(m.url||'')}" download="${fname}" target="_blank" rel="noopener"><i class="fa-solid fa-download"></i></a></div>`;
        } else if (m.type === 'location' || m.type === 'liveLocation') {
            const active=m.type==='liveLocation' && m.active===true; const hasCoords=typeof m.lat==='number'&&typeof m.lng==='number';
            contentHtml += `<div class="location-message"><div class="location-map-icon"><i class="fa-solid fa-location-dot"></i></div><div><strong>${active?'Live location':'Location'}</strong><small>${hasCoords?`${Number(m.lat).toFixed(5)}, ${Number(m.lng).toFixed(5)}`:'Waiting for location…'}</small></div>${hasCoords?`<button type="button" class="location-open-btn" onclick="openMapLocation(${Number(m.lat)},${Number(m.lng)})">View Map</button>`:''}${active&&isSent?`<button type="button" class="location-stop-btn" onclick="stopLiveLocation()">Stop</button>`:''}</div>`;
        } else {
            const safeText = escapeHtml(m.text || '');
            // Turn pasted URLs into real browser links. Trailing chat punctuation is kept outside the link.
            const linked = safeText.replace(/((?:https?:\/\/|www\.)[^\s<]+)/gi, (raw) => {
                const trailing = (raw.match(/[.,!?;:)]}\]]+$/) || [''])[0];
                const core = trailing ? raw.slice(0, -trailing.length) : raw;
                const href = core.toLowerCase().startsWith('www.') ? 'https://' + core : core;
                return `<a class="chat-link-preview" href="${href}" target="_blank" rel="noopener noreferrer" title="Open in browser">${core}</a>${trailing}`;
            });
            contentHtml += linked;
        }
    }

    const reactionHtml = (!deletedForMe && !deletedForEveryone && m.reaction) ? `<div class="msg-reaction-badge">${escapeHtml(m.reaction)}</div>` : '';
    const rowDiv = document.createElement('div');
    rowDiv.className = 'msg-row ' + (isSent ? 'sent' : 'received');
    try { if (isPinnedMessage(getRoomId(currentUser.username, activeFriend.username), mKey)) rowDiv.classList.add('is-pinned'); } catch(_) {}
    rowDiv.dataset.messageKey = mKey;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg ' + (isSent ? 'sent' : 'received');
    msgDiv.innerHTML = (m.forwarded ? '<div class="forwarded-label"><i class="fa-solid fa-share"></i> Forwarded</div>' : '') + contentHtml + (m.edited ? '<span class="edited-label">edited</span>' : '') + reactionHtml;
    msgDiv.querySelectorAll('[data-media-action]').forEach(btn => {
        btn.onclick = e => {
            e.stopPropagation();
            const action = btn.dataset.mediaAction;
            if (action === 'download') downloadMediaFile(m.url, m.fileName || (m.type === 'video' ? 'video.mp4' : 'photo.jpg'));
            else if (action === 'view') openMediaViewer(m.url, m.type, m.fileName || (m.type === 'video' ? 'video.mp4' : 'photo.jpg'));
        };
    });
    if (isSent && m.type !== 'call' && !deletedForMe && !deletedForEveryone) {
        const status = document.createElement('div');
        status.className = 'message-status';
        const read = m.readBy && activeFriend && m.readBy[activeFriend.username];
        status.innerHTML = read ? '<span class="status-check read">✓✓</span><span class="message-seen-label">Seen</span>' : '<span class="status-check">✓</span><span class="message-seen-label sent-label">Sent</span>';
        status.title = read ? 'Seen by recipient' : 'Sent';
        msgDiv.appendChild(status);
    }
    // Message actions open only after a deliberate long-press/hold.
    // A normal tap/click should never open the action menu.
    let holdTimer = null;
    let holdStartX = 0, holdStartY = 0, holdTriggered = false;
    const clearMessageHold = () => {
        if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    };
    const canLongPress = target => {
        if (!target || !target.closest) return true;
        return !target.closest('button,a,input,textarea,video,audio,[data-media-action],.voice-message-player');
    };
    msgDiv.addEventListener('pointerdown', e => {
        if (deletedForMe || deletedForEveryone || !canLongPress(e.target)) return;
        // Ignore secondary mouse buttons; long-press is for primary/touch input.
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        clearMessageHold();
        holdTriggered = false;
        holdStartX = e.clientX; holdStartY = e.clientY;
        holdTimer = setTimeout(() => {
            holdTimer = null;
            holdTriggered = true;
            try { navigator.vibrate?.(18); } catch (_) {}
            showActionMenu({clientX: holdStartX, clientY: holdStartY}, mKey, m, isSent);
        }, 550);
    });
    msgDiv.addEventListener('pointermove', e => {
        if (!holdTimer) return;
        if (Math.hypot(e.clientX - holdStartX, e.clientY - holdStartY) > 12) clearMessageHold();
    });
    msgDiv.addEventListener('pointerup', clearMessageHold);
    msgDiv.addEventListener('pointercancel', clearMessageHold);
    msgDiv.addEventListener('pointerleave', e => {
        if (e.pointerType === 'mouse') clearMessageHold();
    });
    msgDiv.addEventListener('click', e => {
        // Keep normal taps completely passive.
        if (holdTriggered) { e.preventDefault(); e.stopPropagation(); holdTriggered = false; }
    });

    // Tap a call-history bubble to call back immediately. Holding it still
    // uses the message action menu and must not start a call accidentally.
    const callBackCard = msgDiv.querySelector('[data-call-back="1"]');
    if (callBackCard) {
        const callback = e => {
            e.preventDefault();
            e.stopPropagation();
            if (holdTriggered) { holdTriggered = false; return; }
            if (m.callType === 'video') startVideoCall();
            else startAudioCall();
        };
        callBackCard.addEventListener('click', callback);
        callBackCard.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') callback(e);
        });
    }

    const wrapper = document.createElement('div');
    wrapper.className = 'msg-content-wrapper';
    wrapper.appendChild(msgDiv);
    rowDiv.innerHTML = avatarHtml;
    rowDiv.appendChild(wrapper);
    initSwipeReply(rowDiv,mKey,m,isSent);

    const firstRow = box.querySelector('.msg-row');
    if (prepend && firstRow) box.insertBefore(rowDiv, firstRow);
    else box.appendChild(rowDiv);
    const voice = rowDiv.querySelector('.voice-message-player');
    if (voice) {
        const wrap = rowDiv.querySelector('.voice-message');
        voice.addEventListener('play', () => wrap && wrap.classList.add('is-playing'));
        voice.addEventListener('pause', () => wrap && wrap.classList.remove('is-playing'));
        voice.addEventListener('ended', () => wrap && wrap.classList.remove('is-playing'));
    }
    return true;
}

function chatCacheKey(roomId){ return `messenger_chat_cache_${currentUser.username}_${roomId}`; }
function saveChatCache(roomId, rows){
    try { localStorage.setItem(chatCacheKey(roomId), JSON.stringify(rows.slice(-MESSAGE_PAGE_SIZE))); } catch (_) {}
}
function renderCachedChat(roomId, box, loadingEl){
    try {
        const raw=localStorage.getItem(chatCacheKey(roomId)); if(!raw) return false;
        const rows=JSON.parse(raw); if(!Array.isArray(rows)||!rows.length) return false;
        rows.forEach(item=>renderMessageRow(item.key,item.val));
        loadingEl.style.display='none'; box.scrollTop=box.scrollHeight; return true;
    } catch (_) { return false; }
}

async function loadMessages() {
    const box = document.getElementById('room-messages');
    const loadingEl = document.getElementById('chat-loading');
    const olderBtn = document.getElementById('load-older-messages');
    if (!box || !activeFriend) return;

    if (messageLiveQuery && messageChildListener) messageLiveQuery.off('child_added', messageChildListener);
    if (messageLiveQuery && messageChangedListener) messageLiveQuery.off('child_changed', messageChangedListener);
    messageChangedListener = null;
    messageRoomRef = null;
    messageLiveQuery = null;
    messageChildListener = null;
    messageKeys = new Set();
    renderedCallHistoryIds = new Set();
    oldestMessageKey = null;
    messageHasMore = false;

    // Never blank the chat while we wait for Firebase. Restore the cached history first,
    // then refresh it silently in the background. The old behaviour showed a spinner on
    // every open and made users wait even when the same chat had already been loaded.
    box.querySelectorAll('.msg-row').forEach(row => row.remove());
    if (olderBtn) olderBtn.classList.add('hidden');
    loadingEl.style.display = 'none';

    const roomId = getRoomId(currentUser.username, activeFriend.username);
    await ensureChatMembership(activeFriend).catch(e => console.warn('Chat membership bootstrap failed:', e));
    const hadCache = renderCachedChat(roomId, box, loadingEl);
    const roomRef = db.ref('chats/' + roomId);
    const initialQuery = roomRef.limitToLast(MESSAGE_PAGE_SIZE);

    // Show the spinner only after a long 10-second timeout. With 30-message pages
    // and local cache, normal chat opens should never flash a loading screen.
    let slowLoadTimer = null;
    if (!hadCache) {
        slowLoadTimer = setTimeout(() => {
            if (!messageKeys.size) {
                loadingEl.style.display = 'block';
                loadingEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="font-size:22px"></i><br><span style="font-size:12px">Loading latest messages…</span>';
            }
        }, 10000);
    }
    messageRoomRef = roomRef;
    messageLiveQuery = initialQuery;

    // Attach the live listener BEFORE waiting for the full snapshot. Existing messages
    // arrive through child_added immediately, so the user sees the chat progressively.
    messageChildListener = snap => {
        if (!messageKeys.has(snap.key)) {
            const wasNearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 140;
            renderMessageRow(snap.key, snap.val());
            if (snap.val() && snap.val().sender !== currentUser.username && activeFriend) {
                db.ref(`chats/${roomId}/${snap.key}/readBy/${currentUser.username}`).set(true).catch(()=>{});
            }
            try {
                const raw=localStorage.getItem(chatCacheKey(roomId)); const arr=raw?JSON.parse(raw):[];
                const idx=arr.findIndex(x=>x.key===snap.key); if(idx>=0) arr[idx]={key:snap.key,val:snap.val()}; else arr.push({key:snap.key,val:snap.val()});
                saveChatCache(roomId, arr);
            } catch (_) {}
            loadingEl.style.display = 'none';
            if (wasNearBottom || messageKeys.size <= 2) box.scrollTop = box.scrollHeight;
        }
    };
    initialQuery.on('child_added', messageChildListener);

    // Reactions, read states and other message updates must appear live without reopening the chat.
    messageChangedListener = snap => {
        const updated = snap.val();
        if (!updated) return;
        if (messageKeys.has(snap.key)) {
            const row = document.querySelector(`.msg-row[data-message-key="${CSS.escape(snap.key)}"]`);
            if (row) {
                // A reaction is a tiny in-place UI change. Do NOT rebuild/append the
                // whole message row: doing so moves the message to the bottom of the
                // chat. This was the cause of reactions jumping messages around.
                const msg = row.querySelector('.msg');
                if (msg && Object.prototype.hasOwnProperty.call(updated, 'reaction')) {
                    const oldBadge = msg.querySelector('.msg-reaction-badge');
                    const reaction = updated.reaction;
                    if (reaction && !updated.deletedForMe && !updated.deletedForEveryone && updated.type !== 'deleted') {
                        if (oldBadge) oldBadge.textContent = String(reaction);
                        else {
                            const badge = document.createElement('div');
                            badge.className = 'msg-reaction-badge';
                            badge.textContent = String(reaction);
                            msg.appendChild(badge);
                        }
                    } else if (oldBadge) {
                        oldBadge.remove();
                    }
                    try {
                        const raw=localStorage.getItem(chatCacheKey(roomId)); const arr=raw?JSON.parse(raw):[];
                        const idx=arr.findIndex(x=>x.key===snap.key); if(idx>=0){arr[idx]={key:snap.key,val:updated}; saveChatCache(roomId,arr);}
                    } catch (_) {}
                    return;
                }

                // For other message updates, rebuild in the EXACT original DOM position
                // instead of letting renderMessageRow append the replacement to bottom.
                const previous = row;
                const nextSibling = previous.nextElementSibling;
                const oldRect = previous.getBoundingClientRect();
                const oldHeight = previous.offsetHeight;
                const beforeScrollTop = box.scrollTop;
                messageKeys.delete(snap.key);
                renderMessageRow(snap.key, updated, false);
                const candidates = Array.from(box.querySelectorAll(`.msg-row[data-message-key="${CSS.escape(snap.key)}"]`));
                const replacement = candidates[candidates.length - 1];
                if (replacement && replacement !== previous) {
                    if (nextSibling && nextSibling.parentNode === box) nextSibling.before(replacement);
                    previous.remove();
                    // Preserve the user's viewport. If the changed row was above the
                    // viewport, compensate only for its height change. Otherwise keep
                    // the existing scrollTop exactly where it was.
                    const boxRect = box.getBoundingClientRect();
                    if (oldRect.bottom < boxRect.top) {
                        box.scrollTop = beforeScrollTop + (replacement.offsetHeight - oldHeight);
                    } else {
                        box.scrollTop = beforeScrollTop;
                    }
                }
            }
            try {
                const raw=localStorage.getItem(chatCacheKey(roomId)); const arr=raw?JSON.parse(raw):[];
                const idx=arr.findIndex(x=>x.key===snap.key); if(idx>=0){arr[idx]={key:snap.key,val:updated}; saveChatCache(roomId,arr);}
            } catch (_) {}
        }
    };
    initialQuery.on('child_changed', messageChangedListener);

    try {
        const snapshot = await initialQuery.once('value');
        const rows = [];
        snapshot.forEach(snap => rows.push({ key: snap.key, val: snap.val() }));
        oldestMessageKey = rows.length ? rows[0].key : null;
        messageHasMore = rows.length === MESSAGE_PAGE_SIZE;
        if (rows.length) {
            // Merge the Firebase page with any locally cached rows, deduped by message key.
            // This prevents a just-sent message from disappearing during a fast leave/re-enter.
            try {
                const raw = localStorage.getItem(chatCacheKey(roomId));
                const cachedRows = raw ? JSON.parse(raw) : [];
                const merged = new Map();
                cachedRows.forEach(x => { if (x && x.key) merged.set(x.key, x); });
                rows.forEach(x => merged.set(x.key, x));
                saveChatCache(roomId, Array.from(merged.values()).sort((a,b) => Number(a.val?.time||0)-Number(b.val?.time||0)));
            } catch (_) { saveChatCache(roomId, rows); }
        }
        if (olderBtn) olderBtn.classList.toggle('hidden', !messageHasMore);
        if (slowLoadTimer) clearTimeout(slowLoadTimer);
        loadingEl.style.display = 'none';
        if (!rows.length) box.scrollTop = box.scrollHeight;
    } catch (err) {
        if (slowLoadTimer) clearTimeout(slowLoadTimer);
        console.error('Message history load failed:', err);
        initialQuery.off('child_added', messageChildListener);
        if (messageChangedListener) initialQuery.off('child_changed', messageChangedListener);
        messageChangedListener = null;
        messageLiveQuery = null;
        loadingEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i><br><span>Could not load messages. Please try again.</span>';
    }
}

async function loadOlderMessages() {
    if (!messageRoomRef || !oldestMessageKey || messagePageLoading) return;
    messagePageLoading = true;
    const btn = document.getElementById('load-older-messages');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading older…';
    }

    const box = document.getElementById('room-messages');
    const previousHeight = box.scrollHeight;
    const previousTop = box.scrollTop;

    try {
        const snapshot = await messageRoomRef.endAt(oldestMessageKey).limitToLast(MESSAGE_PAGE_SIZE + 1).once('value');
        const rows = [];
        snapshot.forEach(snap => rows.push({ key: snap.key, val: snap.val() }));
        const olderRows = rows.filter(item => item.key !== oldestMessageKey);
        olderRows.forEach(item => renderMessageRow(item.key, item.val, true));
        if (olderRows.length) oldestMessageKey = olderRows[0].key;
        messageHasMore = olderRows.length >= MESSAGE_PAGE_SIZE;
        if (btn) btn.classList.toggle('hidden', !messageHasMore);
        box.scrollTop = box.scrollHeight - previousHeight + previousTop;
    } catch (err) {
        console.error('Older message load failed:', err);
        showAlert('Could not load older messages. Please try again.');
    } finally {
        messagePageLoading = false;
        if (btn && messageHasMore) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-chevron-up"></i> Load older messages';
        }
    }
}


function localKey(name){ return `mpbd_${name}_${currentUser?.username || 'guest'}`; }
function saveLocalSetting(name,value){ localStorage.setItem(`mpbd_${name}`, String(value)); if(name==='online' && typeof setupPresenceSystem==='function'){} }
function requestBrowserNotifications(){ if ('Notification' in window && Notification.permission==='default') Notification.requestPermission().catch(()=>{}); }
function setTheme(theme){ localStorage.setItem('mpbd_theme',theme); applySavedAppearance(); }
function setAccent(accent){ localStorage.setItem('mpbd_accent',accent); applySavedAppearance(); }
function applySavedAppearance(){
    const theme=localStorage.getItem('mpbd_theme')||'dark', accent=localStorage.getItem('mpbd_accent')||'#0084ff';
    document.documentElement.dataset.theme=theme; document.documentElement.style.setProperty('--mp-accent',accent);
}
function toggleChatSearch(){
    const bar=document.getElementById('chat-search-bar'); if(!bar)return;
    const opening=bar.classList.contains('hidden'); bar.classList.toggle('hidden',!opening);
    if(opening){ const i=document.getElementById('chat-search-input'); i?.focus(); } else { const i=document.getElementById('chat-search-input'); if(i)i.value=''; searchInChat(); }
}
function searchInChat(){
    const q=(document.getElementById('chat-search-input')?.value||'').trim().toLowerCase();
    document.querySelectorAll('#room-messages .msg-row').forEach(r=>{
        if(!q){r.style.display=''; return;} r.style.display=(r.innerText||'').toLowerCase().includes(q)?'':'none';
    });
}
function selectedMessageObject(){
    if(!selectedMessageKey||!activeFriend||!currentUser)return null;
    const roomId=getRoomId(currentUser.username,activeFriend.username); return {roomId,key:selectedMessageKey};
}
async function copySelectedMessage(){
    const s=selectedMessageObject(); if(!s)return; hideActionMenu();
    try{ const snap=await db.ref(`chats/${s.roomId}/${s.key}`).once('value'); const m=snap.val()||{}; const text=m.text|| (m.type==='image'?'[Photo]':m.type==='video'?'[Video]':m.type==='audio'?'[Voice Note]':'[Message]'); await navigator.clipboard.writeText(text); showAlert('Message copied.'); }catch(_){showAlert('Could not copy this message.');} finally{selectedMessageKey=null;}
}
async function saveSelectedMessage(){
    const s=selectedMessageObject(); if(!s)return; hideActionMenu();
    try{const snap=await db.ref(`chats/${s.roomId}/${s.key}`).once('value'); const m=snap.val(); if(!m)return; const key=localKey('saved'); const arr=JSON.parse(localStorage.getItem(key)||'[]').filter(x=>x.key!==s.key); arr.unshift({key:s.key,roomId:s.roomId,message:m,savedAt:Date.now()}); localStorage.setItem(key,JSON.stringify(arr.slice(0,100))); showAlert('Message saved.'); updateSavedCount();}catch(_){showAlert('Could not save message.');} finally{selectedMessageKey=null;}
}
async function pinSelectedMessage(){
    const s=selectedMessageObject(); if(!s)return; hideActionMenu();
    const key=localKey('pinned'); const arr=JSON.parse(localStorage.getItem(key)||'[]'); const exists=arr.find(x=>x.roomId===s.roomId&&x.key===s.key);
    if(exists){localStorage.setItem(key,JSON.stringify(arr.filter(x=>!(x.roomId===s.roomId&&x.key===s.key)))); showAlert('Message unpinned.');}
    else {arr.unshift({roomId:s.roomId,key:s.key});localStorage.setItem(key,JSON.stringify(arr.slice(0,50)));showAlert('Message pinned.');}
    document.querySelector(`[data-message-key="${CSS.escape(s.key)}"]`)?.classList.toggle('is-pinned',!exists); selectedMessageKey=null;
}
function isPinnedMessage(roomId,key){try{return JSON.parse(localStorage.getItem(localKey('pinned'))||'[]').some(x=>x.roomId===roomId&&x.key===key);}catch(_){return false;}}
function updateSavedCount(){const el=document.getElementById('saved-count-badge');if(!el)return;try{el.textContent=JSON.parse(localStorage.getItem(localKey('saved'))||'[]').length;}catch(_){el.textContent='0';}}
function openSavedMessages(){
    const arr=JSON.parse(localStorage.getItem(localKey('saved'))||'[]');
    if(!arr.length){showAlert('No saved messages yet.');return;}
    showAlert(`You have ${arr.length} saved message${arr.length===1?'':'s'}.`);
}
function clearChatCaches(){
    if(!currentUser)return; let count=0; for(let i=localStorage.length-1;i>=0;i--){const k=localStorage.key(i)||'';if(k.startsWith(`messenger_chat_cache_${currentUser.username}_`)){localStorage.removeItem(k);count++;}} showAlert(`${count} local chat cache${count===1?'':'s'} cleared.`);
}
function saveAppearanceControls(){
    const sound=localStorage.getItem('mpbd_sound')!=='false', notify=localStorage.getItem('mpbd_notify')!=='false';
    const a=document.getElementById('setting-sound'), b=document.getElementById('setting-notify'); if(a)a.checked=sound;if(b)b.checked=notify; updateSavedCount();
}

function showActionMenu(e, msgKey, msgObj, isSent) {
    selectedMessageKey = msgKey;
    replyingTo = {
        key: msgKey,
        text: msgObj.type === 'image' ? '[Photo]' : msgObj.type === 'video' ? '[Video]' : msgObj.type === 'audio' ? '[Voice Note]' : msgObj.type === 'call' ? '[Call]' : msgObj.text,
        senderName: isSent ? currentUser.name : activeFriend.name
    };

    const popup = document.getElementById('msg-action-popup');
    if (!popup) return;
    const seenBtn = document.getElementById('mark-seen-btn');
    const alreadySeen = !!(msgObj.readBy && activeFriend && msgObj.readBy[activeFriend.username]);
    if (seenBtn) seenBtn.style.display = (!isSent && !alreadySeen) ? 'flex' : 'none';

    // Fixed positioning keeps the popup in the browser viewport instead of
    // letting a chat container clip it. It is always clamped inside the screen.
    popup.style.display = 'flex';
    popup.style.visibility = 'hidden';
    popup.style.top = '0px';
    popup.style.left = '0px';
    requestAnimationFrame(() => {
        const pad = 10;
        const rect = popup.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const x = Number.isFinite(e.clientX) ? e.clientX : vw / 2;
        const y = Number.isFinite(e.clientY) ? e.clientY : vh / 2;
        let posX = x - rect.width / 2;
        posX = Math.max(pad, Math.min(posX, vw - rect.width - pad));
        // Prefer above the held message; if there is not enough room, put it below.
        let posY = y - rect.height - 14;
        if (posY < pad) posY = y + 14;
        posY = Math.max(pad, Math.min(posY, vh - rect.height - pad));
        popup.style.top = `${posY}px`;
        popup.style.left = `${posX}px`;
        popup.style.visibility = 'visible';
    });
}


async function markSelectedMessageSeen() {
    hideActionMenu();
    if (!selectedMessageKey || !activeFriend || !currentUser) return;
    const roomId = getRoomId(currentUser.username, activeFriend.username);
    try {
        await db.ref(`chats/${roomId}/${selectedMessageKey}/readBy/${currentUser.username}`).set(true);
        selectedMessageKey = null;
    } catch (e) {
        console.warn('Mark as seen failed:', e);
        showAlert('Could not mark this message as seen.');
    }
}

function hideActionMenu() {
    const popup=document.getElementById('msg-action-popup');
    if(popup){ popup.style.display='none'; popup.style.visibility='hidden'; }
    closeStickerTray();
}

async function sendReaction(emoji) {
    const key = selectedMessageKey;
    hideActionMenu();
    if(!key || !activeFriend) return;
    const roomId = getRoomId(currentUser.username, activeFriend.username);
    // Update the visible badge immediately without rebuilding the message row.
    // Firebase child_changed will also update the cache/UI, but neither path should
    // alter the message's DOM position or the user's scroll position.
    const row = document.querySelector(`.msg-row[data-message-key="${CSS.escape(key)}"]`);
    const msg = row?.querySelector('.msg');
    if (msg) {
        let badge = msg.querySelector('.msg-reaction-badge');
        if (!badge) { badge = document.createElement('div'); badge.className = 'msg-reaction-badge'; msg.appendChild(badge); }
        badge.textContent = emoji;
    }
    try {
        await db.ref(`chats/${roomId}/${key}`).update({ reaction: emoji });
    } catch (e) {
        console.warn('Reaction update failed:', e);
        showAlert('Could not add reaction.');
    }
}

async function editSelectedMessage(){
    const s=selectedMessageObject(); if(!s)return; hideActionMenu();
    try{
      const snap=await db.ref(`chats/${s.roomId}/${s.key}`).once('value'); const m=snap.val();
      if(!m || m.sender!==currentUser.username || m.type!=='text'){showAlert('Only your text messages can be edited.'); return;}
      const next=await openPremiumDialog({title:'Edit Message',message:'Update your message below.',icon:'fa-pen',mode:'input',defaultValue:m.text||'',placeholder:'Edit message…',confirmText:'Save Changes',maxLength:1000,multiline:true}); if(next===null)return; const text=String(next||'').trim(); if(!text){showAlert('Message cannot be empty.');return;}
      await db.ref(`chats/${s.roomId}/${s.key}`).update({text,edited:true,editedAt:Date.now()});
      const row=document.querySelector(`[data-message-key="${CSS.escape(s.key)}"] .msg`); if(row){ const status=row.querySelector('.message-status'); row.childNodes.forEach(n=>{if(n.nodeType===3)n.remove()}); const link=document.createElement('span'); link.innerHTML=escapeHtml(text).replace(/(https?:\/\/[^\s<]+)/g,'<a class="chat-link-preview" href="$1" target="_blank" rel="noopener noreferrer">$1</a>'); row.insertBefore(link,status||null); }
    }catch(e){showAlert('Edit failed.');} finally{selectedMessageKey=null;}
}
async function forwardSelectedMessage(){
    const s=selectedMessageObject(); if(!s)return; hideActionMenu();
    try{
      const snap=await db.ref(`chats/${s.roomId}/${s.key}`).once('value'); const m=snap.val(); if(!m){return;}
      const target=await openPremiumDialog({title:'Forward Message',message:'Enter the username you want to forward this message to.',icon:'fa-share',mode:'input',placeholder:'@username',confirmText:'Forward'}); if(target===null)return; const cleanTarget=String(target||'').trim().replace(/^@/,''); if(!cleanTarget||cleanTarget===currentUser.username)return;
      const userSnap=await db.ref(`users/${cleanTarget}`).once('value'); if(!userSnap.exists()){showAlert('User not found.');return;}
      const roomId=getRoomId(currentUser.username,cleanTarget); const copy={...m,sender:currentUser.username,time:Date.now(),forwarded:true,replyTo:null}; delete copy.readBy; delete copy.reaction;
      await db.ref(`chats/${roomId}`).push(copy); await cacheLastMessage(cleanTarget, null, copy); showAlert('Message forwarded.','success');
    }catch(e){showAlert('Forward failed.');} finally{selectedMessageKey=null;}
}
function toggleChatTools(){document.getElementById('chat-tools-panel')?.classList.toggle('hidden');}
function saveChatPreference(name,value){if(!activeFriend)return;localStorage.setItem(`mpbd_chat_${currentUser.username}_${activeFriend.username}_${name}`,String(value));}
function applyChatWallpaper(){
 const el=document.getElementById('chat-wallpaper-input'); if(!el||!activeFriend)return; const v=el.value.trim();
 localStorage.setItem(`mpbd_chat_${currentUser.username}_${activeFriend.username}_wallpaper`,v); applyCurrentChatWallpaper();
}
function applyCurrentChatWallpaper(){
 const box=document.getElementById('room-messages'); if(!box||!activeFriend)return; const key=`mpbd_chat_${currentUser.username}_${activeFriend.username}_wallpaper`; const v=localStorage.getItem(key)||'';
 box.style.backgroundImage=(v && (/^https?:\/\//i.test(v)||v.startsWith('data:image/'))) ? `url("${v}")` : 'none'; box.style.backgroundColor=v && !v.includes('/') ? v : '';
 const compact=localStorage.getItem(`mpbd_chat_${currentUser.username}_${activeFriend.username}_compact`)==='true'; box.classList.toggle('compact-chat',compact);
}
function initSwipeReply(row,msgKey,msgObj,isSent){
 let sx=0,sy=0; row.addEventListener('touchstart',e=>{const t=e.touches[0];sx=t.clientX;sy=t.clientY},{passive:true}); row.addEventListener('touchend',e=>{const t=e.changedTouches[0];const dx=t.clientX-sx,dy=t.clientY-sy;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)){replyingTo={key:msgKey,text:msgObj.text|| (msgObj.type==='image'?'[Photo]':'[Message]'),senderName:isSent?currentUser.name:activeFriend.name};triggerReply();}},{passive:true});
}

function triggerReply() {
    hideActionMenu();
    if(!replyingTo) return;
    document.getElementById('reply-preview-bar').style.display = 'flex';
    document.getElementById('replying-to-name').innerText = `Replying to ${replyingTo.senderName}`;
    document.getElementById('replying-to-text').innerText = replyingTo.text;
    document.getElementById('message-input').focus();
}

function cancelReply() {
    replyingTo = null;
    document.getElementById('reply-preview-bar').style.display = 'none';
}

function closeDeleteModal() {
    const modal = document.getElementById('delete-message-modal');
    if (modal) modal.classList.add('hidden');
}

function triggerDelete() {
    hideActionMenu();
    if (!selectedMessageKey || !activeFriend || !currentUser) return;
    const modal = document.getElementById('delete-message-modal');
    const everyoneBtn = document.getElementById('delete-for-everyone-btn');
    const description = document.getElementById('delete-message-description');
    const row = document.querySelector(`.msg-row[data-message-key="${CSS.escape(selectedMessageKey)}"]`);
    const isSent = row ? row.classList.contains('sent') : false;
    if (everyoneBtn) everyoneBtn.style.display = isSent ? 'flex' : 'none';
    if (description) description.textContent = isSent
        ? 'Choose whether to remove this message only for you or for everyone.'
        : 'You can remove this message from your own chat.';
    if (modal) modal.classList.remove('hidden');
}

async function deleteForMe() {
    if (!selectedMessageKey || !activeFriend || !currentUser) return;
    const messageKey = selectedMessageKey;
    const roomId = getRoomId(currentUser.username, activeFriend.username);
    closeDeleteModal();
    selectedMessageKey = null;
    if (replyingTo && replyingTo.key === messageKey) cancelReply();
    try {
        await db.ref(`chats/${roomId}/${messageKey}/deletedFor/${currentUser.username}`).set(true);
        refreshRenderedMessage(messageKey, { ...(await db.ref(`chats/${roomId}/${messageKey}`).once('value')).val(), deletedFor: { ...(await db.ref(`chats/${roomId}/${messageKey}/deletedFor`).once('value')).val() } });
        showAlert('Message deleted for you.');
    } catch (e) {
        console.error('Delete for me failed:', e);
        showAlert('Could not delete the message.');
    }
}

async function deleteForEveryone() {
    if (!selectedMessageKey || !activeFriend || !currentUser) return;
    const messageKey = selectedMessageKey;
    const roomId = getRoomId(currentUser.username, activeFriend.username);
    closeDeleteModal();
    selectedMessageKey = null;
    if (replyingTo && replyingTo.key === messageKey) cancelReply();
    try {
        const ref = db.ref(`chats/${roomId}/${messageKey}`);
        const snap = await ref.once('value');
        const msg = snap.val();
        if (!msg || msg.sender !== currentUser.username) {
            showAlert('Only the sender can delete this message for everyone.');
            return;
        }
        await ref.update({
            type: 'deleted',
            text: 'This message was deleted',
            url: null,
            deletedForEveryone: true,
            deletedAt: firebase.database.ServerValue.TIMESTAMP
        });
        showAlert('Message deleted for everyone.');
    } catch (e) {
        console.error('Delete for everyone failed:', e);
        showAlert('Could not delete the message for everyone.');
    }
}

function handleTyping() {
    closeStickerTray();
    if(!activeFriend) return;
    const roomId = getRoomId(currentUser.username, activeFriend.username);
    const typingRef = db.ref(`typing/${roomId}/${currentUser.username}`);

    typingRef.set(true);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => { typingRef.remove(); }, 1500);
}

function loadTypingStatus() {
    const roomId = getRoomId(currentUser.username, activeFriend.username);
    const typingInd = document.getElementById('typing-indicator');

    db.ref(`typing/${roomId}`).on('value', snap => {
        let isTyping = false;
        if(snap.exists()) {
            snap.forEach(child => {
                if(child.key !== currentUser.username && child.val() === true) isTyping = true;
            });
        }
        if(isTyping) {
            typingInd.style.display = "flex";
            const who = document.getElementById('typing-who');
            if (who) who.textContent = `${activeFriend.name || activeFriend.username} is typing`;
        } else {
            typingInd.style.display = "none";
        }
    });
}

function cacheLastMessage(friendUsername, messageKey, messageData) {
    if (!friendUsername || !messageKey || !messageData) return;
    const payload = { ...messageData, key: messageKey };
    const updates = {};
    updates[`lastMessages/${currentUser.username}/${friendUsername}`] = payload;
    updates[`lastMessages/${friendUsername}/${currentUser.username}`] = payload;
    return db.ref().update(updates).catch(() => {});
}

function closeStickerTray(e){
  if(e && e.stopPropagation) e.stopPropagation();
  const tray=document.getElementById('sticker-tray');
  if(!tray) return;
  tray.classList.remove('show');
  tray.setAttribute('aria-hidden','true');
  const btn=document.getElementById('sticker-btn');
  if(btn) btn.classList.remove('active');
}
function toggleStickerTray(e){
  if(e && e.stopPropagation) e.stopPropagation();
  const tray=document.getElementById('sticker-tray');
  if(!tray) return;
  const open=!tray.classList.contains('show');
  if(open) {
    tray.classList.add('show');
    tray.setAttribute('aria-hidden','false');
    const btn=document.getElementById('sticker-btn');
    if(btn) btn.classList.add('active');
  } else closeStickerTray();
}
async function sendSticker(emoji){
  if(!activeFriend) return;
  closeStickerTray();
  try{
    const roomId=getRoomId(currentUser.username,activeFriend.username); await ensureChatMembership(activeFriend);
    const data={sender:currentUser.username,type:'sticker',sticker:emoji,time:Date.now()};
    const ref=await db.ref(`chats/${roomId}`).push(data); await cacheLastMessage(activeFriend.username,ref.key,data);
  }catch(e){showAlert('Sticker পাঠানো যায়নি। আবার চেষ্টা করো।');}
}

// Keep the sticker picker ephemeral: close when tapping elsewhere, typing, scrolling, or resizing.
document.addEventListener('pointerdown', (e) => {
  const tray=document.getElementById('sticker-tray');
  if(!tray || !tray.classList.contains('show')) return;
  if(e.target.closest('#sticker-tray') || e.target.closest('#sticker-btn')) return;
  closeStickerTray();
}, true);
document.addEventListener('focusin', (e) => {
  if(e.target && (e.target.id==='message-input' || e.target.closest('.normal-input-group'))) closeStickerTray();
});
window.addEventListener('resize', () => { closeStickerTray(); });
window.addEventListener('scroll', () => { closeStickerTray(); }, true);

let sendMessageInFlight = false;
async function sendMessage() {
    if (sendMessageInFlight) return;
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    if(!text || !activeFriend) return;
    try {
        const blocked = await db.ref(`blocked/${currentUser.username}/${activeFriend.username}`).once('value');
        if (blocked.val() === true) { showAlert('You blocked this friend. Unblock them from the profile to send messages.'); return; }
        const blockedBy = await db.ref(`blocked/${activeFriend.username}/${currentUser.username}`).once('value');
        if (blockedBy.val() === true) { showAlert('You cannot message this user because they blocked you.'); return; }
    } catch (_) {}

    const roomId = getRoomId(currentUser.username, activeFriend.username);
    await ensureChatMembership(activeFriend);
    let messageData = {
        sender: currentUser.username,
        text: text,
        type: 'text',
        time: Date.now()
    };

    if(replyingTo && document.getElementById('reply-preview-bar').style.display === 'flex') {
        messageData.replyTo = {
            text: replyingTo.text,
            senderName: replyingTo.senderName
        };
    }

    sendMessageInFlight = true;
    try {
        const ref = await db.ref(`chats/${roomId}`).push(messageData);
        await cacheLastMessage(activeFriend.username, ref.key, messageData);
        // Persist the just-sent message locally immediately so leaving/re-entering the chat
        // never makes it look like the message disappeared while Firebase finishes syncing.
        try {
            const raw = localStorage.getItem(chatCacheKey(roomId));
            const arr = raw ? JSON.parse(raw) : [];
            if (!arr.some(x => x.key === ref.key)) arr.push({key: ref.key, val: messageData});
            saveChatCache(roomId, arr);
        } catch (_) {}
        db.ref(`typing/${roomId}/${currentUser.username}`).remove().catch(()=>{});
        input.value = "";
        cancelReply();
    } catch (err) {
        console.error('Message send failed:', err);
        showAlert('Message পাঠানো যায়নি। Firebase connection/rules check করো।');
    } finally {
        sendMessageInFlight = false;
    }
}

async function compressChatImage(file) {
    if (!file || !file.type.startsWith('image/')) return file;
    try {
        const bitmap = await createImageBitmap(file);
        const maxSide = 1920;
        const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        const ctx = canvas.getContext('2d', { alpha: false });
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.84));
        if (!blob) return file;
        return new File([blob], (file.name || 'photo').replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg', lastModified: Date.now() });
    } catch (_) {
        return file;
    }
}

let mediaEditorState = null;

function setComposerFocus(focused){
    if (focused) closeStickerTray();
    const roomInput=document.querySelector('.room-input');
    if(roomInput) roomInput.classList.toggle('composer-focused', !!focused);
}

function closeMediaEditor(){
    const modal=document.getElementById('media-editor-overlay');
    if(modal) modal.remove();
    if(mediaEditorState?.url) URL.revokeObjectURL(mediaEditorState.url);
    mediaEditorState=null;
}

function openMediaEditor(file){
    return new Promise((resolve,reject)=>{
        if(!file) return resolve(null);
        closeMediaEditor();
        const isImage=file.type.startsWith('image/');
        const isVideo=file.type.startsWith('video/');
        if(!isImage && !isVideo) return resolve(file);
        const url=URL.createObjectURL(file);
        mediaEditorState={file,url,isImage,isVideo,resolve,reject,zoom:1,rotate:0,brightness:1,caption:'',text:'',textColor:'#ffffff',textSize:42,textPosition:'bottom',textX:.5,textY:.88,textFont:'system-ui, sans-serif',textWeight:700,textDragging:false,textPointerId:null,textBg:true,textShadow:true,crop:1,cropMode:false,imageCrop:null,imageCropMode:false,videoCrop:null,videoCropMode:false,start:0,end:0,duration:0};
        const overlay=document.createElement('div'); overlay.id='media-editor-overlay'; overlay.className='media-editor-overlay';
        overlay.innerHTML=`<div class="media-editor-card">
          <div class="media-editor-head"><h3><i class="fa-solid ${isImage?'fa-wand-magic-sparkles':'fa-film'}"></i>${isImage?'Edit photo':'Edit video'}</h3><button class="media-editor-close" type="button" aria-label="Close"><i class="fa-solid fa-xmark"></i></button></div>
          <div class="media-editor-stage" id="media-editor-stage">${isImage?'<canvas id="media-editor-canvas" width="900" height="900"></canvas>':'<div class="video-editor-preview"><video id="media-editor-video" controls playsinline></video><div id="video-text-preview" class="video-text-preview"></div></div>'}</div>
          ${isImage?`<div class="media-editor-tools"><button class="media-tool" id="media-rotate"><i class="fa-solid fa-rotate-right"></i> Rotate</button><button class="media-tool" id="media-crop"><i class="fa-solid fa-crop-simple"></i> Crop</button><button class="media-tool" id="media-reset"><i class="fa-solid fa-arrow-rotate-left"></i> Reset</button><button class="media-tool" id="media-filter"><i class="fa-solid fa-sun"></i> Auto</button></div><div class="image-crop-options hidden" id="image-crop-options"><span>Ratio</span><select id="image-crop-ratio"><option value="free">Free</option><option value="1:1">1:1</option><option value="4:5">4:5</option><option value="16:9">16:9</option><option value="9:16">9:16</option></select><button type="button" id="image-crop-confirm" class="media-tool active">Done</button></div><div class="media-editor-controls"><label>Zoom <input id="media-zoom" type="range" min="1" max="2.5" step="0.01" value="1"><span id="media-zoom-val">1.0×</span></label><label style="margin-top:8px">Brightness <input id="media-brightness" type="range" min="0.6" max="1.5" step="0.01" value="1"><span id="media-bright-val">100%</span></label></div>`:`<div class="media-editor-tools video-edit-tools"><button class="media-tool" id="video-crop"><i class="fa-solid fa-crop-simple"></i> Crop</button><button class="media-tool" id="video-rotate"><i class="fa-solid fa-rotate-right"></i> Rotate</button><button class="media-tool" id="video-reset-crop"><i class="fa-solid fa-arrow-rotate-left"></i> Reset</button></div><div class="video-crop-options hidden" id="video-crop-options"><span>Ratio</span><select id="video-crop-ratio"><option value="free">Free</option><option value="1:1">1:1</option><option value="4:5">4:5</option><option value="16:9">16:9</option><option value="9:16">9:16</option></select><button type="button" id="video-crop-confirm" class="media-tool active">Done</button></div><div class="video-trim-row"><span>Start</span><input id="video-start" type="range" min="0" max="0" step="0.1" value="0"><b id="video-start-val">0.0s</b></div><div class="video-trim-row"><span>End</span><input id="video-end" type="range" min="0" max="0" step="0.1" value="0"><b id="video-end-val">0.0s</b></div>`}
          <div class="media-text-editor"><div class="media-text-row media-text-main"><div class="media-text-input"><i class="fa-solid fa-font"></i><input id="media-overlay-text" maxlength="120" placeholder="Add text…"></div><div class="media-text-swatches" aria-label="Text colors"><button type="button" class="text-swatch active" data-color="#ffffff" style="--sw:#fff" title="White"></button><button type="button" class="text-swatch" data-color="#000000" style="--sw:#000" title="Black"></button><button type="button" class="text-swatch" data-color="#ff4d6d" style="--sw:#ff4d6d" title="Pink"></button><button type="button" class="text-swatch" data-color="#ffd166" style="--sw:#ffd166" title="Yellow"></button><button type="button" class="text-swatch" data-color="#00d4ff" style="--sw:#00d4ff" title="Cyan"></button><input id="media-text-color" type="color" value="#ffffff" title="Custom text color"></div></div><div class="media-text-row media-text-options"><select id="media-text-font" title="Font style"><option value="system-ui, sans-serif" selected>Clean</option><option value="Georgia, serif">Classic</option><option value="Arial Black, sans-serif">Bold</option><option value="Trebuchet MS, sans-serif">Soft</option><option value="Courier New, monospace">Mono</option></select><div class="media-text-size-control" title="Text size"><span class="text-size-a small">A</span><input id="media-text-size" type="range" min="16" max="120" step="1" value="42"><span id="media-text-size-val">42</span><span class="text-size-a large">A</span></div><button type="button" class="media-tool text-bg-toggle active" id="media-text-bg">BG</button><button type="button" class="media-tool text-shadow-toggle active" id="media-text-shadow">Shadow</button><button type="button" class="media-tool text-pos" data-pos="top">Top</button><button type="button" class="media-tool text-pos" data-pos="center">Center</button><button type="button" class="media-tool text-pos" data-pos="bottom">Bottom</button><span class="media-text-hint"><i class="fa-solid fa-hand-pointer"></i> Drag text anywhere</span></div></div>
          <div class="media-editor-caption"><i class="fa-solid fa-pen"></i><input id="media-caption" maxlength="500" placeholder="Add a caption…"></div>
          <div class="media-editor-actions"><button class="media-cancel" type="button">Cancel</button><button class="media-send" type="button"><i class="fa-solid fa-paper-plane"></i> Send ${isImage?'Photo':'Video'}</button></div>
        </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('.media-editor-close').onclick=()=>{closeMediaEditor();resolve(null)};
        overlay.querySelector('.media-cancel').onclick=()=>{closeMediaEditor();resolve(null)};
        overlay.addEventListener('click',e=>{if(e.target===overlay){closeMediaEditor();resolve(null)}});
        overlay.querySelector('#media-caption').oninput=e=>{if(mediaEditorState)mediaEditorState.caption=e.target.value};
        overlay.querySelector('#media-overlay-text').oninput=e=>{if(mediaEditorState){mediaEditorState.text=e.target.value;drawMediaEditorPreview()}};
        overlay.querySelector('#media-text-color').oninput=e=>{if(mediaEditorState){mediaEditorState.textColor=e.target.value;overlay.querySelectorAll('.text-swatch').forEach(x=>x.classList.toggle('active',x.dataset.color.toLowerCase()===e.target.value.toLowerCase()));drawMediaEditorPreview()}};
        overlay.querySelectorAll('.text-swatch').forEach(sw=>sw.onclick=()=>{if(mediaEditorState){mediaEditorState.textColor=sw.dataset.color;const picker=overlay.querySelector('#media-text-color');if(picker)picker.value=sw.dataset.color;overlay.querySelectorAll('.text-swatch').forEach(x=>x.classList.toggle('active',x===sw));drawMediaEditorPreview()}});
        overlay.querySelector('#media-text-font').onchange=e=>{if(mediaEditorState){mediaEditorState.textFont=e.target.value;drawMediaEditorPreview()}};
        overlay.querySelector('#media-text-bg').onclick=()=>{if(mediaEditorState){mediaEditorState.textBg=!mediaEditorState.textBg;overlay.querySelector('#media-text-bg').classList.toggle('active',mediaEditorState.textBg);drawMediaEditorPreview()}};
        overlay.querySelector('#media-text-shadow').onclick=()=>{if(mediaEditorState){mediaEditorState.textShadow=!mediaEditorState.textShadow;overlay.querySelector('#media-text-shadow').classList.toggle('active',mediaEditorState.textShadow);drawMediaEditorPreview()}};
        overlay.querySelector('#media-text-size').oninput=e=>{if(mediaEditorState){mediaEditorState.textSize=parseInt(e.target.value)||42;const v=overlay.querySelector('#media-text-size-val');if(v)v.textContent=mediaEditorState.textSize;drawMediaEditorPreview()}};
        overlay.querySelectorAll('.text-pos').forEach(btn=>btn.onclick=()=>{overlay.querySelectorAll('.text-pos').forEach(x=>x.classList.remove('active'));btn.classList.add('active');mediaEditorState.textPosition=btn.dataset.pos;drawMediaEditorPreview()});
        if(isImage) setupImageMediaEditor(file,overlay);
        else setupVideoMediaEditor(file,overlay);
        bindDraggableMediaText(overlay);
        overlay.querySelector('.media-send').onclick=async()=>{
            const btn=overlay.querySelector('.media-send'); btn.disabled=true; btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Preparing…';
            try{ const result=isImage?await exportEditedImage():await exportTrimmedVideo(); const caption=mediaEditorState?.caption||''; closeMediaEditor(); resolve({file:result,caption}); }
            catch(err){ console.error(err); btn.disabled=false; btn.innerHTML='<i class="fa-solid fa-paper-plane"></i> Send'; showAlert('Could not prepare this media. Original file will be used.'); closeMediaEditor(); resolve(file); }
        };
    });
}

function setupImageMediaEditor(file,overlay){
    const canvas=overlay.querySelector('#media-editor-canvas'), ctx=canvas.getContext('2d');
    const img=new Image(); img.onload=()=>{mediaEditorState.img=img;drawEditedImage();}; img.src=mediaEditorState.url;
    const box=document.createElement('div'); box.className='image-crop-box hidden';
    box.innerHTML='<div class="crop-grid"></div><i class="crop-h nw"></i><i class="crop-h ne"></i><i class="crop-h sw"></i><i class="crop-h se"></i><i class="crop-h n"></i><i class="crop-h e"></i><i class="crop-h s"></i><i class="crop-h w"></i>';
    overlay.querySelector('#media-editor-stage').appendChild(box);
    const stage=overlay.querySelector('#media-editor-stage');
    const cropBtn=overlay.querySelector('#media-crop'), opts=overlay.querySelector('#image-crop-options'), ratio=overlay.querySelector('#image-crop-ratio');
    const getCanvasRect=()=>canvas.getBoundingClientRect();
    const positionBox=()=>{
        if(!mediaEditorState?.imageCrop)return;
        const sr=stage.getBoundingClientRect(), cr=getCanvasRect();
        const c=mediaEditorState.imageCrop;
        box.style.left=(cr.left-sr.left+c.x*cr.width)+'px'; box.style.top=(cr.top-sr.top+c.y*cr.height)+'px';
        box.style.width=(c.w*cr.width)+'px'; box.style.height=(c.h*cr.height)+'px';
    };
    const setCropRatio=(r)=>{
        const cr=getCanvasRect(); if(!cr.width||!cr.height)return;
        let w=.78,h=.78;
        if(r!=='free'){const [a,b]=r.split(':').map(Number);const ar=a/b;w=Math.min(.82,Math.max(.25,.72*ar));h=w/ar;if(h>.82){h=.82;w=h*ar;}}
        const x=(1-w)/2,y=(1-h)/2; mediaEditorState.imageCrop={x,y,w,h}; positionBox();
    };
    const applyCropFromBox=()=>{
        const sr=stage.getBoundingClientRect(),cr=getCanvasRect(),br=box.getBoundingClientRect();
        mediaEditorState.imageCrop={x:Math.max(0,Math.min(1,(br.left-cr.left)/cr.width)),y:Math.max(0,Math.min(1,(br.top-cr.top)/cr.height)),w:Math.max(.05,Math.min(1,br.width/cr.width)),h:Math.max(.05,Math.min(1,br.height/cr.height))};
        mediaEditorState.imageCrop.x=Math.min(mediaEditorState.imageCrop.x,1-mediaEditorState.imageCrop.w);mediaEditorState.imageCrop.y=Math.min(mediaEditorState.imageCrop.y,1-mediaEditorState.imageCrop.h);positionBox();
    };
    let drag=null;
    box.addEventListener('pointerdown',e=>{
        const handle=[...e.target.classList].find(c=>['nw','ne','sw','se','n','e','s','w'].includes(c));
        drag={type:handle||'move',sx:e.clientX,sy:e.clientY,orig:{...mediaEditorState.imageCrop}};box.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopPropagation();
    });
    box.addEventListener('pointermove',e=>{
        if(!drag)return; const cr=getCanvasRect(),o=drag.orig; let dx=(e.clientX-drag.sx)/cr.width,dy=(e.clientY-drag.sy)/cr.height,c={...o};
        if(drag.type==='move'){c.x=Math.max(0,Math.min(1-o.w,o.x+dx));c.y=Math.max(0,Math.min(1-o.h,o.y+dy));}
        else{
            const t=drag.type;
            if(t.includes('w')){const nx=Math.max(0,Math.min(o.x+o.w-.06,o.x+dx));c.w=o.w+(o.x-nx);c.x=nx;}
            if(t.includes('e'))c.w=Math.max(.06,Math.min(1-o.x,o.w+dx));
            if(t.includes('n')){const ny=Math.max(0,Math.min(o.y+o.h-.06,o.y+dy));c.h=o.h+(o.y-ny);c.y=ny;}
            if(t.includes('s'))c.h=Math.max(.06,Math.min(1-o.y,o.h+dy));
            const selected=ratio?.value||'free';
            if(selected!=='free'){
                const [a,b]=selected.split(':').map(Number),ar=a/b;
                if(t==='e'||t==='w'||t==='ne'||t==='nw'||t==='se'||t==='sw'){
                    c.h=Math.min(c.h,1-c.y);c.h=c.w/ar;
                    if(c.h>1-c.y){c.h=1-c.y;c.w=c.h*ar;}
                }else{c.w=Math.min(c.w,1-c.x);c.w=c.h*ar;if(c.w>1-c.x){c.w=1-c.x;c.h=c.w/ar;}}
                if(t.includes('w'))c.x=o.x+o.w-c.w;
                if(t.includes('n'))c.y=o.y+o.h-c.h;
                c.x=Math.max(0,Math.min(1-c.w,c.x));c.y=Math.max(0,Math.min(1-c.h,c.y));
            }
        }
        mediaEditorState.imageCrop=c;positionBox();e.preventDefault();
    });
    box.addEventListener('pointerup',e=>{drag=null;applyCropFromBox();box.releasePointerCapture?.(e.pointerId)});box.addEventListener('pointercancel',()=>drag=null);
    const toggleCrop=()=>{mediaEditorState.imageCropMode=!mediaEditorState.imageCropMode;box.classList.toggle('hidden',!mediaEditorState.imageCropMode);opts.classList.toggle('hidden',!mediaEditorState.imageCropMode);cropBtn.classList.toggle('active',mediaEditorState.imageCropMode);if(mediaEditorState.imageCropMode){setCropRatio(ratio.value||'free');positionBox();}};
    cropBtn.onclick=toggleCrop;
    ratio.onchange=()=>{if(mediaEditorState.imageCropMode)setCropRatio(ratio.value)};
    overlay.querySelector('#image-crop-confirm').onclick=()=>{mediaEditorState.imageCropMode=false;box.classList.add('hidden');opts.classList.add('hidden');cropBtn.classList.remove('active');applyCropFromBox();};
    overlay.querySelector('#media-rotate').onclick=()=>{mediaEditorState.rotate=(mediaEditorState.rotate+90)%360;drawEditedImage();if(mediaEditorState.imageCropMode)positionBox()};
    overlay.querySelector('#media-reset').onclick=()=>{mediaEditorState.zoom=1;mediaEditorState.rotate=0;mediaEditorState.brightness=1;mediaEditorState.imageCrop=null;mediaEditorState.imageCropMode=false;box.classList.add('hidden');opts.classList.add('hidden');cropBtn.classList.remove('active');overlay.querySelector('#media-zoom').value='1';overlay.querySelector('#media-brightness').value='1';overlay.querySelector('#media-zoom-val').textContent='1.0×';overlay.querySelector('#media-bright-val').textContent='100%';drawEditedImage()};
    overlay.querySelector('#media-filter').onclick=()=>{mediaEditorState.brightness=1.12;overlay.querySelector('#media-brightness').value='1.12';overlay.querySelector('#media-bright-val').textContent='112%';drawEditedImage()};
    overlay.querySelector('#media-zoom').oninput=e=>{mediaEditorState.zoom=parseFloat(e.target.value)||1;overlay.querySelector('#media-zoom-val').textContent=mediaEditorState.zoom.toFixed(1)+'×';drawEditedImage();if(mediaEditorState.imageCropMode)positionBox()};
    overlay.querySelector('#media-brightness').oninput=e=>{mediaEditorState.brightness=parseFloat(e.target.value)||1;overlay.querySelector('#media-bright-val').textContent=Math.round(mediaEditorState.brightness*100)+'%';drawEditedImage()};
    const ro=new ResizeObserver(()=>{if(mediaEditorState?.imageCropMode)positionBox()});ro.observe(stage);
}
function drawTextOnCanvas(ctx,text,x,y,maxWidth,size,color,fontFamily='system-ui, sans-serif',weight=700,showBg=true,showShadow=true){
    if(!text)return;
    ctx.save();
    ctx.font=`${weight} ${size}px ${fontFamily}`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    const pad=Math.max(8,size*.24), metrics=ctx.measureText(text);
    const w=Math.min(maxWidth,metrics.width+pad*2), h=size+pad;
    if(showBg){ctx.fillStyle='rgba(8,12,18,.52)';roundRect(ctx,x-w/2,y-h/2,w,h,Math.min(12,h/2));ctx.fill();}
    if(showShadow){ctx.shadowColor='rgba(0,0,0,.72)';ctx.shadowBlur=Math.max(3,size*.10);}
    ctx.fillStyle=color||'#fff';
    ctx.fillText(text,x,y,Math.max(20,maxWidth-pad*2));
    ctx.restore();
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.closePath()}
function drawEditedImage(){
    const st=mediaEditorState;if(!st?.img)return;const canvas=document.getElementById('media-editor-canvas'),ctx=canvas.getContext('2d');const size=900;ctx.clearRect(0,0,size,size);ctx.fillStyle='#080a0e';ctx.fillRect(0,0,size,size);ctx.save();ctx.translate(size/2,size/2);ctx.rotate(st.rotate*Math.PI/180);const iw=st.img.naturalWidth,ih=st.img.naturalHeight;const cover=Math.max(size/iw,size/ih)*st.zoom;const w=iw*cover,h=ih*cover;ctx.filter=`brightness(${st.brightness})`;ctx.drawImage(st.img,-w/2,-h/2,w,h);ctx.restore();ctx.filter='none';
    if(st.text){const x=size*(st.textX??.5),y=size*(st.textY??.88);drawTextOnCanvas(ctx,st.text,x,y,size*.88,st.textSize,st.textColor,st.textFont,st.textWeight,st.textBg,st.textShadow)}
}
function drawMediaEditorPreview(){
    if(!mediaEditorState)return;
    if(mediaEditorState.isImage) drawEditedImage();
    else {const el=document.getElementById('video-text-preview');if(el){el.textContent=mediaEditorState.text||'';el.style.color=mediaEditorState.textColor||'#fff';el.style.fontSize=Math.max(15,mediaEditorState.textSize*.52)+'px';el.style.fontFamily=mediaEditorState.textFont||'system-ui, sans-serif';el.style.fontWeight=mediaEditorState.textWeight||700;el.style.background=mediaEditorState.textBg?'rgba(8,12,18,.52)':'transparent';el.style.boxShadow=mediaEditorState.textShadow?'0 3px 14px rgba(0,0,0,.65)':'none';el.style.left=((mediaEditorState.textX??.5)*100)+'%';el.style.top=((mediaEditorState.textY??.88)*100)+'%';el.style.transform='translate(-50%,-50%)';el.dataset.pos=mediaEditorState.textPosition||'bottom'}}
}
function bindDraggableMediaText(overlay){
    const st=mediaEditorState;if(!st)return;
    const canvas=overlay.querySelector('#media-editor-canvas');
    const videoText=overlay.querySelector('#video-text-preview');
    const target=canvas||videoText;if(!target)return;
    const point=(e)=>{const r=target.getBoundingClientRect();return {x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),y:Math.max(0,Math.min(1,(e.clientY-r.top)/r.height))}};
    const down=(e)=>{if(!st.text)return;st.textDragging=true;st.textPointerId=e.pointerId;target.setPointerCapture?.(e.pointerId);const p=point(e);st.textX=p.x;st.textY=p.y;drawMediaEditorPreview();e.preventDefault()};
    const move=(e)=>{if(!st.textDragging||st.textPointerId!==e.pointerId)return;const p=point(e);st.textX=p.x;st.textY=p.y;st.textPosition=p.y<.33?'top':p.y>.66?'bottom':'center';overlay.querySelectorAll('.text-pos').forEach(x=>x.classList.toggle('active',x.dataset.pos===st.textPosition));drawMediaEditorPreview();e.preventDefault()};
    const up=(e)=>{if(st.textPointerId===e.pointerId){st.textDragging=false;st.textPointerId=null;target.releasePointerCapture?.(e.pointerId)}};
    target.addEventListener('pointerdown',down);target.addEventListener('pointermove',move);target.addEventListener('pointerup',up);target.addEventListener('pointercancel',up);
}
async function exportEditedImage(){
    const st=mediaEditorState;if(!st?.img)return st.file;drawEditedImage();
    const source=document.getElementById('media-editor-canvas');
    let crop=st.imageCrop||{x:0,y:0,w:1,h:1};
    const sx=Math.max(0,Math.min(source.width-1,Math.round(crop.x*source.width))),sy=Math.max(0,Math.min(source.height-1,Math.round(crop.y*source.height)));
    const sw=Math.max(2,Math.min(source.width-sx,Math.round(crop.w*source.width))),sh=Math.max(2,Math.min(source.height-sy,Math.round(crop.h*source.height)));
    const out=document.createElement('canvas');out.width=sw;out.height=sh;const octx=out.getContext('2d');octx.drawImage(source,sx,sy,sw,sh,0,0,sw,sh);
    const blob=await new Promise(r=>out.toBlob(r,'image/jpeg',.92));if(!blob)return st.file;return new File([blob],(st.file.name||'photo').replace(/\.[^.]+$/,'')+'_edited.jpg',{type:'image/jpeg',lastModified:Date.now()});
}
function setupVideoMediaEditor(file,overlay){
    const video=overlay.querySelector('#media-editor-video');
    video.src=mediaEditorState.url;
    const stage=overlay.querySelector('.video-editor-preview');
    if(stage && !stage.querySelector('.video-crop-box')){
        stage.style.position='relative';
        const box=document.createElement('div'); box.className='video-crop-box hidden';
        box.innerHTML='<div class="crop-grid"></div><i class="crop-h nw"></i><i class="crop-h ne"></i><i class="crop-h sw"></i><i class="crop-h se"></i><i class="crop-h n"></i><i class="crop-h e"></i><i class="crop-h s"></i><i class="crop-h w"></i>';
        stage.appendChild(box);
        const setCropRatio=(ratio)=>{
            const r=stage.getBoundingClientRect(); if(!r.width||!r.height)return;
            let w=.78,h=.78;
            if(ratio!=='free'){const [a,b]=ratio.split(':').map(Number);const ar=a/b;w=Math.min(.82,Math.max(.25,.72*ar));h=w/ar;if(h>.82){h=.82;w=h*ar;}}
            const x=(1-w)/2,y=(1-h)/2;
            mediaEditorState.videoCrop={x,y,w,h}; box.style.left=(x*100)+'%';box.style.top=(y*100)+'%';box.style.width=(w*100)+'%';box.style.height=(h*100)+'%';
        };
        const applyBox=()=>{const r=stage.getBoundingClientRect(),b=box.getBoundingClientRect();mediaEditorState.videoCrop={x:(b.left-r.left)/r.width,y:(b.top-r.top)/r.height,w:b.width/r.width,h:b.height/r.height};};
        const point=e=>{const r=stage.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height}};
        let drag=null;
        box.addEventListener('pointerdown',e=>{
            if(e.target.classList.contains('crop-h')){drag={type:[...e.target.classList].find(c=>['nw','ne','sw','se','n','e','s','w'].includes(c)),sx:e.clientX,sy:e.clientY,orig:{...mediaEditorState.videoCrop}}}
            else{drag={type:'move',sx:e.clientX,sy:e.clientY,orig:{...mediaEditorState.videoCrop}}}
            box.setPointerCapture?.(e.pointerId);e.preventDefault();e.stopPropagation();
        });
        box.addEventListener('pointermove',e=>{
            if(!drag)return;const r=stage.getBoundingClientRect(),o=drag.orig;let dx=(e.clientX-drag.sx)/r.width,dy=(e.clientY-drag.sy)/r.height;
            let c={...o};
            if(drag.type==='move'){c.x=Math.max(0,Math.min(1-o.w,o.x+dx));c.y=Math.max(0,Math.min(1-o.h,o.y+dy));}
            else{
                const t=drag.type;
                if(t.includes('w')){const nx=Math.max(0,Math.min(o.x+o.w-.12,o.x+dx));c.w=o.w+(o.x-nx);c.x=nx;}
                if(t.includes('e')){c.w=Math.max(.12,Math.min(1-o.x,o.w+dx));}
                if(t.includes('n')){const ny=Math.max(0,Math.min(o.y+o.h-.12,o.y+dy));c.h=o.h+(o.y-ny);c.y=ny;}
                if(t.includes('s')){c.h=Math.max(.12,Math.min(1-o.y,o.h+dy));}
            }
            mediaEditorState.videoCrop=c;box.style.left=c.x*100+'%';box.style.top=c.y*100+'%';box.style.width=c.w*100+'%';box.style.height=c.h*100+'%';e.preventDefault();
        });
        box.addEventListener('pointerup',()=>{drag=null;applyBox()});
        const cropBtn=overlay.querySelector('#video-crop'),opts=overlay.querySelector('#video-crop-options'),ratio=overlay.querySelector('#video-crop-ratio');
        cropBtn.onclick=()=>{mediaEditorState.videoCropMode=!mediaEditorState.videoCropMode;box.classList.toggle('hidden',!mediaEditorState.videoCropMode);opts.classList.toggle('hidden',!mediaEditorState.videoCropMode);if(mediaEditorState.videoCropMode){setCropRatio(ratio.value||'free');cropBtn.classList.add('active')}else cropBtn.classList.remove('active');};
        ratio.onchange=()=>setCropRatio(ratio.value);
        overlay.querySelector('#video-crop-confirm').onclick=()=>{mediaEditorState.videoCropMode=false;box.classList.add('hidden');opts.classList.add('hidden');cropBtn.classList.remove('active');};
        overlay.querySelector('#video-reset-crop').onclick=()=>{mediaEditorState.videoCrop=null;mediaEditorState.videoCropMode=false;box.classList.add('hidden');opts.classList.add('hidden');cropBtn.classList.remove('active');};
        overlay.querySelector('#video-rotate').onclick=()=>{mediaEditorState.rotate=(mediaEditorState.rotate+90)%360;video.style.transform=`rotate(${mediaEditorState.rotate}deg)`;};
    }
    video.onloadedmetadata=()=>{
        const d=video.duration||0;mediaEditorState.duration=d;
        const a=overlay.querySelector('#video-start'),b=overlay.querySelector('#video-end');
        a.max=d;b.max=d;b.value=d;overlay.querySelector('#video-end-val').textContent=d.toFixed(1)+'s';
        drawMediaEditorPreview();
    };
    const start=overlay.querySelector('#video-start'),end=overlay.querySelector('#video-end');
    start.oninput=()=>{let v=Math.min(parseFloat(start.value)||0,(parseFloat(end.value)||mediaEditorState.duration)-.2);start.value=Math.max(0,v);overlay.querySelector('#video-start-val').textContent=parseFloat(start.value).toFixed(1)+'s';if(video.duration)video.currentTime=parseFloat(start.value)};
    end.oninput=()=>{let v=Math.max(parseFloat(end.value)||mediaEditorState.duration,(parseFloat(start.value)||0)+.2);end.value=Math.min(mediaEditorState.duration,v);overlay.querySelector('#video-end-val').textContent=parseFloat(end.value).toFixed(1)+'s';};
}
async function exportTrimmedVideo(){
    const st=mediaEditorState;
    if(!st?.isVideo) return st?.file;
    const startT=parseFloat(document.getElementById('video-start')?.value)||0;
    const endT=parseFloat(document.getElementById('video-end')?.value)||st.duration;
    if(!st.duration || endT-startT<0.3) return st.file;
    if(!window.MediaRecorder || !HTMLVideoElement.prototype.captureStream) return st.file;
    const v=document.createElement('video');
    v.src=st.url; v.playsInline=true; v.muted=false; v.crossOrigin='anonymous';
    await new Promise(res=>{v.onloadedmetadata=()=>res();v.onerror=()=>res();});
    if(!v.videoWidth || !v.videoHeight) return st.file;
    const srcW=v.videoWidth, srcH=v.videoHeight;
    const crop=st.videoCrop||{x:0,y:0,w:1,h:1};
    const cx=Math.max(0,Math.min(1-crop.w,crop.x)), cy=Math.max(0,Math.min(1-crop.h,crop.y));
    const cw=Math.max(.01,Math.min(1,crop.w)), ch=Math.max(.01,Math.min(1,crop.h));
    const sx=Math.round(srcW*cx), sy=Math.round(srcH*cy), sw=Math.max(2,Math.round(srcW*cw)), sh=Math.max(2,Math.round(srcH*ch));
    const rot=((st.rotate||0)%360+360)%360;
    const outW=(rot===90||rot===270)?sh:sw, outH=(rot===90||rot===270)?sw:sh;
    const canvas=document.createElement('canvas'); canvas.width=outW; canvas.height=outH;
    const ctx=canvas.getContext('2d');
    const videoStream=v.captureStream(), canvasStream=canvas.captureStream(30);
    videoStream.getAudioTracks().forEach(t=>canvasStream.addTrack(t));
    const mime=['video/webm;codecs=vp9,opus','video/webm;codecs=vp8,opus','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
    if(!mime){v.pause();return st.file;}
    const rec=new MediaRecorder(canvasStream,{mimeType:mime,videoBitsPerSecond:Math.min(7000000,Math.max(1800000,outW*outH*3))});
    const chunks=[]; rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
    const done=new Promise(res=>rec.onstop=res); rec.start(200);
    v.currentTime=startT; await v.play().catch(()=>{});
    await new Promise(resolve=>{
      const tick=()=>{
        if(v.currentTime>=endT || v.ended){try{rec.stop()}catch(_){} resolve(); return;}
        ctx.clearRect(0,0,outW,outH); ctx.save(); ctx.filter=`brightness(${st.brightness||1})`;
        if(rot===90){ctx.translate(outW,0);ctx.rotate(Math.PI/2)}
        else if(rot===180){ctx.translate(outW,outH);ctx.rotate(Math.PI)}
        else if(rot===270){ctx.translate(0,outH);ctx.rotate(-Math.PI/2)}
        ctx.drawImage(v,sx,sy,sw,sh,0,0,sw,sh); ctx.restore(); ctx.filter='none';
        if(st.text){const x=outW*(st.textX??.5),y=outH*(st.textY??.88);drawTextOnCanvas(ctx,st.text,x,y,outW*.88,Math.max(22,st.textSize*(outW/900)),st.textColor,st.textFont,st.textWeight,st.textBg,st.textShadow)}
        requestAnimationFrame(tick);
      }; requestAnimationFrame(tick);
    });
    await done; videoStream.getTracks().forEach(t=>t.stop()); canvasStream.getTracks().forEach(t=>t.stop());
    const blob=new Blob(chunks,{type:mime}); if(!blob.size)return st.file;
    return new File([blob],(st.file.name||'video').replace(/\.[^.]+$/,'')+'_edited.webm',{type:mime,lastModified:Date.now()});
}


let pendingMedia = null;
let pendingMediaObjectUrl = null;

function sendComposerContent(){
  if(pendingMedia?.file){ sendPendingMedia(); return; }
  sendMessage();
}

function clearPendingMedia(){
  if(pendingMediaObjectUrl){ try{ URL.revokeObjectURL(pendingMediaObjectUrl); }catch(_){} pendingMediaObjectUrl=null; }
  pendingMedia=null;
  const wrap=document.getElementById('pending-media-composer');
  const preview=document.getElementById('pending-media-preview');
  const caption=document.getElementById('pending-media-caption');
  if(wrap) wrap.classList.add('hidden');
  if(preview) preview.innerHTML='';
  if(caption) caption.value='';
}

function prepareMediaForSending(file){
  if(!file || !activeFriend) return;
  const isVideo=file.type.startsWith('video/'), isImage=file.type.startsWith('image/');
  if(!isVideo && !isImage){ showAlert('Please select an image or video.'); return; }
  const max=isVideo ? 100*1024*1024 : 10*1024*1024;
  if(file.size>max){ showAlert(`${isVideo?'Video':'Photo'} must be ${isVideo?'100 MB':'10 MB'} or smaller.`); return; }
  clearPendingMedia();
  pendingMedia={file,isVideo,isImage};
  pendingMediaObjectUrl=URL.createObjectURL(file);
  const wrap=document.getElementById('pending-media-composer');
  const preview=document.getElementById('pending-media-preview');
  const name=document.getElementById('pending-media-name');
  const size=document.getElementById('pending-media-size');
  if(!wrap||!preview)return;
  preview.innerHTML=isVideo
    ? `<video src="${pendingMediaObjectUrl}" muted playsinline preload="metadata"></video>`
    : `<img src="${pendingMediaObjectUrl}" alt="Selected photo">`;
  const pv=preview.querySelector('video'); if(pv){ pv.onloadedmetadata=()=>{ pv.currentTime=0.01; }; }
  if(name)name.textContent=file.name|| (isVideo?'video.mp4':'photo.jpg');
  if(size)size.textContent=`${formatBytes(file.size)} • ${isVideo?'Video':'Photo'}`;
  wrap.classList.remove('hidden');
  const caption=document.getElementById('pending-media-caption'); if(caption)caption.focus();
}

async function editPendingMedia(){
  if(!pendingMedia?.file)return;
  const edited=await openMediaEditor(pendingMedia.file);
  if(!edited)return;
  const f=edited.file||edited;
  if(pendingMediaObjectUrl){try{URL.revokeObjectURL(pendingMediaObjectUrl)}catch(_){} }
  pendingMediaObjectUrl=URL.createObjectURL(f);
  pendingMedia.file=f;
  pendingMedia.isVideo=f.type.startsWith('video/'); pendingMedia.isImage=f.type.startsWith('image/');
  const preview=document.getElementById('pending-media-preview');
  if(preview){ preview.innerHTML=pendingMedia.isVideo?`<video src="${pendingMediaObjectUrl}" muted playsinline preload="metadata"></video>`:`<img src="${pendingMediaObjectUrl}" alt="Selected photo">`; }
  const name=document.getElementById('pending-media-name'); if(name)name.textContent=f.name||'edited-media';
  const size=document.getElementById('pending-media-size'); if(size)size.textContent=`${formatBytes(f.size)} • ${pendingMedia.isVideo?'Video':'Photo'}`;
  if(edited.caption){const c=document.getElementById('pending-media-caption');if(c)c.value=edited.caption;}
}

async function uploadMediaMessage(file, caption = '') {
  if (!file || !activeFriend || !currentUser) throw new Error('No media or chat selected.');
  const isVideo = (file.type || '').startsWith('video/');
  const isImage = (file.type || '').startsWith('image/');
  if (!isVideo && !isImage) throw new Error('Only image and video files can be sent here.');
  const maxBytes = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  if (file.size > maxBytes) throw new Error(`${isVideo ? 'Video' : 'Photo'} must be ${isVideo ? '100 MB' : '10 MB'} or smaller.`);

  // Check both directions before uploading so a blocked message never consumes upload bandwidth.
  const [blocked, blockedBy] = await Promise.all([
    db.ref(`blocked/${currentUser.username}/${activeFriend.username}`).once('value').catch(() => null),
    db.ref(`blocked/${activeFriend.username}/${currentUser.username}`).once('value').catch(() => null)
  ]);
  if (blocked?.val() === true || blockedBy?.val() === true) {
    throw new Error('Messaging is blocked for this friend.');
  }

  const roomId = getRoomId(currentUser.username, activeFriend.username);
  await ensureChatMembership(activeFriend);
  setMediaUploadProgress(0, 0, file.size, isVideo ? 'Uploading video…' : 'Uploading photo…');
  try {
    const result = await uploadMediaToCloudinary(file, (loaded, total) => {
      const percent = total ? (loaded / total) * 100 : 0;
      setMediaUploadProgress(percent, loaded, total || file.size, isVideo ? 'Uploading video…' : 'Uploading photo…');
    });
    const data = {
      sender: currentUser.username,
      type: isVideo ? 'video' : 'image',
      url: result.secure_url,
      fileName: file.name || (isVideo ? 'video.mp4' : 'photo.jpg'),
      size: Number(file.size || 0),
      mimeType: file.type || '',
      publicId: result.public_id || '',
      resourceType: result.resource_type || (isVideo ? 'video' : 'image'),
      width: Number(result.width || 0) || null,
      height: Number(result.height || 0) || null,
      duration: Number(result.duration || 0) || null,
      text: caption || '',
      time: Date.now()
    };
    const ref = await db.ref(`chats/${roomId}`).push(data);
    await cacheLastMessage(activeFriend.username, ref.key, data);
    try {
      const raw = localStorage.getItem(chatCacheKey(roomId));
      const arr = raw ? JSON.parse(raw) : [];
      if (!arr.some(x => x.key === ref.key)) arr.push({ key: ref.key, val: data });
      saveChatCache(roomId, arr);
    } catch (_) {}
    setMediaUploadProgress(100, file.size, file.size, 'Sent');
    return ref.key;
  } finally {
    setTimeout(hideMediaUploadProgress, 450);
  }
}

async function sendPendingMedia(){
  if(!pendingMedia?.file || !activeFriend)return;
  const send=document.getElementById('pending-media-send');
  const edit=document.getElementById('pending-media-edit');
  const remove=document.getElementById('pending-media-remove');
  const caption=(document.getElementById('pending-media-caption')?.value||'').trim();
  if(send){send.disabled=true;send.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> Sending';}
  if(edit)edit.disabled=true; if(remove)remove.disabled=true;
  const file=pendingMedia.file;
  try{ await uploadMediaMessage(file,caption); clearPendingMedia(); }
  catch(err){ console.error('Media send failed:', err); showAlert(err?.message || 'Video/Photo send failed. Please try again.'); }
  finally{ if(send){send.disabled=false;send.innerHTML='<i class="fa-solid fa-paper-plane"></i> Send';} if(edit)edit.disabled=false;if(remove)remove.disabled=false; }
}

async function sendMediaMessage(event){
  const input=event?.target;
  const files=Array.from(input?.files||[]);
  if(input) input.value='';
  if(!files.length)return;
  if(files.length>1)showAlert('Messenger-style sending selects one photo or video at a time.');
  prepareMediaForSending(files[0]);
}

async function sendMediaMessageSingle(event,fileOverride=null){
  const file=fileOverride||event?.target?.files?.[0];
  if(event?.target)event.target.value='';
  if(file)prepareMediaForSending(file);
}

(function wirePendingMediaComposer(){
  const ready=()=>{
    document.getElementById('pending-media-send')?.addEventListener('click',sendPendingMedia);
    document.getElementById('pending-media-edit')?.addEventListener('click',editPendingMedia);
    document.getElementById('pending-media-remove')?.addEventListener('click',clearPendingMedia);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true}); else ready();
})();


async function sendFileMessage(event) {
    const file = event.target.files[0]; event.target.value = '';
    if (!file || !activeFriend) return;
    const maxBytes = 1200000;
    if (file.size > maxBytes) { showAlert('File is too large. Maximum is 1.2 MB in free storage mode.'); return; }
    try {
        const blocked = await db.ref(`blocked/${currentUser.username}/${activeFriend.username}`).once('value').catch(()=>null);
        const blockedBy = await db.ref(`blocked/${activeFriend.username}/${currentUser.username}`).once('value').catch(()=>null);
        if (blocked?.val() === true || blockedBy?.val() === true) { showAlert('Messaging is blocked for this friend.'); return; }
        const dataUrl = await new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>resolve(r.result); r.onerror=reject; r.readAsDataURL(file); });
        const roomId=getRoomId(currentUser.username, activeFriend.username); await ensureChatMembership(activeFriend);
        await db.ref(`chats/${roomId}`).push({sender:currentUser.username,type:'file',url:dataUrl,fileName:file.name,size:file.size,mimeType:file.type||'application/octet-stream',time:Date.now()});
    } catch(e) { console.error(e); showAlert('Could not send this file.'); }
}

let liveLocationWatchId = null;
let liveLocationMessageRef = null;
function sendLocationMessage() {
    if (!activeFriend) return;
    if (!navigator.geolocation) { showAlert('This browser does not support location.'); return; }
    navigator.geolocation.getCurrentPosition(async pos => {
        try {
            const roomId=getRoomId(currentUser.username, activeFriend.username); await ensureChatMembership(activeFriend);
            await db.ref(`chats/${roomId}`).push({sender:currentUser.username,type:'location',lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:Math.round(pos.coords.accuracy||0),time:Date.now()});
        } catch(e) { showAlert('Could not send location.'); }
    }, err => showAlert('Location permission was denied or unavailable.'), {enableHighAccuracy:true,timeout:10000,maximumAge:0});
}
function startLiveLocation() {
    if (!activeFriend) return;
    if (!navigator.geolocation) { showAlert('Live location is not supported.'); return; }
    if (liveLocationWatchId !== null) { showAlert('Live location is already sharing.'); return; }
    const roomId=getRoomId(currentUser.username, activeFriend.username);
    ensureChatMembership(activeFriend).then(()=>{
        liveLocationMessageRef=db.ref(`chats/${roomId}`).push();
        liveLocationMessageRef.set({sender:currentUser.username,type:'liveLocation',lat:null,lng:null,accuracy:null,active:true,startedAt:Date.now(),time:Date.now()});
        liveLocationWatchId=navigator.geolocation.watchPosition(pos=>{
            if(liveLocationMessageRef) liveLocationMessageRef.update({lat:pos.coords.latitude,lng:pos.coords.longitude,accuracy:Math.round(pos.coords.accuracy||0),updatedAt:Date.now(),active:true});
        }, ()=>{}, {enableHighAccuracy:true,maximumAge:3000,timeout:10000});
        showAlert('Live location sharing started. Use Stop Live Location from the message to stop it.');
    }).catch(()=>showAlert('Could not start live location.'));
}
async function stopLiveLocation() {
    if (liveLocationWatchId !== null) { navigator.geolocation.clearWatch(liveLocationWatchId); liveLocationWatchId=null; }
    if (liveLocationMessageRef) { await liveLocationMessageRef.update({active:false,endedAt:Date.now()}).catch(()=>{}); liveLocationMessageRef=null; }
}
function openMapLocation(lat,lng){ if(typeof lat!=='number'||typeof lng!=='number') return; window.open(`https://www.google.com/maps?q=${encodeURIComponent(lat+','+lng)}`,'_blank','noopener'); }

function getSupportedAudioMimeType() {
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
        'audio/ogg'
    ];
    if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    return types.find(type => MediaRecorder.isTypeSupported(type)) || '';
}


/* V37 MEDIA BUSY FIX
   Prevents this app's own recorder/call stream from holding the microphone/camera.
   A browser cannot release a device held by a different app/tab, so we also give
   a clear fallback message for that case.
*/
function stopOwnedMediaBeforeCall() {
    try {
        if (mediaRecorder) {
            if (mediaRecorder.state === 'recording') {
                try { mediaRecorder.stop(); } catch (_) {}
            }
        }
    } catch (_) {}

    if (recordingStream) {
        try { recordingStream.getTracks().forEach(track => track.stop()); } catch (_) {}
    }
    recordingStream = null;
    mediaRecorder = null;
    audioChunks = [];
    clearInterval(recordTimerInterval);
    recordTimerInterval = null;

    const recordingGroup = document.getElementById('recording-input-group');
    const normalGroup = document.getElementById('normal-input-group');
    if (recordingGroup) {
        recordingGroup.style.display = 'none';
        recordingGroup.classList.remove('recording-active');
    }
    if (normalGroup) normalGroup.style.display = 'flex';
}

function stopOwnedCallMedia() {
    // Never tear down a live call here; only release a stale local stream.
    if (peerConnection) return;
    if (localStream) {
        try { localStream.getTracks().forEach(track => track.stop()); } catch (_) {}
        localStream = null;
    }
    // A <video> element can keep a reference to the old MediaStream even after
    // its tracks are stopped. Detach it before requesting a new camera stream.
    const localVideo = document.getElementById('local-video');
    if (localVideo && localVideo.srcObject) {
        try { localVideo.pause(); } catch (_) {}
        try { localVideo.srcObject.getTracks().forEach(track => track.stop()); } catch (_) {}
        try { localVideo.srcObject = null; } catch (_) {}
        try { localVideo.load(); } catch (_) {}
    }
}

function waitForMediaRelease(ms = 180) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function releaseAppMediaHard() {
    // Stop every capture stream owned by this page, including a recorder that
    // may still be firing its asynchronous onstop handler.
    try { stopOwnedMediaBeforeCall(); } catch (_) {}
    try { stopOwnedCallMedia(); } catch (_) {}
    const localVideo = document.getElementById('local-video');
    if (localVideo) {
        try { localVideo.pause(); } catch (_) {}
        try {
            const s = localVideo.srcObject;
            if (s && typeof s.getTracks === 'function') s.getTracks().forEach(t => { try { t.stop(); } catch (_) {} });
        } catch (_) {}
        try { localVideo.srcObject = null; } catch (_) {}
        try { localVideo.removeAttribute('src'); } catch (_) {}
        try { localVideo.load(); } catch (_) {}
    }
    await waitForMediaRelease(250);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
}

async function startRecording() {
    if (!activeFriend) return;
    if (peerConnection || localStream) {
        showAlert('Voice recording is unavailable while a call is active.');
        return;
    }
    stopOwnedMediaBeforeCall();
    stopOwnedCallMedia();
    await waitForMediaRelease();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
        showAlert('Voice recording is not supported. Please use a modern HTTPS browser/app.');
        return;
    }
    if (mediaRecorder && mediaRecorder.state === 'recording') return;

    try {
        recordingStream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });

        const mimeType = getSupportedAudioMimeType();
        mediaRecorder = mimeType ? new MediaRecorder(recordingStream, { mimeType }) : new MediaRecorder(recordingStream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            if (event.data && event.data.size > 0) audioChunks.push(event.data);
        };

        mediaRecorder.onerror = () => {
            cleanupRecording();
            showAlert('Voice recording failed. Please try again.');
        };

        mediaRecorder.start(250);
        document.getElementById('normal-input-group').style.display = 'none';
        document.getElementById('recording-input-group').style.display = 'flex';
        document.getElementById('recording-input-group').classList.add('recording-active');
        recordSeconds = 0;
        document.getElementById('rec-timer').innerText = '0:00';
        clearInterval(recordTimerInterval);
        recordTimerInterval = setInterval(() => {
            recordSeconds++;
            const mins = Math.floor(recordSeconds / 60);
            const secs = (recordSeconds % 60).toString().padStart(2, '0');
            document.getElementById('rec-timer').innerText = `${mins}:${secs}`;
        }, 1000);
    } catch (err) {
        cleanupRecording();
        showAlert('Microphone permission denied or unavailable. Allow microphone access and try again.');
    }
}

function cleanupRecording() {
    clearInterval(recordTimerInterval);
    recordTimerInterval = null;
    if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
    }
    recordingStream = null;
    mediaRecorder = null;
    audioChunks = [];
    document.getElementById('recording-input-group').style.display = 'none';
    document.getElementById('recording-input-group').classList.remove('recording-active');
    document.getElementById('normal-input-group').style.display = 'flex';
}

function stopAndSendRecording() {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;
    const recorder = mediaRecorder;
    const stream = recordingStream;
    recorder.onstop = async () => {
        const chunks = audioChunks.slice();
        const mimeType = recorder.mimeType || (chunks[0] && chunks[0].type) || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: mimeType });
        if (!audioBlob.size || !activeFriend) {
            cleanupRecording();
            return;
        }

        try {
            const dataUrl = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(audioBlob);
            });
            const roomId = getRoomId(currentUser.username, activeFriend.username);
            await ensureChatMembership(activeFriend);
            const messageData = {
                sender: currentUser.username,
                url: dataUrl,
                type: 'audio',
                mimeType: mimeType,
                time: Date.now()
            };
            if (replyingTo && document.getElementById('reply-preview-bar').style.display === 'flex') {
                messageData.replyTo = { text: replyingTo.text, senderName: replyingTo.senderName };
            }
            await db.ref(`chats/${roomId}`).push(messageData);
            cancelReply();
        } catch (err) {
            showAlert('Could not send the voice message. Please try again.');
        } finally {
            if (stream) stream.getTracks().forEach(track => track.stop());
            cleanupRecording();
        }
    };
    recorder.stop();
}

function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        const recorder = mediaRecorder;
        recorder.onstop = () => cleanupRecording();
        recorder.stop();
    } else {
        cleanupRecording();
    }
}

function resetRecordingUI() {
    cleanupRecording();
}

function formatCallDuration(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function clearCallSetupTimer() {
    if (callSetupTimer) clearTimeout(callSetupTimer);
    callSetupTimer = null;
}

function clearIncomingCallWatchTimer() {
    if (incomingCallWatchTimer) clearTimeout(incomingCallWatchTimer);
    incomingCallWatchTimer = null;
}

function scheduleOutgoingCallTimeout() {
    clearCallSetupTimer();
    // Give remote users enough time to answer and ICE enough time to establish
    // a cross-network path. Do not label an answered call as "no answer".
    callSetupTimer = setTimeout(async () => {
        callSetupTimer = null;
        if (!activeCallId || isCallEnding || callWasConnected || !activeCallRef) return;
        let status = null;
        try {
            const snap = await activeCallRef.once('value');
            status = snap.val()?.status || null;
        } catch (_) {}
        if (status === 'connected' || callWasConnected) return;
        const reason = status === 'answered' ? 'connection_timeout' : 'no_answer';
        callHistoryStatus = reason;
        await writeCallHistory(reason);
        try { await activeCallRef.update({status:'ended', endReason:reason, endedAt:firebase.database.ServerValue.TIMESTAMP}); } catch (_) {}
        finishCall(false);
    }, 60000);
}

function scheduleIncomingCallExpiry(callId, callRef) {
    clearIncomingCallWatchTimer();
    incomingCallWatchTimer = setTimeout(async () => {
        incomingCallWatchTimer = null;
        if (!incomingCallData || incomingCallData.callId !== callId || peerConnection) return;
        callDirection = 'incoming';
        callPeerUsername = incomingCallData.callerUsername;
        callPeerName = incomingCallData.callerName || incomingCallData.callerUsername;
        currentCallType = incomingCallData.type || 'audio';
        activeCallId = callId;
        activeCallRef = callRef;
        callHistoryStatus = 'no_answer';
        await writeCallHistory('no_answer');
        try { await callRef.update({status:'ended', endReason:'no_answer', endedAt:firebase.database.ServerValue.TIMESTAMP}); } catch (_) {}
        stopRingtone();
        document.getElementById('incoming-call-screen')?.classList.add('hidden');
        incomingCallData = null;
        activeCallRef = null;
        activeCallId = null;
        callPeerUsername = null;
        callPeerName = null;
        callDirection = null;
        notifyNativeCallActive(false);
    }, 45000);
}

function setCallBusyLock() {
    if (callBusyLock) return false;
    callBusyLock = true;
    return true;
}

function stopIceRestartLoop() {
    if (iceRestartTimer) clearInterval(iceRestartTimer);
    iceRestartTimer = null;
    iceRestartInProgress = false;
}

async function createAndPublishIceRestartOffer() {
    if (!peerConnection || !activeCallRef || isCallEnding || callDirection !== 'outgoing') return;
    if (peerConnection.signalingState !== 'stable') return;
    try {
        iceRestartInProgress = true;
        setCallStatus('Reconnecting...');
        const offer = await peerConnection.createOffer({ iceRestart: true });
        await peerConnection.setLocalDescription(offer);
        await activeCallRef.child('callerCandidates').remove().catch(() => {});
        lastRestartOfferSdp = offer.sdp;
        lastRestartAnswerSdp = null;
        await activeCallRef.update({
            restartOffer: { type: offer.type, sdp: offer.sdp },
            restartAnswer: null,
            restartAt: firebase.database.ServerValue.TIMESTAMP
        });
    } catch (e) {
        console.warn('ICE restart offer failed:', e);
    } finally {
        iceRestartInProgress = false;
    }
}

async function handleRemoteRestartOffer(restartOffer) {
    if (!peerConnection || !activeCallRef || !restartOffer?.sdp || isCallEnding) return;
    if (lastRestartOfferSdp === restartOffer.sdp) return;
    if (peerConnection.signalingState !== 'stable') return;
    lastRestartOfferSdp = restartOffer.sdp;
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(restartOffer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        await activeCallRef.child('calleeCandidates').remove().catch(() => {});
        lastRestartAnswerSdp = answer.sdp;
        await activeCallRef.update({
            restartAnswer: { type: answer.type, sdp: answer.sdp },
            restartAnsweredAt: firebase.database.ServerValue.TIMESTAMP
        });
        await flushRemoteCandidates();
    } catch (e) {
        console.warn('ICE restart answer failed:', e);
    }
}

function startIceRestartLoop() {
    if (iceRestartTimer || isCallEnding) return;
    const attempt = async () => {
        if (!peerConnection || !activeCallRef || isCallEnding) return;
        if (peerConnection.connectionState === 'connected') {
            stopIceRestartLoop();
            return;
        }
        // Only the caller creates restart offers. The callee responds to them.
        if (callDirection !== 'outgoing' || iceRestartInProgress) return;
        await createAndPublishIceRestartOffer();
    };
    attempt();
    iceRestartTimer = setInterval(attempt, 5000);
}

function stopCallTimer() {
    if (callTimerInterval) clearInterval(callTimerInterval);
    if (callTimerAnimation) cancelAnimationFrame(callTimerAnimation);
    callTimerInterval = null;
    callTimerAnimation = null;
    if (callConnectionGraceTimer) clearTimeout(callConnectionGraceTimer);
    callConnectionGraceTimer = null;
    callConnectedAt = null;
}

function renderCallTimer() {
    if (!callConnectedAt) return;
    const text = `Connected · ${formatCallDuration(Date.now() - callConnectedAt)}`;
    ['audio-call-status', 'video-call-status'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    });
}

function startCallTimer(connectedAt) {
    const ts = Number(connectedAt);
    if (!Number.isFinite(ts) || ts <= 0) return;
    callConnectedAt = ts;
    callWasConnected = true;
    callStartedAt = ts;
    if (callTimerInterval) clearInterval(callTimerInterval);
    if (callTimerAnimation) cancelAnimationFrame(callTimerAnimation);
    renderCallTimer();
    callTimerInterval = setInterval(renderCallTimer, 1000);
    const update = () => {
        if (!callConnectedAt) return;
        renderCallTimer();
        callTimerAnimation = requestAnimationFrame(update);
    };
    callTimerAnimation = requestAnimationFrame(update);
}

async function ensureSharedConnectedAt() {
    if (!activeCallRef) return null;
    try {
        const result = await activeCallRef.child('connectedAt').transaction(current => current || Date.now());
        const value = result && result.snapshot ? result.snapshot.val() : null;
        if (value) {
            await activeCallRef.update({ status: 'connected' }).catch(() => {});
            startCallTimer(value);
            return value;
        }
    } catch (e) {
        console.warn('connectedAt transaction failed', e);
    }
    const snap = await activeCallRef.child('connectedAt').once('value').catch(() => null);
    if (snap && snap.exists()) { startCallTimer(snap.val()); return snap.val(); }
    return null;
}

function setCallStatus(text) {
    ['audio-call-status', 'video-call-status'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    });
    const miniStatus = document.getElementById('call-mini-status');
    if (miniStatus && activeCallId) miniStatus.textContent = text;
}

function notifyNativeCallActive(active) {
    try {
        if (window.AndroidApp?.setCallActive) {
            window.AndroidApp.setCallActive(!!active);
        }
    } catch (_) {}
}

function showCallScreen(type) {
    callScreenMinimized = false;
    document.getElementById('call-mini-bar')?.classList.add('hidden');
    document.getElementById('audio-call-screen').classList.toggle('hidden', type !== 'audio');
    document.getElementById('video-call-screen').classList.toggle('hidden', type !== 'video');
    // Android: keep the CPU/microphone session alive when the screen turns off
    // and keep a foreground call service running while the call is active.
    notifyNativeCallActive(true);
}

function updateCallMiniBar() {
    initDraggableCallMiniBar();
    if (!activeCallId) return;
    const name = callPeerName || activeFriend?.name || callPeerUsername || 'Call';
    const nameEl = document.getElementById('call-mini-name');
    const statusEl = document.getElementById('call-mini-status');
    const avatar = document.getElementById('call-mini-avatar');
    if (nameEl) nameEl.textContent = name;
    if (statusEl) statusEl.textContent = document.getElementById('audio-call-status')?.textContent || document.getElementById('video-call-status')?.textContent || 'Call in progress';
    if (avatar) {
        const pic = activeFriend?.profilePic || '';
        avatar.innerHTML = pic ? `<img src="${escapeHtml(pic)}" alt="">` : escapeHtml((name || 'U')[0].toUpperCase());
    }
}

function initDraggableCallMiniBar() {
    const bar = document.getElementById('call-mini-bar');
    if (!bar || bar.dataset.dragReady === '1') return;
    bar.dataset.dragReady = '1';
    let dragging = false, moved = false, startX = 0, startY = 0, startLeft = 0, startTop = 0, pointerId = null;

    try {
        const saved = JSON.parse(localStorage.getItem('messenger_call_mini_pos') || 'null');
        if (saved && Number.isFinite(saved.left) && Number.isFinite(saved.top)) {
            const maxL = Math.max(8, window.innerWidth - bar.offsetWidth - 8);
            const maxT = Math.max(8, window.innerHeight - bar.offsetHeight - 8);
            bar.style.left = Math.min(Math.max(8, saved.left), maxL) + 'px';
            bar.style.top = Math.min(Math.max(8, saved.top), maxT) + 'px';
            bar.style.right = 'auto'; bar.style.bottom = 'auto';
        }
    } catch (_) {}

    const isControl = target => target && target.closest && target.closest('button');
    bar.addEventListener('pointerdown', e => {
        if (isControl(e.target)) return;
        pointerId = e.pointerId;
        dragging = true; moved = false;
        const r = bar.getBoundingClientRect();
        startX = e.clientX; startY = e.clientY; startLeft = r.left; startTop = r.top;
        bar.classList.add('dragging');
        try { bar.setPointerCapture(pointerId); } catch (_) {}
        e.preventDefault();
    });
    bar.addEventListener('pointermove', e => {
        if (!dragging || e.pointerId !== pointerId) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 5) moved = true;
        const maxL = Math.max(8, window.innerWidth - bar.offsetWidth - 8);
        const maxT = Math.max(8, window.innerHeight - bar.offsetHeight - 8);
        const left = Math.min(Math.max(8, startLeft + dx), maxL);
        const top = Math.min(Math.max(8, startTop + dy), maxT);
        bar.style.left = left + 'px'; bar.style.top = top + 'px';
        bar.style.right = 'auto'; bar.style.bottom = 'auto';
    });
    const finish = e => {
        if (!dragging || (e && e.pointerId !== pointerId)) return;
        dragging = false; bar.classList.remove('dragging');
        const r = bar.getBoundingClientRect();
        try { localStorage.setItem('messenger_call_mini_pos', JSON.stringify({left:r.left, top:r.top})); } catch (_) {}
    };
    bar.addEventListener('pointerup', finish);
    bar.addEventListener('pointercancel', finish);
    window.addEventListener('resize', () => {
        if (bar.classList.contains('hidden')) return;
        const r = bar.getBoundingClientRect();
        const left = Math.min(Math.max(8, r.left), Math.max(8, innerWidth - bar.offsetWidth - 8));
        const top = Math.min(Math.max(8, r.top), Math.max(8, innerHeight - bar.offsetHeight - 8));
        bar.style.left = left + 'px'; bar.style.top = top + 'px'; bar.style.right = 'auto'; bar.style.bottom = 'auto';
    });
    bar.addEventListener('click', e => {
        if (moved && !isControl(e.target)) { e.preventDefault(); e.stopPropagation(); }
        moved = false;
    }, true);
}

function minimizeCallScreen() {
    if (!activeCallId || isCallEnding) return;
    callScreenMinimized = true;
    document.getElementById('audio-call-screen').classList.add('hidden');
    document.getElementById('video-call-screen').classList.add('hidden');
    updateCallMiniBar();
    document.getElementById('call-mini-bar')?.classList.remove('hidden');
}

function restoreCallScreen() {
    if (!activeCallId) return;
    callScreenMinimized = false;
    document.getElementById('call-mini-bar')?.classList.add('hidden');
    showCallScreen(currentCallType);
}

function stopMediaStream(stream) {
    if (stream) stream.getTracks().forEach(track => { try { track.stop(); } catch (_) {} });
}

function removeCallListeners() {
    stopIceRestartLoop();
    clearCallSetupTimer();
    clearIncomingCallWatchTimer();
    if (!activeCallRef) return;
    activeCallRef.off();
    activeCallRef = null;
    callListenersAttached = false;
}

async function addRemoteCandidate(candidate) {
    if (!peerConnection || !candidate) return;
    if (peerConnection.remoteDescription && peerConnection.remoteDescription.type) {
        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
            console.warn('ICE candidate error; queueing for retry:', e);
            if (!callCandidateQueue.some(c => c && c.candidate === candidate.candidate && c.sdpMid === candidate.sdpMid && c.sdpMLineIndex === candidate.sdpMLineIndex)) {
                callCandidateQueue.push(candidate);
            }
        }
    } else {
        if (!callCandidateQueue.some(c => c && c.candidate === candidate.candidate && c.sdpMid === candidate.sdpMid && c.sdpMLineIndex === candidate.sdpMLineIndex)) {
            callCandidateQueue.push(candidate);
        }
    }
}

async function flushRemoteCandidates(retry = 0) {
    if (!peerConnection || !peerConnection.remoteDescription) return;
    const queue = callCandidateQueue.splice(0);
    for (const candidate of queue) await addRemoteCandidate(candidate);
    if (callCandidateQueue.length && retry < 4) {
        setTimeout(() => flushRemoteCandidates(retry + 1).catch(() => {}), 300 * (retry + 1));
    }
}

async function prepareLocalMedia() {
    // V45.6: no TURN credentials are required.
    if (!window.isSecureContext && location.protocol !== 'localhost:' && location.hostname !== 'localhost') {
        throw new Error('SECURE_CONTEXT_REQUIRED');
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MEDIA_API_UNAVAILABLE');
    }

    // IMPORTANT: completely release this page's recorder/camera/video element
    // before asking Chrome/Android for call media. This fixes the common
    // NotReadableError caused by a stale MediaStream owned by this same app.
    await releaseAppMediaHard();

    const audio = { echoCancellation: true, noiseSuppression: true, autoGainControl: true };

    const requestMedia = async () => {
        if (currentCallType === 'video') {
            const preferred = {
                audio,
                video: {
                    facingMode: { ideal: usingFrontCamera ? 'user' : 'environment' },
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };
            try {
                return await navigator.mediaDevices.getUserMedia(preferred);
            } catch (firstErr) {
                // Basic constraints fallback for Android/WebView.
                try {
                    return await navigator.mediaDevices.getUserMedia({ audio, video: true });
                } catch (secondErr) {
                    secondErr._firstMediaError = firstErr;
                    throw secondErr;
                }
            }
        }
        return await navigator.mediaDevices.getUserMedia({ audio, video: false });
    };

    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            localStream = await requestMedia();
            break;
        } catch (err) {
            lastErr = err;
            const name = String(err?.name || '').toLowerCase();
            if (name !== 'notreadableerror' && name !== 'aborterror') throw err;
            // Android/Chrome sometimes needs the capture device to settle after
            // MediaRecorder.stop() or after a previous failed getUserMedia().
            await releaseAppMediaHard();
            await waitForMediaRelease(350 + attempt * 350);
        }
    }
    if (!localStream) throw lastErr || new Error('MEDIA_CAPTURE_FAILED');

    if (!localStream || !localStream.getTracks().length) throw new Error('NO_MEDIA_TRACKS');
    return localStream;
}

function explainCallError(err) {
    const name = String(err?.name || '').toLowerCase();
    const msg = String(err?.message || '').toLowerCase();
    if (err?.message === 'TURN_CREDENTIALS_NOT_CONFIGURED') return 'TURN is disabled in this version. Please use a secure HTTPS connection for calls.';
    if (err?.message === 'SECURE_CONTEXT_REQUIRED') return 'Call needs HTTPS. Open the deployed Firebase/HTTPS link, not the .html file directly.';
    if (err?.message === 'MEDIA_API_UNAVAILABLE') return 'Your browser/WebView does not provide microphone access. Use Chrome/Android WebView over HTTPS.';
    if (err?.message === 'NO_MEDIA_TRACKS') return 'Microphone/camera did not return a usable media stream.';
    if (name === 'notallowederror' || name === 'securityerror') return 'Microphone/camera permission was blocked. Allow it for this site and try again.';
    if (name === 'notfounderror') return currentCallType === 'video' ? 'No camera or microphone was found on this device.' : 'No microphone was found on this device.';
    if (name === 'notreadableerror' || name === 'aborterror') return currentCallType === 'video'
        ? 'Camera/microphone could not be opened. The app already released its own media. Close other tabs/apps using the camera or microphone, then retry.'
        : 'Microphone could not be opened. The app already released its own recorder. Close other tabs/apps using the microphone, then retry.';
    if (name === 'overconstrainederror') return 'This device rejected the camera settings. Try the call again; a basic camera fallback is enabled.';
    if (msg.includes('permission_denied') || msg.includes('permission denied')) return 'Firebase denied the call signal. Publish the included database.rules.json and make sure both users are signed in.';
    if (msg.includes('network') || msg.includes('offline')) return 'Network connection failed while starting the call. Check internet and Firebase connection.';
    return `Call could not start${err?.message ? `: ${err.message}` : '.'}`;
}

function setAudioOutputMode(useSpeaker) {
    isSpeakerOn = !!useSpeaker;
    // Android APK: use a native WebView bridge when available so the initial
    // route is the earpiece and the button switches to the loudspeaker.
    try {
        if (window.AndroidAudio && typeof window.AndroidAudio.setSpeakerphone === 'function') {
            window.AndroidAudio.setSpeakerphone(isSpeakerOn);
        }
    } catch (e) { console.warn('Android audio route unavailable:', e); }
    const audio = document.getElementById('remote-audio');
    const video = document.getElementById('remote-video');
    if (audio) { audio.muted = false; audio.volume = 1; }
    if (video) { video.muted = false; video.volume = 1; }
    updateSpeakerButtons();
}

function bindRemoteStream(stream) {
    remoteStream = stream;
    if (currentCallType === 'video') {
        const video = document.getElementById('remote-video');
        video.srcObject = stream;
        video.muted = false;
        video.volume = 1;
        video.play().catch(() => {});
        setAudioOutputMode(isSpeakerOn);
    } else {
        const audio = document.getElementById('remote-audio');
        audio.srcObject = stream;
        audio.muted = false;
        audio.volume = 1;
        audio.play().catch(() => {});
        setAudioOutputMode(isSpeakerOn);
    }
}

function toggleLocalVideoSize() {
    const video = document.getElementById('local-video');
    if (!video) return;
    localVideoExpanded = !localVideoExpanded;
    video.classList.toggle('expanded', localVideoExpanded);
    video.setAttribute('aria-label', localVideoExpanded ? 'Tap to minimize camera' : 'Tap to enlarge camera');
}

function resetCallUI() {
    callScreenMinimized = false;
    document.getElementById('audio-call-screen').classList.add('hidden');
    document.getElementById('video-call-screen').classList.add('hidden');
    document.getElementById('incoming-call-screen').classList.add('hidden');
    document.getElementById('call-mini-bar')?.classList.add('hidden');
    notifyNativeCallActive(false);
    const remoteAudio = document.getElementById('remote-audio');
    if (remoteAudio) { remoteAudio.pause(); remoteAudio.srcObject = null; }
    ['remote-video', 'local-video'].forEach(id => {
        const v = document.getElementById(id);
        if (v) { v.pause(); v.srcObject = null; }
    });
}

function listenForIncomingCalls() {
    if (!currentUser) return;
    // Keep the exact Query instance so repeated init/reconnect calls always detach
    // the previous listener. Calling off() on a newly-created equivalent Query is
    // not a reliable substitute for retaining the original listener handle.
    if (incomingCallQuery) {
        try { incomingCallQuery.off('child_added'); } catch (_) {}
    }
    const ref = db.ref(`calls/${currentUser.username}`).orderByChild('status').equalTo('calling');
    incomingCallQuery = ref;
    ref.on('child_added', async snapshot => {
        const call = snapshot.val();
        if (!call || !call.callerUsername || call.calleeUsername !== currentUser.username || call.status !== 'calling') return;
        if (peerConnection || incomingCallData || activeCallId || incomingCallProcessing) return;

        const callId = snapshot.key;
        incomingCallProcessing = true;
        try {
            const createdAt = Number(call.createdAt || 0);
            if (createdAt && Date.now() - createdAt > 60000) {
                await snapshot.ref.update({ status: 'ended', endReason: 'expired', endedAt: firebase.database.ServerValue.TIMESTAMP }).catch(() => {});
                return;
            }

            const [blocked, blockedBy] = await Promise.all([
                db.ref(`blocked/${currentUser.username}/${call.callerUsername}`).once('value').catch(() => null),
                db.ref(`blocked/${call.callerUsername}/${currentUser.username}`).once('value').catch(() => null)
            ]);
            if (blocked?.val() === true || blockedBy?.val() === true) {
                await snapshot.ref.update({ status: 'ended', endReason: 'blocked', endedAt: firebase.database.ServerValue.TIMESTAMP }).catch(() => {});
                return;
            }

            // Claim this ringing call locally before rendering UI so two child_added
            // callbacks cannot race and display two incoming-call screens.
            incomingCallData = { ...call, callId, calleeUsername: currentUser.username };
            callDirection = 'incoming';
            callPeerUsername = call.callerUsername;
            callPeerName = call.callerName || call.callerUsername;
            currentCallType = call.type === 'video' ? 'video' : 'audio';
            activeCallId = callId;
            activeCallRef = snapshot.ref;

            const name = call.callerName || call.callerUsername;
            const nameEl = document.getElementById('incoming-caller-name');
            if (nameEl) nameEl.innerText = `${name} is calling...`;
            const typeEl = document.querySelector('#incoming-call-screen .call-incoming-type');
            if (typeEl) typeEl.innerText = currentCallType === 'video' ? 'Video call' : 'Audio call';
            const av = document.getElementById('incoming-call-avatar');
            if (av) {
                av.innerHTML = call.callerPic ? `<img src="${call.callerPic}">` : '';
                if (!call.callerPic) av.innerText = name[0]?.toUpperCase() || 'U';
            }
            document.getElementById('incoming-call-screen')?.classList.remove('hidden');
            notifyNativeCallActive(true);
            startRingtone();
            showBrowserNotification(`${name} is calling`, currentCallType === 'video' ? 'Video call' : 'Audio call', `call-${callId}`);
            scheduleIncomingCallExpiry(callId, activeCallRef);

            activeCallRef.on('value', snap2 => {
                const updated = snap2.val();
                if (!updated || !incomingCallData || incomingCallData.callId !== callId) return;
                if (updated.status === 'ended' || updated.endReason === 'cancelled' || updated.endReason === 'rejected' || updated.endReason === 'no_answer' || updated.endReason === 'blocked') {
                    stopRingtone();
                    document.getElementById('incoming-call-screen')?.classList.add('hidden');
                    clearIncomingCallWatchTimer();
                    incomingCallData = null;
                    activeCallRef?.off();
                    activeCallRef = null;
                    activeCallId = null;
                    callPeerUsername = null;
                    callPeerName = null;
                    callDirection = null;
                    notifyNativeCallActive(false);
                }
            });
        } finally {
            incomingCallProcessing = false;
        }
    });
}

async function startAudioCall() {
    if (!currentUser || !activeFriend || peerConnection || incomingCallData || activeCallId || callBusyLock) return;
    if (!setCallBusyLock()) return;
    try {
        stopOwnedMediaBeforeCall();
        await waitForMediaRelease();
        const [a,b] = await Promise.all([db.ref(`blocked/${currentUser.username}/${activeFriend.username}`).once('value').catch(()=>null), db.ref(`blocked/${activeFriend.username}/${currentUser.username}`).once('value').catch(()=>null)]);
        if (a?.val() === true || b?.val() === true) { showAlert('Calls are blocked for this friend.'); return; }
        currentCallType = 'audio';
        callDirection = 'outgoing';
        callPeerUsername = activeFriend.username;
        callPeerName = activeFriend.name || activeFriend.username;
        isMuted = false; isSpeakerOn = false; callEndedByUser = false;
        await createOutgoingCall();
    } finally { callBusyLock = false; }
}

async function startVideoCall() {
    if (!currentUser || !activeFriend || peerConnection || incomingCallData || activeCallId || callBusyLock) return;
    if (!setCallBusyLock()) return;
    try {
        stopOwnedMediaBeforeCall();
        await waitForMediaRelease();
        const [a,b] = await Promise.all([db.ref(`blocked/${currentUser.username}/${activeFriend.username}`).once('value').catch(()=>null), db.ref(`blocked/${activeFriend.username}/${currentUser.username}`).once('value').catch(()=>null)]);
        if (a?.val() === true || b?.val() === true) { showAlert('Calls are blocked for this friend.'); return; }
        currentCallType = 'video';
        callDirection = 'outgoing';
        callPeerUsername = activeFriend.username;
        callPeerName = activeFriend.name || activeFriend.username;
        isMuted = false; isSpeakerOn = false; callEndedByUser = false;
        await createOutgoingCall();
    } finally { callBusyLock = false; }
}

function attachPeerConnectionHandlers() {
    peerConnection.ontrack = event => {
        const stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
        bindRemoteStream(stream);
    };
    peerConnection.onconnectionstatechange = async () => {
        if (!peerConnection) return;
        const state = peerConnection.connectionState;
        if (state === 'connected') {
            stopIceRestartLoop();
            setCallStatus('Connected');
            await ensureSharedConnectedAt();
        } else if ((state === 'disconnected' || state === 'failed') && !isCallEnding) {
            // V10: NEVER end a call automatically because of ICE/network state.
            // Keep the call session alive and repeatedly attempt ICE restart.
            setCallStatus('Reconnecting...');
            startIceRestartLoop();
        }
    };
    peerConnection.onicecandidate = event => {
        if (event.candidate && activeCallRef) {
            const branch = callDirection === 'outgoing' ? 'callerCandidates' : 'calleeCandidates';
            activeCallRef.child(branch).push({
                candidate: event.candidate.candidate,
                sdpMid: event.candidate.sdpMid,
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                usernameFragment: event.candidate.usernameFragment || null
            }).catch(e => console.warn('ICE candidate write failed:', e));
        }
    };
    peerConnection.onicecandidateerror = event => {
        console.warn('WebRTC ICE candidate error:', event?.errorCode, event?.errorText, event?.url || '');
    };
    peerConnection.oniceconnectionstatechange = () => {
        if (!peerConnection || isCallEnding) return;
        const state = peerConnection.iceConnectionState;
        if (state === 'checking') {
            setCallStatus('Connecting...');
        } else if (state === 'connected' || state === 'completed') {
            if (callConnectionGraceTimer) { clearTimeout(callConnectionGraceTimer); callConnectionGraceTimer = null; }
            stopIceRestartLoop();
            ensureSharedConnectedAt().catch(() => {});
        } else if (state === 'disconnected') {
            setCallStatus('Reconnecting...');
            if (!callConnectionGraceTimer) {
                callConnectionGraceTimer = setTimeout(() => {
                    callConnectionGraceTimer = null;
                    if (peerConnection && !isCallEnding && peerConnection.iceConnectionState === 'disconnected') startIceRestartLoop();
                }, 2500);
            }
        } else if (state === 'failed') {
            if (callConnectionGraceTimer) { clearTimeout(callConnectionGraceTimer); callConnectionGraceTimer = null; }
            setCallStatus('Reconnecting...');
            startIceRestartLoop();
        }
    };
}

async function createOutgoingCall() {
    try {
        isCallEnding = false;
        stopCallTimer();
        stopIceRestartLoop();
        callCandidateQueue = [];
        lastRemoteOfferSdp = null;
        lastRestartOfferSdp = null;
        lastRestartAnswerSdp = null;
        await prepareLocalMedia();
        if (currentCallType === 'video') {
            const localVideo = document.getElementById('local-video');
            localVideo.srcObject = localStream;
            localVideo.muted = true;
            localVideo.play().catch(() => {});
            document.getElementById('video-call-name').innerText = `Calling ${activeFriend.name}`;
        } else {
            document.getElementById('audio-call-name').innerText = `Calling ${activeFriend.name}`;
            const av = document.getElementById('audio-call-avatar');
            if (activeFriend.profilePic) av.innerHTML = `<img src="${activeFriend.profilePic}">`;
            else av.innerText = (activeFriend.name || 'U')[0].toUpperCase();
        }
        setCallStatus('Calling...');
        showCallScreen(currentCallType);
        peerConnection = new RTCPeerConnection(servers);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        attachPeerConnectionHandlers();

        // Create the call record BEFORE setLocalDescription().
        // Chrome may emit ICE candidates immediately after setLocalDescription;
        // having the parent call node already present prevents the first
        // candidates from being rejected by Firebase Rules.
        activeCallRef = db.ref(`calls/${activeFriend.username}`).push();
        activeCallId = activeCallRef.key;
        await activeCallRef.set({
            callerUsername: currentUser.username,
            callerName: currentUser.name || currentUser.username,
            callerPic: currentUser.profilePic || '',
            calleeUsername: activeFriend.username,
            type: currentCallType,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        activeCallRef.on('value', async snap => {
            const call = snap.val();
            if (!call || isCallEnding || !peerConnection) return;
            if (call.answer && call.answer.sdp && (!peerConnection.currentRemoteDescription || peerConnection.currentRemoteDescription.sdp !== call.answer.sdp)) {
                try {
                    if (peerConnection.signalingState !== 'stable' && peerConnection.signalingState !== 'have-local-offer') { return; }
                    await peerConnection.setRemoteDescription(new RTCSessionDescription(call.answer));
                    await flushRemoteCandidates();
                } catch (e) { console.error('Remote answer error:', e); }
            }
            if (call.restartAnswer && call.restartAnswer.sdp && call.restartAnswer.sdp !== lastRestartAnswerSdp) {
                try {
                    if (peerConnection.signalingState === 'have-local-offer') {
                        await peerConnection.setRemoteDescription(new RTCSessionDescription(call.restartAnswer));
                        lastRestartAnswerSdp = call.restartAnswer.sdp;
                        await flushRemoteCandidates();
                    }
                } catch (e) { console.warn('Restart answer error:', e); }
            }
            if (call.status === 'connected' && call.connectedAt) { stopRingtone(); startCallTimer(call.connectedAt); }
            if (call.status === 'ended') {
                if (!callHistoryWritten) await writeCallHistory(call.endReason || (callWasConnected ? 'completed' : 'cancelled'));
                finishCall(false);
            }
        });
        activeCallRef.child('calleeCandidates').on('child_added', snap => addRemoteCandidate(snap.val()));

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        await activeCallRef.update({
            status: 'calling',
            offer: { type: offer.type, sdp: offer.sdp }
        });
        scheduleOutgoingCallTimeout();
    } catch (err) {
        console.error('Outgoing call error:', err);
        try {
            if (activeCallRef) await activeCallRef.update({ status: 'ended', endReason: 'setup_failed', endedAt: firebase.database.ServerValue.TIMESTAMP }).catch(() => {});
        } catch (_) {}
        showAlert(explainCallError(err));
        finishCall(true);
    }
}

async function handleRemoteOffer(call) {
    if (!peerConnection || !call || !call.offer || !call.offer.sdp) return;
    if (lastRemoteOfferSdp === call.offer.sdp) return;
    lastRemoteOfferSdp = call.offer.sdp;
    try {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(call.offer));
        await flushRemoteCandidates();
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        if (activeCallRef) {
            await activeCallRef.update({
                status: 'answered',
                answer: { type: answer.type, sdp: answer.sdp },
                answeredAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    } catch (e) {
        console.warn('Remote offer handling failed:', e);
    }
}

async function acceptIncomingCall() {
    if (!incomingCallData || peerConnection || callBusyLock) return;
    if (!setCallBusyLock()) return;
    stopRingtone();
    clearIncomingCallWatchTimer();
    callEndedByUser = false;
    try {
        isCallEnding = false;
        stopCallTimer();
        stopIceRestartLoop();
        currentCallType = incomingCallData.type || 'audio';
        callDirection = 'incoming';
        callPeerUsername = incomingCallData.callerUsername;
        callPeerName = incomingCallData.callerName || incomingCallData.callerUsername;
        activeCallId = incomingCallData.callId;
        activeCallRef = db.ref(`calls/${currentUser.username}/${activeCallId}`);
        document.getElementById('incoming-call-screen').classList.add('hidden');
        const userSnap = await db.ref(`users/${incomingCallData.callerUsername}`).once('value');
        if (!userSnap.exists()) throw new Error('Caller not found.');
        activeFriend = userSnap.val();
        callCandidateQueue = [];
        lastRemoteOfferSdp = null;
        lastRestartOfferSdp = null;
        lastRestartAnswerSdp = null;
        await prepareLocalMedia();
        if (currentCallType === 'video') {
            const localVideo = document.getElementById('local-video');
            localVideo.srcObject = localStream;
            localVideo.muted = true;
            localVideo.play().catch(() => {});
            document.getElementById('video-call-name').innerText = `Connected with ${activeFriend.name}`;
        } else {
            document.getElementById('audio-call-name').innerText = `Connected with ${activeFriend.name}`;
            const av = document.getElementById('audio-call-avatar');
            if (activeFriend.profilePic) av.innerHTML = `<img src="${activeFriend.profilePic}">`;
            else av.innerText = (activeFriend.name || 'U')[0].toUpperCase();
        }
        setCallStatus('Connecting...');
        showCallScreen(currentCallType);
        peerConnection = new RTCPeerConnection(servers);
        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        attachPeerConnectionHandlers();
        activeCallRef.child('callerCandidates').on('child_added', snap => addRemoteCandidate(snap.val()));
        const snap = await activeCallRef.once('value');
        const call = snap.val();
        if (!call || !call.offer) throw new Error('Call offer expired.');
        await handleRemoteOffer(call);
        activeCallRef.on('value', async snap2 => {
            const c = snap2.val();
            if (!c || isCallEnding || !peerConnection) return;
            if (c.offer && c.offer.sdp !== lastRemoteOfferSdp) await handleRemoteOffer(c);
            if (c.restartOffer && c.restartOffer.sdp !== lastRestartOfferSdp) {
                await handleRemoteRestartOffer(c.restartOffer);
            }
            if (c.status === 'connected' && c.connectedAt) startCallTimer(c.connectedAt);
            if (c.status === 'ended') {
                if (!callHistoryWritten) await writeCallHistory(c.endReason || (callWasConnected ? 'completed' : 'cancelled'));
                finishCall(false);
            }
        });
        incomingCallData = null;
    } catch (err) {
        console.error('Accept call error:', err);
        showAlert(explainCallError(err));
        await rejectIncomingCall();
        finishCall(true);
    } finally {
        callBusyLock = false;
    }
}

async function rejectIncomingCall() {
    clearIncomingCallWatchTimer();
    stopRingtone();
    if (incomingCallData) {
        callDirection = 'incoming';
        callPeerUsername = incomingCallData.callerUsername;
        callPeerName = incomingCallData.callerName || incomingCallData.callerUsername;
        currentCallType = incomingCallData.type || 'audio';
        activeCallId = incomingCallData.callId;
        activeCallRef = db.ref(`calls/${currentUser.username}/${incomingCallData.callId}`);
        callHistoryStatus = 'rejected';
        await writeCallHistory('rejected');
        await activeCallRef.update({ status: 'ended', endReason: 'rejected', endedAt: firebase.database.ServerValue.TIMESTAMP }).catch(() => {});
        activeCallRef.off();
    }
    incomingCallData = null;
    document.getElementById('incoming-call-screen').classList.add('hidden');
    activeCallRef = null;
    activeCallId = null;
}

function toggleAudioMute() {
    isMuted = !isMuted;
    if (localStream) localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    const btn = document.getElementById('btn-audio-mute');
    if (btn) {
        btn.classList.toggle('active', isMuted);
        btn.innerHTML = isMuted ? '<i class="fa-solid fa-microphone-slash"></i>' : '<i class="fa-solid fa-microphone"></i>';
    }
}

function toggleVideoMute() {
    isMuted = !isMuted;
    if (localStream) localStream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    const btn = document.getElementById('btn-video-mute');
    if (btn) {
        btn.classList.toggle('active', isMuted);
        btn.innerHTML = isMuted ? '<i class="fa-solid fa-microphone-slash"></i>' : '<i class="fa-solid fa-microphone"></i>';
    }
}

function toggleVideoCamera() {
    if (!localStream || currentCallType !== 'video') return;
    const track = localStream.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    const btn = document.getElementById('btn-video-camera');
    if (btn) {
        btn.classList.toggle('active', !track.enabled);
        btn.innerHTML = track.enabled ? '<i class="fa-solid fa-video"></i>' : '<i class="fa-solid fa-video-slash"></i>';
    }
}

function updateSpeakerButtons() {
    ['btn-audio-speaker', 'btn-video-speaker'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.classList.toggle('active', isSpeakerOn);
        btn.innerHTML = isSpeakerOn ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-low"></i>';
        btn.title = isSpeakerOn ? 'Speaker: ON — tap for earpiece' : 'Earpiece: ON — tap for speaker';
    });
}

function toggleSpeaker() {
    setAudioOutputMode(!isSpeakerOn);
}

function toggleVideoSpeaker() {
    // Video remote audio is carried by the video element.
    setAudioOutputMode(!isSpeakerOn);
}

async function flipCamera() {
    if (!localStream || !peerConnection || currentCallType !== 'video') return;
    const oldTrack = localStream.getVideoTracks()[0];
    const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
    const targetFacing = usingFrontCamera ? 'environment' : 'user';
    let newStream = null;
    try {
        // Acquire the new lens FIRST. Stopping the current camera before this
        // request can cause black-camera/resource errors on Android.
        newStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: targetFacing }, width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false
        });
        const newTrack = newStream.getVideoTracks()[0];
        if (!newTrack) throw new Error('NO_CAMERA_TRACK');
        if (sender) await sender.replaceTrack(newTrack);
        localStream.addTrack(newTrack);
        if (oldTrack) {
            try { oldTrack.stop(); } catch (_) {}
            try { localStream.removeTrack(oldTrack); } catch (_) {}
        }
        usingFrontCamera = !usingFrontCamera;
        const localVideo = document.getElementById('local-video');
        if (localVideo) {
            localVideo.srcObject = localStream;
            localVideo.muted = true;
            localVideo.play().catch(() => {});
        }
    } catch (err) {
        if (newStream) stopMediaStream(newStream);
        showAlert('Could not switch camera. Your current camera was kept active.');
    }
}

async function writeCallHistory(statusOverride = null) {
    if (!activeCallRef || !callPeerUsername || !currentUser) return;
    const callId = activeCallId || activeCallRef.key || '';
    if (!callId) return;
    const ownFlagRef = activeCallRef.child(`historyByUser/${currentUser.username}`);
    try {
        const tx = await ownFlagRef.transaction(v => v || true);
        if (!tx.committed || tx.snapshot.val() !== true) return;
        const durationMs = callWasConnected && callStartedAt ? Math.max(0, Date.now() - callStartedAt) : 0;
        const status = statusOverride || callHistoryStatus || (callWasConnected ? 'completed' : (callDirection === 'incoming' ? 'missed' : 'cancelled'));
        const roomId = getRoomId(currentUser.username, callPeerUsername);
        // One call must create one history message. Both clients can reach this function,
        // so use a deterministic key + transaction instead of push(), which creates duplicates.
        const historyKey = `_call_${String(callId).replace(/[^A-Za-z0-9_-]/g, '_')}`;
        const historyRef = db.ref(`chats/${roomId}/${historyKey}`);
        const historyData = {
            type: 'call', sender: currentUser.username, senderName: currentUser.name || currentUser.username,
            callType: currentCallType || 'audio', status,
            duration: durationMs ? formatCallDuration(durationMs) : '', callId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };
        await historyRef.transaction(existing => existing || historyData);
        callHistoryWritten = true;
    } catch (e) {
        console.warn('Call history write failed:', e);
        callHistoryWritten = false;
    }
}

async function endCall() {
    if (isCallEnding || !activeCallId) return;
    callEndedByUser = true;
    clearCallSetupTimer();
    clearIncomingCallWatchTimer();
    isCallEnding = true;
    stopIceRestartLoop();
    callHistoryStatus = callWasConnected ? 'completed' : (callDirection === 'incoming' ? 'missed' : 'cancelled');
    await writeCallHistory(callHistoryStatus);
    if (activeCallRef) {
        await activeCallRef.update({ status: 'ended', endReason: callHistoryStatus, endedAt: firebase.database.ServerValue.TIMESTAMP }).catch(() => {});
    }
    finishCall(false);
}

function finishCall(silent) {
    clearCallSetupTimer();
    clearIncomingCallWatchTimer();
    stopRingtone();
    stopIceRestartLoop();
    stopCallTimer();
    if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.ontrack = null;
        peerConnection.onconnectionstatechange = null;
        try { peerConnection.close(); } catch (_) {}
        peerConnection = null;
    }
    stopMediaStream(localStream);
    localStream = null;
    const localVideoEl = document.getElementById('local-video');
    if (localVideoEl) {
        try { localVideoEl.pause(); } catch (_) {}
        try { localVideoEl.srcObject = null; } catch (_) {}
        try { localVideoEl.load(); } catch (_) {}
    }
    remoteStream = null;
    callCandidateQueue = [];
    removeCallListeners();
    activeCallId = null;
    activeCallRef = null;
    incomingCallData = null;
    isMuted = false;
    isCallEnding = false;
    callWasConnected = false;
    callStartedAt = null;
    callPeerUsername = null;
    callPeerName = null;
    callDirection = null;
    callHistoryStatus = null;
    callHistoryWritten = false;
    callBusyLock = false;
    incomingCallProcessing = false;
    callEndedByUser = false;
    lastRemoteOfferSdp = null;
    lastRestartOfferSdp = null;
    lastRestartAnswerSdp = null;
    isSpeakerOn = false;
    localVideoExpanded = false;
    updateSpeakerButtons();
    const audioBtn = document.getElementById('btn-audio-mute');
    const videoMuteBtn = document.getElementById('btn-video-mute');
    if (audioBtn) { audioBtn.classList.remove('active'); audioBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; }
    if (videoMuteBtn) { videoMuteBtn.classList.remove('active'); videoMuteBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>'; }
    const camBtn = document.getElementById('btn-video-camera');
    if (camBtn) { camBtn.classList.remove('active'); camBtn.innerHTML = '<i class="fa-solid fa-video"></i>'; }
    resetCallUI();
    if (!silent) setCallStatus('Call ended');
}

// Global right-click protection requested for Messenger Pro.
// This is a UI restriction only; it is not a replacement for real security rules.
(function installRightClickGuard(){
    let lastNotice = 0;
    document.addEventListener('contextmenu', event => {
        event.preventDefault();
        event.stopPropagation();
        const now = Date.now();
        if (now - lastNotice > 900) {
            lastNotice = now;
            showAlert('Hacker Not Allow', 'error');
        }
        return false;
    }, true);
})();

document.getElementById('friend-input').addEventListener('keypress', e => { if(e.key === 'Enter') searchUser(); });
document.getElementById('friend-input').addEventListener('keydown', e => { if(e.key === 'Escape') clearSearch(); });

document.getElementById('message-input').addEventListener('keypress', e => {
    if(e.key === 'Enter') sendMessage();
});


// Keep the native Android call service/wake lock synchronized after screen on,
// tab visibility changes, and WebView resume. This does not end or recreate the call.
document.addEventListener('visibilitychange', () => {
    if (activeCallId || peerConnection || incomingCallData) {
        notifyNativeCallActive(true);
    }
});
window.addEventListener('pageshow', () => {
    if (activeCallId || peerConnection || incomingCallData) notifyNativeCallActive(true);
});
window.addEventListener('focus', () => {
    if (activeCallId || peerConnection || incomingCallData) notifyNativeCallActive(true);
});

window.onNativeIncomingCall = function(callId) {
    try {
        if (callId) localStorage.setItem('pendingIncomingCallId', String(callId));
        if (currentUser && !incomingCallData) listenForIncomingCalls();
    } catch (_) {}
};

// V33 premium call animation state hooks
(function(){
  const applyCallState = () => {
    const ids = ['audio-call-screen','video-call-screen'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const status = document.getElementById(id === 'audio-call-screen' ? 'audio-call-status' : 'video-call-status');
      el.dataset.callState = (status?.textContent || '').toLowerCase().includes('connected') ? 'connected' : 'connecting';
    });
  };
  window.addEventListener('messenger-call-state-refresh', applyCallState);
  setInterval(applyCallState, 900);
})();
