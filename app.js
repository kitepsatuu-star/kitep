import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, addDoc, collection, query, orderBy, limit, onSnapshot, serverTimestamp, where } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

/* 1) Firebase Console -> Project settings -> Your apps -> Web app.
   2) Төмөндөгү объектти өз Firebase config'иңиз менен алмаштырыңыз. */
const firebaseConfig = {
  apiKey: "AIzaSyB9OfNtCz2Y2cEZsM2otwmJk_Sbltjc2Jo",
  authDomain: "kitep-5fef6.firebaseapp.com",
  projectId: "kitep-5fef6",
  storageBucket: "kitep-5fef6.firebasestorage.app",
  messagingSenderId: "111982428599",
  appId: "1:111982428599:web:bbbd54caeed638a7f0a832",
  measurementId: "G-2CLSHEYCDY"
};

/* Cloudinary:
   Settings -> Upload presets -> Add upload preset -> Signing mode: Unsigned.
   Бул жерге cloud name жана unsigned preset'ти жазыңыз. */
const CLOUDINARY_CLOUD_NAME = "heln4wad";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

let currentUser = null, currentProfile = null, chatUnsub = null, searchType = "people";
const $ = id => document.getElementById(id);

function toast(msg){ $("toast").textContent=msg; $("toast").classList.add("show"); setTimeout(()=>$("toast").classList.remove("show"),2500); }
function avatar(u){ return u?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name||"U")}&background=e9edf7&color=172033`; }
function escapeHtml(s=""){return s.replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));}

document.querySelectorAll(".nav-item").forEach(btn=>btn.onclick=()=>showScreen(btn.dataset.screen));
function showScreen(id){
  document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
  $(id).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.screen===id));
  if(id==="homeScreen") loadFeed();
  if(id==="videosScreen") loadVideos();
  if(id==="messagesScreen") loadPeople();
  if(id==="searchScreen"){loadPeople("suggestions"); runSearch();}
  if(id==="profileScreen") renderProfile();
}

$("topAction").onclick=()=>{ if(!currentUser){openAuth();return;} const id=document.querySelector(".screen.active").id; openModal(id==="videosScreen"?"videoModal":"postModal"); };
function openModal(id){$(id).classList.add("show")}
document.querySelectorAll(".close").forEach(b=>b.onclick=()=>{ if(b.id==="closeAuth") $("authModal").classList.remove("show"); else $(b.dataset.close).classList.remove("show");});
function openAuth(){ $("authModal").classList.add("show"); }

$("googleBtn").onclick=async()=>{
  try{await signInWithPopup(auth,provider);}catch(e){toast("Google кирүүдө ката: "+e.message);}
};

onAuthStateChanged(auth, async user=>{
  currentUser=user;
  if(!user){currentProfile=null;renderProfile();return;}
  const snap=await getDoc(doc(db,"users",user.uid));
  if(snap.exists()){currentProfile={id:user.uid,...snap.data()};$("authModal").classList.remove("show");renderProfile();}
  else{
    $("authModal").classList.add("show");
    $("profileFormWrap").classList.remove("hidden");
    $("googleBtn").classList.add("hidden");
    $("fullName").value=user.displayName||"";
  }
});

$("saveProfile").onclick=async()=>{
  if(!currentUser)return;
  const name=$("fullName").value.trim(), age=Number($("age").value), phone=$("phone").value.trim(), gender=$("gender").value;
  if(!name||!age||age<13||!phone||!gender){toast("Бардык талааларды туура толтуруңуз.");return;}
  await setDoc(doc(db,"users",currentUser.uid),{name,age,phone,gender,email:currentUser.email||"",photoURL:currentUser.photoURL||"",createdAt:serverTimestamp()});
  currentProfile={id:currentUser.uid,name,age,phone,gender,email:currentUser.email||"",photoURL:currentUser.photoURL||""};
  $("authModal").classList.remove("show"); toast("Профиль даяр!");
};

async function cloudinaryUpload(file,type){
  if(CLOUDINARY_CLOUD_NAME.startsWith("YOUR_")||CLOUDINARY_UPLOAD_PRESET.startsWith("YOUR_"))throw new Error("Cloudinary жөндөөлөрүн app.js ичинде толтуруңуз.");
  const fd=new FormData();fd.append("file",file);fd.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);
  const r=await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type}/upload`,{method:"POST",body:fd});
  if(!r.ok)throw new Error("Cloudinary upload error");
  return (await r.json()).secure_url;
}

$("publishPost").onclick=async()=>{
  if(!currentUser)return openAuth();
  const text=$("postText").value.trim(), file=$("postImage").files[0];
  if(!text&&!file)return toast("Текст же сүрөт кошуңуз.");
  try{
    let imageURL="";
    if(file)imageURL=await cloudinaryUpload(file,"image");
    await addDoc(collection(db,"posts"),{uid:currentUser.uid,authorName:currentProfile.name,authorPhoto:currentProfile.photoURL||"",text,imageURL,createdAt:serverTimestamp()});
    $("postModal").classList.remove("show");$("postText").value="";$("postImage").value="";toast("Жарыяланды!");
  }catch(e){toast(e.message);}
};

$("publishVideo").onclick=async()=>{
  if(!currentUser)return openAuth();
  const file=$("videoFile").files[0],title=$("videoTitle").value.trim()||"Видео";
  if(!file)return toast("Видео тандаңыз.");
  if(file.size>100*1024*1024)return toast("Бул демо версияда видео 100MB чейин.");
  try{
    toast("Видео жүктөлүп жатат...");
    const url=await cloudinaryUpload(file,"video");
    await addDoc(collection(db,"videos"),{uid:currentUser.uid,title,url,authorName:currentProfile.name,createdAt:serverTimestamp()});
    $("videoModal").classList.remove("show");$("videoFile").value="";$("videoTitle").value="";toast("Видео даяр!");
  }catch(e){toast(e.message);}
};

function loadFeed(){
  onSnapshot(query(collection(db,"posts"),orderBy("createdAt","desc"),limit(30)),snap=>{
    $("feed").innerHTML=snap.docs.map(d=>{const p=d.data();return `<article class="post">${p.imageURL?`<img class="post-image" src="${p.imageURL}" loading="lazy">`:""}<div class="post-body"><div class="post-author"><img class="avatar" src="${avatar({name:p.authorName,photoURL:p.authorPhoto})}"><div><b>${escapeHtml(p.authorName||"Колдонуучу")}</b><small class="muted">Жаңы жарыя</small></div></div>${p.text?`<div class="post-text">${escapeHtml(p.text)}</div>`:""}</div></article>`}).join("")||`<div class="result">Азырынча жарыя жок. ＋ басып биринчи жарыяны кошуңуз.</div>`;
  },e=>toast("Feed ката: "+e.message));
}
function loadVideos(){
  onSnapshot(query(collection(db,"videos"),orderBy("createdAt","desc"),limit(30)),snap=>{
    $("videos").innerHTML=snap.docs.map(d=>{const v=d.data();return `<article class="video-card"><video src="${v.url}" controls preload="metadata"></video><div class="video-meta"><b>${escapeHtml(v.title||"Видео")}</b><div class="muted">${escapeHtml(v.authorName||"")}</div></div></article>`}).join("")||`<div class="result">Азырынча видео жок.</div>`;
  },e=>toast("Видео ката: "+e.message));
}

let peopleCache=[];
function loadPeople(mode="chat"){
  onSnapshot(query(collection(db,"users"),limit(100)),snap=>{
    peopleCache=snap.docs.map(d=>({id:d.id,...d.data()})).filter(p=>p.id!==currentUser?.uid);
    const html=peopleCache.map(p=>`<div class="person" data-uid="${p.id}"><img class="avatar" src="${avatar(p)}"><div class="person-info"><b>${escapeHtml(p.name||"Колдонуучу")}</b><small>${p.age||""} жаш</small></div><span>›</span></div>`).join("")||`<div class="result">Азырынча башка катталган адам жок.</div>`;
    if(mode==="suggestions")$("suggestions").innerHTML=html; else $("peopleForChat").innerHTML=html;
    document.querySelectorAll(".person").forEach(el=>el.onclick=()=>openChat(el.dataset.uid));
  });
}
async function openChat(uid){
  if(!currentUser)return openAuth();
  const p=peopleCache.find(x=>x.id===uid);if(!p)return;
  $("peopleForChat").classList.add("hidden");$("chatBox").classList.remove("hidden");
  $("chatName").textContent=p.name||"Колдонуучу";$("chatAvatar").src=avatar(p);
  const chatId=[currentUser.uid,uid].sort().join("_");
  if(chatUnsub)chatUnsub();
  chatUnsub=onSnapshot(query(collection(db,"chats",chatId,"messages"),orderBy("createdAt","asc"),limit(100)),snap=>{
    $("chatMessages").innerHTML=snap.docs.map(d=>{const m=d.data();return `<div class="bubble ${m.uid===currentUser.uid?"mine":""}">${escapeHtml(m.text||"")}</div>`}).join("");
    $("chatMessages").scrollTop=$("chatMessages").scrollHeight;
  });
  $("chatForm").onsubmit=async e=>{
    e.preventDefault();const text=$("chatText").value.trim();if(!text)return;
    await addDoc(collection(db,"chats",chatId,"messages"),{uid:currentUser.uid,to:uid,text,createdAt:serverTimestamp()});$("chatText").value="";
  };
}
$("backChat").onclick=()=>{$("chatBox").classList.add("hidden");$("peopleForChat").classList.remove("hidden");if(chatUnsub){chatUnsub();chatUnsub=null;}};

document.querySelectorAll(".search-tab").forEach(b=>b.onclick=()=>{document.querySelectorAll(".search-tab").forEach(x=>x.classList.remove("active"));b.classList.add("active");searchType=b.dataset.type;runSearch();});
$("searchInput").oninput=runSearch;
function runSearch(){
  const q=$("searchInput").value.trim().toLowerCase();
  if(searchType==="people"){
    const arr=peopleCache.filter(p=>(p.name||"").toLowerCase().includes(q));
    $("searchResults").innerHTML=arr.map(p=>`<div class="result"><img class="avatar" src="${avatar(p)}"><b>${escapeHtml(p.name||"")}</b><p class="muted">${p.age||""} жаш</p></div>`).join("")||`<div class="result">Адам табылган жок.</div>`;
  }else{
    const col=searchType==="videos"?"videos":"books";
    onSnapshot(query(collection(db,col),limit(50)),snap=>{
      const arr=snap.docs.map(d=>({id:d.id,...d.data()})).filter(x=>(x.title||x.name||"").toLowerCase().includes(q));
      $("searchResults").innerHTML=arr.map(x=>`<div class="result"><b>${escapeHtml(x.title||x.name||"Материал")}</b>${x.url?`<div style="margin-top:10px"><video controls style="width:100%" src="${x.url}"></video></div>`:""}</div>`).join("")||`<div class="result">Натыйжа жок.</div>`;
    });
  }
}

function renderProfile(){
  if(!currentUser){
    $("profileContent").innerHTML=`<div class="profile-card"><div class="profile-main" style="padding-top:30px;text-align:center"><div class="auth-logo">S</div><h1>Профиль</h1><p class="muted">Жеке аккаунтуңузга кирүү үчүн Google менен кириңиз.</p><button class="primary" id="profileLogin">Google менен кирүү</button></div></div>`;
    setTimeout(()=>{const b=$("profileLogin");if(b)b.onclick=openAuth;},0);return;
  }
  const p=currentProfile||{name:currentUser.displayName||"Колдонуучу",age:"",phone:"",gender:"",photoURL:currentUser.photoURL||""};
  $("profileContent").innerHTML=`<div class="profile-card"><div class="profile-cover"></div><div class="profile-main"><img class="avatar" src="${avatar(p)}"><h1>${escapeHtml(p.name)}</h1><p class="muted">${escapeHtml(p.email||"")}</p><div class="profile-stats"><div class="stat"><b id="postCount">0</b><span>Жарыя</span></div><div class="stat"><b id="videoCount">0</b><span>Видео</span></div><div class="stat"><b>${p.age||"—"}</b><span>Жаш</span></div></div><div class="result"><b>Телефон:</b> ${escapeHtml(p.phone||"—")}<br><b>Жынысы:</b> ${p.gender==="male"?"Эркек":p.gender==="female"?"Кыз":"—"}</div><div class="profile-actions"><button id="editProfile">Профилди өзгөртүү</button><button id="logout">Чыгуу</button></div></div></div>`;
  $("logout").onclick=()=>signOut(auth);
  $("editProfile").onclick=()=>{ $("profileFormWrap").classList.remove("hidden");$("googleBtn").classList.add("hidden");$("fullName").value=p.name||"";$("age").value=p.age||"";$("phone").value=p.phone||"";$("gender").value=p.gender||"";openAuth();};
}
loadFeed();renderProfile();
