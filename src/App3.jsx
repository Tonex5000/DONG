import React, { useState, useEffect } from 'react';
import { ethers, BrowserProvider, Contract, parseEther, formatEther, formatUnits, parseUnits } from 'ethers';
import contractABI from './contractABI';

const TokenPresaleUI = ({ onClose }) => {
  const [account, setAccount] = useState('');
  const [tokensToBuy, setTokensToBuy] = useState('');
  const [tokensLeft, setTokensLeft] = useState(0);
  const [userBalance, setUserBalance] = useState(0);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [contractBalance, setContractBalance] = useState(0);
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const CONTRACT_ADDRESS = '0xa5a5043253F4B42c0566cb778c35D05472bfb051';
  const USDT_ADDRESS = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';
  const TOKEN_ADDRESS = '0x0b5c0017B8ca9300E51710Dc1160879d9fD77587';

  const PRESALE_ABI = contractABI;

  const ERC20_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)"
  ];

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        setAccount(accounts[0]);
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError('Failed to connect wallet: ' + err.message);
    }
  };

  const getContractInfo = async () => {
    if (!account) return;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const presaleContract = new Contract(CONTRACT_ADDRESS, PRESALE_ABI, provider);
      const usdtContract = new Contract(USDT_ADDRESS, ERC20_ABI, provider);
      const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
      
      // Get tokens left for sale
      const left = await presaleContract.getTokensLeft();
      setTokensLeft(formatEther(left));
      
      // Get user's token balance
      const balance = await presaleContract.tokensOwned(account);
      setUserBalance(formatEther(balance));

      // Get user's USDT balance
      const usdt = await usdtContract.balanceOf(account);
      setUsdtBalance(formatUnits(usdt, 6));

      // Get contract's token balance
      const contractBal = await tokenContract.balanceOf(CONTRACT_ADDRESS);
      setContractBalance(formatEther(contractBal));

    } catch (err) {
      console.error('Error fetching contract info:', err);
      setError('Failed to fetch contract info: ' + err.message);
    }
  };

  const buyTokens = async () => {
    if (!tokensToBuy || parseFloat(tokensToBuy) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
  
    setIsLoading(true);
    setError('');
  
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
  
      const presaleContract = new Contract(CONTRACT_ADDRESS, PRESALE_ABI, signer);
      const usdtContract = new Contract(USDT_ADDRESS, ERC20_ABI, signer);
  
      // Get token price (assuming it's 0.04 USDT with 6 decimals precision)
      const tokenPriceInUsdt = BigInt(40000); // 0.04 USDT with 6 decimal places
  
      // Convert the entered amount to 18 decimal format for token calculations
      const parsedAmount = parseUnits(tokensToBuy, 18);
      console.log(`ParsedAmount: ${parsedAmount}`);
  
      // Calculate total cost in USDT with 6 decimals
      /* const totalCost = (parsedAmount / BigInt(10 ** 18)) * tokenPriceInUsdt; */
      const totalCost = (parsedAmount * tokenPriceInUsdt) / BigInt(10 ** 18);
      console.log(`Total cost in USDT wei: ${totalCost}`);
      console.log(`totalCost: ${Number(totalCost) / 10 ** 6} USDT`); // Convert to readable USDT format
      console.log(`totalCost (raw): ${totalCost}`);
  
      // Check if user has enough USDT balance
      const userUsdtBalance = await usdtContract.balanceOf(account);
      console.log(`userUsdtBalance: ${userUsdtBalance}`);
  
      if (userUsdtBalance < totalCost) {
        throw new Error(`Insufficient USDT balance. Need ${Number(totalCost) / 10 ** 6} USDT`);
      }
  
      // Check contract token balance
      const tokenContract = new Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
      const contractTokenBalance = await tokenContract.balanceOf(CONTRACT_ADDRESS);
      console.log(`contractTokenBalance: ${contractTokenBalance}`);
  
      if (contractTokenBalance < parsedAmount) {
        throw new Error('Insufficient tokens in contract for sale');
      }
  
      // Approve the spending of USDT
      console.log('Approving USDT spend...');
      const approveTx = await usdtContract.approve(CONTRACT_ADDRESS, totalCost);
      await approveTx.wait();
  
      // Buy tokens after approval
      console.log('Buying tokens...');
      //const fig = BigInt(Math.floor(parseFloat(tokensToBuy) * 10 ** 18));
      const buyTx = await presaleContract.buyTokens(parsedAmount);
      await buyTx.wait();
  
      await getContractInfo();
      setTokensToBuy('');
      setSuccess('Tokens purchased successfully!');
      
    } catch (err) {
      console.error('Transaction error:', err);
      setError('Transaction failed: ' + (err.reason || err.message));
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    if (account) {
      getContractInfo();
    }
  }, [account]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        setAccount(accounts[0] || '');
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Token Presale</h1>
      
      {!account ? (
        <button 
          onClick={connectWallet}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Connect Wallet
        </button>
      ) : (
        <div style={modalStyle}>
          <p>Connected Account: {account}</p>
          <p>Your USDT Balance: {usdtBalance} USDT</p>
          <p>Your Token Balance: {userBalance} Tokens</p>
          <p>Tokens Left for Sale: {tokensLeft}</p>
          <p>Contract Token Balance: {contractBalance}</p>
          
          <div>
            <input
              type="number"
              value={tokensToBuy}
              onChange={(e) => setTokensToBuy(e.target.value)}
              placeholder="Amount of tokens to buy"
              className="border p-2 rounded mr-2"
            />
            <button
              onClick={buyTokens}
              disabled={isLoading}
              className="bg-green-500 text-white p-2 rounded"
            >
              {isLoading ? 'Processing...' : 'Buy Tokens'}
            </button>
            <br/>
            <button onClick={onClose} style={closeButtonStyle}>Close</button>
          </div>
          
          {error && (
            <p className="text-red-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
};

const modalStyle = {
    padding: "20px",
    background: "white",
    borderRadius: "10px",
    textAlign: "center",
    position: "fixed",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 1000,
  };

  const closeButtonStyle = {
    padding: "10px 20px",
    background: "#f44336",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  };
  
export default TokenPresaleUI;
