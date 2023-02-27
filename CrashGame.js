import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { ethers } from "ethers";
import Lottie from "react-lottie";
import rocketLaunch from "./rocket-launch.json";

import CrashGameContract from "./contracts/CrashGame.json";

const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // replace with your contract address
const MIN_BET_AMOUNT = 0.1; // minimum bet amount in ether
const MAX_BET_AMOUNT = 10; // maximum bet amount in ether

const web3 = new Web3(Web3.givenProvider);
const contract = new web3.eth.Contract(CrashGameContract.abi, CONTRACT_ADDRESS);

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();
const contractWithSigner = new ethers.Contract(
  CONTRACT_ADDRESS,
  CrashGameContract.abi,
  signer
);

const rocketAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: rocketLaunch,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

function CrashGame() {
  const [betAmount, setBetAmount] = useState(0);
  const [cashOutMultiplier, setCashOutMultiplier] = useState(0);
  const [crashPoint, setCrashPoint] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(0);
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        // get contract data
        const _crashPoint = await contract.methods.crashPoint().call();
        const _gameStartTime = await contract.methods.gameStartTime().call();
        const _players = await contract.methods.getPlayers().call();

        setCrashPoint(_crashPoint);
        setGameStartTime(_gameStartTime);
        setPlayers(_players);

        setIsLoading(false);
      } catch (err) {
        console.error(err);
        setIsLoading(false);
        setIsError(true);
      }
    }

    fetchData();
  }, []);

  async function placeBet() {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const account = accounts[0];

      // check if bet amount is within limits
      if (betAmount < MIN_BET_AMOUNT || betAmount > MAX_BET_AMOUNT) {
        alert(
          `Bet amount must be between ${MIN_BET_AMOUNT} and ${MAX_BET_AMOUNT}`
                  );
        return;
      }

      // check if game has already started
      if (Date.now() > gameStartTime * 1000) {
        alert("Game has already started. Please wait for the next game.");
        return;
      }

      // place bet
      const tx = await contractWithSigner.placeBet(cashOutMultiplier, {
        value: ethers.utils.parseEther(betAmount.toString()),
      });
      await tx.wait();

      // update players list
      const _players = await contract.methods.getPlayers().call();
      setPlayers(_players);

      alert("Bet placed successfully!");
    } catch (err) {
      console.error(err);
      alert("Error placing bet.");
    }
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading data. Please refresh the page and try again.</div>;
  }

  return (
    <div className="crash-game">
      <div className="rocket-container">
        <Lottie options={rocketAnimationOptions} height={400} width={400} />
        <div className="overlay">
          <div className="crash-point">
            <p>Crash Point:</p>
            <p>{crashPoint.toFixed(2)}</p>
          </div>
          <div className="players">
            <p>Players:</p>
            {players.map((player) => (
              <div key={player}>
                <p>{player}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="controls">
        <div className="bet-amount">
          <label htmlFor="bet-amount-input">Bet Amount (ETH):</label>
          <input
            id="bet-amount-input"
            type="number"
            min={MIN_BET_AMOUNT}
            max={MAX_BET_AMOUNT}
            step="0.1"
            value={betAmount}
            onChange={(e) => setBetAmount(e.target.value)}
          />
        </div>
        <div className="cash-out">
          <label htmlFor="cash-out-input">Cash Out Multiplier:</label>
          <input
            id="cash-out-input"
            type="number"
            min="1"
            max="100"
            step="1"
            value={cashOutMultiplier}
            onChange={(e) => setCashOutMultiplier(e.target.value)}
          />
        </div>
        <button onClick={placeBet}>Place Bet</button>
      </div>
    </div>
  );
}

export default CrashGame;

