// Pick 2 Pro Dashboard • v1.2 • January 2026
// Features: Shelf Chart, Predictive Pairs, & Advanced Insights (Deep Search)

////////////////////////////////////////////
// Created and Built By Michael "CODEWITHGLASGOW" Glasgow
// Founder and CEO of FinFolio Suite Projects 
// Self Taught Developer
// Coding Language: JAVA
// Apps Script, Scriptable, Visual Studio Code
////////////////////////////////////////////

const url = "https://script.google.com/macros/s/AKfycbwyr-M_ZzIscNgxJmR_UYHgZqmamn62Np4msDFaCjX9KgyUmyjuzuIYbawBmT0_mw4j/exec?action=calendar&game=PIKII&weeks=159"

const spirits = {1:"Centipede",2:"Old Lady",3:"Carriage",4:"Dead Man",5:"Parson Man",6:"Belly",7:"Hog",8:"Tiger",9:"Cattle",10:"Monkey",11:"Corbeau",12:"King",13:"Crapaud",14:"Money",15:"Sick Woman",16:"Jamette",17:"Pigeon",18:"Water Boat",19:"Horse",20:"Dog",21:"Mouth",22:"Rat",23:"House",24:"Queen",25:"Morrocoy",26:"Fowl",27:"Little Snake",28:"Red Fish",29:"Opium Man",30:"House Cat",31:"Parson Wife",32:"Shrimp",33:"Spider",34:"Blind Man",35:"Big Snake",36:"Donkey"}

let request = new Request(url)
let json = await request.loadJSON()
let data = json.data
let weeks = data.weeks

// Sort weeks chronologically
let monthMap = {"Jan":0, "Feb":1, "Mar":2, "Apr":3, "May":4, "Jun":5, "Jul":6, "Aug":7, "Sep":8, "Oct":9, "Nov":10, "Dec":11}
weeks.sort((a, b) => {
  let pa = a.startDate.split(" ")
  let pb = b.startDate.split(" ")
  let da = new Date(pa[2], monthMap[pa[1]], pa[0])
  let db = new Date(pb[2], monthMap[pb[1]], pb[0])
  return da - db
})

let dayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
let timeOrder = ["MOR", "MID", "NON", "EVE"]
let timeNames = { MOR: "Morning", MID: "Midday", NON: "Afternoon", EVE: "Evening" }

// --- 1. LINEAR TIMELINE GENERATION ---
let timeline = []
for (let week of weeks) {
  let parts = week.startDate.split(" ")
  let startDate = new Date(parts[2], monthMap[parts[1]], parts[0])
  for (let day of week.days) {
    let drawDate = new Date(startDate)
    drawDate.setDate(drawDate.getDate() + dayOrder.indexOf(day.dayName))
    for (let t of timeOrder) {
      let pairStr = day.draws[t]
      if (!pairStr || pairStr === "-" || pairStr === "PENDING") continue
      timeline.push({ 
        date: drawDate, 
        dayName: day.dayName, 
        timeSlot: t, 
        time: timeNames[t], 
        pair: pairStr, 
        isCurrent: week.isCurrentWeek === true 
      })
    }
  }
}

let lastSeenDate = {}, lastSeenTime = {}, frequency = {}, lastPair = {}
let currentWeekHits = {}, pairInfo = {}
let now = new Date()

// --- 2. DATA PROCESSING & PREDICTIONS ---
for (let i = 0; i < timeline.length; i++) {
  let current = timeline[i]
  let next = timeline[i + 1]
  let nums = current.pair.split(",").map(Number)
  let sortedKey = nums.slice().sort((a,b)=>a-b).join(",")

  if (!(sortedKey in pairInfo)) {
    pairInfo[sortedKey] = { frequency: 0, lastDate: null, lastTime: null, hitThisWeek: false, history: [], nextNums: {} }
  }

  pairInfo[sortedKey].frequency++
  pairInfo[sortedKey].lastDate = current.date
  pairInfo[sortedKey].lastTime = current.time
  if (current.isCurrent) pairInfo[sortedKey].hitThisWeek = true
  
  pairInfo[sortedKey].history.push({ 
    date: current.date.toLocaleDateString("en-GB", {day:"2-digit", month:"short", year:"2-digit"}).toUpperCase().replace(" ","-"), 
    time: current.time 
  })

  if (next) {
    next.pair.split(",").map(Number).forEach(n => {
      pairInfo[sortedKey].nextNums[n] = (pairInfo[sortedKey].nextNums[n] || 0) + 1
    })
  }

  nums.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1
    lastSeenDate[num] = current.date
    lastSeenTime[num] = current.time
    lastPair[num] = current.pair
    if (current.isCurrent) currentWeekHits[num] = (currentWeekHits[num] || 0) + 1
  })
}

// Build Marks
let marks = []
for (let n = 1; n <= 36; n++) {
  let daysAgo = lastSeenDate[n] ? Math.floor((now - lastSeenDate[n]) / 86400000) : 999
  marks.push({ 
    num: n, spirit: spirits[n] || "Unknown",
    date: lastSeenDate[n] ? lastSeenDate[n].toLocaleDateString("en-GB", { day: "2-digit", month: "short" , year: "2-digit"}).toUpperCase().replace(" ", "-") : "N/A",
    time: lastSeenTime[n] || "N/A", days: daysAgo, freq: frequency[n] || 0,
    lastPair: lastPair[n] || "N/A", isHitThisWeek: !!currentWeekHits[n]
  })
}
marks.sort((a, b) => b.days - a.days)

let pairMarks = []
for (let key in pairInfo) {
  let info = pairInfo[key]
  let daysAgo = info.lastDate ? Math.floor((now - info.lastDate) / 86400000) : 999
  let [n1, n2] = key.split(",").map(Number)
  pairMarks.push({
    pair: key, spirit: `${spirits[n1] || "?"} / ${spirits[n2] || "?"}`,
    date: info.lastDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase().replace(" ", "-"),
    time: info.lastTime, days: daysAgo, freq: info.frequency, isHitThisWeek: info.hitThisWeek
  })
}
pairMarks.sort((a, b) => b.days - a.days)

// --- 3. DASHBOARD UI (WebView) ---
async function presentDashboard() {
  let html = `
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
    <style>
      :root { --bg: #000; --card: #1c1c1e; --accent: #007AFF; --success: #32d74b; --warn: #ff9f0a; --danger: #ff453a; --sec: #8e8e93; --purple: #af52de; }
      body { background: var(--bg); color: #fff; font-family: -apple-system, sans-serif; margin: 0; padding-top: 195px; padding-bottom: 40px;}
      .nav { position: fixed; top: 0; width: 100%; background: rgba(28,28,30,0.9); backdrop-filter: blur(20px); z-index: 100; padding: 12px; border-bottom: 0.5px solid #333; box-sizing: border-box; }
      .search-box { width: 100%; background: #2c2c2e; border: 0.5px solid #3a3a3c; border-radius: 10px; padding: 10px; color: #fff; margin: 10px 0; }
      .tabs { display: flex; gap: 5px; margin-bottom: 10px; }
      .tab { flex: 1; background: #2c2c2e; border: none; color: #fff; padding: 10px; border-radius: 8px; font-weight: 600; font-size: 11px; text-transform: uppercase; }
      .tab.active { background: var(--accent); }
      .container { padding: 12px; }
      .card { background: var(--card); border-radius: 14px; padding: 14px; margin-bottom: 12px; border: 0.5px solid #2c2c2e; }
      .row { display: flex; align-items: center; width: 100%; }
      .num { font-size: 24px; font-weight: 800; min-width: 50px; color: var(--success); }
      .info { flex-grow: 1; padding-left: 12px; }
      .spirit { font-size: 14px; font-weight: 600; }
      .sub { font-size: 11px; color: var(--sec); }
      .sev { width: 4px; height: 40px; border-radius: 2px; }
      .red { background: var(--danger); } .orange { background: var(--warn); } .green { background: var(--success); }
      .badge { background: #2c2c2e; padding: 6px; border-radius: 8px; text-align: center; min-width: 55px; border: 0.5px solid #3a3a3c; }
      .panel { width: 100%; display: none; margin-top: 12px; padding-top: 12px; border-top: 0.5px solid #333; }
      .table { width: 100%; font-size: 12px; border-collapse: collapse; }
      .table td { padding: 5px 0; border-bottom: 0.5px solid #222; }
      .ball { background: var(--accent); color: #fff; border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; }
      
      /* Insights UI */
      .input-group { display: flex; gap: 8px; margin-bottom: 10px; }
      .input-group select { flex: 1; background: #2c2c2e; color: white; border: 1px solid #3a3a3c; padding: 10px; border-radius: 8px; font-size: 13px; }
      .rank-btn { background: var(--success); color: black; border: none; border-radius: 8px; padding: 10px; width: 100%; font-weight: bold; }
      .res-row { display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #111; border-radius: 8px; margin-bottom: 5px; border-left: 3px solid var(--accent); }
      /* RESPONSIVE MOBILE SPLASH */
#splash-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #020617;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: opacity 0.8s ease-out;
}

.stage {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row; /* Keeps items side-by-side */
  align-items: center;
  justify-content: space-around;
  perspective: 800px;
  padding: 0 5vw;
}

.scene {
  width: 18vw; /* Scale dice based on screen width */
  height: 18vw;
  max-width: 70px;
  max-height: 70px;
  position: relative;
}

.cube {
  width: 100%;
  height: 100%;
  position: absolute;
  transform-style: preserve-3d;
  transition: transform 2s cubic-bezier(0.17, 0.67, 0.83, 0.67);
}

.face {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 12%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
  backface-visibility: hidden;
}

/* Position faces based on 18vw width (half is 9vw) */
.face--1 { transform: rotateY(0deg) translateZ(9vw); }
.face--2 { transform: rotateY(90deg) translateZ(9vw); }
.face--3 { transform: rotateY(180deg) translateZ(9vw); }
.face--4 { transform: rotateY(-90deg) translateZ(9vw); }
.face--5 { transform: rotateX(90deg) translateZ(9vw); }
.face--6 { transform: rotateX(-90deg) translateZ(9vw); }

/* Cap the translateZ for larger screens using media query */
@media (min-width: 400px) {
  .face--1 { transform: rotateY(0deg) translateZ(35px); }
  .face--2 { transform: rotateY(90deg) translateZ(35px); }
  .face--3 { transform: rotateY(180deg) translateZ(35px); }
  .face--4 { transform: rotateY(-90deg) translateZ(35px); }
  .face--5 { transform: rotateX(90deg) translateZ(35px); }
  .face--6 { transform: rotateX(-90deg) translateZ(35px); }
}

.dot { width: 2.5vw; height: 2.5vw; max-width: 8px; max-height: 8px; background: #111; border-radius: 50%; }
.dots { display: grid; gap: 1vw; grid-template-columns: repeat(3, 1fr); }

.reveal {
  text-align: center;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out;
  flex: 1;
}

.reveal.show { opacity: 1; transform: translateY(0); }

.title { font-size: 7vw; font-weight: 900; color: #fff; margin: 0; white-space: nowrap; }
.subtitle { font-size: 3.5vw; color: #58a6ff; margin-top: 5px; white-space: nowrap; }

.fade-out { opacity: 0 !important; pointer-events: none; }

    </style>
  </head>
  <body>
   <div id="splash-screen">
  <div class="stage">
    <div class="scene">
      <div class="cube" id="cube1"></div>
    </div>
    
    <div class="reveal" id="revealText">
      <h1 class="title">2 QUICK</h1>
      <h1 class="title">SHELF ANALYSIS</h1>
      <p class="subtitle">CODEWITHGLASGOW</p>
    </div>
    
    <div class="scene">
      <div class="cube" id="cube2"></div>
    </div>
  </div>
</div>

   <div id="main-content">
    <div class="nav">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:bold; font-size:18px;">Pick 2 Pro Dashboard</span>
        <span style="color:var(--accent); font-weight:600;" onclick="window.location='homescreen://'">Done</span>
      </div>
      <div class="tabs" style="margin-top:10px;">
        <button class="tab active" onclick="show('numbers', this)">Numbers</button>
        <button class="tab" onclick="show('pairs', this)">Pairs</button>
        <button class="tab" onclick="show('insights', this)">Insights</button>
      </div>
      <div id="search-container">
        <input type="text" id="search" class="search-box" placeholder="Search mark or spirit..." onkeyup="filter()">
        <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--sec);">
          <span>Sort: <select id="sort" onchange="sorting()" style="background:none; color:var(--accent); border:none; font-weight:bold;">
            <option value="days-desc">Coldest</option><option value="days-asc">Hottest</option><option value="freq-desc">Most Hits</option>
          </select></span>
          <label><input type="checkbox" id="hide" onchange="filter()"> Hide Weekly Hits</label>
        </div>
      </div>
    </div>

    <div id="numbers-tab" class="container">
      ${marks.map(m => `
        <div class="card" data-num="${m.num}" data-days="${m.days}" data-freq="${m.freq}" data-spirit="${m.spirit}">
          <div class="row">
            <div class="sev ${m.days >= 30 ? 'red' : (m.days >= 15 ? 'orange' : 'green')}"></div>
            <div class="num">${String(m.num).padStart(2, '0')}</div>
            <div class="info">
              <div class="sub">${m.date} • ${m.time}</div>
              <div class="spirit">${m.spirit}</div>
              <div class="sub">${m.days} days out • Last: ${m.lastPair}</div>
            </div>
            <div class="badge">
              <div style="font-size:14px; font-weight:700;">${m.freq}x</div>
              <div style="font-size:8px; color:var(--sec);">${m.isHitThisWeek ? 'HIT' : 'TOTAL'}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <div id="pairs-tab" class="container" style="display:none;">
      ${pairMarks.map((p, idx) => {
        let f = Object.entries(pairInfo[p.pair].nextNums).sort((a,b)=>b[1]-a[1]).slice(0,3).map(x=>x[0]);
        return `
        <div class="card" data-num="${p.pair}" data-days="${p.days}" data-freq="${p.freq}" data-spirit="${p.spirit}">
          <div class="row" onclick="toggle(${idx})">
            <div class="sev ${p.days >= 30 ? 'red' : (p.days >= 15 ? 'orange' : 'green')}"></div>
            <div class="num" style="font-size:18px;">${p.pair.replace(',','-')}</div>
            <div class="info">
              <div class="sub">${p.date} • ${p.time}</div>
              <div class="spirit" style="font-size:12px;">${p.spirit}</div>
              <div class="sub">${p.days} days out</div>
            </div>
            <div class="badge">
              <div style="font-size:14px; font-weight:700;">${p.freq}x</div>
              <div style="font-size:7px; font-weight:bold; color:var(--accent);">PREDICT ▾</div>
            </div>
          </div>
          <div id="p-${idx}" class="panel">
            <div style="margin-bottom:12px;">
              <div class="sub" style="text-transform:uppercase; margin-bottom:6px;">Likely Follows (Next Draw):</div>
              <div style="display:flex; gap:10px;">
                ${f.map(n => `<div class="ball">${String(n).padStart(2,'0')}</div>`).join('')}
              </div>
            </div>
            <table class="table">
              <tr style="color:var(--sec); font-weight:bold;"><td>DATE</td><td>TIME</td></tr>
              ${pairInfo[p.pair].history.slice().reverse().slice(0,5).map(h => `
                <tr><td>${h.date}</td><td>${h.time}</td></tr>
              `).join('')}
            </table>
          </div>
        </div>`;
      }).join('')}
    </div>

    <div id="insights-tab" class="container" style="display:none;">
      <div class="card" style="border-left: 4px solid var(--purple);">
        <div style="font-weight:bold; color:var(--purple); margin-bottom:15px; text-align:center;">🔍 MOST PLAYED PAIR ANALYZER</div>
        
        <div class="input-group">
          <select id="searchDay">
            <option value="Monday">Monday</option><option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option><option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option><option value="Saturday">Saturday</option>
          </select>
          <select id="searchTime">
            <option value="ALL">All Times</option>
            <option value="MOR">Morning</option><option value="MID">Midday</option>
            <option value="NON">Afternoon</option><option value="EVE">Evening</option>
          </select>
        </div>
        
        <div class="input-group">
          <select id="searchScope">
            <option value="4">Last 4 Weeks (Trending)</option>
            <option value="12">Last 12 Weeks (3 Months)</option>
            <option value="52">Last 52 Weeks (Year)</option>
            <option value="159">Full History (159 Wks)</option>
          </select>
        </div>
        
        <button class="rank-btn" onclick="runDeepSearch()">RANK PAIRS</button>
        <div id="searchResults" style="margin-top:15px;"></div>
      </div>
    </div>

    <script>
      const timeline = ${JSON.stringify(timeline)};
      const spirits = ${JSON.stringify(spirits)};

      function show(t, el) {
        document.getElementById('numbers-tab').style.display = t === 'numbers' ? 'block' : 'none';
        document.getElementById('pairs-tab').style.display = t === 'pairs' ? 'block' : 'none';
        document.getElementById('insights-tab').style.display = t === 'insights' ? 'block' : 'none';
        document.getElementById('search-container').style.display = t === 'insights' ? 'none' : 'block';
        
        document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
      }

      function toggle(i) {
        let p = document.getElementById('p-' + i);
        p.style.display = p.style.display === 'block' ? 'none' : 'block';
      }

      function filter() {
        let v = document.getElementById('search').value.toLowerCase();
        let h = document.getElementById('hide').checked;
        let tab = document.querySelector('.tab.active').innerText.toLowerCase();
        if (tab === 'insights') return;
        let cards = document.getElementById(tab + '-tab').getElementsByClassName('card');
        for (let c of cards) {
          let matches = c.dataset.num.includes(v) || c.dataset.spirit.toLowerCase().includes(v);
          let isHit = c.innerHTML.includes('>HIT</div>');
          c.style.display = (matches && (!h || !isHit)) ? 'block' : 'none';
        }
      }

      function sorting() {
        let val = document.getElementById('sort').value;
        let [k, dir] = val.split('-');
        let tab = document.querySelector('.tab.active').innerText.toLowerCase();
        let container = document.getElementById(tab + '-tab');
        let cards = Array.from(container.getElementsByClassName('card'));
        cards.sort((a, b) => {
          let vA = k === 'num' ? a.dataset.num : parseInt(a.dataset[k]);
          let vB = k === 'num' ? b.dataset.num : parseInt(b.dataset[k]);
          return dir === 'asc' ? (vA > vB ? 1 : -1) : (vB > vA ? 1 : -1);
        });
        cards.forEach(c => container.appendChild(c));
      }

      function runDeepSearch() {
        const day = document.getElementById('searchDay').value;
        const time = document.getElementById('searchTime').value;
        const scope = parseInt(document.getElementById('searchScope').value);
        const resultsDiv = document.getElementById('searchResults');

        // Logic to slice the last X draws based on the timeline
        // Note: Timeline is already linear draws. 1 week has up to 24 draws.
        const drawScope = scope * 24; 
        const targetedDraws = timeline.slice(-drawScope);

        const counts = {};
        targetedDraws.forEach(d => {
          if (d.dayName === day && (time === 'ALL' || d.timeSlot === time)) {
            let sortedPair = d.pair.split(',').map(Number).sort((a,b)=>a-b).join('-');
            counts[sortedPair] = (counts[sortedPair] || 0) + 1;
          }
        });

        const sorted = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 10);
        
        let html = '<div style="font-size:12px; color:var(--sec); margin-bottom:10px;">Top Pairs for ' + day + ' (' + time + '):</div>';
        if (sorted.length === 0) {
          html += '<div style="text-align:center; padding:20px; color:var(--danger);">No pairs found for this slot.</div>';
        } else {
          sorted.forEach(([pair, count], idx) => {
            let [n1, n2] = pair.split('-');
            let sLabel = spirits[n1] + " / " + spirits[n2];
            html += '<div class="res-row">' +
                    '  <div style="display:flex; align-items:center; gap:10px;">' +
                    '    <span style="color:var(--accent); font-weight:bold;">#' + (idx+1) + '</span>' +
                    '    <div>' +
                    '      <div style="font-weight:bold;">' + pair + '</div>' +
                    '      <div style="font-size:10px; color:var(--sec);">' + sLabel + '</div>' +
                    '    </div>' +
                    '  </div>' +
                    '  <div style="color:var(--success); font-weight:bold;">' + count + 'x</div>' +
                    '</div>';
          });
        }
        resultsDiv.innerHTML = html;
      }
      
      function makeFace(num) {
  const face = document.createElement('div');
  face.className = 'face face--' + num;
  const dot = '<div class="dot"></div>';
  const dots = {
    1: dot,
    2: '<div class="dots">' + dot + '<div></div><div></div><div></div><div></div><div></div><div></div><div></div>' + dot + '</div>',
    3: '<div class="dots">' + dot + '<div></div><div></div><div></div>' + dot + '<div></div><div></div><div></div>' + dot + '</div>',
    4: '<div class="dots">' + dot + '<div></div>' + dot + '<div></div><div></div><div></div>' + dot + '<div></div>' + dot + '</div>',
    5: '<div class="dots">' + dot + '<div></div>' + dot + '<div></div>' + dot + '<div></div>' + dot + '<div></div>' + dot + '</div>',
    6: '<div class="dots">' + dot + dot + dot + dot + dot + dot + '</div>'
  };
  face.innerHTML = dots[num] || '';
  return face;
}

function rollDice(cubeId) {
  const cube = document.getElementById(cubeId);
  cube.innerHTML = '';
  for (let i = 1; i <= 6; i++) cube.appendChild(makeFace(i));
  
  const result = Math.floor(Math.random() * 6) + 1;
  const rotations = {
    1: 'rotateX(0deg) rotateY(0deg)',
    2: 'rotateY(-90deg)',
    3: 'rotateY(180deg)',
    4: 'rotateY(90deg)',
    5: 'rotateX(-90deg)',
    6: 'rotateX(90deg)'
  };
  
  // High-speed pre-spin
  cube.style.transform = 'rotateX(720deg) rotateY(720deg)';
  
  setTimeout(() => {
    cube.style.transform = rotations[result];
  }, 100);
}

function startSplash() {
  rollDice('cube1');
  rollDice('cube2');
  
  setTimeout(() => {
    document.getElementById('revealText').classList.add('show');
  }, 1200);

  setTimeout(() => {
    const splash = document.getElementById('splash-screen');
    const main = document.getElementById('main-content');
    
    splash.classList.add('fade-out');
    
    setTimeout(() => {
      splash.style.display = 'none';
      main.style.display = 'block';
      setTimeout(() => main.style.opacity = '1', 50);
    }, 800);
  }, 3500);
}

// Call this at the end of your script or where you initialize
startSplash();

    </script>
  </body>
  </html>
  `
  let wv = new WebView(); await wv.loadHTML(html); await wv.present();
}

// Start Dashboard
await presentDashboard()
