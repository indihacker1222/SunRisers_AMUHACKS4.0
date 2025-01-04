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
  const [showModal, setShowModal] = useState(false);

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
        toast.error("Deposit failed: An unexpected error occurred.");
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
        toast.error("Transaction failed: Contract reverted.");
      } else {
        // Handle unexpected errors
        console.error(error);
        toast.error("Withdraw Principal failed: An unexpected error occurred.");
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
        toast.error("Transaction failed: Contract reverted.");
      } else if (error.message.includes("out of gas")) {
        toast.error(
          "Transaction failed: Out of gas. Please increase the gas limit."
        );
      } else {
        // Log and display unexpected errors
        console.error(error);
        toast.error("Claim yield failed: An unexpected error occurred.");
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
        toast.error("Sell transaction failed: An unexpected error occurred.");
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
        toast.error("Cannot cancel deposit: It has already matured.");
      } else if (
        error.message.includes(
          "Cannot cancel deposit after selling yield tokens"
        )
      ) {
        toast.error("Cannot cancel deposit: Yield tokens have been sold.");
      } else if (error.message.includes("Refund transfer failed")) {
        toast.error("Refund transfer failed. Please try again.");
      } else {
        toast.error("Cancel deposit failed: An unexpected error occurred.");
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

      const transaction1 = await writeContractAsync({
        address: YIELDTOKENADDRESS,
        abi: YIELDTOKENABI,
        functionName: "approve",
        args: [FIXEDYIELDPRTOCOLADDRESS, approveAmount],
      });

      const transaction2 = await writeContractAsync({
        address: PRINCIPLETOKENADDRESS,
        abi: PRINCIPLETOKENABI,
        functionName: "approve",
        args: [FIXEDYIELDPRTOCOLADDRESS, approveAmount],
      });

      if (transaction1) {
        toast.success("Yield Tokens approved successfully!");
        console.log("Transaction submitted:", transaction1);
      } else {
        toast.error("Yeild Tokens approving failed!");
      }

      if (transaction2) {
        toast.success("Principle Tokens approved successfully!");
        console.log("Transaction submitted:", transaction2);
      } else {
        toast.error("Principle Tokens approving failed!");
      }
    } catch (error) {
      // Handle errors
      if (error.code === "USER_REJECTED") {
        toast.error("Approval failed: User rejected the request.");
      } else if (error.code === "INSUFFICIENT_FUNDS") {
        toast.error("Transaction failed: Insufficient funds for gas.");
      } else {
        toast.error("Approval failed: An unexpected error occurred.");
      }
    }
  };

  // Handle modal visibility toggle
  const toggleModal = () => {
    setShowModal(!showModal);
  };

  // Modal content explaining the project
  const renderModal = () => (
    <div className="modal">
      <div className="modal-content">
        <h2>About Fixed Yield Protocol</h2>
        <p>
          The Fixed Yield Protocol is a decentralized platform that allows users
          to deposit their tokens and earn fixed yields over a predefined
          maturity period. Users can claim their yields or withdraw their
          principal once the deposit has matured.
        </p>
        <p>
          The protocol offers a transparent and secure method for users to
          generate passive income from their cryptocurrency holdings.
        </p>
        <button onClick={toggleModal}>Close</button>
      </div>
    </div>
  );

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
          <h1>YieldX</h1>
        </div>
        <div className="headerButtons">
          <div className="approve">
            <button onClick={toggleModal}>Documentation</button>
          </div>
          <div className="approve">
            <button onClick={() => approveTokens()}>Approve</button>
          </div>
          <div className="rainbowwallet">
            {" "}
            <ConnectButton />{" "}
          </div>
        </div>
      </header>

      {/* Modal for Documentation */}
      {showModal && renderModal()}

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
