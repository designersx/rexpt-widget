import { RetellWebClient } from 'https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.7/+esm';
window.addEventListener('DOMContentLoaded', async () => {
  function getAgentIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("agentId");
  }
  if (document.getElementById("voice-call-agent")) return;
  const agentId = getAgentIdFromURL();
  const API_URL = "https://rexptin.truet.net/api"
  // const API_URL = "http://localhost:2512/api"
  // Step 1: Fetch agent details
  let agentName = "Support Agent";
  let agentVoiceId = "";
  let agentVoiceName = "";
  let callId = ""
  try {
    // 1. Fetch agent details
    const agentRes = await fetch(`${API_URL}/agent/fetchAgentDetailsFromRetell`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"  // 👈 this is required for JSON body
      },
      body: JSON.stringify({
        agent_id: agentId  // 👈 include agent_id here
      }),
    });

    if (agentRes.ok) {
      const agentData = await agentRes.json();
      agentName = agentData.agent_name || agentName;
      agentVoiceId = agentData.voice_id || "";
    }

    // 2. Fetch all voices
    const voicesRes = await fetch(`${API_URL}/agent/fetchAgentVoiceDetailsFromRetell`, {
      method: "POST",

    });

    if (voicesRes.ok) {
      const voicesData = await voicesRes.json();
      const voice = voicesData.find(v => v.voice_id === agentVoiceId);
      if (voice) {
        agentVoiceName = voice.avatar_url || "https://i.pravatar.cc/100?img=68";
      }
    }
  } catch (err) {
    console.error("Error fetching data:", err);
  }

  // Create widget
  function createWidget() {
    const widget = document.createElement("div");
    widget.id = "voice-call-agent";
    widget.className = "voice-call-container";
    widget.innerHTML = `
      <div class="voice-call-header">
        <span>📞 Voice Call Agent</span>
        <button id="voice-call-close">×</button>
      </div>
      <div class="voice-call-body">
        <div class="agent-info">
          <img src=${agentVoiceName} alt="Agent" />
          <div>
            <h4>${agentName}</h4>
            <p>Status: <span class="available">Available</span></p>
          </div>
        </div>
        <button class="call-button" id="start-call">Start Call</button>
        <div class="call-status" id="call-status">Not Connected</div>
      </div>
    `;
    document.body.appendChild(widget);

    // Close button functionality: remove widget and show minimized button
    widget.querySelector("#voice-call-close").onclick = () => {
      if (onCall) {
        retellWebClient.emit("call_ended");
      }
      widget.remove();
      createMinimizedButton();
    };

    // Call setup
    const callBtn = document.getElementById("start-call");
    const status = document.getElementById("call-status");

    callBtn.onclick = async () => {
      if (!onCall) {
        callBtn.disabled = true;
        callBtn.textContent = "Starting...";
        try {
          const res = await fetch(`${API_URL}/agent/create-web-call`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agent_id: agentId }),
          });
          const data = await res.json();
          const access_token = data.access_token;
          callId = data.call_id;
          await retellWebClient.startCall({ accessToken: access_token });

          callBtn.textContent = "End Call";
          onCall = true;
        } catch (err) {
          console.error("Call failed:", err);
          status.textContent = "Error starting call";
        } finally {
          callBtn.disabled = false; // Enable button again regardless of success/failure
        }
      } else {
        console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(retellWebClient)));
        await retellWebClient.stopCall();
        callBtn.textContent = "Start Call";
        onCall = false;
      }
    };
  }

  function createMinimizedButton() {
    const minimizedBtn = document.createElement("button");
    minimizedBtn.id = "voice-call-minimized";
    minimizedBtn.textContent = "📞 Voice Call";
    minimizedBtn.style = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 10px 15px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      z-index: 9999;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    `;

    minimizedBtn.onclick = () => {
      minimizedBtn.remove();
      createWidget();
    };

    document.body.appendChild(minimizedBtn);
  }
  const retellWebClient = new RetellWebClient();
  let onCall = false;

  retellWebClient.on("call_started", () => {
    const status = document.getElementById("call-status");
    if (status) {
      status.textContent = "In Call...";
      status.className = "call-status connected";
    }
  });

  retellWebClient.on("call_ended", () => {
    const status = document.getElementById("call-status");
    const callBtn = document.getElementById("start-call");
    if (status) {
      status.textContent = "Not Connected";
      status.className = "call-status";
    }
    if (callBtn) {
      callBtn.textContent = "Start Call";
    }
    onCall = false;
  });
  // Initialize the full widget initially
  createWidget();
});





// Helper function to create element with classes and attributes
// import { RetellWebClient } from 'https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.7/+esm';
// function createElement(tag, options = {}) {
//   const el = document.createElement(tag);
//   if (options.className) el.className = options.className;
//   if (options.id) el.id = options.id;
//   if (options.src) el.src = options.src;
//   if (options.alt) el.alt = options.alt;
//   if (options.innerHTML) el.innerHTML = options.innerHTML;
//   if (options.style) el.style = options.style;
//   return el;
// }

// // Append all elements to the DOM
// async function initWidget() {
//   const rexAgent = createElement('div', { id: 'rexAgent', className: 'raxAgentdiv' });
//   const rexImg = createElement('img', { src: 'agent.jpg', className: 'rexImage', alt: 'Agent' });
//   const dot = createElement('div', { className: 'dot' });
//   rexAgent.appendChild(rexImg);
//   rexAgent.appendChild(dot);
//   document.body.appendChild(rexAgent);

//   function getAgentIdFromURL() {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get("agentId");
//   }
//   const retellWebClient = new RetellWebClient();
//   const agentId = getAgentIdFromURL();
//   const API_URL = "http://localhost:2512/api";

//   let agentName = "Support Agent";
//   let agentVoiceId = "";
//   let agentVoiceName = "";
//   let callId = "";
//   let onCall = false;

//   try {
//     const agentRes = await fetch(`${API_URL}/agent/fetchAgentDetailsFromRetell`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ agent_id: agentId }),
//     });

//     if (agentRes.ok) {
//       const agentData = await agentRes.json();
//       agentName = agentData.agent_name || agentName;
//       agentVoiceId = agentData.voice_id || "";
//     }

//     const voicesRes = await fetch(`${API_URL}/agent/fetchAgentVoiceDetailsFromRetell`, {
//       method: "POST",
//     });

//     if (voicesRes.ok) {
//       const voicesData = await voicesRes.json();
//       const voice = voicesData.find(v => v.voice_id === agentVoiceId);
//       if (voice) {
//         agentVoiceName = voice.avatar_url || "https://i.pravatar.cc/100?img=68";
//       }
//     }
//   } catch (err) {
//     console.error("Error fetching data:", err);
//   }

//   // === Logo ===
//   const inlogo = createElement('div', { id: 'inlogo', className: 'inlogo' });
//   const logoImg = createElement('img', {
//     src: 'logo.png',
//     alt: 'Logo',
//     style: 'width: 100%; height: 100%;'
//   });
//   inlogo.appendChild(logoImg);
//   document.body.appendChild(inlogo);

//   // === Modal ===
//   const modal = createElement('div', { id: 'modal', className: 'modalOverlay' });
//   modal.style.display = 'none';

//   const modalContent = createElement('div', { className: 'modalContent' });

//   const closeModalBtn = createElement('span', {
//     id: 'closeModalBtn',
//     className: 'closeBtn',
//     innerHTML: '&times;'
//   });

//   const imgrex = createElement('div', { className: 'imgrex' });
//   const agentImg = createElement('img', { src: agentVoiceName || 'agent.jpg', alt: 'Agent' });
//   const cornerOverlay = createElement('div', { className: 'cornerOverlay' });
//   imgrex.appendChild(agentImg);
//   imgrex.appendChild(cornerOverlay);

//   const callBtn = createElement('div', { id: 'start-call', className: 'greendiv' });
//   const phoneIconWrapper = createElement('div', { className: 'phoneIcon' });
//   const phoneIcon = createElement('img', {
//     id: 'phoneIcon',
//     src: 'svg/Phone-call.svg'
//   });
//   phoneIconWrapper.appendChild(phoneIcon);

//   const callText = createElement('div', { id: 'callText', className: 'callText' });
//   callText.innerHTML = `
//         <p>Call <span class="agentTag">${agentName}</span></p>
//         <small>[BUSINESS NAME] Agent is LIVE</small>
//       `;

//   callBtn.appendChild(phoneIconWrapper);
//   callBtn.appendChild(callText);

//   const powered = createElement('p', {
//     className: 'Powered',
//     innerHTML: 'Powered by GuardX'
//   });

//   modalContent.appendChild(closeModalBtn);
//   modalContent.appendChild(imgrex);
//   modalContent.appendChild(callBtn);
//   modalContent.appendChild(powered);
//   modal.appendChild(modalContent);
//   document.body.appendChild(modal);

//   // === Events ===
//   rexAgent.addEventListener('click', () => {
//     modal.style.display = 'flex';
//     rexAgent.classList.add('noFloat');
//     inlogo.classList.add('noFloatInlogo');
//   });

//   closeModalBtn.addEventListener('click', () => {
//     modal.style.display = 'none';
//     rexAgent.classList.remove('noFloat');
//     inlogo.classList.remove('noFloatInlogo');
//   });

//   modalContent.addEventListener('click', (e) => e.stopPropagation());
//   modal.addEventListener('click', () => {
//     modal.style.display = 'none';
//     rexAgent.classList.remove('noFloat');
//     inlogo.classList.remove('noFloatInlogo');
//   });

//   callBtn.onclick = async () => {
//     if (!onCall) {
//       callBtn.disabled = true;
//       callText.innerHTML = `<p>Connecting...</p>`;
//       try {
//         const res = await fetch(`${API_URL}/agent/create-web-call`, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ agent_id: agentId }),
//         });
//         const data = await res.json();
//         const access_token = data.access_token;
//         callId = data.call_id;
//         await retellWebClient.startCall({ accessToken: access_token });

//         // Update UI
//         callBtn.classList.remove('greendiv');
//         callBtn.classList.add('reddiv');
//         phoneIcon.src = 'svg/Hangup.svg';
//         callText.innerHTML = `
//               <p>Hang up Now</p>
//               <small>In Call with ${agentName}</small>
//             `;
//         onCall = true;
//       } catch (err) {
//         console.error("Call failed:", err);
//         callText.innerHTML = `<p>Failed to connect</p>`;
//       } finally {
//         callBtn.disabled = false;
//       }
//     } else {
//       await retellWebClient.stopCall();
//       callBtn.classList.remove('reddiv');
//       callBtn.classList.add('greendiv');
//       phoneIcon.src = 'svg/Phone-call.svg';
//       callText.innerHTML = `
//             <p>Call <span class="agentTag">${agentName}</span></p>
//             <small>[BUSINESS NAME] Agent is LIVE</small>
//           `;
//       onCall = false;
//     }
//   };
// }

// // Run when DOM is loaded
// document.addEventListener('DOMContentLoaded', initWidget);