import React, { useState, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import logo from "./assets/FixedYieldProtocollogo.png";
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import { toast } from "react-hot-toast";
import { ethers } from "ethers";

import {
  FIXEDYIELDPRTOCOLADDRESS,
  YIELDTOKENADDRESS,
  PRINCIPLETOKENADDRESS,
  FIXEDYIELDPRTOCOLABI,
  YIELDTOKENABI,
  PRINCIPLETOKENABI,
} from "./abi/constant";
import "./App.css";

const App = () => {
  const [account, setAccount] = useState("");
  const [formData, setFormData] = useState({
    amount: "",
    feeRate: "",
    yieldAmount: "",
    buyer: "",
    depositorAddress: "",
  });
  const [depositDetails, setDepositDetails] = useState({});

  const { writeContractAsync, isPending } = useWriteContract();
  const { address } = useAccount();

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Fields that require positive integers
    const positiveIntegerFields = ["amount", "feeRate", "yieldAmount"];

    if (positiveIntegerFields.includes(name)) {
      // Validate that the value is either empty or a positive integer
      if (value === "" || /^(\d+(\.\d{0,18})?|0\.\d{0,18})$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      // For other fields, allow any input
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const { data, isError } = useReadContract({
    address: FIXEDYIELDPRTOCOLADDRESS,
    abi: FIXEDYIELDPRTOCOLABI,
    functionName: "getDepositDetails",
    args: [address],
  });

  const handleDeposit = async () => {
    try {
      // Validate the input amount (should be greater than 0)
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast.error("Amount must be greater than zero");
        return;
      }

      // Convert the input amount from ETH to wei
      const depositValue = ethers.utils.parseEther(formData.amount);

      // Send the deposit transaction to the smart contract
      const transaction = await writeContractAsync({
        address: FIXEDYIELDPRTOCOLADDRESS,
        abi: FIXEDYIELDPRTOCOLABI,
        functionName: "deposit",
        value: depositValue,
      });

      console.log(transaction);
      if (transaction) {
        toast.success("Deposit successful!");
      } else {
        toast.error("Deposit failed!");
      }
    } catch (error) {
      // Handle specific errors
      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (error.message.includes("Amount must be greater than zero")) {
        toast.error("Amount must be greater than zero.");
      } else if (
        error.message.includes("Existing deposit must be withdrawn first")
      ) {
        toast.error("You have an existing deposit. Please withdraw it first.");
      } else if (error.message.includes("revert")) {
        // Handle contract revert errors
        if (error.message.includes("Amount must be greater than zero")) {
          toast.error("Amount must be greater than zero.");
        } else if (
          error.message.includes("Existing deposit must be withdrawn first")
        ) {
          toast.error(
            "You have an existing deposit. Please withdraw it first."
          );
        } else {
          toast.error(
            "Transaction failed: Contract reverted. Please try again."
          );
        }
      } else if (error.message.includes("out of gas")) {
        toast.error(
          "Transaction failed: Out of gas. Please increase the gas limit."
        );
      } else {
        // Handle unexpected errors
        console.error(error);
        toast.error(`Deposit failed: ${error.message || error}`);
      }
    }
  };

  const handleWithdrawPrincipal = async () => {
    try {
      const transaction = await writeContractAsync({
        address: FIXEDYIELDPRTOCOLADDRESS,
        abi: FIXEDYIELDPRTOCOLABI,
        functionName: "withdrawPrincipal",
        args: [],
      });

      if (transaction) {
        toast.success("Principal withdrawn successfully!");
      } else {
        toast.error("Principal withdraw failed!");
      }
    } catch (error) {
      // Error handling for different cases
      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (error.message.includes("Deposit has not matured yet")) {
        toast.error("Deposit has not matured yet.");
      } else if (error.message.includes("No deposit found")) {
        toast.error("No deposit found.");
      } else if (error.message.includes("Principal transfer failed")) {
        toast.error("Principal transfer failed.");
      } else if (error.message.includes("revert")) {
        toast.error(`Transaction failed: Contract reverted. ${error.message}`);
      } else {
        // Handle unexpected errors
        console.error(error);
        toast.error(`Withdraw Principal failed: ${error.message || error}`);
      }
    }
  };

  const handleClaimYield = async () => {
    try {
      if (
        !formData.depositorAddress ||
        formData.depositorAddress.trim() === ""
      ) {
        toast.error("Please enter a valid depositor address");
        return;
      }

      const transaction = await writeContractAsync({
        address: FIXEDYIELDPRTOCOLADDRESS,
        abi: FIXEDYIELDPRTOCOLABI,
        functionName: "claimYield",
        args: [formData.depositorAddress],
      });

      if (transaction) {
        toast.success("Yield claimed successfully!");
      } else {
        toast.error("Yield withdraw failed!");
      }
    } catch (error) {
      // Handle errors with specific cases
      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (error.message.includes("No yield tokens found")) {
        toast.error("No yield tokens found to claim.");
      } else if (error.message.includes("Deposit has not matured yet")) {
        toast.error("Cannot claim yield: Deposit has not matured yet.");
      } else if (error.message.includes("Yield transfer failed")) {
        toast.error("Yield transfer failed. Please try again.");
      } else if (error.message.includes("revert")) {
        toast.error(`Transaction failed: Contract reverted. ${error.message}`);
      } else if (error.message.includes("out of gas")) {
        toast.error(
          "Transaction failed: Out of gas. Please increase the gas limit."
        );
      } else {
        // Log and display unexpected errors
        console.error(error);
        toast.error(`Claim yield failed: ${error.message || error}`);
      }
    }
  };

  const handleSellYieldToken = async () => {
    try {
      if (!formData.buyer || formData.buyer.trim() === "") {
        toast.error("Buyer address is required");
        return;
      }
      if (!formData.yieldAmount || parseFloat(formData.yieldAmount) <= 0) {
        toast.error("Yield amount must be greater than zero");
        return;
      }

      // Convert the yield amount to Wei (smallest unit for tokens)
      const yieldAmount = ethers.utils.parseUnits(formData.yieldAmount, 18);

      // Send the sell transaction to the smart contract
      const transaction = await writeContractAsync({
        address: FIXEDYIELDPRTOCOLADDRESS,
        abi: FIXEDYIELDPRTOCOLABI,
        functionName: "sellYieldToken",
        args: [formData.buyer, yieldAmount],
      });

      console.log(transaction);
      if (transaction) {
        toast.success("Yield tokens sold successfully!");
      } else {
        toast.error("Sell transaction failed!");
      }
    } catch (error) {
      // Handle specific errors
      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error(
          "Transaction failed: Gas estimation failed. Please try again."
        );
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction cancelled by user.");
      } else if (error.message.includes("Invalid buyer address")) {
        toast.error("Invalid buyer address.");
      } else if (
        error.message.includes("Yield amount must be greater than zero")
      ) {
        toast.error("Yield amount must be greater than zero.");
      } else if (error.message.includes("Insufficient yield token balance")) {
        toast.error("You have insufficient yield token balance.");
      } else if (error.message.includes("Yield token transfer failed")) {
        toast.error("Yield token transfer failed. Please try again.");
      } else if (error.message.includes("revert")) {
        // Handle contract revert errors
        if (error.message.includes("Invalid buyer address")) {
          toast.error("Invalid buyer address.");
        } else if (
          error.message.includes("Yield amount must be greater than zero")
        ) {
          toast.error("Yield amount must be greater than zero.");
        } else if (error.message.includes("Insufficient yield token balance")) {
          toast.error("You have insufficient yield token balance.");
        } else {
          toast.error(
            "Transaction failed: Contract reverted. Please try again."
          );
        }
      } else if (error.message.includes("out of gas")) {
        toast.error(
          "Transaction failed: Out of gas. Please increase the gas limit."
        );
      } else {
        // Handle unexpected errors
        console.error(error);
        toast.error(`Sell transaction failed: ${error.message || error}`);
      }
    }
  };

  const handleCancelDeposit = async () => {
    try {
      const transaction = await writeContractAsync({
        address: FIXEDYIELDPRTOCOLADDRESS,
        abi: FIXEDYIELDPRTOCOLABI,
        functionName: "cancelDeposit",
      });

      if (transaction) {
        toast.success("Deposit canceled successfully!");
      } else {
        toast.error("Deposite canceled Failed!");
      }
    } catch (error) {
      // Error handling for various possible errors
      if (error.code === "UNPREDICTABLE_GAS_LIMIT") {
        toast.error("Transaction failed: Gas estimation failed.");
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds.");
      } else if (error.code === "USER_REJECTED") {
        toast.warning("Transaction canceled by user.");
      } else if (error.message.includes("No deposit found")) {
        toast.error("No deposit found to cancel.");
      } else if (error.message.includes("Deposit has already matured")) {
        toast.error("Cannot cancel deposit: Deposit has already matured.");
      } else if (
        error.message.includes(
          "Cannot cancel deposit after selling yield tokens"
        )
      ) {
        toast.error(
          "Cannot cancel deposit after selling yield tokens. Ensure you have not sold your yield tokens."
        );
      } else if (error.message.includes("Refund transfer failed")) {
        toast.error("Refund transfer failed. Please try again.");
      } else {
        console.error(error);
        toast.error(`Cancel deposit failed: ${error.message || error}`);
      }
    }
  };

  useEffect(() => {
    const fetchDepositDetails = async () => {
      if (data && data.length > 0) {
        try {
          // Ensure data values are correctly converted from BigNumber
          const principal = ethers.utils.formatEther(data[0]);
          const yieldAmount = ethers.utils.formatEther(data[1]);
          const maturityTime = new Date(
            Number(data[2]) * 1000
          ).toLocaleString(); // Convert timestamp to date string
          const yieldClaimed = data[3] ? "Yes" : "No";

          // Update state with the processed deposit details
          setDepositDetails({
            principal,
            yield: yieldAmount,
            maturityTime,
            yieldClaimed,
          });
        } catch (error) {
          console.error("Error fetching deposit details:", error);
        }
      }
    };

    if (data) {
      fetchDepositDetails();
    }
  }, [data, account]);

  const approveTokens = async () => {
    try {
      // Convert the input amount to Wei (smallest unit for tokens)
      const approveAmount = ethers.utils.parseEther("10000");

      const transaction = await writeContractAsync({
        address: YIELDTOKENADDRESS,
        abi: YIELDTOKENABI,
        functionName: "approve",
        args: [FIXEDYIELDPRTOCOLADDRESS, approveAmount],
      });

      if (transaction) {
        toast.success("Tokens approved successfully!");
        console.log("Transaction submitted:", transaction);
      } else {
        toast.error("Tokens approving failed!");
      }
    } catch (error) {
      // Handle errors
      if (error.code === "USER_REJECTED") {
        toast.warning("Approval cancelled by user.");
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds for gas.");
      } else {
        console.error(error);
        toast.error(`Approval failed: ${error.message || error}`);
      }
    }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logoContainer">
          <img
            src={logo}
            alt="Logo"
            className="logo"
            style={{ borderRadius: "50px" }}
          />
          <h1>Fixed Yield Protocol</h1>
        </div>
        <div className="headerButtons">
          <div className="approve">
            <button onClick={() => approveTokens()}>Approve</button>
          </div>
          <div className="rainbowwallet">
            {" "}
            <ConnectButton />{" "}
          </div>
        </div>
      </header>

      <main className="main">
        <div className="card">
          <h2>Deposit</h2>
          <input
            type="text"
            name="amount"
            placeholder="Enter Amount"
            value={formData.amount}
            onChange={handleInputChange}
          />
          <button onClick={handleDeposit}>Deposit</button>
        </div>

        <div className="card">
          <h2>Withdraw Principal</h2>
          <button onClick={handleWithdrawPrincipal}>Withdraw Principal</button>
        </div>

        <div className="card">
          <h2>Claim Yield</h2>
          <input
            type="text"
            name="depositorAddress"
            placeholder="Enter depositor address"
            value={formData.depositorAddress || ""}
            onChange={handleInputChange}
          />
          <button onClick={() => handleClaimYield(formData.depositorAddress)}>
            Claim Yield
          </button>
        </div>

        <div className="card">
          <h2>Sell Yield Token</h2>
          <input
            type="text"
            name="buyer"
            placeholder="Buyer Address"
            value={formData.buyer}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="yieldAmount"
            placeholder="Yield Amount"
            value={formData.yieldAmount}
            onChange={handleInputChange}
          />
          <button onClick={handleSellYieldToken}>Sell Yield Token</button>
        </div>

        <div className="card">
          <h2>Cancel Deposit</h2>
          <button onClick={handleCancelDeposit}>Cancel Deposit</button>
        </div>

        <div className="card">
          <h2>Deposit Details</h2>

          {depositDetails.principal && (
            <div>
              <p>Principal: {depositDetails.principal} EDU</p>
              <p>Yield: {depositDetails.yield} EDU</p>
              <p>Maturity Time: {depositDetails.maturityTime}</p>
              <p>Yield Claimed: {depositDetails.yieldClaimed}</p>
            </div>
          )}
        </div>
      </main>

      <footer className="footer">
        <p>Built with ❤️ for Fixed Yield Protocol</p>
      </footer>
    </div>
  );
};

export default App;
