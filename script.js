/* DOM */
const sliderBox = document.getElementById('speedSliderBox');
const slider = document.getElementById('sliderHours');
const labelHours = document.getElementById('labelHours');
const display = document.getElementById('display');

const tabClock = document.getElementById('tabClock');
const tabStopwatch = document.getElementById('tabStopwatch');
const tabAlarm = document.getElementById('tabAlarm');
const tabSettings = document.getElementById('tabSettings');

const stopwatchArea = document.getElementById('stopwatchArea');
const startBtn = document.getElementById('startBtn');
const lapBtn = document.getElementById('lapBtn');
const resetBtn = document.getElementById('resetBtn');
const lapsDiv = document.getElementById('laps');

const alarmArea = document.getElementById('alarmArea');
const alarmTimeInput = document.getElementById('alarmTime');
const addAlarmBtn = document.getElementById('addAlarmBtn');
const alarmListDiv = document.getElementById('alarmList');

const settingsArea = document.getElementById('settingsArea');
const showSecondsCheckbox = document.getElementById('showSecondsCheckbox');

/* state */
let customHours = Number(localStorage.getItem('nclock_hours')) || 24;
slider.value = customHours;
labelHours.textContent = `${customHours} 時間`;

let showSeconds = localStorage.getItem('nclock_showSeconds')==='false'?false:true;
showSecondsCheckbox.checked=showSeconds;

let mode = localStorage.getItem('nclock_mode') || 'clock';
let running=false;
let elapsedMs=Number(localStorage.getItem('nclock_sw_elapsed'))||0;
let lastPerf=null;
let laps=JSON.parse(localStorage.getItem('nclock_sw_laps')||'[]');
let alarms=JSON.parse(localStorage.getItem('nclock_alarms')||'[]');

/* save */
function save(){ 
  localStorage.setItem('nclock_hours',String(customHours));
  localStorage.setItem('nclock_mode',mode);
  localStorage.setItem('nclock_sw_elapsed',String(elapsedMs));
  localStorage.setItem('nclock_sw_laps',JSON.stringify(laps));
  localStorage.setItem('nclock_alarms',JSON.stringify(alarms));
  localStorage.setItem('nclock_showSeconds',showSeconds);
}

/* slider */
slider.addEventListener('input', e=>{
  customHours = Number(e.target.value);
  labelHours.textContent = `${customHours} 時間`;
  save();
});

/* tabs */
function updateMode(){
  [tabClock, tabStopwatch, tabAlarm, tabSettings].forEach(t=>t.classList.remove('active'));
  if(mode==='clock') tabClock.classList.add('active');
  if(mode==='stopwatch') tabStopwatch.classList.add('active');
  if(mode==='alarm') tabAlarm.classList.add('active');
  if(mode==='settings') tabSettings.classList.add('active');

  stopwatchArea.style.display = mode==='stopwatch'?'block':'none';
  alarmArea.style.display = mode==='alarm'?'block':'none';
  settingsArea.style.display = mode==='settings'?'block':'none';
  sliderBox.style.display = mode==='clock'?'block':'none';
}
tabClock.addEventListener('click',()=>{mode='clock'; updateMode(); save();});
tabStopwatch.addEventListener('click',()=>{mode='stopwatch'; updateMode(); save();});
tabAlarm.addEventListener('click',()=>{mode='alarm'; updateMode(); save();});
tabSettings.addEventListener('click',()=>{mode='settings'; updateMode(); save();});

/* stopwatch */
startBtn.addEventListener('click',()=>{
  if(!running){
    running=true; lastPerf=performance.now();
    startBtn.textContent='Stop';
    startBtn.classList.remove('btn-start'); startBtn.classList.add('btn-stop');
    lapBtn.disabled=false; resetBtn.disabled=true;
  }else{
    running=false;
    startBtn.textContent='Start';
    startBtn.classList.remove('btn-stop'); startBtn.classList.add('btn-start');
    lapBtn.disabled=true; resetBtn.disabled=false;
    save();
  }
});
lapBtn.addEventListener('click',()=>{
  const txt=display.textContent;
  laps.unshift(txt); if(laps.length>50) laps.pop();
  renderLaps(); save();
});
resetBtn.addEventListener('click',()=>{ elapsedMs=0;laps=[];renderLaps();resetBtn.disabled=true; save();});

/* render */
function renderLaps(){
  lapsDiv.innerHTML = laps.length===0?'<div style="color:#666;padding:8px;">ラップなし</div>':
    laps.map((t,i)=>`<div class="lap-item"><div>Lap ${laps.length-i}</div><div>${t}</div></div>`).join('');
}

function renderAlarms(){
  alarmListDiv.innerHTML = alarms.length===0?'<div style="color:#666;padding:8px;">アラームなし</div>':
    alarms.map((a,i)=>`
      <div class="alarm-item">
        <div>${a.time}</div>
        <label class="switch">
          <input type="checkbox" ${a.on?'checked':''} onchange="toggleAlarm(${i},this.checked)">
          <span class="slider"></span>
        </label>
        <button onclick="deleteAlarm(${i})">削除</button>
      </div>
    `).join('');
}
window.deleteAlarm = function(i){ alarms.splice(i,1); renderAlarms(); save(); }
window.toggleAlarm = function(i,state){ alarms[i].on=state; save(); }

/* alarm add */
addAlarmBtn.addEventListener('click',()=>{
  if(!alarmTimeInput.value) return;
  alarms.push({time:alarmTimeInput.value,on:true});
  renderAlarms(); save();
});

/* settings */
showSecondsCheckbox.addEventListener('change',()=>{ showSeconds=showSecondsCheckbox.checked; save(); });

/* tick */
function tick(){
  const now=new Date();
  if(mode==='clock'){
    const speed=24/customHours;
    const virtualSec=(now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds())*speed;
    const h=Math.floor(virtualSec/3600)%24;
    const m=Math.floor(virtualSec/60)%60;
    const s=Math.floor(virtualSec)%60;
    display.textContent=showSeconds?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;

    // alarm check
    const nowStr=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    alarms.forEach(a=>{ if(a.on && a.time===nowStr) alert(`アラーム: ${a.time}`); });
  } else if(mode==='stopwatch'){
    if(running){
      const dt=performance.now()-lastPerf;
      elapsedMs+=dt*(24/customHours); lastPerf=performance.now();
    }
    const totalSec=Math.floor(elapsedMs/1000);
    const h=Math.floor(totalSec/3600);
    const m=Math.floor(totalSec/60)%60;
    const s=Math.floor(totalSec)%60;
    display.textContent=showSeconds?`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`:
      `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  }
  requestAnimationFrame(tick);
}

/* init */
renderLaps(); renderAlarms(); updateMode(); requestAnimationFrame(tick);
setInterval(save,2000);

/* service worker */
if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
