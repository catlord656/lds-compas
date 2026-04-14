// Your published Google Sheet URL (TSV format)
const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRAwiKKguJiZmN6xzGMHuTVhOs0xGBXiicXRkQeFUrCA5gsczOvRM-cbLpIcfEI1EDY7dSNtmp82o2g/pub?output=tsv";

// Helper: parse TSV into rows
async function fetchSheet() {
  const response = await fetch(SHEET_URL);
  const text = await response.text();
  return text.split("\n").map(row => row.split("\t"));
}

// Extract URL parameter
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

// Draw a compass chart
function drawCompass(canvasElement, points, highlight = null) {
  const ctx = canvasElement.getContext('2d');
  
  const chart = new Chart(ctx, {
    type: "scatter",
    data: {
      datasets: [
        {
          label: "Compass Points",
          data: points,
          backgroundColor: points.map(p =>
            highlight && p.email === highlight ? "red" : "blue"
          ),
          pointRadius: points.map(p =>
            highlight && p.email === highlight ? 10 : 5
          )
        }
      ]
    },
    options: {
      scales: {
        x: {
          type: 'linear',
          min: -1,
          max: 1,
          ticks: {
            stepSize: 0.2,
            callback: function(value) { return value.toFixed(1); }
          },
          title: { display: true, text: "EK" }
        },
        y: {
          type: 'linear',
          min: -1,
          max: 1,
          ticks: {
            stepSize: 0.2,
            callback: function(value) { return value.toFixed(1); }
          },
          title: { display: true, text: "EL" }
        }
      },
      plugins: {
        legend: { display: false }
      }
    },
    plugins: [{
      id: 'labels',
      afterDatasetsDraw(chart) {
        const { ctx, chartArea: { left, top, width, height } } = chart;
        ctx.save();
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'black';
        
        // Justice (top center)
        ctx.fillText('Justice', left + width / 2, top - 20);
        
        // Mercy (bottom center)
        ctx.fillText('Mercy', left + width / 2, top + height + 20);
        
        // Orthodox (left center)
        ctx.textAlign = 'right';
        ctx.fillText('Orthodox', left - 20, top + height / 2);
        
        // Heterodox (right center)
        ctx.textAlign = 'left';
        ctx.fillText('Heterodox', left + width + 20, top + height / 2);
        
        ctx.restore();
      }
    }]
  });
}

// PERSONAL COMPASS
async function loadPersonalCompass() {
  const email = getParam("email");
  if (!email) {
    alert("No email provided in URL. Use ?email=you@example.com");
    return;
  }

  const rows = await fetchSheet();
  const header = rows[0];

  const emailIndex = header.indexOf("Email Address");
  const ekIndex = header.indexOf("EK");
  const elIndex = header.indexOf("EL");

  const userRow = rows.find(r => r[emailIndex] === email);

  if (!userRow) {
    alert("Email not found in sheet.");
    return;
  }

  const ek = parseFloat(userRow[ekIndex]);
  const el = parseFloat(userRow[elIndex]);

  drawCompass(document.getElementById("personalChart"), [
    { x: ek, y: el, email }
  ]);
}

// GLOBAL COMPASS
async function loadGlobalCompass() {
  const highlightEmail = getParam("email");

  const rows = await fetchSheet();
  const header = rows[0];

  const emailIndex = header.indexOf("Email Address");
  const ekIndex = header.indexOf("EK");
  const elIndex = header.indexOf("EL");

  const points = rows.slice(1).map(r => ({
    x: parseFloat(r[ekIndex]),
    y: parseFloat(r[elIndex]),
    email: r[emailIndex]
  }));

  drawCompass(
    document.getElementById("globalChart"),
    points,
    highlightEmail
  );
}
