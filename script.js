// Your published Google Sheet URL (TSV format) – used for GLOBAL only
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
function drawCompass(canvasElement, points, highlight = null, isGlobal = false) {
  const chart = new Chart(canvasElement.getContext('2d'), {
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
          grid: {
            drawBorder: true,
            color: function(context) {
              return context.tick && context.tick.value === 0 ? '#000000' : '#e0e0e0';
            },
            lineWidth: function(context) {
              return context.tick && context.tick.value === 0 ? 2 : 1;
            }
          },
          border: {
            display: false
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
          grid: {
            drawBorder: true,
            color: function(context) {
              return context.tick && context.tick.value === 0 ? '#000000' : '#e0e0e0';
            },
            lineWidth: function(context) {
              return context.tick && context.tick.value === 0 ? 2 : 1;
            }
          },
          border: {
            display: false
          },
          title: { display: true, text: "EL" }
        }
      },
      plugins: {
        legend: { display: false },
        filler: {
          propagate: true
        },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function(context) {
              const point = context.raw;
              if (isGlobal && point.initials && point.timestamp) {
                return `${point.initials} - ${point.timestamp}`;
              }
              return '';
            }
          }
        }
      },
      onHover: function(event, activeElements) {
        canvasElement.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
      }
    },
    plugins: [{
      id: 'chartAreaBorder',
      afterDatasetsDraw(chart) {
        const {ctx, chartArea: {left, top, width, height}} = chart;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(left, top, width, height);
      }
    }]
  });
}

// PERSONAL COMPASS – now uses EK/EL passed from compass.html
function loadPersonalCompass() {
  const ek = window.personalEK;
  const el = window.personalEL;

  if (isNaN(ek) || isNaN(el)) {
    alert("No EK/EL values found in the URL.");
    return;
  }

  drawCompass(
    document.getElementById("personalChart"),
    [{ x: ek, y: el, email: "personal" }],
    null,
    false
  );
}

// GLOBAL COMPASS – still uses the sheet
async function loadGlobalCompass() {
  const highlightEmail = getParam("email"); // optional highlight

  const rows = await fetchSheet();
  const header = rows[0];

  const emailIndex = header.indexOf("Email Address");
  const ekIndex = header.indexOf("EK");
  const elIndex = header.indexOf("EL");
  const initialsIndex = header.indexOf("Initials");
  const timestampIndex = header.indexOf("Timestamp");

  const points = rows.slice(1).filter(r => r[ekIndex] && r[elIndex]).map(r => ({
    x: parseFloat(r[ekIndex]),
    y: parseFloat(r[elIndex]),
    email: r[emailIndex],
    initials: r[initialsIndex] || '',
    timestamp: r[timestampIndex] || ''
  }));

  drawCompass(
    document.getElementById("globalChart"),
    points,
    highlightEmail,
    true
  );
}
