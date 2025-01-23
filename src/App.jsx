import React, { useState } from "react";
import TokenPresaleUI from "./App4";

const App = () => {
  const [isModalOpen, setModalOpen] = useState(false);

  const handleConnectWallet = async () => {
    try {
      await switchToPolygon();
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to connect to wallet:", error.message);
      alert("An error occurred while connecting to the wallet. Please try again.");
    }
  };

  return (
    <div>
      <button onClick={handleConnectWallet} style={connectButtonStyle}>
        Connect Wallet
      </button>
      {isModalOpen && <TokenPresaleUI onClose={() => setModalOpen(false)} />}
    </div>
  );
};

const switchToPolygon = async () => {
  if (!window.ethereum) {
    alert("MetaMask is not installed!");
    return;
  }

  try {
    const polygonChainId = "0x89"; // Polygon Mainnet Chain ID
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    if (chainId !== polygonChainId) {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: polygonChainId }],
      });
    } else {
      console.log("Already on Polygon network");
    }
  } catch (error) {
    if (error.code === 4902) {
      try {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x89",
              chainName: "Polygon Mainnet",
              rpcUrls: ["https://polygon-rpc.com/"],
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              blockExplorerUrls: ["https://polygonscan.com/"],
            },
          ],
        });
      } catch (addError) {
        console.error("Error adding Polygon network:", addError.message);
      }
    } else {
      console.error("Error switching to Polygon network:", error.message);
      alert("Failed to switch networks. Please check your MetaMask settings.");
    }
  }
};

const connectButtonStyle = {
  padding: "10px 20px",
  background: "#4caf50",
  color: "white",
  border: "none",
  borderRadius: "5px",
  cursor: "pointer",
};

export default App;
