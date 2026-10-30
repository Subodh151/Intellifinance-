const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

async function testInEdge() {
  const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
  const port = 9229;
  const edge = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    '--disable-extensions',
    `--remote-debugging-port=${port}`,
    'about:blank'
  ]);

  // Wait for Edge to start
  await new Promise(r => setTimeout(r, 2000));

  // Get all targets
  const devToolsData = await new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}/json`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });

  const targets = JSON.parse(devToolsData);
  console.log('All targets:', targets.map(t => ({ type: t.type, url: t.url })));

  // Use the first page target
  const page = targets.find(t => t.type === 'page') || targets[0];
  if (!page) { console.log('No page target found'); edge.kill(); return; }
  console.log('Using target:', page.url, page.webSocketDebuggerUrl);

  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve) => ws.on('open', resolve));

  // Enable Page domain
  ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
  ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
  await new Promise(r => setTimeout(r, 300));

  // Navigate to profile page
  console.log('Navigating to profile page...');
  await new Promise((resolve) => {
    ws.on('message', (raw) => {
      const msg = JSON.parse(raw);
      if (msg.method === 'Page.loadEventFired') {
        console.log('Page loaded!');
        resolve();
      }
    });
    ws.send(JSON.stringify({
      id: 3,
      method: 'Page.navigate',
      params: { url: 'http://localhost:8080/profile/code.html' }
    }));
  });

  // Extra wait for JS to initialize
  await new Promise(r => setTimeout(r, 2000));

  // Now run diagnostics
  const result = await new Promise((resolve) => {
    const handler = (raw) => {
      const msg = JSON.parse(raw);
      if (msg.id === 10) {
        ws.off('message', handler);
        resolve(msg);
      }
    };
    ws.on('message', handler);

    ws.send(JSON.stringify({
      id: 10,
      method: 'Runtime.evaluate',
      params: {
        expression: `(() => {
          const hasIF = !!(window.IntelliFinance);
          const allBtns = Array.from(document.querySelectorAll('button'));
          const allInputs = Array.from(document.querySelectorAll('input'));
          const salaryInput = document.getElementById('if-baseSalary');
          const mainSaveBtn = document.querySelector('[data-action="save-profile"]');
          
          // Test save
          if (salaryInput) salaryInput.value = '12,750.00';
          let clicked = false, clickError = null;
          if (mainSaveBtn) {
            try { mainSaveBtn.click(); clicked = true; }
            catch(e) { clickError = e.message; }
          }

          return new Promise(resolve => setTimeout(() => {
            const toast = document.getElementById('if-toast');
            let stored = null;
            try { stored = JSON.parse(localStorage.getItem('IF_PROFILE')); } catch(e) {}

            resolve({
              hasIntelliFinance: hasIF,
              totalButtons: allBtns.length,
              totalInputs: allInputs.length,
              mainSaveBtnFound: !!mainSaveBtn,
              salaryInputFound: !!salaryInput,
              salaryVal: salaryInput ? salaryInput.value : null,
              clicked,
              clickError,
              toastFound: !!toast,
              toastText: toast ? toast.textContent.trim() : null,
              toastOpacity: toast ? toast.style.opacity : null,
              storedBaseSalary: stored ? stored.baseSalary : null,
              storedLastUpdated: stored ? stored.lastUpdated : null,
            });
          }, 1500));
        })()`,
        returnByValue: true,
        awaitPromise: true
      }
    }));
  });

  console.log('\n========================================');
  console.log('DIAGNOSTIC RESULT:');
  console.log(JSON.stringify(result.result?.result?.value ?? result, null, 2));
  console.log('========================================\n');

  ws.close();
  edge.kill();
}

testInEdge().catch(console.error);
