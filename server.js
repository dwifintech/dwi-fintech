<!DOCTYPE html>
<html>
<head>
  <title>DWI Fintech</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    body {
      margin:0;
      font-family:'Segoe UI', Arial;
      background:#0b0e11;
      color:#eaecef;
    }

    /* TOPBAR */
    .topbar {
      background:#11161c;
      padding:15px 25px;
      display:flex;
      justify-content:space-between;
      border-bottom:1px solid #1f2933;
    }

    .logo {
      color:#f0b90b;
      font-weight:600;
      font-size:18px;
    }

    /* LAYOUT */
    .container { display:flex; }

    /* SIDEBAR */
    .sidebar {
      width:220px;
      background:#11161c;
      height:100vh;
      border-right:1px solid #1f2933;
    }

    .menu {
      padding:12px 20px;
      cursor:pointer;
      color:#9ca3af;
      font-size:14px;
    }

    .menu:hover {
      background:#1a222d;
      color:white;
    }

    /* MAIN */
    .main {
      flex:1;
      padding:25px;
    }

    .card {
      background:#11161c;
      padding:20px;
      border-radius:10px;
      margin-bottom:20px;
      border:1px solid #1f2933;
    }

    /* BUTTON */
    .btn {
      background:#f0b90b;
      border:none;
      padding:10px 15px;
      border-radius:5px;
      cursor:pointer;
      font-weight:500;
    }

    .btn:hover {
      background:#ffd34d;
    }

    input {
      padding:10px;
      margin:5px 0;
      width:220px;
      background:#1a222d;
      border:none;
      color:white;
      border-radius:5px;
    }

    canvas {
      margin-top:15px;
      background:#0b0e11;
      border-radius:10px;
      padding:10px;
    }

  </style>
</head>

<body>

<div class="topbar">
  <div class="logo">DWI FINTECH</div>
  <div>
    <a href="about.html" style="color:#f0b90b; margin-right:15px;">About</a>
    <button class="btn" onclick="logout()">Logout</button>
  </div>
</div>

<div class="container">

<div class="sidebar">
  <div class="menu" onclick="show('dashboard')">Dashboard</div>
  <div class="menu" onclick="show('invest')">Invest</div>
  <div class="menu" onclick="show('charts')">Performance</div>
</div>

<div class="main">

<!-- DASHBOARD -->
<div id="dashboard" class="card">
  <h2>Portfolio Overview</h2>

  <p>Total Invested: $<span id="invested">0</span></p>
  <p>Total Profit: $<span id="profit">0</span></p>
  <p>Available Balance: $<span id="available">0</span></p>

  <button class="btn" onclick="loadDashboard()">Refresh</button>
</div>

<!-- INVEST -->
<div id="invest" class="card" style="display:none">
  <h2>Investment Plans</h2>

  <button class="btn" onclick="loadPlans()">Load Plans</button>

  <div id="plans"></div>

  <h3 style="margin-top:20px;">Start Investment</h3>

  <input id="amount" placeholder="Enter Amount"><br>
  <input id="plan" placeholder="Plan Name"><br>

  <button class="btn" onclick="invest()">Invest Now</button>
</div>

<!-- CHART -->
<div id="charts" class="card" style="display:none">
  <h2>Performance Analytics</h2>

  <button class="btn" onclick="loadInvestments()">Load Investments</button>

  <div id="investments"></div>

  <canvas id="chart"></canvas>
</div>

</div>
</div>

<script>

const API = "https://dwi-fintech.onrender.com";

let email = localStorage.getItem("email");

// redirect if not logged in
if(!email){
  window.location = "index.html";
}

// logout
function logout(){
  localStorage.removeItem("email");
  window.location = "index.html";
}

// navigation
function show(p){
  document.getElementById("dashboard").style.display="none";
  document.getElementById("invest").style.display="none";
  document.getElementById("charts").style.display="none";

  document.getElementById(p).style.display="block";
}

// dashboard
async function loadDashboard(){
  let res = await fetch(API + "/dashboard",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email})
  });

  let d = await res.json();

  invested.innerText = d.totalInvested;
  profit.innerText = d.totalProfit;
  available.innerText = d.available;
}

// plans
async function loadPlans(){
  let res = await fetch(API + "/plans");
  let data = await res.json();

  let html = "";
  data.forEach(p=>{
    html += `
      <p>
        <strong>${p.name}</strong> 
        (${p.type}) - ${p.risk}
      </p>
    `;
  });

  plans.innerHTML = html;
}

// invest
async function invest(){
  let res = await fetch(API + "/invest",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      email,
      amount:amount.value,
      planName:plan.value
    })
  });

  alert(await res.text());
}

// load investments
async function loadInvestments(){
  let res = await fetch(API + "/my-investments",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email})
  });

  let data = await res.json();

  let html="";
  data.forEach((i,index)=>{
    html += `
      <p>
        ${i.type} - $${i.amount} 
        | Profit: $${i.profit}
        <button class="btn" onclick="loadChart(${index})">View</button>
      </p>
    `;
  });

  investments.innerHTML = html;
}

// chart
let chart;

async function loadChart(index){
  let res = await fetch(API + "/chart",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({email,index})
  });

  let data = await res.json();

  if(chart) chart.destroy();

  chart = new Chart(document.getElementById("chart"),{
    type:"line",
    data:{
      labels:data.map((_,i)=>"Day "+(i+1)),
      datasets:[{
        data:data,
        borderColor:"#f0b90b",
        tension:0.3
      }]
    }
  });
}

</script>

</body>
</html>