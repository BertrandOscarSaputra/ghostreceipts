# 👻 GhostReceipt Smart Contracts

Phase 2 Web3 integration using Solidity and Foundry.

## Overview

The smart contract acts as a neutral coordinator for the shared agreement state.

### Stored State
- Agreement ID (UUID hash or uint256)
- Party A (Creator wallet)
- Party B (Participant wallet)
- Current Version
- Agreement Status

Detailed agreement text, descriptions, and private metadata remain in PostgreSQL, while state transitions and mutual approvals are verified and committed on-chain.

## Directory Structure
- `src/`: Smart contracts (`GhostReceipt.sol`)
- `test/`: Foundry test suite
- `script/`: Deployment scripts
