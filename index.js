import { RetellWebClient } from 'https://cdn.jsdelivr.net/npm/retell-client-js-sdk@2.0.7/+esm';
window.addEventListener('DOMContentLoaded', async () => {
  if (document.getElementById("voice-call-agent")) return;
  const agentId = "agent_2c06a4b2b65b29b1599b459e9e";
  const retell_api_key = "key_22b39ad5d58e4cb2410fafb876b5"
  const retell_api_url = "https://api.retellai.com"
  // Step 1: Fetch agent details
  let agentName = "Support Agent";
  let agentVoiceId = "";
  let agentVoiceName = "";
  let callId = ""
  try {
    // 1. Fetch agent details
    const agentRes = await fetch(`${retell_api_url}/get-agent/${agentId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${retell_api_key}`,
        "Content-Type": "application/json",
      },
    });

    if (agentRes.ok) {
      const agentData = await agentRes.json();
      console.log(agentData)
      agentName = agentData.agent_name || agentName;
      agentVoiceId = agentData.voice_id || "";
    }

    // 2. Fetch all voices
    const voicesRes = await fetch(`${retell_api_url}/list-voices`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${retell_api_key}`,
        "Content-Type": "application/json",
      },
    });

    if (voicesRes.ok) {
      const voicesData = await voicesRes.json();
      console.log(voicesData, "voicesData")
      console.log(agentVoiceId)
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
          const res = await fetch(`http://localhost:5000/api/agent/create-web-call`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ agent_id: agentId }),
          });
          const data = await res.json();
          const access_token = data.access_token;
          callId = data.call_id; // save the call ID here
          console.log(callId)
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
